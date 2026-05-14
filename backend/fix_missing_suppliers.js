const { setupDatabase, getDb } = require('./database');
const xlsx = require('xlsx');
const path = require('path');

async function fixSuppliers() {
    try {
        await setupDatabase();
        const db = getDb();

        // 1. Get all supplier codes from Excel
        const workbook = xlsx.readFile(path.join(__dirname, '..', '請購單 採購單資料.xlsx'));
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        
        const excelCodes = new Set();
        data.forEach(row => {
            for (let k in row) {
                if (k.includes('廠商') || k.includes('Supplier')) {
                    if (row[k]) excelCodes.add(row[k].toString().trim());
                    break;
                }
            }
        });

        console.log(`Found ${excelCodes.size} unique supplier codes in Excel.`);

        // 2. Get existing suppliers from DB
        const dbSuppliers = await db.allAsync("SELECT id, supplier_code, name FROM suppliers");
        const codeToId = {};
        dbSuppliers.forEach(s => {
            codeToId[s.supplier_code] = s.id;
        });

        // 3. Add missing suppliers
        let addedCount = 0;
        for (const code of excelCodes) {
            if (!codeToId[code]) {
                console.log(`Adding missing supplier: ${code}`);
                const result = await db.runAsync(
                    "INSERT INTO suppliers (supplier_code, name, status, category) VALUES (?, ?, ?, ?)",
                    [code, code, 'qualified', '印度採購匯入']
                );
                codeToId[code] = result.lastID;
                addedCount++;
            }
        }
        console.log(`Added ${addedCount} missing suppliers.`);

        // 4. Update existing POs and PRs that might have null supplier_id
        console.log('Updating POs and PRs to link new suppliers...');
        const pos = await db.allAsync("SELECT id, supplier_name FROM purchase_orders WHERE supplier_id IS NULL OR supplier_id = 0");
        let updatedPOCount = 0;
        for (const po of pos) {
            const code = po.supplier_name; // In my import, I put the code in supplier_name if not found
            if (codeToId[code]) {
                await db.runAsync("UPDATE purchase_orders SET supplier_id = ? WHERE id = ?", [codeToId[code], po.id]);
                updatedPOCount++;
            }
        }

        const prs = await db.allAsync("SELECT id, supplier_name FROM purchase_requests WHERE supplier_id IS NULL OR supplier_id = 0");
        let updatedPRCount = 0;
        for (const pr of prs) {
            const code = pr.supplier_name;
            if (codeToId[code]) {
                await db.runAsync("UPDATE purchase_requests SET supplier_id = ? WHERE id = ?", [codeToId[code], pr.id]);
                updatedPRCount++;
            }
        }

        console.log(`Updated ${updatedPOCount} POs and ${updatedPRCount} PRs with correct supplier IDs.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixSuppliers();
