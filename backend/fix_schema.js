const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./procurement.db');

db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run(`
        CREATE TABLE purchase_orders_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            po_number TEXT NOT NULL,
            pr_id INTEGER,
            supplier_id INTEGER,
            total_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            requester TEXT,
            department TEXT,
            remarks TEXT,
            supplier_name TEXT,
            currency TEXT DEFAULT 'INR',
            exchange_rate REAL DEFAULT 1.0,
            subtotal REAL DEFAULT 0,
            cgst_rate REAL DEFAULT 9,
            sgst_rate REAL DEFAULT 9,
            cgst_amount REAL DEFAULT 0,
            sgst_amount REAL DEFAULT 0,
            shipping_fee REAL DEFAULT 0
        )
    `);
    db.run('INSERT INTO purchase_orders_new SELECT * FROM purchase_orders');
    db.run('DROP TABLE purchase_orders');
    db.run('ALTER TABLE purchase_orders_new RENAME TO purchase_orders');
    db.run('COMMIT', (err) => {
        if (err) console.error('FAILED:', err);
        else console.log('SUCCESS: supplier_id is now nullable');
    });
});
db.close();
