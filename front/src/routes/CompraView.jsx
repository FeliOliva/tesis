import React, { useEffect, useState, useCallback } from "react";
import {
  ShoppingCart,
  Barcode,
  Check,
  CreditCard,
  Wallet,
  Smartphone,
} from "lucide-react";
import CameraViewer from "../components/CameraViewer";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

const CompraView = () => {
  const [articulo, setArticulo] = useState({
    nombre: "",
    precio: "",
    peso: "",
    precioPorKg: "",
  });
  const [carrito, setCarrito] = useState([]);
  const [totalCompra, setTotalCompra] = useState(0);
  const [websocketStatus, setWebsocketStatus] = useState("Conectando...");
  const [showConfirmSale, setShowConfirmSale] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showCloseCashier, setShowCloseCashier] = useState(false);

  const generateNroVenta = useCallback(() => {
    return Math.floor(100000 + Math.random() * 900000);
  }, []);

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
          id: data.id || 0,
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

  const generarTicket = async ({ id, nro_venta, productos, total, fecha }) => {
    console.log("Generando ticket para venta:", { id, nro_venta });
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, productos.length > 2 ? 200 : 150],
    });

    const pageWidth = 80;
    const margin = 5;
    const colProducto = margin;
    const colCantidad = margin + 35;
    const colSubtotal = margin + 55;
    let yPos = 10;

    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("VERDULERIA MI FAMILIA", pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
    doc.text("TICKET DE VENTA", pageWidth / 2, yPos, { align: "center" });
    yPos += 5;

    // Info básica
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`N° Venta: ${nro_venta}`, margin, yPos);
    yPos += 4;
    doc.text(`Fecha: ${new Date(fecha).toLocaleString()}`, margin, yPos);
    yPos += 6;

    // Línea divisoria
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // Encabezados de columnas
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PRODUCTO", colProducto, yPos);
    doc.text("CANT.", colCantidad, yPos);
    doc.text("SUBTOTAL", colSubtotal, yPos, { align: "right" });
    yPos += 5;

    // Productos
    doc.setFont("helvetica", "normal");
    productos.forEach((producto) => {
      // Nombre del producto
      doc.text(producto.nombre, colProducto, yPos);

      // Cantidad (en g si es menor a 1kg, kg si es mayor)
      const cantidadTexto =
        producto.cantidad >= 1
          ? `${producto.cantidad.toFixed(3)} kg`
          : `${(producto.cantidad * 1000).toFixed(0)} g`;
      doc.text(cantidadTexto, colCantidad, yPos);

      // Subtotal
      const subtotal = (producto.cantidad * producto.precio).toFixed(2);
      doc.text(`$${subtotal}`, colSubtotal, yPos, { align: "right" });

      yPos += 5;
    });

    // Línea divisoria antes del total
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // Total (alineado con la columna SUBTOTAL)
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: $${total.toFixed(2)}`, colSubtotal, yPos, {
      align: "right",
    });
    yPos += 10;

    // QR
    const qrUrl = await QRCode.toDataURL(`${id}`, {
      width: 100,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    doc.addImage(qrUrl, "PNG", (pageWidth - 15) / 2, yPos, 15, 15);
    yPos += 20;

    // Pie de página
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Escanea para ver detalles", pageWidth / 2, yPos, {
      align: "center",
    });
    yPos += 4;
    doc.text("¡Gracias por su compra!", pageWidth / 2, yPos, {
      align: "center",
    });

    doc.save(`ticket_${nro_venta}.pdf`);
  };

  const agregarAlCarrito = () => {
    console.log("articulo", articulo);
    if (
      articulo.nombre &&
      articulo.nombre !== "Producto no identificado" &&
      articulo.peso > 0
    ) {
      // Verificar si el artículo ya está en el carrito
      const articuloExistente = carrito.find(
        (item) => item.articulo_id === articulo.id
      );

      if (articuloExistente) {
        alert("Este artículo ya fue agregado al carrito.");
        return;
      }
      const cantidadEnKg = Number(articulo.peso) / 1000;
      const nuevoItem = {
        producto: articulo.nombre,
        precio: parseFloat(articulo.precioPorKg),
        cantidad: cantidadEnKg.toFixed(3), // esto ahora es string con 3 decimales
        subTotal: parseFloat(articulo.precioTotal),
        articulo_id: articulo.id,
      };

      setCarrito((prev) => [...prev, nuevoItem]);
      setTotalCompra((prev) => prev + nuevoItem.subTotal);
    }
  };

  const limpiarCarrito = () => {
    setCarrito([]);
    setTotalCompra(0);
  };

  const registrarVenta = async () => {
    if (carrito.length === 0) return false;

    try {
      const nroVenta = generateNroVenta();
      const fechaActual = new Date();

      // Preparamos los detalles de la venta
      const detallesVenta = carrito.map((item) => ({
        articulo_id: item.articulo_id,
        precio: item.precio,
        cantidad: item.cantidad,
        producto: item.producto,
      }));

      // Objeto completo de la venta para el ticket
      const ventaData = {
        nro_venta: nroVenta,
        detalles: detallesVenta,
        total: totalCompra,
      };
      console.log("Datos de la venta:", ventaData);

      // Enviamos la venta al endpoint
      const response = await fetch("http://localhost:3000/api/ventas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ventaData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Venta registrada:", data);

        // Generar el ticket con todos los datos necesarios
        generarTicket({
          id: data.ventaId, // ID de la venta para el QR
          nro_venta: nroVenta, // Número de venta visible
          productos: carrito.map((item) => ({
            nombre: item.producto,
            cantidad: parseFloat(item.cantidad),
            precio: item.precio,
          })),
          total: totalCompra,
          fecha: fechaActual,
        });

        // Mostrar mensaje de agradecimiento
        setShowThankYou(true);

        return true;
      } else {
        console.error("Error al registrar la venta");
        return false;
      }
    } catch (error) {
      console.error("Error al registrar la venta:", error);
      return false;
    }
  };

  const finalizarCompra = async () => {
    // Mostrar confirmación antes de procesar la venta
    setShowConfirmSale(true);
  };

  const handleConfirmSale = async () => {
    // Cerrar el modal de confirmación
    setShowConfirmSale(false);

    // Registramos la venta y descargamos el ticket
    const ventaRegistrada = await registrarVenta();

    if (!ventaRegistrada) {
      alert("Error al registrar la venta. Intente nuevamente.");
    }
    // El mensaje de agradecimiento se mostrará desde registrarVenta()
  };

  const handleThankYouClose = () => {
    // Limpiar el carrito al cerrar el mensaje de agradecimiento
    limpiarCarrito();
    setShowThankYou(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      {/* Modal de confirmación de venta */}
      {showConfirmSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <h2 className="text-xl font-bold mb-4">Confirmar Venta</h2>
            <p>¿Está seguro de que desea finalizar esta venta?</p>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setShowConfirmSale(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSale}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de agradecimiento */}
      {showThankYou && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
            <h2 className="text-xl font-bold mb-4">¡Gracias por su compra!</h2>
            <p>Su ticket se ha generado automáticamente.</p>
            <button
              onClick={handleThankYouClose}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
            >
              Volver
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Producto Actual */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Cámara de Supervisión</h2>
          <CameraViewer />

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
              disabled={carrito.length === 0}
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

export default CompraView;
