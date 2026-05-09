const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// 獲取所有部門 (含父子關係)
router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const rows = await db.allAsync(`
            SELECT d.*, p.name as parent_name 
            FROM departments d 
            LEFT JOIN departments p ON d.parent_id = p.id
        `);
        res.json(rows);
    } catch (err) {
        console.error('Dept API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 新增部門
router.post('/', async (req, res) => {
    const { dept_code, name, parent_id, manager_id } = req.body;
    try {
        const db = getDb();
        const result = await db.runAsync(
            'INSERT INTO departments (dept_code, name, parent_id, manager_id) VALUES (?, ?, ?, ?)',
            [dept_code, name, parent_id, manager_id]
        );
        res.json({ id: result.lastID, message: 'Department created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 刪除部門
router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.runAsync('DELETE FROM departments WHERE id = ?', [req.params.id]);
        res.json({ message: 'Department deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
