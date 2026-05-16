const { setupDatabase, getDb } = require('./database');

async function updateTK() {
    try {
        await setupDatabase();
        const db = getDb();
        
        await db.runAsync(
            "UPDATE users SET username = 'tkchen', password = 'tkchen' WHERE name = 'TKchen'"
        );
        
        console.log("Username and password updated to lowercase 'tkchen'.");
        process.exit(0);
    } catch (err) {
        console.error("Update Error:", err);
        process.exit(1);
    }
}

updateTK();
