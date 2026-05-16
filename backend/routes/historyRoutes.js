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
            SELECT 
                'PR' as type, 
                pr.id as id, 
                pr.pr_number as number, 
                pr.pr_number as pr_number, 
                pr.requester as requester, 
                pr.department as department, 
                pr.total_amount as total_amount, 
                pr.status as status, 
                pr.created_at as created_at, 
                pr.remarks as remarks,
                pr.currency as currency, 
                pr.exchange_rate as exchange_rate, 
                pr.input_mode as input_mode,
                (SELECT approver FROM approval_history WHERE target_type = 'PR' AND target_id = pr.id ORDER BY created_at DESC LIMIT 1) as last_approver,
                (SELECT created_at FROM approval_history WHERE target_type = 'PR' AND target_id = pr.id ORDER BY created_at DESC LIMIT 1) as approval_date
            FROM purchase_requests pr
            WHERE pr.status IN ('approved', 'converted', 'rejected')
            ${search ? 'AND (pr.pr_number LIKE ? OR pr.requester LIKE ? OR pr.department LIKE ?)' : ''}
        `, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);

        // 整合 PO 歷史
        const poHistory = await db.allAsync(`
            SELECT 
                'PO' as type, 
                po.id as id, 
                po.po_number as number, 
                po.po_number as po_number, 
                pr.pr_number as pr_number, 
                pr.requester as requester, 
                pr.department as department, 
                po.total_amount as total_amount, 
                po.status as status, 
                po.created_at as created_at, 
                po.remarks as remarks,
                po.currency as currency, 
                po.exchange_rate as exchange_rate, 
                po.subtotal as subtotal, 
                po.supplier_name as supplier_name,
                po.cgst_rate as cgst_rate, 
                po.sgst_rate as sgst_rate, 
                po.cgst_amount as cgst_amount, 
                po.sgst_amount as sgst_amount, 
                po.shipping_fee as shipping_fee,
                (SELECT name FROM suppliers WHERE id = po.supplier_id) as display_supplier,
                (SELECT approver FROM approval_history WHERE target_type = 'PO' AND target_id = po.id ORDER BY created_at DESC LIMIT 1) as last_approver,
                (SELECT created_at FROM approval_history WHERE target_type = 'PO' AND target_id = po.id ORDER BY created_at DESC LIMIT 1) as approval_date
            FROM purchase_orders po
            LEFT JOIN purchase_requests pr ON po.pr_id = pr.id
            WHERE po.status IN ('approved', 'closed', 'rejected')
            ${search ? 'AND (po.po_number LIKE ? OR pr.requester LIKE ? OR pr.department LIKE ?)' : ''}
        `, search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []);

        // 整合兩者並按日期排序
        const combined = [...prHistory, ...poHistory].sort((a, b) => new Date(b.approval_date || b.created_at) - new Date(a.approval_date || a.created_at));
        
        res.json(combined);
    } catch (err) {
        console.error('History API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 退回單據 (將狀態改回待簽核或草稿)
router.post('/return/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        const db = getDb();
        
        // 1. 先清除該單據目前所有的簽核任務 (避免重複)
        await db.runAsync("DELETE FROM approvals WHERE target_type = ? AND target_id = ?", [type, id]);

        if (type === 'PR') {
            // 2a. 更新 PR 狀態
            await db.runAsync('UPDATE purchase_requests SET status = "dept_pending" WHERE id = ?', [id]);
            
            // 3a. 重新尋找該部門的經理來簽核
            const pr = await db.getAsync("SELECT department FROM purchase_requests WHERE id = ?", [id]);
            const dept = await db.getAsync("SELECT manager FROM departments WHERE name = ?", [pr.department]);
            const manager = dept ? dept.manager : 'tkchen'; // 預設給 tkchen

            await db.runAsync(
                "INSERT INTO approvals (target_type, target_id, approver, status) VALUES ('PR', ?, ?, 'pending')",
                [id, manager]
            );
        } else {
            // 2b. 更新 PO 狀態
            await db.runAsync('UPDATE purchase_orders SET status = "pending" WHERE id = ?', [id]);
            
            // 3b. 重新指派給經理 (固定為 tkchen)
            await db.runAsync(
                "INSERT INTO approvals (target_type, target_id, approver, status) VALUES ('PO', ?, 'tkchen', 'pending')",
                [id]
            );
        }

        // 4. 在歷史紀錄中留下一筆「退回」的紀錄
        await db.runAsync(
            "INSERT INTO approval_history (target_type, target_id, approver, status, comment) VALUES (?, ?, '系統系統', 'rejected', '從審查歷史退回待簽核')",
            [type, id]
        );

        res.json({ success: true, message: '單據已成功退回至待簽核清單' });
    } catch (err) {
        console.error('Return Error:', err);
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
