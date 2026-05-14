const { setupDatabase, getDb } = require('./database');
(async () => {
    await setupDatabase();
    const db = getDb();
    const pos = await db.allAsync('SELECT po_number, status, requester, total_amount FROM purchase_orders');
    console.log(JSON.stringify(pos, null, 2));
    process.exit(0);
})();
