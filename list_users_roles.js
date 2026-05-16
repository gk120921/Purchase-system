const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('backend/procurement.db');

db.all('SELECT username, name, role, department FROM users', (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
