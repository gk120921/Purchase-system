const { setupDatabase } = require('./database');

async function inspectUsers() {
    let db;
    try {
        db = await setupDatabase();
        const users = await db.allAsync('SELECT id, username, allowed_modules FROM users');
        console.log('--- User Allowed Modules Inspection ---');
        users.forEach(u => {
            console.log(`User ID: ${u.id}, Username: ${u.username}`);
            console.log(`Raw allowed_modules: "${u.allowed_modules}"`);
            try {
                const parsed = u.allowed_modules ? JSON.parse(u.allowed_modules) : [];
                console.log(`Parsed:`, parsed, Array.isArray(parsed) ? '(Array)' : '(Not Array)');
            } catch (e) {
                console.log(`Parse Error: ${e.message}`);
            }
            console.log('---');
        });
    } catch (err) {
        console.error(err);
    }
}

inspectUsers();
