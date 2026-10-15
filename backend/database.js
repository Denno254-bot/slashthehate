require("dotenv").config();
const mysql = require("mysql2/promise");



/* =================================
   DATABASE CONNECTION
================================= */
const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "slash_app",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "slash_the_hate",
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


/* =================================
   TEST DATABASE CONNECTION
================================= */

db.getConnection((error, connection) => {

    if (error) {

        console.error(
            "Database connection failed:"
        );

        console.error(
            error.message
        );

        return;

    }


    console.log(
        "Connected to Slash the Hate database."
    );


    connection.release();

});


module.exports = db;
