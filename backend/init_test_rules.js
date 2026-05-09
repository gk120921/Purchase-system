const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function init() {
    const db = await open({
        filename: path.join(__dirname, 'procurement.db'),
        driver: sqlite3.Database
    });

    console.log('Ensuring tables exist...');
    await db.exec(`
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dept_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            parent_id INTEGER,
            manager_id INTEGER
        )
    `);

    await db.exec(`
        CREATE TABLE IF NOT EXISTS approval_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dept_id INTEGER,
            min_amount REAL DEFAULT 0,
            max_amount REAL,
            flow_json TEXT,
            description TEXT
        )
    `);

    console.log('Cleaning old test data...');
    await db.run('DELETE FROM approval_rules');
    await db.run('DELETE FROM departments');
    
    console.log('Creating Departments Hierarchy...');
    const resRoot = await db.run("INSERT INTO departments (dept_code, name) VALUES ('ROOT', 'KST India')");
    const rootId = resRoot.lastID;

    const resT100 = await db.run("INSERT INTO departments (dept_code, name, parent_id) VALUES ('T100', 'Production Dept', ?)", [rootId]);
    const t100Id = resT100.lastID;

    const resT120 = await db.run("INSERT INTO departments (dept_code, name, parent_id) VALUES ('T120', 'Production Planning', ?)", [t100Id]);
    const t120Id = resT120.lastID;

    console.log('Creating Multi-stage Approval Rules for T120...');
    
    await db.run(`
        INSERT INTO approval_rules (dept_id, min_amount, max_amount, flow_json, description) 
        VALUES (?, 0, 10000, '["supervisor"]', 'Small amount - Dept Head only')
    `, [t120Id]);

    await db.run(`
        INSERT INTO approval_rules (dept_id, min_amount, max_amount, flow_json, description) 
        VALUES (?, 10001, 50000, '["supervisor", "manager"]', 'Medium amount - Manager involved')
    `, [t120Id]);

    await db.run(`
        INSERT INTO approval_rules (dept_id, min_amount, max_amount, flow_json, description) 
        VALUES (?, 50001, 9999999, '["supervisor", "manager", "admin"]', 'Large amount - Full chain')
    `, [t120Id]);

    console.log('Test rules initialized successfully.');
    
    const departments = await db.all('SELECT * FROM departments');
    console.table(departments);
    
    const rules = await db.all('SELECT * FROM approval_rules');
    console.table(rules);

    await db.close();
}

init().catch(console.error);
