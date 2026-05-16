const { setupDatabase, getDb } = require('./database');

async function migrate() {
    try {
        await setupDatabase();
        const db = getDb();
        console.log('--- Adding Excluding Tax Column ---');

        try {
            await db.runAsync("ALTER TABLE purchase_orders ADD COLUMN excluding_tax_amount REAL DEFAULT 0");
            console.log('Added excluding_tax_amount');
        } catch (e) { console.log('excluding_tax_amount might exist'); }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
