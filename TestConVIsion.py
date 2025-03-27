import cv2
import io
import os
import time
import threading
import numpy as np
from google.cloud import vision

# Configurar Google Cloud Vision
client = vision.ImageAnnotatorClient()

# Configurar la cámara con resolución reducida
cap = cv2.VideoCapture(0)  # 0 para la cámara por defecto
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Leer el primer fotograma
ret, frame1 = cap.read()
if not ret:
    print("⚠️ Error al acceder a la cámara")
    cap.release()
    exit()

frame1_gray = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
frame1_gray = cv2.GaussianBlur(frame1_gray, (21, 21), 0)

ultimo_tiempo = time.time()  # Tiempo de la última captura

def procesar_imagen(frame):
    """ Captura, analiza con Google Cloud Vision y borra la imagen """
    try:
        img_path = "captura.jpg"
        cv2.imwrite(img_path, frame)

        # Llamar a Google Cloud Vision
        with io.open(img_path, 'rb') as image_file:
            content = image_file.read()
        image = vision.Image(content=content)

        response = client.label_detection(image=image)
        labels = response.label_annotations

        for label in labels:
            print(f"🔍 {label.description} ({label.score:.2f})")

        os.remove(img_path)
        print("🗑️ Imagen eliminada después del análisis.")
    except Exception as e:
        print(f"❌ Error al procesar la imagen: {e}")

while True:
    # Leer el siguiente fotograma
    ret, frame2 = cap.read()
    if not ret:
        print("⚠️ Error al leer de la cámara")
        break

    frame2_gray = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    frame2_gray = cv2.GaussianBlur(frame2_gray, (21, 21), 0)

    # Calcular la diferencia entre los fotogramas
    frame_diff = cv2.absdiff(frame1_gray, frame2_gray)
    _, thresh = cv2.threshold(frame_diff, 30, 255, cv2.THRESH_BINARY)

    # Si hay suficientes píxeles cambiados y ha pasado suficiente tiempo
    if np.sum(thresh) > 50000 and (time.time() - ultimo_tiempo) > 3:
        ultimo_tiempo = time.time()  # Actualizar el tiempo de la última captura
        print("📸 Capturando imagen...")
        threading.Thread(target=procesar_imagen, args=(frame2.copy(),)).start()

    # Actualizar el fotograma de referencia
    frame1_gray = frame2_gray

    # Mostrar la imagen en vivo
    cv2.imshow("Cámara", frame2)

    # Salir con la tecla 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Liberar la cámara y cerrar ventanas
cap.release()
cv2.destroyAllWindows()
