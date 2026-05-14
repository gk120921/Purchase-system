const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// 獲取所有付款憑單
router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const vouchers = await db.allAsync('SELECT * FROM payment_vouchers ORDER BY id DESC');
        res.json(vouchers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 獲取付款憑單 (根據 PO ID)
router.get('/po/:po_id', async (req, res) => {
    try {
        const db = getDb();
        let voucher = await db.getAsync('SELECT * FROM payment_vouchers WHERE po_id = ?', [req.params.po_id]);
        
        if (!voucher) {
            const po = await db.getAsync('SELECT * FROM purchase_orders WHERE id = ?', [req.params.po_id]);
            if (!po) return res.status(404).json({ error: 'PO not found' });
            
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const d = String(now.getDate()).padStart(2, '0');
            const todayStr = `${y}${m}${d}`;
            const voucher_number = `PV-${todayStr}-${req.params.po_id}`;
            
            await db.runAsync(
                `INSERT INTO payment_vouchers (po_id, voucher_number, net_amount, status) 
                 VALUES (?, ?, ?, ?)`,
                [req.params.po_id, voucher_number, po.total_amount, 'pending']
            );
            voucher = await db.getAsync('SELECT * FROM payment_vouchers WHERE po_id = ?', [req.params.po_id]);
        }
        res.json(voucher);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 更新付款憑單
router.put('/:id', async (req, res) => {
    const { 
        payment_category, due_date, tds_rate, tds_amount, net_amount, 
        remarks, status, authorized_by, requested_by, reviewed_by 
    } = req.body;
    try {
        const db = getDb();
        await db.runAsync(
            `UPDATE payment_vouchers SET 
                payment_category = ?, 
                due_date = ?, 
                tds_rate = ?, 
                tds_amount = ?, 
                net_amount = ?, 
                remarks = ?, 
                status = ?,
                authorized_by = ?,
                requested_by = ?,
                reviewed_by = ?
            WHERE id = ?`,
            [
                payment_category, due_date, tds_rate, tds_amount, net_amount, 
                remarks, status, authorized_by, requested_by, reviewed_by, req.params.id
            ]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
