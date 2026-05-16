const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('backend/procurement.db');

const allowed_modules = JSON.stringify([
    "dashboard", "po", "export", "departments", "pr", 
    "subjects", "suppliers", "users", "materials", "approvals"
]);

const sql = "UPDATE users SET username = ?, password = ?, allowed_modules = ? WHERE name = '陳台昆'";
const params = ['Taikun', 'Taikun', allowed_modules];

db.run(sql, params, (err) => {
    if (err) {
        console.error('Update Error:', err);
    } else {
        console.log('TaiKun (Director) username and password updated to: Taikun');
    }
    db.close();
});
