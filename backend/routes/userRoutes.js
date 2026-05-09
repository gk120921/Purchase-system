const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = getDb();
        const user = await db.getAsync('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (user) {
            const { password: _, ...userWithoutPassword } = user;
            if (userWithoutPassword.allowed_modules) {
                try {
                    let modules = JSON.parse(userWithoutPassword.allowed_modules);
                    if (typeof modules === 'string') modules = JSON.parse(modules);
                    userWithoutPassword.allowed_modules = Array.isArray(modules) ? modules : [];
                } catch (e) {
                    userWithoutPassword.allowed_modules = [];
                }
            }
            res.json(userWithoutPassword);
        } else {
            res.status(401).json({ error: '帳號或密碼錯誤' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User Management
router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const users = await db.allAsync(`
            SELECT u.*, 
                   d.name as joined_dept_name, 
                   d.dept_code as joined_dept_code, 
                   p.name as joined_proxy_name
            FROM users u
            LEFT JOIN departments d ON u.dept_id = d.id
            LEFT JOIN users p ON u.proxy_user_id = p.id
        `);
        const formattedUsers = users.map(u => {
            let modules = [];
            try {
                modules = u.allowed_modules ? JSON.parse(u.allowed_modules) : [];
                if (typeof modules === 'string') modules = JSON.parse(modules); // Handle double stringification
            } catch (e) { modules = []; }
            
            return {
                ...u,
                display_dept_name: u.joined_dept_name || u.dept_name || '未分配',
                display_dept_code: u.joined_dept_code || u.dept_code || 'N/A',
                proxy_name: u.joined_proxy_name || '無',
                allowed_modules: Array.isArray(modules) ? modules : []
            };
        });
        res.json(formattedUsers);
    } catch (err) {
        console.error('User API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 新增人員
router.post('/', async (req, res) => {
    const { username, password, name, role, dept_id, allowed_modules, proxy_user_id, proxy_start, proxy_end } = req.body;
    try {
        const db = getDb();
        const result = await db.runAsync(
            `INSERT INTO users (username, password, name, role, dept_id, allowed_modules, proxy_user_id, proxy_start, proxy_end) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, password, name, role, dept_id, JSON.stringify(allowed_modules || []), proxy_user_id, proxy_start, proxy_end]
        );
        res.json({ id: result.lastID, message: 'User created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 更新人員
router.put('/:id', async (req, res) => {
    const { username, password, name, role, dept_id, allowed_modules, proxy_user_id, proxy_start, proxy_end } = req.body;
    try {
        const db = getDb();
        await db.runAsync(
            `UPDATE users SET username=?, password=?, name=?, role=?, dept_id=?, allowed_modules=?, proxy_user_id=?, proxy_start=?, proxy_end=? WHERE id=?`,
            [username, password, name, role, dept_id, JSON.stringify(allowed_modules || []), proxy_user_id, proxy_start, proxy_end, req.params.id]
        );
        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 刪除人員
router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        await db.runAsync('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
