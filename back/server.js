const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");
const db = require("./db.js");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const Routes = require("./routes/route.js");
app.use("/api", Routes);

let ultimoPeso = { valor: 0, timestamp: 0 };
let ultimoArticulo = null;

const buscarArticulo = async (nombre) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/articulos?nombre=${encodeURIComponent(nombre)}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error al buscar artículo:", error);
    return { nombre: nombre, precio: 0 };
  }
};

const broadcastDatosCombinados = () => {
  if (!ultimoArticulo) return;

  const precioTotal =
    ultimoPeso.valor > 0
      ? (ultimoArticulo.precio * (ultimoPeso.valor / 1000)).toFixed(2)
      : 0;

  const datos = {
    nombre: ultimoArticulo.nombre,
    precio: ultimoArticulo.precio,
    peso: ultimoPeso.valor,
    precioTotal: precioTotal,
    precioPorKg: ultimoArticulo.precio,
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(datos));
    }
  });
};

wss.on("connection", (ws) => {
  console.log("🟢 Cliente conectado al WebSocket");

  if (ultimoArticulo) {
    broadcastDatosCombinados();
  }

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.tipo === "peso") {
        ultimoPeso = {
          valor: data.valor,
          timestamp: Date.now(),
        };
        console.log(`⚖️ Peso actualizado: ${data.valor}g`);
        broadcastDatosCombinados();
        return;
      }

      if (data.tipo === "fruta") {
        const articulo = await buscarArticulo(data.nombre);
        if (articulo) {
          ultimoArticulo = articulo;
          console.log("📦 Datos del artículo:", articulo);
          broadcastDatosCombinados();
        }
      }
    } catch (error) {
      console.error("❌ Error al procesar mensaje:", error);
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
