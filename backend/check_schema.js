const { setupDatabase, getDb } = require('./database');

async function check() {
    await setupDatabase();
    const db = getDb();
    console.log("--- Approvals ---");
    console.log(await db.allAsync("PRAGMA table_info(approvals)"));
    console.log("--- Approval History ---");
    console.log(await db.allAsync("PRAGMA table_info(approval_history)"));
    process.exit(0);
}
check();
