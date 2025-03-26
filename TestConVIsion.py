import cv2
import io
import os
import time
import numpy as np
from google.cloud import vision

# Configurar Google Cloud Vision
client = vision.ImageAnnotatorClient()

# Configurar la cámara
cap = cv2.VideoCapture(0)  # 0 para la cámara por defecto

# Leer el primer fotograma
_, frame1 = cap.read()
frame1_gray = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
frame1_gray = cv2.GaussianBlur(frame1_gray, (21, 21), 0)

while True:
    # Leer el siguiente fotograma
    _, frame2 = cap.read()
    frame2_gray = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    frame2_gray = cv2.GaussianBlur(frame2_gray, (21, 21), 0)

    # Calcular la diferencia entre los fotogramas
    frame_diff = cv2.absdiff(frame1_gray, frame2_gray)
    _, thresh = cv2.threshold(frame_diff, 30, 255, cv2.THRESH_BINARY)

    # Si hay suficientes píxeles cambiados, capturar la imagen
    if np.sum(thresh) > 50000:  # Ajusta este umbral según pruebas
        img_path = "captura.jpg"
        cv2.imwrite(img_path, frame2)
        print("📸 Imagen capturada y guardada.")

        # Llamar a Google Cloud Vision para analizar la imagen
        with io.open(img_path, 'rb') as image_file:
            content = image_file.read()
        image = vision.Image(content=content)

        response = client.label_detection(image=image)
        labels = response.label_annotations

        # Mostrar los resultados
        for label in labels:
            print(f"🔍 {label.description} ({label.score:.2f})")

        # Borrar la imagen después del análisis
        os.remove(img_path)
        print("🗑️ Imagen eliminada después del análisis.")

    # Actualizar el fotograma de referencia
    frame1_gray = frame2_gray

    # Mostrar la imagen en vivo
    cv2.imshow("Camara", frame2)

    # Salir con la tecla 'q'
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Liberar la cámara y cerrar ventanas
cap.release()
cv2.destroyAllWindows()
