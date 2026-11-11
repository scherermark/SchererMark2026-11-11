
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

app.get("/berletek", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT b.id, b.megnevezes, b.ar,
            b.ervenyesseg_nap AS ervenyes_napok,
            b.elerheto AS diak_kedvezmeny,
            t.nev AS tipus_nev
            FROM berletek b
            JOIN tipusok t ON b.tipus_id = t.id
            ORDER BY b.ar ASC
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ hiba: error.message });
    }
});

app.get("/berletek/elerheto", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM berletek
            WHERE elerheto = 1
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ hiba: error.message });
    }
});

app.get("/berletek/kereses/:szoveg", async (req, res) => {
    try {
        const szoveg = req.params.szoveg;

        const [rows] = await pool.query(`
            SELECT * FROM berletek
            WHERE megnevezes = ?
        `, [szoveg]);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ hiba: error.message });
    }
});

app.get("/tipusok/statisztika", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.nev AS tipus_nev,
            COUNT(b.id) AS berletek_szama,
            ROUND(AVG(b.ar), 1) AS atlagos_ar
            FROM tipusok t
            JOIN berletek b ON t.id = b.tipus_id
            GROUP BY t.id, t.nev
            ORDER BY t.id
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ hiba: error.message });
    }
});

app.get("/berletek/dragak", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT megnevezes, ar, ervenyesseg_nap
            FROM berletek
            WHERE ar < 20000
            ORDER BY ervenyesseg_nap DESC
        `);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ hiba: error.message });
    }
});

app.use((req, res) => {
    res.status(404).json({
        hiba: "A végpont nem található"
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Szerver fut: http://localhost:${process.env.PORT}`);
});
