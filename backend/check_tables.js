const { setupDatabase, getDb } = require('./database');
(async () => {
    await setupDatabase();
    const db = getDb();
    const tables = await db.allAsync("SELECT name FROM sqlite_master WHERE type='table'");
    console.log(tables);
    process.exit(0);
})();
