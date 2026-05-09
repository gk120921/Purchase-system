const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/thresholds', async (req, res) => {
    try {
        const db = getDb();
        const thresholds = await db.allAsync('SELECT * FROM approval_thresholds ORDER BY priority ASC');
        res.json(thresholds);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/thresholds', async (req, res) => {
    const { thresholds } = req.body;
    try {
        const db = getDb();
        for (const t of thresholds) {
            await db.runAsync('UPDATE approval_thresholds SET level_name = ?, role_key = ?, min_amount = ?, priority = ?, dept_code = ? WHERE id = ?', 
            [t.level_name, t.role_key, t.min_amount, t.priority, t.dept_code || null, t.id]);
        }
        res.json({ message: 'Thresholds updated successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/thresholds', async (req, res) => {
    const { level_name, role_key, min_amount, priority, dept_code } = req.body;
    try {
        const db = getDb();
        await db.runAsync('INSERT INTO approval_thresholds (level_name, role_key, min_amount, priority, dept_code) VALUES (?, ?, ?, ?, ?)', 
        [level_name, role_key, min_amount, priority, dept_code || null]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/thresholds/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.runAsync('DELETE FROM approval_thresholds WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
