import cv2
import io
import os
import time
import threading
import asyncio
import websockets
import numpy as np
from collections import Counter
from google.cloud import vision
import json

client = vision.ImageAnnotatorClient()

# Diccionario de traducción de frutas (Inglés -> Español)
FRUIT_TRANSLATIONS = {
    "apple": "manzana",
    "banana": "banana",
    "orange": "naranja",
    "lemon": "Limon",
    "tomato": "tomate",
    "pear": "pera",
    "kiwi": "kiwi",
    "avocado": "palta",
}

# Configuración de la cámara
cap = cv2.VideoCapture(10)
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
            # Enviar como JSON con tipo "fruta"
            message = json.dumps({"tipo": "fruta", "nombre": fruit})
            await websocket.send(message)
            print(f"📤 Fruta enviada: {fruit}")
    except Exception as e:
        print(f"⚠️ Error al conectar con WebSocket: {e}")


def procesar_imagen(frame):
    try:
        img_path = "captura.jpg"
        cv2.imwrite(img_path, frame)

        # Llamar a Google Cloud Vision con Object Localization
        with io.open(img_path, "rb") as image_file:
            content = image_file.read()
        image = vision.Image(content=content)

        response = client.object_localization(image=image)
        objects = response.localized_object_annotations

        # Filtrar frutas y traducirlas al español
        detected_fruits = [
            FRUIT_TRANSLATIONS[obj.name.lower()]
            for obj in objects
            if obj.name.lower() in FRUIT_TRANSLATIONS
        ]

        if detected_fruits:
            conteo = Counter(detected_fruits)
            frutas_unicas = list(conteo.keys())

            if len(frutas_unicas) == 1:
                fruta = frutas_unicas[0]
                cantidad = conteo[fruta]
                print(f"🍏 Fruta detectada: {fruta} (x{cantidad})")
                asyncio.run(send_fruit(fruta))  # Enviar una sola vez
            else:
                print(f"⚠️ Se detectaron múltiples frutas: {', '.join(frutas_unicas)}")
                print("🚫 Por favor, coloca solo un tipo de fruta en la balanza.")
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


cap.release()
