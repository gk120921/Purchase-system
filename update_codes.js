const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./backend/procurement.db');

db.serialize(() => {
    db.run("UPDATE departments SET dept_code = 'I' || SUBSTR(dept_code, 2) WHERE dept_code LIKE '1%'", (err) => {
        if (err) {
            console.error('Update failed:', err.message);
        } else {
            console.log('Success: All department codes starting with 1 have been updated to start with I.');
        }
    });
});
db.close();
