import React, { useEffect, useState } from "react";

const WS_URL = "ws://localhost:3000";

function App() {
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log("Conectado al servidor WebSocket");
    };

    websocket.onmessage = (event) => {
      console.log("Mensaje recibido:", event.data);
      console.log("Fruta detectada:", event.data);
      setMessage(event.data);
    };

    websocket.onclose = () => {
      console.log("Desconectado del WebSocket");
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Detección de Frutas en Tiempo Real</h1>
      <h2>Fruta Detectada: {message || "Esperando..."}</h2>
    </div>
  );
}

export default App;
