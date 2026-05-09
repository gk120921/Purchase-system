const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const materials = await db.allAsync('SELECT * FROM materials ORDER BY material_number ASC');
        res.json(materials);
    } catch (err) {
        console.error('GET Materials Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { material_number, name, unit } = req.body;
    try {
        const db = getDb();
        await db.runAsync('INSERT INTO materials (material_number, name, unit) VALUES (?, ?, ?)', [material_number, name || material_number, unit]);
        console.log(`Success: Added material ${material_number}`);
        res.json({ success: true });
    } catch (err) {
        console.error('POST Material Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { material_number, name, unit } = req.body;
    try {
        const db = getDb();
        await db.runAsync('UPDATE materials SET material_number = ?, name = ?, unit = ? WHERE id = ?', [material_number, name, unit, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('PUT Material Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.runAsync('DELETE FROM materials WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE Material Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
