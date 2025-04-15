import React, { useEffect, useState } from "react";
import { ShoppingCart, Scale, Barcode, Check, X } from "lucide-react";

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

  useEffect(() => {
    const WS_URL = "ws://localhost:3000";
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      setWebsocketStatus("Conectado");
      console.log("conectado");
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setArticulo({
          nombre: data.nombre || "Producto no identificado",
          precio: data.precio || "-",
          peso: data.peso || "0 kg",
          precioPorKg: data.precioPorKg || "-",
        });
      } catch (error) {
        console.error("Error al parsear el mensaje:", error);
      }
    };

    websocket.onclose = () => {
      setWebsocketStatus("Desconectado");
    };

    return () => {
      websocket.close();
    };
  }, []);

  const agregarAlCarrito = () => {
    if (articulo.nombre && articulo.nombre !== "Producto no identificado") {
      const nuevoItem = {
        producto: articulo.nombre,
        precio: parseFloat(articulo.precio),
        cantidad: parseFloat(articulo.peso),
        subTotal: parseFloat(articulo.precio) * parseFloat(articulo.peso),
      };

      const nuevosItems = [...carrito, nuevoItem];
      setCarrito(nuevosItems);

      const nuevoTotal = nuevosItems.reduce(
        (acc, item) => acc + item.subTotal,
        0
      );
      setTotalCompra(nuevoTotal);
    }
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setTotalCompra(0);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="grid grid-cols-2 gap-6">
        {/* Producto Actual */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-64 bg-gray-200 flex items-center justify-center mb-4">
            <Scale size={100} className="text-gray-500" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{articulo.nombre}</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-sm text-gray-600">Peso</label>
                <p className="font-semibold">{articulo.peso} kg</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600">
                  Precio por kg
                </label>
                <p className="font-semibold">${articulo.precio}</p>
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={agregarAlCarrito}
                className="bg-green-500 text-white px-4 py-2 rounded flex items-center"
              >
                <Check className="mr-2" /> Confirmar
              </button>
              <button className="bg-red-500 text-white px-4 py-2 rounded flex items-center">
                <X className="mr-2" /> Cancelar
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
            <button className="bg-green-500 text-white px-4 py-2 rounded">
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
