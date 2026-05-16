const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('backend/procurement.db');

db.serialize(() => {
    db.run("UPDATE purchase_requests SET created_at = '2026-05-13 10:00:00' WHERE pr_number LIKE '%20260513%'", (err) => {
        if (err) console.error('PR Update Error:', err);
        else console.log('PR dates synchronized to May 13th.');
    });

    db.run("UPDATE purchase_orders SET created_at = '2026-05-13 10:00:00' WHERE po_number LIKE '%20260513%'", (err) => {
        if (err) console.error('PO Update Error:', err);
        else console.log('PO dates synchronized to May 13th.');
    });
});

db.close();
