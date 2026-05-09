const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/po-details', async (req, res) => {
    try {
        const db = getDb();
        const rows = await db.all(`
            SELECT 
                po.po_number,
                po.created_at as po_date,
                pr.pr_number,
                COALESCE(s.name, po.supplier_name) as supplier_name,
                s.supplier_code,
                pi.material_number,
                pi.description,
                pi.unit,
                pi.quantity,
                pi.unit_price,
                sub.code as subject_code,
                pi.remark_zh,
                po.status
            FROM po_items pi
            JOIN purchase_orders po ON pi.po_id = po.id
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN purchase_requests pr ON po.pr_id = pr.id
            LEFT JOIN accounting_subjects sub ON pi.subject_id = sub.id
            ORDER BY po.created_at DESC, pi.id ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('EXPORT API ERROR:', err);
        res.status(500).json({ error: 'EXPORT_DB_ERROR', message: err.message });
    }
});

module.exports = router;
