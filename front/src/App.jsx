import React, { useEffect, useState, useCallback } from "react";
import { ShoppingCart, Scale, Barcode, Check, X } from "lucide-react";
import DroidCamViewer from "./components/DroidCamViewer";
const App = () => {
  const [articulo, setArticulo] = useState({
    nombre: "",
    precio: "",
    peso: "",
    precioPorKg: "",
  });
  const [carrito, setCarrito] = useState([]);
  const [totalCompra, setTotalCompra] = useState(0);
  const [websocketStatus, setWebsocketStatus] = useState("Conectando...");

  // Función para formatear el peso
  const formatPeso = useCallback((gramos) => {
    return gramos >= 1000 ? `${(gramos / 1000).toFixed(2)} kg` : `${gramos} g`;
  }, []);

  useEffect(() => {
    const WS_URL = "ws://localhost:3000";
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      setWebsocketStatus("Conectado");
      console.log("Conexión WebSocket establecida");
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Datos recibidos:", data);

        setArticulo((prev) => ({
          ...prev,
          nombre: data.nombre || "Producto no identificado",
          precio: data.precioPorKg || "0",
          peso: data.peso || 0,
          precioTotal: data.precioTotal || "0",
          precioPorKg: data.precioPorKg || "0",
        }));
      } catch (error) {
        console.error("Error al parsear el mensaje:", error);
      }
    };

    websocket.onclose = () => {
      setWebsocketStatus("Desconectado");
      console.log("Conexión WebSocket cerrada");
    };

    websocket.onerror = (error) => {
      console.error("Error en WebSocket:", error);
      setWebsocketStatus("Error de conexión");
    };

    return () => {
      websocket.close();
    };
  }, []);

  const agregarAlCarrito = () => {
    if (
      articulo.nombre &&
      articulo.nombre !== "Producto no identificado" &&
      articulo.peso > 0
    ) {
      const cantidad = articulo.peso / 1000; // Convertir a kg
      const nuevoItem = {
        producto: articulo.nombre,
        precio: parseFloat(articulo.precioPorKg),
        cantidad: cantidad,
        subTotal: parseFloat(articulo.precioTotal),
      };

      setCarrito((prev) => [...prev, nuevoItem]);
      setTotalCompra((prev) => prev + nuevoItem.subTotal);
    }
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setTotalCompra(0);
  };

  const finalizarCompra = async () => {
    if (carrito.length === 0) return;

    try {
      // Por simplicidad, creamos una preferencia con el total del carrito
      const response = await fetch("http://localhost:3000/api/createQR", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Compra en kiosco",
          quantity: 1,
          unit_price: totalCompra,
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        window.open(data.init_point, "_blank"); // abre Mercado Pago en otra pestaña
      } else {
        alert("Error al generar el link de pago.");
      }
    } catch (error) {
      console.error("Error al finalizar la compra:", error);
      alert("Ocurrió un error al procesar el pago.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="grid grid-cols-2 gap-6">
        {/* Producto Actual */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Cámara de Supervisión</h2>
          <DroidCamViewer />

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{articulo.nombre}</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-sm text-gray-600">Peso</label>
                <p className="font-semibold">
                  {articulo.peso > 0 ? formatPeso(articulo.peso) : "---"}
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-600">
                  Precio por kg
                </label>
                <p className="font-semibold">${articulo.precioPorKg || "0"}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Total</label>
                <p className="font-semibold">${articulo.precioTotal || "0"}</p>
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={agregarAlCarrito}
                className="bg-green-500 text-white px-4 py-2 rounded flex items-center"
                disabled={
                  !articulo.peso ||
                  articulo.nombre === "Producto no identificado"
                }
              >
                <Check className="mr-2" /> Confirmar
              </button>
            </div>
          </div>
        </div>

        {/* Carrito de Compras */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <ShoppingCart className="mr-2" />
            <h2 className="text-2xl font-bold">Carrito de Compras</h2>
          </div>

          <div className="overflow-y-auto max-h-96">
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b">
                  <th className="text-left">Producto</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td>{item.producto}</td>
                    <td className="text-center">${item.precio}</td>
                    <td className="text-center">{item.cantidad} kg</td>
                    <td className="text-right">${item.subTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Barcode className="mr-2" />
              <span>Número de caja: 51234</span>
            </div>
            <div>
              <strong>Total: ${totalCompra.toFixed(2)}</strong>
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={limpiarCarrito}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Vaciar Carrito
            </button>
            <button
              onClick={finalizarCompra}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Finalizar Compra
            </button>
          </div>
        </div>
      </div>

      {/* WebSocket Status */}
      <div className="mt-4 text-center">
        <p>
          Estado del WebSocket:
          <span
            className={`ml-2 ${
              websocketStatus === "Conectado"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {websocketStatus}
          </span>
        </p>
      </div>
    </div>
  );
};

export default App;
