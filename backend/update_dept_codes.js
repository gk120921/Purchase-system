const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./procurement.db');

db.serialize(() => {
    // 使用 REPLACE 函式來替換字首
    db.run("UPDATE departments SET dept_code = 'I' || SUBSTR(dept_code, 2) WHERE dept_code LIKE '1%'", (err) => {
        if (err) {
            console.error('Update failed:', err.message);
        } else {
            console.log('Success: All codes starting with 1 updated to I');
        }
    });
});
db.close();
