const { setupDatabase, getDb } = require('./database');

async function findPO() {
    try {
        await setupDatabase();
        const db = getDb();
        const po = await db.allAsync("SELECT * FROM purchase_orders WHERE subtotal = 5510 OR total_amount = 5510 OR total_amount = 5786 OR total_amount = 5785.5");
        console.log('--- PO Search Results ---');
        console.log(JSON.stringify(po, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findPO();
