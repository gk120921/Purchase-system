const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'procurement.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 檢查欄位是否存在，不存在則新增
    db.all("PRAGMA table_info(departments)", (err, rows) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        const hasNameEn = rows.some(row => row.name === 'name_en');
        if (!hasNameEn) {
            db.run("ALTER TABLE departments ADD COLUMN name_en TEXT;", (err) => {
                if (err) {
                    console.error("Error adding column:", err);
                } else {
                    console.log("Column 'name_en' added successfully to 'departments' table.");
                    
                    // 將現有資料搬移 (假設現有的 name 是英文)
                    db.run("UPDATE departments SET name_en = name WHERE name_en IS NULL;", (err) => {
                        if (err) console.error("Error migrating data:", err);
                        else console.log("Migrated existing names to name_en.");
                    });
                }
                db.close();
            });
        } else {
            console.log("Column 'name_en' already exists.");
            db.close();
        }
    });
});
