const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'procurement.db');
const db = new sqlite3.Database(dbPath);

const updates = [
    { code: 'I000', cn: '印度工廠' },
    { code: 'I100', cn: '行政部' },
    { code: 'I200', cn: '品保部' },
    { code: 'I300', cn: '生產部' },
    { code: 'I110', cn: '財務課' },
    { code: 'I120', cn: '採購課' },
    { code: 'I130', cn: '人資行政課' },
    { code: 'I210', cn: '品保課' },
    { code: 'I211', cn: '品保組' }
];

db.serialize(() => {
    updates.forEach(item => {
        db.run("UPDATE departments SET name = ? WHERE dept_code = ?", [item.cn, item.code], (err) => {
            if (err) console.error(`Error updating ${item.code}:`, err);
            else console.log(`Updated ${item.code} to ${item.cn}`);
        });
    });
});

db.close();
