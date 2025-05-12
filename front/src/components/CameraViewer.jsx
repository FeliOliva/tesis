import React, { useEffect, useRef } from "react";

const CameraViewer = ({}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Acceder a la cámara del dispositivo
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "environment", // Para usar la cámara trasera en móviles
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error al acceder a la cámara:", err);
      }
    };

    startCamera();

    // Limpieza al desmontar el componente
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="mb-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-auto border rounded"
      />
    </div>
  );
};

export default CameraViewer;
