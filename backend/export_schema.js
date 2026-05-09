const { setupDatabase } = require('./database');

async function getFullSchema() {
    let db;
    try {
        db = await setupDatabase();
        const tables = await db.allAsync("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        
        console.log('--- Full Database Schema Export ---');
        for (const table of tables) {
            const schema = await db.getAsync(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table.name}'`);
            console.log(`\n-- Table: ${table.name}`);
            console.log(schema.sql + ';');
            
            // Also get indexes
            const indexes = await db.allAsync(`SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='${table.name}'`);
            indexes.forEach(idx => {
                if (idx.sql) console.log(idx.sql + ';');
            });
        }
    } catch (err) {
        console.error(err);
    }
}

getFullSchema();
