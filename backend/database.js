
require("dotenv").config();

const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "slash_the_hate",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the database connection
(async () => {
    try {
        const connection = await db.getConnection();

        console.log("Connected to Slash the Hate database.");

        connection.release();
    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
})();

module.exports = db;

