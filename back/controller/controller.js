const model = require('../models/model.js');

const getArticuloByNombre = async (req, res) => {
    try {
        const { nombre } = req.query;

        if (!nombre) {
            return res.status(400).json({ message: "Debe proporcionar un nombre de artículo" });
        }

        const articulo = await model.getArticuloByNombre(nombre);
        if (articulo) {
            res.status(200).json(articulo);
        } else {
            res.status(404).json({ message: "Artículo no encontrado" });
        }
    } catch (error) {
        console.error("Error al obtener el artículo:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const createVenta = async (req, res) => {
    try {
        const { nro_venta, detalles } = req.body;

        if (!detalles || detalles.length === 0) {
            return res.status(400).json({ message: "Debe incluir al menos un detalle de venta" });
        }
        const ventaId = await model.createVenta(nro_venta);
        await model.createDetalleVenta(ventaId, detalles);

        res.status(201).json({ message: "Venta creada exitosamente", ventaId });
    } catch (error) {
        console.error("Error al crear la venta:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


module.exports = {
    getArticuloByNombre,
    createVenta
};