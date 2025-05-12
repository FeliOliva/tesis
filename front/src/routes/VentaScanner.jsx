import React, { useState, useEffect } from "react";
import QrScanner from "../components/QRScanner";
import {
  QrCode,
  Calendar,
  DollarSign,
  ShoppingCart,
  CheckCircle,
} from "lucide-react";
import axios from "axios";

const VentasScanner = () => {
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [ventasPagadas, setVentasPagadas] = useState([]);
  const [ventaActual, setVentaActual] = useState(null);
  const [totalDia, setTotalDia] = useState(0);
  const [scanActive, setScanActive] = useState(true);
  const [cameraError, setCameraError] = useState(null);

  // Cargar ventas del localStorage al iniciar
  useEffect(() => {
    const loadVentas = () => {
      try {
        const ventasData = localStorage.getItem("ventasEscaneadas");
        const ventasGuardadas = ventasData ? JSON.parse(ventasData) : [];

        const ventasPagadasData = localStorage.getItem("ventasPagadas");
        const ventasPagadasGuardadas = ventasPagadasData
          ? JSON.parse(ventasPagadasData)
          : [];

        setVentasDelDia(ventasGuardadas);
        setVentasPagadas(ventasPagadasGuardadas);
        calcularTotal(ventasGuardadas);
      } catch (error) {
        console.error("Error al cargar ventas:", error);
        localStorage.setItem("ventasEscaneadas", JSON.stringify([]));
        localStorage.setItem("ventasPagadas", JSON.stringify([]));
      }
    };

    loadVentas();
  }, []);

  const calcularTotal = (ventas) => {
    const total = ventas.reduce((sum, venta) => sum + venta.total, 0);
    setTotalDia(total);
  };

  const handleScan = async (data) => {
    if (!data) return;

    console.log("Datos escaneados:", data);

    try {
      const id_venta = parseInt(data);
      const response = await axios.get(
        `http://localhost:3000/api/ventas/${id_venta}`
      );

      console.log("Respuesta completa:", response.data);

      if (!response.data) {
        throw new Error("No se recibieron datos de la venta");
      }

      // Normalizamos los datos: siempre trabajamos con un array
      const productosData = Array.isArray(response.data)
        ? response.data
        : [response.data];

      // Verificamos que todos los items tengan el mismo nro_venta
      const nroVentaUnico = productosData[0].nro_venta;
      if (!productosData.every((item) => item.nro_venta === nroVentaUnico)) {
        throw new Error("Los artículos tienen números de venta diferentes");
      }

      const venta = {
        nro_venta: nroVentaUnico,
        fecha: productosData[0].fecha_momento,
        productos: productosData.map((item) => ({
          nombre: item.nombre_articulo,
          cantidad: parseFloat(item.cantidad),
          precio: parseFloat(item.precio),
        })),
        total: productosData.reduce(
          (sum, item) =>
            sum + parseFloat(item.cantidad) * parseFloat(item.precio),
          0
        ),
      };

      console.log("Venta procesada:", venta);

      // Validaciones
      if (
        !venta.nro_venta ||
        venta.productos.length === 0 ||
        isNaN(venta.total)
      ) {
        throw new Error("Estructura de venta inválida");
      }

      // Mostrar venta en pantalla
      setVentaActual(venta);
      setScanActive(false);

      // Guardar en ventas del día
      const nuevasVentas = [venta, ...ventasDelDia];
      setVentasDelDia(nuevasVentas);
      localStorage.setItem("ventasEscaneadas", JSON.stringify(nuevasVentas));
      calcularTotal(nuevasVentas);
    } catch (error) {
      console.error("Error al procesar QR:", error);
      setCameraError(`Error: ${error.message}`);
      setTimeout(() => setCameraError(null), 5000);
    }
  };

  const handleCameraError = (error) => {
    console.error("Error de cámara:", error);

    let errorMessage = "Error al acceder a la cámara";
    if (error.name === "NotAllowedError") {
      errorMessage =
        "Permiso de cámara denegado. Por favor habilita los permisos.";
    } else if (error.name === "NotFoundError") {
      errorMessage = "No se encontró dispositivo de cámara";
    } else if (error.name === "NotSupportedError") {
      errorMessage = "Navegador no compatible con la API de cámara";
    } else if (error.name === "NotReadableError") {
      errorMessage = "La cámara ya está en uso o no se puede acceder";
    }

    setCameraError(errorMessage);
    setTimeout(() => setCameraError(null), 5000);
  };

  const formatFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePagarVenta = () => {
    if (!ventaActual) return;

    // Marcar como pagada y mover a lista de pagadas
    const ventaPagada = { ...ventaActual, pagada: true };

    // Eliminar de ventas pendientes
    const nuevasVentas = ventasDelDia.filter(
      (v) => v.nro_venta !== ventaActual.nro_venta
    );
    setVentasDelDia(nuevasVentas);
    localStorage.setItem("ventasEscaneadas", JSON.stringify(nuevasVentas));

    // Agregar a ventas pagadas
    const nuevasVentasPagadas = [ventaPagada, ...ventasPagadas];
    setVentasPagadas(nuevasVentasPagadas);
    localStorage.setItem("ventasPagadas", JSON.stringify(nuevasVentasPagadas));

    // Calcular nuevo total
    calcularTotal(nuevasVentas);

    // Limpiar venta actual y reactivar el scanner
    setVentaActual(null);
    setScanActive(true); // Esta línea reactiva el scanner
  };

  const handleNuevaVenta = () => {
    // Limpiar venta actual y reactivar el scanner
    setVentaActual(null);
    setScanActive(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <QrCode className="mr-2" /> Sistema de Ventas
      </h1>

      {cameraError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {cameraError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resumen del día */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Calendar className="mr-2" /> Resumen del Día
          </h2>
          <div className="space-y-2">
            <p>
              <span className="font-semibold">Ventas pendientes:</span>{" "}
              {ventasDelDia.length}
            </p>
            <p>
              <span className="font-semibold">Ventas pagadas:</span>{" "}
              {ventasPagadas.length}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Total pendiente:</span>
              <span className="text-green-600 ml-2">
                ${totalDia.toFixed(2)}
              </span>
            </p>
          </div>
        </div>

        {/* Cámara y venta actual */}
        <div className="md:col-span-2 space-y-6">
          {/* Scanner QR o Detalles de la venta actual */}
          {!ventaActual ? (
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Escanear Ticket</h2>
              <div className="flex flex-col items-center">
                <div className="border-4 border-dashed border-blue-500 rounded-lg overflow-hidden w-full max-w-sm mx-auto">
                  {scanActive ? (
                    <QrScanner
                      key={scanActive ? "active" : "inactive"}
                      onScan={handleScan}
                      onError={handleCameraError}
                      scanDelay={300}
                    />
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500">Escaneo completado</p>
                    </div>
                  )}
                </div>
                <p className="text-gray-500 mt-4 text-center text-sm">
                  Apunta tu cámara al código QR para escanear los datos de la
                  venta
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <ShoppingCart className="mr-2" /> Detalles de la Venta
              </h2>
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">
                    N° Venta: {ventaActual.nro_venta}
                  </span>
                  <span>{formatFecha(ventaActual.fecha)}</span>
                </div>
                <hr className="my-3" />

                {/* Productos */}
                <div className="mb-4">
                  <h3 className="font-medium text-gray-700 mb-2">Productos:</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-2 px-1 text-left">Producto</th>
                          <th className="py-2 px-1 text-right">Cantidad</th>
                          <th className="py-2 px-1 text-right">Precio</th>
                          <th className="py-2 px-1 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventaActual.productos.map((producto, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2 px-1">{producto.nombre}</td>
                            <td className="py-2 px-1 text-right">
                              {producto.cantidad}
                            </td>
                            <td className="py-2 px-1 text-right">
                              ${producto.precio}
                            </td>
                            <td className="py-2 px-1 text-right">
                              $
                              {(producto.cantidad * producto.precio).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-lg font-bold mt-4 py-2 border-t">
                  <span>Total:</span>
                  <span className="text-green-600">
                    ${ventaActual.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-3">
                <button
                  onClick={handlePagarVenta}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center"
                >
                  <CheckCircle className="mr-2" size={18} />
                  Marcar como Pagada
                </button>
                <button
                  onClick={handleNuevaVenta}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Escanear Nuevo QR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historial de ventas pendientes */}
      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Ventas Pendientes</h2>
        {ventasDelDia.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">N° Venta</th>
                  <th className="text-left py-2">Hora</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-right py-2">Productos</th>
                  <th className="text-center py-2">Acción</th>
                </tr>
              </thead>
              <tbody>
                {ventasDelDia.map((venta) => (
                  <tr
                    key={venta.nro_venta}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-2">{venta.nro_venta}</td>
                    <td className="py-2">
                      {formatFecha(venta.fechaEscaneo || venta.fecha)}
                    </td>
                    <td className="py-2 text-right">
                      ${venta.total.toFixed(2)}
                    </td>
                    <td className="py-2 text-right">
                      {venta.productos.length}
                    </td>
                    <td className="py-2 text-center">
                      <button
                        onClick={() => setVentaActual(venta)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay ventas pendientes</p>
        )}
      </div>

      {/* Ventas pagadas */}
      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Ventas Pagadas</h2>
        {ventasPagadas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">N° Venta</th>
                  <th className="text-left py-2">Hora</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-right py-2">Productos</th>
                </tr>
              </thead>
              <tbody>
                {ventasPagadas.map((venta) => (
                  <tr
                    key={venta.nro_venta}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="py-2">{venta.nro_venta}</td>
                    <td className="py-2">
                      {formatFecha(venta.fechaEscaneo || venta.fecha)}
                    </td>
                    <td className="py-2 text-right">
                      ${venta.total.toFixed(2)}
                    </td>
                    <td className="py-2 text-right">
                      {venta.productos.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay ventas pagadas</p>
        )}
      </div>
    </div>
  );
};

export default VentasScanner;
