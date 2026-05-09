const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const prs = await db.allAsync(`
            SELECT pr.id, pr.pr_number, pr.requester, pr.department, 
                   pr.total_amount, pr.status, pr.created_at, pr.remarks,
                   pr.subject_id, pr.supplier_id, pr.input_mode, pr.currency, pr.exchange_rate,
                   (SELECT remark_zh FROM pr_items WHERE pr_id = pr.id LIMIT 1) as item_remark_zh,
                   (SELECT remark_en FROM pr_items WHERE pr_id = pr.id LIMIT 1) as item_remark_en,
                   CASE 
                      WHEN s.id IS NOT NULL THEN (s.supplier_code || ' - ' || s.name)
                      ELSE pr.supplier_name 
                   END as display_supplier, 
                   (acc.code || ' - ' || acc.name) as display_subject 
            FROM purchase_requests pr
            LEFT JOIN suppliers s ON pr.supplier_id = s.id
            LEFT JOIN accounting_subjects acc ON pr.subject_id = acc.id
            WHERE pr.status NOT IN ('approved', 'converted', 'rejected')
            ORDER BY pr.created_at DESC
        `);
        res.json(prs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { requester, department, subject_id, supplier_id, items, remarks, input_mode = 'BOM', currency = 'INR', exchange_rate = 1.0 } = req.body;
    try {
        const db = getDb();
        const pr_number = `PR-${Date.now()}`;
        const total_amount = (items || []).reduce((sum, item) => sum + (parseFloat(item.quantity) * (parseFloat(item.unit_price) || 0)), 0);
        
        const thresholds = await db.allAsync('SELECT * FROM approval_thresholds WHERE dept_code IS NULL OR dept_code = ? ORDER BY min_amount DESC', [department]);
        const triggerThreshold = thresholds.find(t => total_amount >= t.min_amount);
        const status = (triggerThreshold && triggerThreshold.role_key === 'admin') ? 'gm_pending' : 'dept_pending';

        const isManual = isNaN(parseInt(supplier_id));
        const s_id = isManual ? null : supplier_id;
        const s_name = isManual ? supplier_id : null;

        const result = await db.runAsync(
            'INSERT INTO purchase_requests (pr_number, requester, department, subject_id, supplier_id, supplier_name, total_amount, remarks, status, input_mode, currency, exchange_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [pr_number, requester, department, subject_id, s_id, s_name, total_amount, remarks, status, input_mode, currency, exchange_rate]
        );
        
        const pr_id = result.lastID;
        const stmt = await db.prepareAsync(`
            INSERT INTO pr_items (
                pr_id, description, quantity, unit, demand_day, 
                purchase_quantity, manufacturer, date_of_purchase, 
                remark_zh, remark_en, unit_price, total, subject_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of items) {
            const qty = parseFloat(item.quantity) || 0;
            const up = parseFloat(item.unit_price) || 0;
            await stmt.runAsync(
                pr_id, 
                item.description || item.material_number || '未填寫', 
                qty, item.unit, item.demand_day, item.purchase_quantity, 
                item.manufacturer, item.date_of_purchase, item.remark_zh, item.remark_en, up, qty * up,
                item.subject_id || null
            );
        }
        await stmt.finalizeAsync();
        res.status(201).json({ id: pr_id, pr_number });
    } catch (err) {
        console.error('PR Post Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/items', async (req, res) => {
    try {
        const db = getDb();
        const items = await db.allAsync('SELECT * FROM pr_items WHERE pr_id = ?', [req.params.id]);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { requester, department, subject_id, supplier_id, items, remarks, input_mode = 'BOM', currency = 'INR', exchange_rate = 1.0 } = req.body;
    try {
        const db = getDb();
        const total_amount = (items || []).reduce((sum, item) => sum + (parseFloat(item.quantity) * (parseFloat(item.unit_price) || 0)), 0);
        const thresholds = await db.allAsync('SELECT * FROM approval_thresholds ORDER BY min_amount DESC');
        const triggerThreshold = thresholds.find(t => total_amount >= t.min_amount);
        const status = (triggerThreshold && triggerThreshold.role_key === 'admin') ? 'gm_pending' : 'dept_pending';

        const sub_id = parseInt(subject_id) || 1;
        const isManual = isNaN(parseInt(supplier_id));
        const s_id = isManual ? null : parseInt(supplier_id);
        const s_name = isManual ? supplier_id : null;

        await db.runAsync(
            'UPDATE purchase_requests SET requester = ?, department = ?, subject_id = ?, supplier_id = ?, supplier_name = ?, total_amount = ?, remarks = ?, status = ?, input_mode = ?, currency = ?, exchange_rate = ? WHERE id = ?',
            [requester, department, sub_id, s_id, s_name, total_amount, remarks, status, input_mode, currency, exchange_rate, id]
        );

        await db.runAsync('DELETE FROM pr_items WHERE pr_id = ?', [id]);
        const stmt = await db.prepareAsync(`
            INSERT INTO pr_items (
                pr_id, description, quantity, unit, demand_day, 
                purchase_quantity, manufacturer, date_of_purchase, 
                remark_zh, remark_en, unit_price, total, subject_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of items) {
            const qty = parseFloat(item.quantity) || 0;
            const up = parseFloat(item.unit_price) || 0;
            await stmt.runAsync(
                id, item.description || item.material_number || '未填寫', 
                qty, item.unit, item.demand_day, item.purchase_quantity, 
                item.manufacturer, item.date_of_purchase, item.remark_zh, item.remark_en, up, qty * up,
                item.subject_id || null
            );
        }
        await stmt.finalizeAsync();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.runAsync('DELETE FROM purchase_requests WHERE id = ?', [req.params.id]);
        await db.runAsync('DELETE FROM pr_items WHERE pr_id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
