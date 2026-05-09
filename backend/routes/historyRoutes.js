const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// 獲取所有已完成的審查紀錄 (PR & PO)
router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const { search } = req.query;
        let whereClause = '';
        let params = [];

        if (search) {
            whereClause = `AND (pr_number LIKE ? OR requester LIKE ? OR department LIKE ?)`;
            params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }

        // 整合 PR 歷史
        const prHistory = await db.allAsync(`
            SELECT 'PR' as type, id, pr_number as number, requester, department, 
                   total_amount, status, created_at, remarks,
                   currency, exchange_rate
            FROM purchase_requests
            WHERE status IN ('approved', 'converted', 'rejected')
            ${whereClause}
        `, params);

        // 整合 PO 歷史
        const poHistory = await db.allAsync(`
            SELECT 'PO' as type, id, po_number as number, 'N/A' as requester, 'N/A' as department, 
                   total_amount, status, created_at, remarks,
                   currency, exchange_rate
            FROM purchase_orders
            WHERE status IN ('approved', 'closed', 'rejected')
            ${search ? 'AND (po_number LIKE ?)' : ''}
        `, search ? [`%${search}%`] : []);

        // 整合兩者並按日期排序
        const combined = [...prHistory, ...poHistory].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        res.json(combined);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 退回單據 (將狀態改回待簽核或草稿)
router.post('/return/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        const db = getDb();
        if (type === 'PR') {
            await db.runAsync('UPDATE purchase_requests SET status = "dept_pending" WHERE id = ?', [id]);
        } else {
            await db.runAsync('UPDATE purchase_orders SET status = "pending" WHERE id = ?', [id]);
        }
        res.json({ success: true, message: '單據已成功退回至待簽核清單' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 刪除單據
router.delete('/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        const db = getDb();
        if (type === 'PR') {
            await db.runAsync('DELETE FROM purchase_requests WHERE id = ?', [id]);
            await db.runAsync('DELETE FROM pr_items WHERE pr_id = ?', [id]);
        } else {
            await db.runAsync('DELETE FROM purchase_orders WHERE id = ?', [id]);
            await db.runAsync('DELETE FROM po_items WHERE po_id = ?', [id]);
        }
        res.json({ success: true, message: '紀錄已永久刪除' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
