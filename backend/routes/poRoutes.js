const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// 核心生成函數
async function generatePONumber(db) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}${mm}${dd}`;
    const pattern = `PO-${todayStr}%`;
    
    const lastPO = await db.getAsync(
        "SELECT po_number FROM purchase_orders WHERE po_number LIKE ? ORDER BY id DESC LIMIT 1", 
        [pattern]
    );
    
    let nextSeq = "001";
    if (lastPO && lastPO.po_number) {
        const lastPart = lastPO.po_number.split('-').pop();
        const seqPart = lastPart.substring(8);
        if (!isNaN(parseInt(seqPart))) {
            nextSeq = String(parseInt(seqPart, 10) + 1).padStart(3, '0');
        }
    }
    const finalNum = `PO-${todayStr}${nextSeq}`;
    console.log(`[NumberGenerator] Generated New PO Number: ${finalNum}`);
    return finalNum;
}

// 取得下一個 PO 單號
router.get('/next-number', async (req, res) => {
    try {
        const db = getDb();
        const next = await generatePONumber(db);
        res.json({ next });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const pos = await db.allAsync(`
            SELECT po.*, 
                   pr.pr_number as pr_number,
                   CASE 
                      WHEN s.id IS NOT NULL THEN (s.supplier_code || ' - ' || s.name)
                      ELSE po.supplier_name 
                   END as display_supplier,
                   (SELECT GROUP_CONCAT(description, ', ') FROM po_items WHERE po_id = po.id) as items_summary
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN purchase_requests pr ON po.pr_id = pr.id
            WHERE po.status NOT IN ('closed', 'rejected')
            ORDER BY po.created_at DESC
        `);
        res.json(pos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/items', async (req, res) => {
    try {
        const db = getDb();
        const items = await db.allAsync('SELECT * FROM po_items WHERE po_id = ?', [req.params.id]);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { 
        pr_id, supplier_id, supplier_name, requester, department, items, remarks, currency, exchange_rate, 
        subtotal, cgst_rate, sgst_rate, cgst_amount, sgst_amount, shipping_fee, total_amount,
        shipping_remark_zh, shipping_remark_en, excluding_tax_amount
    } = req.body;
    try {
        const db = getDb();
        const po_number = await generatePONumber(db);
        
        const result = await db.runAsync(
            `INSERT INTO purchase_orders (
                po_number, pr_id, supplier_id, supplier_name, requester, department,
                subtotal, cgst_rate, sgst_rate, 
                cgst_amount, sgst_amount, shipping_fee, total_amount, 
                remarks, status, currency, exchange_rate,
                shipping_remark_zh, shipping_remark_en, excluding_tax_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                po_number, pr_id, supplier_id, supplier_name, requester, department,
                subtotal || 0, cgst_rate || 9, sgst_rate || 9, 
                cgst_amount || 0, sgst_amount || 0, shipping_fee || 0, total_amount || 0, 
                remarks, 'pending', currency, exchange_rate,
                shipping_remark_zh, shipping_remark_en, excluding_tax_amount || 0
            ]
        );
        
        const po_id = result.lastID;
        const stmt = await db.prepareAsync(`
            INSERT INTO po_items (
                po_id, material_number, description, quantity, unit, 
                demand_day, purchase_quantity, manufacturer, date_of_purchase, 
                remark_zh, remark_en, unit_price, total, subject_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of items) {
            await stmt.runAsync(
                po_id, item.material_number || '', item.description || '', 
                item.quantity || 0, item.unit || '', item.demand_day || '', 
                item.purchase_quantity || 0, item.manufacturer || '', 
                item.date_of_purchase || '', item.date_of_purchase || '', // 暫時映射
                item.remark_zh || '', item.unit_price || 0, 
                item.total || 0, item.subject_id || null
            );
        }
        await stmt.finalizeAsync();

        if (pr_id) {
            await db.runAsync('UPDATE purchase_requests SET status = "po_created" WHERE id = ?', [pr_id]);
        }

        res.status(201).json({ id: po_id, po_number });
    } catch (err) {
        console.error('Create PO Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { 
        supplier_id, supplier_name, requester, department, items, remarks, currency, exchange_rate, 
        subtotal, cgst_rate, sgst_rate, cgst_amount, sgst_amount, shipping_fee, total_amount, status,
        shipping_remark_zh, shipping_remark_en, excluding_tax_amount
    } = req.body;
    try {
        const db = getDb();
        await db.runAsync(
            `UPDATE purchase_orders SET 
                supplier_id = ?, supplier_name = ?, requester = ?, department = ?,
                subtotal = ?, cgst_rate = ?, sgst_rate = ?, 
                cgst_amount = ?, sgst_amount = ?, shipping_fee = ?, total_amount = ?, 
                remarks = ?, status = ?, currency = ?, exchange_rate = ?,
                shipping_remark_zh = ?, shipping_remark_en = ?, excluding_tax_amount = ?
            WHERE id = ?`,
            [
                supplier_id, supplier_name, requester, department,
                subtotal || 0, cgst_rate || 9, sgst_rate || 9, 
                cgst_amount || 0, sgst_amount || 0, shipping_fee || 0, total_amount || 0, 
                remarks, status || 'pending', currency, exchange_rate, 
                shipping_remark_zh, shipping_remark_en, excluding_tax_amount || 0, req.params.id
            ]
        );

        // Update items
        await db.runAsync('DELETE FROM po_items WHERE po_id = ?', [req.params.id]);
        const stmt = await db.prepareAsync(`
            INSERT INTO po_items (
                po_id, material_number, description, quantity, unit, 
                demand_day, purchase_quantity, manufacturer, date_of_purchase, 
                remark_zh, remark_en, unit_price, total, subject_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of items) {
            await stmt.runAsync(
                req.params.id, item.material_number || '', item.description || '', 
                item.quantity || 0, item.unit || '', item.demand_day || '', 
                item.purchase_quantity || 0, item.manufacturer || '', 
                item.date_of_purchase || '', item.remark_zh || '', 
                item.remark_en || '', item.unit_price || 0, 
                item.total || 0, item.subject_id || null
            );
        }
        await stmt.finalizeAsync();

        res.json({ success: true });
    } catch (err) {
        console.error('Update PO Error:', err);
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

router.get('/:id', async (req, res) => {
    try {
        const db = getDb();
        const po = await db.getAsync(`
            SELECT po.*, 
                   pr.pr_number as linked_pr_number,
                   CASE 
                      WHEN s.id IS NOT NULL THEN (s.supplier_code || ' - ' || s.name)
                      ELSE po.supplier_name 
                   END as linked_supplier_name
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN purchase_requests pr ON po.pr_id = pr.id
            WHERE po.id = ?
        `, [req.params.id]);
        if (!po) return res.status(404).json({ error: 'PO not found' });
        
        const items = await db.allAsync('SELECT * FROM po_items WHERE po_id = ?', [req.params.id]);
        po.items = items;
        
        res.json(po);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
