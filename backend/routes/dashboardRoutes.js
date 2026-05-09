const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/stats', async (req, res) => {
    try {
        const db = getDb();
        
        // 1. 每月支出趨勢 (過去 6 個月)
        const monthlyTrend = await db.allAsync(`
            SELECT strftime('%Y-%m', created_at) as month, SUM(total_amount * exchange_rate) as amount
            FROM purchase_orders
            WHERE created_at >= date('now', '-6 months')
            GROUP BY month
            ORDER BY month ASC
        `);

        // 2. 類別佔比 (依會計科目)
        const categoryStats = await db.allAsync(`
            SELECT s.name as category, SUM(pr.total_amount * pr.exchange_rate) as total_value
            FROM purchase_requests pr
            JOIN accounting_subjects s ON pr.subject_id = s.id
            GROUP BY s.name
        `);

        // 3. 支出排行榜 (前 3 大科目)
        const top3 = await db.allAsync(`
            SELECT s.name as category, SUM(pr.total_amount * pr.exchange_rate) as total_value
            FROM purchase_requests pr
            JOIN accounting_subjects s ON pr.subject_id = s.id
            GROUP BY s.name
            ORDER BY total_value DESC
            LIMIT 3
        `);

        res.json({
            monthlyTrend: monthlyTrend || [],
            categoryStats: categoryStats || [],
            top3: top3 || []
        });
    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
