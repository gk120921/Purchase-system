const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const pos = await db.allAsync(`
            SELECT po.*, 
                   s.name as supplier_name,
                   s.supplier_code as supplier_code
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            WHERE po.status NOT IN ('approved', 'closed', 'rejected')
            ORDER BY po.created_at DESC
        `);
        res.json(pos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { pr_id, supplier_id, items, remarks, currency, exchange_rate, total_amount } = req.body;
    try {
        const db = getDb();
        const po_number = `PO-${Date.now()}`;
        
        const result = await db.runAsync(
            'INSERT INTO purchase_orders (po_number, pr_id, supplier_id, total_amount, remarks, status, currency, exchange_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [po_number, pr_id, supplier_id, total_amount, remarks, 'pending', currency, exchange_rate]
        );
        
        const po_id = result.lastID;
        const stmt = await db.prepareAsync('INSERT INTO po_items (po_id, description, quantity, unit, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)');
        for (const item of items) {
            await stmt.runAsync(po_id, item.description, item.quantity, item.unit, item.unit_price, item.total);
        }
        await stmt.finalizeAsync();

        if (pr_id) {
            await db.runAsync('UPDATE purchase_requests SET status = "po_created" WHERE id = ?', [pr_id]);
        }

        res.status(201).json({ id: po_id, po_number });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.runAsync('DELETE FROM purchase_orders WHERE id = ?', [req.params.id]);
        await db.runAsync('DELETE FROM po_items WHERE po_id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
