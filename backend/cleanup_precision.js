const { setupDatabase, getDb } = require('./database');

async function cleanupPrecision() {
    try {
        await setupDatabase();
        const db = getDb();
        console.log('--- Starting Global Precision Cleanup ---');

        // 1. 修復採購單 (PO)
        const sqlPO = `
            UPDATE purchase_orders 
            SET subtotal = ROUND(subtotal, 2),
                cgst_amount = ROUND(cgst_amount, 2),
                sgst_amount = ROUND(sgst_amount, 2),
                shipping_fee = ROUND(shipping_fee, 2),
                total_amount = ROUND(total_amount, 2),
                excluding_tax_amount = ROUND(excluding_tax_amount, 2)
        `;
        const resPO = await db.runAsync(sqlPO);
        console.log(`Cleaned up Purchase Orders: ${resPO.changes} rows.`);

        // 2. 修復請購單 (PR)
        const sqlPR = `
            UPDATE purchase_requests 
            SET total_amount = ROUND(total_amount, 2)
        `;
        const resPR = await db.runAsync(sqlPR);
        console.log(`Cleaned up Purchase Requests: ${resPR.changes} rows.`);

        // 3. 修復品項明細 (Items)
        await db.runAsync("UPDATE po_items SET unit_price = ROUND(unit_price, 2), total = ROUND(total, 2)");
        await db.runAsync("UPDATE pr_items SET unit_price = ROUND(unit_price, 2), total = ROUND(total, 2)");
        console.log('Cleaned up all Item details.');

        console.log('SUCCESS: Global precision cleanup complete.');
        process.exit(0);
    } catch (err) {
        console.error('Cleanup Failed:', err);
        process.exit(1);
    }
}

cleanupPrecision();
