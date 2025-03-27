import cv2
import io
import os
import time
import threading
import asyncio
import websockets
import numpy as np
from google.cloud import vision

client = vision.ImageAnnotatorClient()
FRUITS = {"apple", "banana", "orange", "peach", "pear", "lemon", "plum", "tomato"}

# Configuración de la cámara
cap = cv2.VideoCapture(1)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

ret, frame1 = cap.read()
if not ret:
    print("⚠️ Error al acceder a la cámara")
    cap.release()
    exit()

frame1_gray = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
frame1_gray = cv2.GaussianBlur(frame1_gray, (21, 21), 0)

ultimo_tiempo = time.time()


async def send_fruit(fruit):
    """Envía la fruta detectada al WebSocket en Node.js"""
    uri = "ws://localhost:3000"
    try:
        async with websockets.connect(uri) as websocket:
            await websocket.send(fruit)
            print(f"📤 Fruta enviada: {fruit}")
    except Exception as e:
        print(f"⚠️ Error al conectar con WebSocket: {e}")


def procesar_imagen(frame):
    """Captura, analiza con Google Cloud Vision y envía la fruta detectada"""
    try:
        img_path = "captura.jpg"
        cv2.imwrite(img_path, frame)

        # Llamar a Google Cloud Vision con Object Localization
        with io.open(img_path, "rb") as image_file:
            content = image_file.read()
        image = vision.Image(content=content)

        response = client.object_localization(image=image)
        objects = response.localized_object_annotations

        # Filtrar solo frutas
        detected_fruits = [obj.name for obj in objects if obj.name.lower() in FRUITS]

        if detected_fruits:
            frutas_detectadas = ", ".join(detected_fruits)
            print(f"🍏 Frutas detectadas: {frutas_detectadas}")
            asyncio.run(send_fruit(frutas_detectadas))  # Enviar a WebSocket
        else:
            print("⚠️ Ninguna fruta detectada.")

        os.remove(img_path)
        print("🗑️ Imagen eliminada después del análisis.")
    except Exception as e:
        print(f"❌ Error al procesar la imagen: {e}")


while True:
    ret, frame2 = cap.read()
    if not ret:
        print("⚠️ Error al leer de la cámara")
        break

    frame2_gray = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    frame2_gray = cv2.GaussianBlur(frame2_gray, (21, 21), 0)

    frame_diff = cv2.absdiff(frame1_gray, frame2_gray)
    _, thresh = cv2.threshold(frame_diff, 30, 255, cv2.THRESH_BINARY)

    if np.sum(thresh) > 50000 and (time.time() - ultimo_tiempo) > 3:
        ultimo_tiempo = time.time()
        print("📸 Capturando imagen...")
        threading.Thread(target=procesar_imagen, args=(frame2.copy(),)).start()

    frame1_gray = frame2_gray
    cv2.imshow("Cámara", frame2)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
