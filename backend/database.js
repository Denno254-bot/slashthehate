
require("dotenv").config();

const mysql = require("mysql2/promise");
const fs = require("fs");

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "slash_the_hate",

    ssl: process.env.DB_SSL_CA_PATH
        ? {
            ca: fs.readFileSync(
                process.env.DB_SSL_CA_PATH,
                "utf8"
            ),
            rejectUnauthorized: true
        }
        : undefined,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the database connection
(async () => {
    let connection;

    try {
        connection = await db.getConnection();
        await connection.ping();

        console.log("Connected to Slash the Hate database.");
    } catch (error) {
        console.error("Database connection failed:", error.message);
    } finally {
        if (connection) {
            connection.release();
        }
    }
})();

module.exports = db;
