const { setupDatabase } = require('./database');

async function repairUserData() {
    let db;
    try {
        db = await setupDatabase();
        const users = await db.allAsync('SELECT id, allowed_modules FROM users');
        for (const u of users) {
            try {
                let modules = JSON.parse(u.allowed_modules);
                if (typeof modules === 'string') {
                    console.log(`Repairing User ID ${u.id}: Double stringified detected.`);
                    modules = JSON.parse(modules);
                    await db.runAsync('UPDATE users SET allowed_modules = ? WHERE id = ?', [JSON.stringify(modules), u.id]);
                    console.log(`User ID ${u.id} repaired.`);
                }
            } catch (e) {
                console.error(`Error processing User ID ${u.id}: ${e.message}`);
            }
        }
        console.log('Database repair finished.');
    } catch (err) {
        console.error(err);
    }
}

repairUserData();
