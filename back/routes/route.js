const express = require("express");
const router = express.Router();
const controller = require("../controller/controller.js");

router.get("/articulos", controller.getArticuloByNombre);
router.post("/ventas", controller.createVenta);
router.post("/createQR", controller.createQR);

module.exports = router;