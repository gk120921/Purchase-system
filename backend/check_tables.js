const { setupDatabase, getDb } = require('./database');

async function checkTables() {
    await setupDatabase();
    const db = getDb();
    const rows = await db.allAsync("SELECT name FROM sqlite_master WHERE type='table'");
    console.log(rows);
    process.exit(0);
}
checkTables();
