const { setupDatabase } = require('./database');

async function checkStatus() {
    let db;
    try {
        db = await setupDatabase();
        const prStatus = await db.allAsync('SELECT status, COUNT(*) as count FROM purchase_requests GROUP BY status');
        console.log('--- PR Status Counts ---');
        console.log(prStatus);
        
        const poStatus = await db.allAsync('SELECT status, COUNT(*) as count FROM purchase_orders GROUP BY status');
        console.log('--- PO Status Counts ---');
        console.log(poStatus);

        const units = await db.allAsync('SELECT * FROM units');
        console.log('--- Units ---');
        console.log(units);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkStatus();
