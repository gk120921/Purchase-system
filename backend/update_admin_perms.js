const { setupDatabase } = require('./database');

async function updateAdmin() {
    let db;
    try {
        db = await setupDatabase();
        const user = await db.getAsync('SELECT * FROM users WHERE username = ?', ['admin']);
        if (user) {
            let modules = JSON.parse(user.allowed_modules || '[]');
            if (!modules.includes('units')) {
                modules.push('units');
                await db.runAsync('UPDATE users SET allowed_modules = ? WHERE id = ?', [JSON.stringify(modules), user.id]);
                console.log('Admin permissions updated.');
            } else {
                console.log('Admin already has units permission.');
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateAdmin();
