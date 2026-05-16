const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('backend/procurement.db');

const sql = "INSERT INTO users (username, password, name, role, dept_name, dept_code) VALUES (?, ?, ?, ?, ?, ?)";
const params = ['TaiKun', '123456', '陳台昆', 'manager', '管理層', 'M001'];

db.run(sql, params, (err) => {
    if (err) {
        console.error('Insert Error:', err);
    } else {
        console.log('TaiKun (Director) added successfully with manager role.');
    }
    db.close();
});
