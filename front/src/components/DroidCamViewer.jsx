import React, { useState, useEffect } from "react";

const DroidCamViewer = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuración de DroidCam (cambia la IP por la correcta)
  const droidCamUrl = `http://192.168.0.126:4747/video`;

  return (
    <div className="relative h-64 w-full bg-black rounded-lg overflow-hidden">
      {error ? (
        <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
          <p className="text-red-500 font-bold">Error conectando a DroidCam</p>
          <p className="text-sm mt-2">{error}</p>
          <p className="text-xs mt-4">Asegúrate que:</p>
          <ul className="text-xs text-left list-disc pl-5">
            <li>DroidCam esté ejecutándose en tu teléfono</li>
            <li>La IP y puerto sean correctos (actual: {droidCamUrl})</li>
            <li>Ambos dispositivos estén en la misma red WiFi</li>
          </ul>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse text-white">
                Conectando con DroidCam...
              </div>
            </div>
          )}
          <img
            src={droidCamUrl}
            alt="DroidCam Feed"
            onLoad={() => setIsLoading(false)}
            onError={(e) => {
              setIsLoading(false);
              setError("No se pudo cargar la transmisión de video");
              console.error("Error en DroidCam:", e);
            }}
            className={`w-full h-full object-contain ${
              isLoading ? "hidden" : "block"
            }`}
          />
        </>
      )}
    </div>
  );
};

export default DroidCamViewer;
