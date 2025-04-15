const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const db = require('./db.js');


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(cors());
app.use(express.urlencoded({ extended: true }));

//routes
const Routes = require("./routes/route.js");

app.use("/api", Routes);

// Función para buscar un artículo por nombre
const getArticuloByNombre = async (nombre) => {
    try {
        const [rows] = await db.query("SELECT nombre, precio FROM articulos WHERE nombre = ?", [nombre]);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("Error en la BD:", error);
        return null;
    }
};


wss.on("connection", (ws) => {
    console.log("🟢 Cliente conectado al WebSocket");

    ws.on("message", async (message) => {
        const textMessage = message.toString(); // Convertir Buffer a texto
        console.log(`📩 Fruta recibida: ${textMessage}`);

        try {
            // Hacer una petición al endpoint de la base de datos
            const response = await fetch(`http://localhost:3000/api/articulos?nombre=${textMessage}`);
            const articulo = await response.json();

            console.log("📦 Datos del artículo:", articulo);

            // Enviar la respuesta formateada a todos los clientes WebSocket
            const jsonResponse = JSON.stringify({
                nombre: articulo.nombre || "No encontrado",
                precio: articulo.precio || "-",
            });

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(jsonResponse);
                }
            });
        } catch (error) {
            console.error("❌ Error al obtener el artículo:", error);
        }
    });

    ws.on("close", () => {
        console.log("🔴 Cliente desconectado del WebSocket");
    });
});
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor WebSocket corriendo en http://localhost:${PORT}`);
});
