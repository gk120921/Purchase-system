const { setupDatabase, getDb } = require('./database');

async function fixPermissions() {
    try {
        await setupDatabase();
        const db = getDb();
        
        const users = await db.allAsync("SELECT * FROM users");
        for (const user of users) {
            let modules = (user.allowed_modules || "").split(',').map(m => m.trim()).filter(Boolean);
            if (!modules.includes('units')) {
                modules.push('units');
                await db.runAsync("UPDATE users SET allowed_modules = ? WHERE id = ?", [modules.join(','), user.id]);
                console.log(`Added 'units' permission to user: ${user.username}`);
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixPermissions();
