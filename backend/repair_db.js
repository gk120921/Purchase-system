const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('procurement.db');

db.serialize(() => {
    db.run("UPDATE purchase_orders SET status = 'draft' WHERE status IS NULL OR status = 'open' OR status = ''", (err) => {
        if (err) console.error(err);
        else console.log('Updated PO statuses to draft');
    });
    db.run("UPDATE po_items SET material_number = description WHERE material_number IS NULL OR material_number = ''", (err) => {
        if (err) console.error(err);
        else console.log('Updated PO item material numbers');
    });
});
db.close();
