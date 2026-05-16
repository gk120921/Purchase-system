const { setupDatabase, getDb } = require('./database');

async function standardizeUnits() {
    try {
        await setupDatabase();
        const db = getDb();
        console.log('--- Starting Unit Standardization to NOS ---');

        // 1. Update Materials table
        const resMat = await db.runAsync("UPDATE materials SET unit = 'NOS' WHERE unit IN ('PC', 'PCS', 'pc', 'pcs')");
        console.log(`Updated materials count: ${resMat.changes || 'Success'}`);

        // 2. Ensure NOS exists in units table
        await db.runAsync("INSERT OR IGNORE INTO units (name) VALUES ('NOS')");
        
        console.log('SUCCESS: Units standardized to NOS.');
        process.exit(0);
    } catch (err) {
        console.error('Standardization Error:', err);
        process.exit(1);
    }
}

standardizeUnits();
