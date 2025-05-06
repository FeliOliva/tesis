const db = require("../db.js");

const getArticuloByNombre = async (nombre) => {
  try {
    const [rows] = await db.query("SELECT * FROM articulos WHERE nombre = ?", [
      nombre,
    ]);
    return rows[0];
  } catch (error) {
    console.error("Error al obtener el artículo:", error);
    throw error;
  }
};

const createVenta = async (nroVenta) => {
  try {
    const [result] = await db.query(
      "INSERT INTO venta (nro_venta) VALUES (?)",
      [nroVenta]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error al crear la venta:", error);
    throw error;
  }
};

const createDetalleVenta = async (ventaId, detalles) => {
  try {
    const values = detalles.map(({ articulo_id, precio, cantidad }) => [
      ventaId,
      articulo_id,
      precio,
      cantidad,
    ]);

    await db.query(
      "INSERT INTO detalle_venta (venta_id, articulo_id, precio, cantidad) VALUES ?",
      [values]
    );
  } catch (error) {
    console.error("Error al crear los detalles de venta:", error);
    throw error;
  }
};

module.exports = {
  getArticuloByNombre,
  createVenta,
  createDetalleVenta,
};
