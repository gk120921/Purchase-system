const { setupDatabase } = require('./database');

async function addUnitsTable() {
    let db;
    try {
        db = await setupDatabase();
        console.log('Adding units table...');
        await db.runAsync(`CREATE TABLE IF NOT EXISTS units (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Seed some initial units
        const initialUnits = ['M', 'PC', 'KG', 'PCS', 'SET', 'BOX', 'ROLL', 'BAG', 'BTL', 'L', 'M2', 'M3'];
        for (const unit of initialUnits) {
            try {
                await db.runAsync(`INSERT INTO units (name) VALUES (?)`, [unit]);
            } catch (e) {
                // Ignore duplicates
            }
        }
        
        console.log('Units table ready.');
        process.exit(0);
    } catch (err) {
        console.error('Failed to add units table:', err);
        process.exit(1);
    }
}

addUnitsTable();
