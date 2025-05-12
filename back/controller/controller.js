const model = require("../models/model.js");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

const preferenceInstance = new Preference(client);
const createQR = async (req, res) => {
  try {
    const { title, quantity, unit_price } = req.body;

    const preferenceData = {
      items: [
        {
          title,
          quantity,
          unit_price,
          currency_id: "ARS",
        },
      ],
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }],
      },
    };

    const response = await preferenceInstance.create({ body: preferenceData });
    res.status(200).json({ init_point: response.init_point });
  } catch (error) {
    console.error("Error al crear la preferencia de pago:", error);
    res.status(500).json({ error: "Error al crear la preferencia" });
  }
};

const getArticuloByNombre = async (req, res) => {
  try {
    const { nombre } = req.query;

    if (!nombre) {
      return res
        .status(400)
        .json({ message: "Debe proporcionar un nombre de artículo" });
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
const getVentas = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ message: "Debe proporcionar un ID de venta" });
    }

    const venta = await model.getVentas(id);
    if (venta) {
      res.status(200).json(venta);
    } else {
      res.status(404).json({ message: "Venta no encontrada" });
    }
  } catch (error) {
    console.error("Error al obtener la venta:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
const createVenta = async (req, res) => {
  try {
    const { nro_venta, detalles } = req.body;

    if (!detalles || detalles.length === 0) {
      return res
        .status(400)
        .json({ message: "Debe incluir al menos un detalle de venta" });
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
  createVenta,
  createQR,
  getVentas,
};
