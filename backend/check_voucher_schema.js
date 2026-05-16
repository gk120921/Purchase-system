const { setupDatabase, getDb } = require('./database');

async function checkSchema() {
    try {
        await setupDatabase();
        const db = getDb();
        const schema = await db.allAsync("PRAGMA table_info(payment_vouchers)");
        console.log('--- payment_vouchers schema ---');
        console.log(JSON.stringify(schema, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
