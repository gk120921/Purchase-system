const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const units = await db.allAsync('SELECT * FROM units ORDER BY name ASC');
        res.json(units);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/', async (req, res) => {
    const { name, description } = req.body;
    try {
        const db = getDb();
        await db.runAsync('INSERT INTO units (name, description) VALUES (?, ?)', [name, description]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/:id', async (req, res) => {
    const { name, description } = req.body;
    try {
        const db = getDb();
        await db.runAsync('UPDATE units SET name = ?, description = ? WHERE id = ?', [name, description, req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.runAsync('DELETE FROM units WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
