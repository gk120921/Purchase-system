const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// 執行簽核動作
router.post('/', async (req, res) => {
    const { target_type, target_id, approver, status, comment } = req.body;
    try {
        const db = getDb();
        
        // 1. 寫入簽核歷程
        await db.runAsync(
            'INSERT INTO approval_history (target_type, target_id, approver, status, comment) VALUES (?, ?, ?, ?, ?)',
            [target_type, target_id, approver, status, comment]
        );

        // 2. 更新目標單據狀態
        if (target_type === 'PR') {
            await db.runAsync('UPDATE purchase_requests SET status = ? WHERE id = ?', [status, target_id]);
        } else if (target_type === 'PO') {
            await db.runAsync('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, target_id]);
        }

        res.json({ success: true, message: 'Approval processed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 獲取簽核歷程
router.get('/history/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        const db = getDb();
        const history = await db.allAsync(
            'SELECT * FROM approval_history WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC',
            [type, id]
        );
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
