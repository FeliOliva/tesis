const express = require("express");
const router = express.Router();
const controller = require("../controller/controller.js");

router.get("/articulos", controller.getArticuloByNombre);
router.post("/ventas", controller.createVenta);

module.exports = router;