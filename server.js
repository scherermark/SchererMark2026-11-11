require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fitness_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const hibakezeles = (res, error) => {
    console.error(error);
    return res.status(500).json({ hiba: error.message });
};

app.get('/berletek', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT b.id, b.megnevezes, b.ar,
                   b.ervenyesseg_nap AS ervenyes_napok,
                   b.elerheto,
                   t.nev AS tipus_nev
            FROM berletek b
            INNER JOIN tipusok t ON b.tipus_id = t.id
            ORDER BY b.ar ASC
        `);
        res.json(rows);
    } catch (error) {
        hibakezeles(res, error);
    }
});

app.get('/berletek/elerheto', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, tipus_id, megnevezes, ar,
                   ervenyesseg_nap AS ervenyes_napok,
                   elerheto
            FROM berletek
            WHERE elerheto = 1 AND ervenyesseg_nap <= 30
        `);
        res.json(rows);
    } catch (error) {
        hibakezeles(res, error);
    }
});

app.get('/berletek/kereses/:szoveg', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, tipus_id, megnevezes, ar,
                   ervenyesseg_nap AS ervenyes_napok,
                   elerheto
            FROM berletek
            WHERE megnevezes LIKE ?
        `, [`%${req.params.szoveg}%`]);
        res.json(rows);
    } catch (error) {
        hibakezeles(res, error);
    }
});

app.get('/tipusok/statisztika', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.nev AS tipus_nev,
                   COUNT(b.id) AS berletek_szama,
                   ROUND(AVG(b.ar), 1) AS atlagos_ar
            FROM tipusok t
            LEFT JOIN berletek b ON b.tipus_id = t.id
            GROUP BY t.id, t.nev
            ORDER BY t.id
        `);
        res.json(rows);
    } catch (error) {
        hibakezeles(res, error);
    }
});

app.get('/berletek/dragak', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT megnevezes, ar,
                   ervenyesseg_nap AS ervenyes_napok
            FROM berletek
            WHERE ar > 20000
            ORDER BY ervenyesseg_nap DESC
        `);
        res.json(rows);
    } catch (error) {
        hibakezeles(res, error);
    }
});

app.use((req, res) => {
    res.status(404).json({ hiba: 'A végpont nem található.' });
});

app.listen(PORT, () => {
    console.log(`A szerver fut: http://localhost:${PORT}`);
});