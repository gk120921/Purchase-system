const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const rows = await db.allAsync('SELECT * FROM accounting_subjects ORDER BY code ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { code, name, description } = req.body;
    try {
        const db = getDb();
        const result = await db.runAsync(
            'INSERT INTO accounting_subjects (code, name, description) VALUES (?, ?, ?)',
            [code, name, description]
        );
        res.json({ id: result.lastID, message: 'Subject created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { code, name, description } = req.body;
    try {
        const db = getDb();
        await db.runAsync(
            'UPDATE accounting_subjects SET code = ?, name = ?, description = ? WHERE id = ?',
            [code, name, description, req.params.id]
        );
        res.json({ message: 'Subject updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.runAsync('DELETE FROM accounting_subjects WHERE id = ?', [req.params.id]);
        res.json({ message: 'Subject deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
