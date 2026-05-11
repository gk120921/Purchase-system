const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'backend', 'procurement.db');
const db = new sqlite3.Database(dbPath);

const pr_id = 6; 

db.serialize(() => {
    db.get('SELECT * FROM purchase_requests WHERE id = ?', [pr_id], (err, pr) => {
        if (err) { console.error('DB ERROR:', err); return; }
        if (!pr) { console.log('PR NOT FOUND'); return; }

        console.log('Found PR:', pr.pr_number, 'Amount:', pr.total_amount);

        db.all('SELECT * FROM pr_items WHERE pr_id = ?', [pr_id], (err, items) => {
            const po_number = `PO-FIX-${Date.now()}`;
            const subtotal = pr.total_amount || 0;
            const cgst = subtotal * 0.09;
            const sgst = subtotal * 0.09;
            const total = subtotal + cgst + sgst;

            db.run(`
                INSERT INTO purchase_orders (
                    po_number, pr_id, supplier_id, subtotal, cgst_rate, sgst_rate, 
                    cgst_amount, sgst_amount, shipping_fee, total_amount, 
                    remarks, status, currency, exchange_rate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    po_number, pr.id, pr.supplier_id, subtotal, 9, 9, 
                    cgst, sgst, 0, total, 
                    'Emergency Recovery', 'pending', pr.currency || 'INR', pr.exchange_rate || 1.0
                ],
                function(err) {
                    if (err) {
                        console.error('*** INSERT PO FAILED ***');
                        console.error('Error Message:', err.message);
                        return;
                    }

                    const po_id = this.lastID;
                    console.log('PO Created Successfully! ID:', po_id);

                    items.forEach(item => {
                        db.run('INSERT INTO po_items (po_id, description, quantity, unit, unit_price, total) VALUES (?, ?, ?, ?, ?, ?)', 
                            [po_id, item.description, item.quantity, item.unit, item.unit_price, item.total]
                        );
                    });

                    db.run('UPDATE purchase_requests SET status = "converted" WHERE id = ?', [pr_id], () => {
                        console.log('PR Status fixed to converted');
                        console.log('Please check PO list now!');
                    });
                }
            );
        });
    });
});
