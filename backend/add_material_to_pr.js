const { setupDatabase, getDb } = require('./database');

async function migrate() {
    try {
        await setupDatabase();
        const db = getDb();
        console.log('Adding material_number column to pr_items...');
        await db.runAsync('ALTER TABLE pr_items ADD COLUMN material_number TEXT');
        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        if (err.message.includes('duplicate column name')) {
            console.log('Column already exists.');
            process.exit(0);
        }
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
