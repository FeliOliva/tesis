import React from "react";

const DroidCamViewer = () => {
  // La URL de DroidCam por defecto es http://192.168.x.x:4747/video
  const droidCamUrl = "http://192.168.0.126:4747"; // Cambia por tu IP

  return (
    <div className="mb-4">
      <img 
        src={droidCamUrl} 
        alt="Cámara en vivo" 
        className="w-full h-auto border rounded"
      />
    </div>
  );
};

export default DroidCamViewer;