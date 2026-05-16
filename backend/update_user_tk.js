const { setupDatabase, getDb } = require('./database');

async function updateTK() {
    try {
        await setupDatabase();
        const db = getDb();
        
        // 1. 更新用戶主表
        const result = await db.runAsync(
            "UPDATE users SET name = 'TKchen', username = 'TKchen', password = 'tkchen123' WHERE name = '陳台坤' OR username = 'Taikun'"
        );
        
        // 2. 更新部門負責人欄位 (如果部門負責人是存姓名字串的話)
        await db.runAsync("UPDATE departments SET manager = 'TKchen' WHERE manager = '陳台坤' OR manager = 'Taikun'");
        
        console.log("User TKchen updated successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Update Error:", err);
        process.exit(1);
    }
}

updateTK();
