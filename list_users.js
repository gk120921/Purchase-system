const { setupDatabase } = require('./backend/database');

async function listUsers() {
    const db = await setupDatabase();
    const users = await db.allAsync('SELECT username, password FROM users');
    console.log('--- Current Users ---');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}

listUsers();
