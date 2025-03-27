const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(cors());
wss.on("connection", (ws) => {
    console.log("🟢 Cliente conectado al WebSocket");

    ws.on("message", (message) => {
        const textMessage = message.toString(); // Convertir Buffer a texto
        console.log(`📩 Fruta recibida: ${textMessage}`);

        // Reenviar la fruta detectada a todos los clientes conectados
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(textMessage); // Enviar como string
            }
        });
    });

    ws.on("close", () => {
        console.log("🔴 Cliente desconectado del WebSocket");
    });
});


const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor WebSocket corriendo en http://localhost:${PORT}`);
});
