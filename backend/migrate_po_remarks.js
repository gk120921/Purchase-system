const { setupDatabase, getDb } = require('./database');

async function migrate() {
    try {
        await setupDatabase();
        const db = getDb();
        console.log('--- Adding Shipping Remark Columns ---');

        try {
            await db.runAsync("ALTER TABLE purchase_orders ADD COLUMN shipping_remark_zh TEXT");
            console.log('Added shipping_remark_zh');
        } catch (e) { console.log('shipping_remark_zh might exist'); }

        try {
            await db.runAsync("ALTER TABLE purchase_orders ADD COLUMN shipping_remark_en TEXT");
            console.log('Added shipping_remark_en');
        } catch (e) { console.log('shipping_remark_en might exist'); }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
