const mysql = require("mysql2");
require("dotenv").config();
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.log(err);
        console.log("No se ha podido conectar con la base de datos");
    } else {
        console.log("Conectado a la base de datos");
    }
});

module.exports = connection.promise();
