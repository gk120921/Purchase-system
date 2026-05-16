const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('backend/procurement.db');

db.all("SELECT * FROM users WHERE name LIKE '%TaiKun%' OR name LIKE '%台昆%' OR username LIKE '%TaiKun%'", (err, rows) => {
    if (err) console.error(err);
    else console.log(JSON.stringify(rows, null, 2));
    db.close();
});
