const { setupDatabase, getDb } = require('./database');

async function migrate() {
    try {
        await setupDatabase();
        const db = getDb();
        await db.runAsync("ALTER TABLE payment_vouchers ADD COLUMN exchange_rate REAL DEFAULT 1.0");
        console.log("SUCCESS: Added exchange_rate to payment_vouchers.");
        process.exit(0);
    } catch (err) {
        if (err.message.includes("duplicate column name")) {
            console.log("INFO: Column exchange_rate already exists.");
            process.exit(0);
        }
        console.error(err);
        process.exit(1);
    }
}

migrate();
