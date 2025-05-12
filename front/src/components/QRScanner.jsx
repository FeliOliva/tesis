import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const QrScanner = ({ onScan, onError, scanDelay = 500 }) => {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const scannerContainerId = "qr-scanner-container";

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(scannerContainerId);
    let isMounted = true;

    const startScanner = async () => {
      try {
        // Verificar disponibilidad de cámaras
        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length === 0) {
          throw new Error("No se encontraron cámaras disponibles");
        }

        // Esperar a que el contenedor esté completamente renderizado
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Obtener dimensiones reales del contenedor
        const container = document.getElementById(scannerContainerId);
        if (!container) {
          throw new Error("Contenedor del escáner no encontrado");
        }

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calcular tamaño del qrbox (70% del área más pequeña)
        const qrboxSize = Math.min(containerWidth, containerHeight) * 0.7;

        // Preferir cámara trasera
        const cameraId =
          cameras.find(
            (cam) =>
              cam.label.toLowerCase().includes("back") ||
              cam.label.toLowerCase().includes("rear")
          )?.id || cameras[0].id;

        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: {
              width: Math.floor(qrboxSize),
              height: Math.floor(qrboxSize),
            },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText) => {
            if (isMounted) {
              console.log("QR escaneado:", decodedText);
              onScan(decodedText);
            }
          },
          (errorMessage) => {
            // Ignorar errores internos de la librería
            if (!errorMessage.includes("No MultiFormat Readers") && isMounted) {
              console.warn("Error de escaneo:", errorMessage);
              onError?.(errorMessage);
            }
          }
        );

        scannerRef.current = html5QrCode;
        setIsScanning(true);
        setHasCamera(true);
      } catch (err) {
        if (isMounted) {
          console.error("Error al iniciar el escáner:", err);
          onError?.(err.message);
          setIsScanning(false);
          setHasCamera(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err) => {
          console.error("Error al detener el escáner:", err);
        });
      }
    };
  }, [onScan, onError, scanDelay]);

  return (
    <div className="relative">
      <div
        id={scannerContainerId}
        className="w-full bg-black"
        style={{
          height: "350px",
          minHeight: "350px",
          maxHeight: "350px",
        }}
      />

      {!isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <p className="text-white">
            {hasCamera ? "Iniciando escáner..." : "Cámara no disponible"}
          </p>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 p-2 text-center bg-black bg-opacity-50 text-white text-sm">
        Coloca el código QR dentro del cuadro
      </div>
    </div>
  );
};

export default QrScanner;
