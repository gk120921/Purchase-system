const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

function setupDatabase() {
    return new Promise((resolve, reject) => {
        const dbPath = path.resolve(__dirname, 'procurement.db');
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Database connection failed:', err);
                return reject(err);
            }
            console.log('Connected to SQLite database.');
            
            // 擴充 db 物件
            db.allAsync = (sql, params = []) => new Promise((res, rej) => {
                db.all(sql, params, (err, rows) => err ? rej(err) : res(rows));
            });

            db.getAsync = (sql, params = []) => new Promise((res, rej) => {
                db.get(sql, params, (err, row) => err ? rej(err) : res(row));
            });

            db.runAsync = (sql, params = []) => new Promise((res, rej) => {
                db.run(sql, params, function(err) { err ? rej(err) : res(this); });
            });

            // 支援預編譯語句的 Promise 化
            db.prepareAsync = (sql) => new Promise((res, rej) => {
                const stmt = db.prepare(sql, (err) => {
                    if (err) return rej(err);
                    
                    // 擴充 stmt 物件
                    const originalRun = stmt.run.bind(stmt);
                    stmt.runAsync = (...args) => new Promise((sRes, sRej) => {
                        originalRun(...args, (err) => err ? sRej(err) : sRes());
                    });

                    const originalFinalize = stmt.finalize.bind(stmt);
                    stmt.finalizeAsync = () => new Promise((fRes, fRej) => {
                        originalFinalize((err) => err ? fRej(err) : fRes());
                    });

                    res(stmt);
                });
            });

            resolve(db);
        });
    });
}

function getDb() {
    if (!db) throw new Error('Database not initialized');
    return db;
}

module.exports = { setupDatabase, getDb };
