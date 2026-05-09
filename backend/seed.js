const { setupDatabase } = require('./database');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

async function importSuppliersFromExcel(db) {
    const filePath = path.join(__dirname, '..', '合格供應商名冊.xlsx');
    if (!fs.existsSync(filePath)) {
        console.warn('Supplier Excel file not found, skipping import.');
        return;
    }

    console.log('Recreating suppliers table...');
    await db.runAsync('DROP TABLE IF EXISTS suppliers');
    await db.runAsync(`
        CREATE TABLE suppliers (
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
            qualified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets['合格供應商名冊'];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log(`Importing ${data.length} suppliers from Excel...`);
    const stmt = await db.prepareAsync(`
        INSERT INTO suppliers (supplier_code, name, category, contact, phone, email, address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const row of data) {
        const code = row['供應商編碼\r\nSupplier Code'] || '';
        const name = row['全銜\r\nFull title'] || row['廠商公司名稱\r\nManufacturer Company Name\r\n'] || 'Unknown';
        const category = row['供應商類別\r\nSupplier Category'] || '';
        const contact = row['聯絡人\r\nContact'] || '';
        const phone = row['電話一\r\nPhone one']?.toString() || '';
        const email = row['E-mail'] || '';
        const address = row['聯絡地址\r\nContact address'] || '';

        try {
            await stmt.runAsync(code, name, category, contact, phone, email, address);
        } catch (err) {
            // Ignore duplicates
        }
    }
    await stmt.finalizeAsync();
    console.log('Suppliers imported successfully.');
}

async function importMaterialsFromExcel(db) {
    const filePath = path.join(__dirname, '..', 'Basic Material Information Sheet.xlsx');
    if (!fs.existsSync(filePath)) {
        console.warn('Material Excel file not found, skipping import.');
        return;
    }

    console.log('Recreating materials table...');
    await db.runAsync('DROP TABLE IF EXISTS materials');
    await db.runAsync(`
        CREATE TABLE materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            material_number TEXT UNIQUE NOT NULL,
            name TEXT,
            unit TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log(`Importing materials from Excel...`);
    const stmt = await db.prepareAsync(`
        INSERT OR IGNORE INTO materials (material_number, name, unit)
        VALUES (?, ?, ?)
    `);

    for (const row of data) {
        const materialNumber = row['料品編號\r\nMaterial Number'];
        const unit = row['單位'];

        if (materialNumber && unit) {
            await stmt.runAsync(materialNumber, materialNumber, unit);
        }
    }
    await stmt.finalizeAsync();
    console.log('Materials imported successfully.');
}

async function seed() {
    const db = await setupDatabase();

    // 0. Seed Users
    console.log('Recreating users table...');
    await db.runAsync('DROP TABLE IF EXISTS users');
    await db.runAsync(`
        CREATE TABLE users (
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
        )
    `);

    const users = [
        ['buyer', '1234', '採購小張', 'purchaser', 'D001', '採購部', JSON.stringify(['dashboard', 'pr', 'subjects', 'suppliers'])],
        ['boss', '1234', '陳主管', 'supervisor', 'M001', '管理層', JSON.stringify(['dashboard', 'approvals', 'po', 'subjects', 'suppliers', 'export'])],
        ['admin', 'admin123', '管理員', 'admin', 'S001', '系統課', JSON.stringify(['dashboard', 'pr', 'approvals', 'po', 'history', 'subjects', 'materials', 'suppliers', 'departments', 'users', 'settings', 'export'])]
    ];
    const userStmt = await db.prepareAsync('INSERT INTO users (username, password, name, role, dept_code, dept_name, allowed_modules) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const u of users) {
        await userStmt.runAsync(...u);
    }
    await userStmt.finalizeAsync();
    console.log('Default users seeded.');

    // 1. Import Accounting Subjects
    const excelPath = path.join(__dirname, '..', '預算費用會計科目對照表Comparison Table of Accounting Subjects for Budgetary Expenses.xlsx');
    try {
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets['Subject Code'];
        const data = xlsx.utils.sheet_to_json(sheet);

        await db.runAsync('DROP TABLE IF EXISTS accounting_subjects');
        await db.runAsync(`
            CREATE TABLE accounting_subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                english_name TEXT,
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const stmt = await db.prepareAsync('INSERT OR IGNORE INTO accounting_subjects (category, code, name, english_name, description) VALUES (?, ?, ?, ?, ?)');
        for (const row of data) {
            const code = row['科目代碼 (Code)'];
            const name = row['名稱 (Name - Traditional Chinese)'];
            if (code && name) {
                await stmt.runAsync(row['分類 (Category)'], code.toString(), name, row['英文名稱 (English Name)'], row['內容說明 (Description)']);
            }
        }
        await stmt.finalizeAsync();
        console.log('Accounting subjects imported.');
    } catch (err) {
        console.error('Accounting subjects import failed:', err.message);
    }

    // 2. Import Suppliers
    await importSuppliersFromExcel(db);

    // 3. Import Materials
    await importMaterialsFromExcel(db);

    console.log('Seeding complete.');
}

seed().catch(console.error);
