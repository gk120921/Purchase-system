const { setupDatabase } = require('./database');

async function setupFreshDatabase() {
    let db;
    try {
        db = await setupDatabase();
        console.log('--- Fresh Database Setup Starting ---');

        const tables = [
            'purchase_requests', 'pr_items', 'purchase_orders', 'po_items', 
            'approvals', 'users', 'accounting_subjects', 'suppliers', 
            'materials', 'approval_thresholds', 'departments', 'approval_rules'
        ];

        console.log('Dropping existing tables...');
        for (const table of tables) {
            await db.run(`DROP TABLE IF EXISTS ${table}`);
        }

        console.log('Creating tables...');

        await db.run(`CREATE TABLE purchase_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pr_number TEXT UNIQUE NOT NULL,
            requester TEXT NOT NULL,
            department TEXT,
            subject_id INTEGER,
            supplier_id INTEGER,
            total_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            remarks TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
            supplier_name TEXT, 
            input_mode TEXT, 
            currency TEXT DEFAULT "INR", 
            exchange_rate REAL DEFAULT 1.0
        )`);

        await db.run(`CREATE TABLE pr_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pr_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit_price REAL NOT NULL,
            total REAL NOT NULL, 
            unit TEXT, 
            demand_day TEXT, 
            purchase_quantity REAL, 
            manufacturer TEXT, 
            date_of_purchase TEXT, 
            remark_zh TEXT, 
            remark_en TEXT, 
            subject_id INTEGER
        )`);

        await db.run(`CREATE TABLE purchase_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            po_number TEXT UNIQUE NOT NULL,
            pr_id INTEGER,
            supplier_id INTEGER NOT NULL,
            total_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
            requester TEXT, 
            department TEXT, 
            remarks TEXT, 
            supplier_name TEXT, 
            currency TEXT DEFAULT "INR", 
            exchange_rate REAL DEFAULT 1.0
        )`);

        await db.run(`CREATE TABLE po_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            po_id INTEGER NOT NULL,
            material_number TEXT,
            description TEXT,
            quantity REAL NOT NULL,
            unit TEXT,
            demand_day TEXT,
            purchase_quantity REAL,
            manufacturer TEXT,
            date_of_purchase TEXT,
            remark_zh TEXT,
            remark_en TEXT,
            unit_price REAL DEFAULT 0,
            total REAL DEFAULT 0, 
            subject_id INTEGER
        )`);

        await db.run(`CREATE TABLE approvals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_type TEXT NOT NULL,
            target_id INTEGER NOT NULL,
            approver TEXT NOT NULL,
            status TEXT NOT NULL,
            comment TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            dept_code TEXT,
            dept_name TEXT,
            allowed_modules TEXT,
            dept_id INTEGER, 
            proxy_user_id INTEGER, 
            proxy_end DATETIME, 
            proxy_start DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.run(`CREATE TABLE accounting_subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            english_name TEXT,
            description TEXT
        )`);

        await db.run(`CREATE TABLE suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_code TEXT UNIQUE,
            name TEXT NOT NULL,
            tax_id TEXT,
            category TEXT,
            contact TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            status TEXT DEFAULT 'qualified',
            name_en TEXT,
            qualified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.run(`CREATE TABLE materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            material_number TEXT UNIQUE NOT NULL,
            unit TEXT NOT NULL,
            name TEXT, 
            name_en TEXT
        )`);

        await db.run(`CREATE TABLE approval_thresholds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level_name TEXT NOT NULL,
            role_key TEXT NOT NULL,
            dept_code TEXT,
            min_amount REAL DEFAULT 0,
            priority INTEGER DEFAULT 1,
            description TEXT
        )`);

        await db.run(`CREATE TABLE departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dept_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            parent_id INTEGER,
            manager_id INTEGER
        )`);

        await db.run(`CREATE TABLE approval_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dept_id INTEGER,
            min_amount REAL DEFAULT 0,
            max_amount REAL,
            flow_json TEXT,
            description TEXT
        )`);

        console.log('Seeding initial admin user...');
        const allModules = JSON.stringify(['dashboard', 'pr', 'approvals', 'po', 'history', 'subjects', 'materials', 'suppliers', 'departments', 'users', 'settings', 'export']);
        await db.run(`INSERT INTO users (username, password, name, role, dept_name, allowed_modules) 
                      VALUES (?, ?, ?, ?, ?, ?)`, 
                      ['admin', 'admin', '系統管理員', 'admin', '資訊部', allModules]);

        console.log('--- Database Setup Completed ---');
        console.log('Default Login: admin / admin');
        
    } catch (err) {
        console.error('Setup Failed:', err);
    }
}

setupFreshDatabase();
