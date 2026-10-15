const mysql = require("mysql2/promise");



/* =================================
   DATABASE CONNECTION
================================= */

const db = mysql.createPool({

    host: "localhost",

    user: "slash_app",

    password: "SlashApp@2026",

    database: "slash_the_hate",

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
