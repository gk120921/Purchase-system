const { setupDatabase, getDb } = require('./database');

async function clearData() {
    try {
        await setupDatabase();
        const db = getDb();
        console.log('Clearing PR/PO and Approval data...');

        await db.runAsync('DELETE FROM purchase_requests');
        await db.runAsync('DELETE FROM pr_items');
        await db.runAsync('DELETE FROM purchase_orders');
        await db.runAsync('DELETE FROM po_items');
        await db.runAsync('DELETE FROM approval_history');
        await db.runAsync('DELETE FROM approvals');
        await db.runAsync('DELETE FROM payment_vouchers');

        // Reset auto-increment counters
        const tables = ['purchase_requests', 'pr_items', 'purchase_orders', 'po_items', 'approval_history', 'approvals', 'payment_vouchers'];
        for (const table of tables) {
            await db.runAsync('DELETE FROM sqlite_sequence WHERE name = ?', [table]);
        }

        console.log('Data cleared successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Clear failed:', err);
        process.exit(1);
    }
}

clearData();
