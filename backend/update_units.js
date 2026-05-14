const { setupDatabase, getDb } = require('./database');

async function updateUnits() {
    try {
        await setupDatabase();
        const db = getDb();
        
        // Ensure units table exists
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS units (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Clear existing units
        console.log('Clearing existing units...');
        await db.runAsync('DELETE FROM units');

        // Insert new units
        const newUnits = ['KG', 'LTR', 'M', 'PC'];
        console.log(`Inserting units: ${newUnits.join(', ')}`);
        
        for (const unit of newUnits) {
            await db.runAsync('INSERT INTO units (name) VALUES (?)', [unit]);
        }

        console.log('Units updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to update units:', err);
        process.exit(1);
    }
}

updateUnits();
