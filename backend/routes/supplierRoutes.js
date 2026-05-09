const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const suppliers = await db.all('SELECT * FROM suppliers ORDER BY id DESC');
        res.json(suppliers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { supplier_code, name, tax_id, category, contact, phone, email, address } = req.body;
    try {
        const db = getDb();
        await db.run(
            'INSERT INTO suppliers (supplier_code, name, tax_id, category, contact, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [supplier_code, name, tax_id, category, contact, phone, email, address]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { supplier_code, name, tax_id, category, contact, phone, email, address } = req.body;
    try {
        const db = getDb();
        await db.run(
            'UPDATE suppliers SET supplier_code=?, name=?, tax_id=?, category=?, contact=?, phone=?, email=?, address=? WHERE id=?',
            [supplier_code, name, tax_id, category, contact, phone, email, address, req.params.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.run('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
