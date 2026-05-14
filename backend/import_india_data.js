const XLSX = require('xlsx');
const { setupDatabase, getDb } = require('./database');
const path = require('path');

const EXCEL_PATH = path.join(__dirname, '..', '請購單 採購單資料.xlsx');
const DEFAULT_REQUESTER = '管理員';
const DEFAULT_TAX_RATE = 9; // CGST 9%, SGST 9%

async function generatePRNumber(db) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}${mm}${dd}`;
    const pattern = `PR-${todayStr}%`;
    const lastPR = await db.getAsync("SELECT pr_number FROM purchase_requests WHERE pr_number LIKE ? ORDER BY id DESC LIMIT 1", [pattern]);
    let nextSeq = "001";
    if (lastPR && lastPR.pr_number) {
        const parts = lastPR.pr_number.split('-');
        const seqPart = parts[parts.length - 1].substring(8);
        if (!isNaN(parseInt(seqPart))) nextSeq = String(parseInt(seqPart, 10) + 1).padStart(3, '0');
    }
    return `PR-${todayStr}${nextSeq}`;
}

async function generatePONumber(db) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}${mm}${dd}`;
    const pattern = `PO-${todayStr}%`;
    const lastPO = await db.getAsync("SELECT po_number FROM purchase_orders WHERE po_number LIKE ? ORDER BY id DESC LIMIT 1", [pattern]);
    let nextSeq = "001";
    if (lastPO && lastPO.po_number) {
        const parts = lastPO.po_number.split('-');
        const seqPart = parts[parts.length - 1].substring(8);
        if (!isNaN(parseInt(seqPart))) nextSeq = String(parseInt(seqPart, 10) + 1).padStart(3, '0');
    }
    return `PO-${todayStr}${nextSeq}`;
}

function excelDateToJS(serial) {
    if (!serial) return null;
    if (typeof serial === 'string') return serial;
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
}

function findKey(row, keywords) {
    const keys = Object.keys(row);
    for (const key of keys) {
        for (const kw of keywords) {
            if (key.includes(kw)) return row[key];
        }
    }
    return null;
}

async function run() {
    await setupDatabase();
    const db = getDb();

    console.log('Reading Excel...');
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    // Group by Original PO Number
    const groups = {};
    for (const row of rawData) {
        const poNum = findKey(row, ['PO Number', '單號']);
        if (!poNum) continue;
        if (!groups[poNum]) groups[poNum] = [];
        groups[poNum].push(row);
    }

    const poNumbers = Object.keys(groups);
    console.log(`Found ${poNumbers.length} PO groups. Running full import...`);

    const subjects = await db.allAsync("SELECT id, code FROM accounting_subjects");
    const subjectMap = {};
    subjects.forEach(s => subjectMap[s.code] = s.id);

    const suppliers = await db.allAsync("SELECT id, supplier_code, name FROM suppliers");
    const supplierMap = {};
    const supplierNameMap = {};
    suppliers.forEach(s => {
        supplierMap[s.supplier_code] = s.id;
        supplierMap[s.name] = s.id;
        supplierNameMap[s.id] = s.name;
    });

    for (const [origPoNum, items] of Object.entries(groups)) {
        console.log(`Processing group: ${origPoNum} (${items.length} items)`);

        const firstItem = items[0];
        const date = excelDateToJS(findKey(firstItem, ['日期', 'DATE']));
        const dept = findKey(firstItem, ['部門', 'Dept']) || 'I300';
        const supplierRef = findKey(firstItem, ['廠商', 'Supplier', '供應商']);
        const currency = findKey(firstItem, ['幣別', 'Currency']) || 'INR';

        let supplier_id = supplierMap[supplierRef] || null;
        let supplier_display_name = supplierNameMap[supplier_id] || supplierRef;

    // 1. Create PR
    const pr_number = await generatePRNumber(db);
    let pr_total = 0;
    const processedItems = [];

    for (const row of items) {
        const qty = parseFloat(findKey(row, ['數量', 'Qty'])) || 0;
        const price = parseFloat(findKey(row, ['單價', 'Price'])) || 0;
        const lineTotal = qty * price;
        pr_total += lineTotal;

        const matNum = String(findKey(row, ['料品', 'Material']) || '');
        const remarkEN = findKey(row, ['英文備註', 'EN Remark']) || '';
        const remarkZH = findKey(row, ['中文備註', 'ZH Remark']) || '';
        const demandDay = excelDateToJS(findKey(row, ['需求日', 'Req. Day']));
        const deliveryDay = excelDateToJS(findKey(row, ['進貨', 'Delivery']));
        const unit = findKey(row, ['單位', 'Unit']) || 'PC';

        const subject_id = subjectMap[matNum] || 21; // Default to 5341

        processedItems.push({
            material_number: matNum,
            description: remarkZH || remarkEN || matNum || 'Imported Item',
            remark_zh: remarkZH,
            remark_en: remarkEN,
            quantity: qty,
            unit: unit,
            unit_price: price,
            total: lineTotal,
            subject_id: subject_id,
            demand_day: demandDay,
            date_of_purchase: deliveryDay
        });
    }

    const pr_remarks = `印度原單號: ${origPoNum}`;
    const prResult = await db.runAsync(
        'INSERT INTO purchase_requests (pr_number, requester, department, total_amount, remarks, status, currency, exchange_rate, supplier_id, supplier_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [pr_number, DEFAULT_REQUESTER, dept, pr_total, pr_remarks, 'converted', currency, 1.0, supplier_id, supplier_display_name, date + ' 00:00:00']
    );
    const pr_id = prResult.lastID;

    // Create Approval History for PR
    await db.runAsync(
        'INSERT INTO approval_history (target_type, target_id, approver, status, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        ['PR', pr_id, DEFAULT_REQUESTER, 'approved', 'Excel匯入補單', date + ' 00:00:00']
    );

    for (const pItem of processedItems) {
        await db.runAsync(
            `INSERT INTO pr_items (
                pr_id, description, quantity, unit, unit_price, total, 
                subject_id, remark_zh, remark_en, demand_day, date_of_purchase, manufacturer, material_number
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                pr_id, pItem.description, pItem.quantity, pItem.unit, pItem.unit_price, pItem.total, 
                pItem.subject_id, pItem.remark_zh, pItem.remark_en, pItem.demand_day, pItem.date_of_purchase, supplier_display_name, pItem.material_number
            ]
        );
    }

    // 2. Create PO
    const po_number = await generatePONumber(db);
    const subtotal = pr_total;
    const cgst_amount = subtotal * (DEFAULT_TAX_RATE / 100);
    const sgst_amount = subtotal * (DEFAULT_TAX_RATE / 100);
    const final_total = subtotal + cgst_amount + sgst_amount;

    const poResult = await db.runAsync(
        `INSERT INTO purchase_orders (
            po_number, pr_id, supplier_id, supplier_name, requester, department,
            subtotal, cgst_rate, sgst_rate, cgst_amount, sgst_amount, total_amount, 
            remarks, status, currency, exchange_rate, shipping_fee, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            po_number, pr_id, supplier_id, supplier_display_name, DEFAULT_REQUESTER, dept,
            subtotal, DEFAULT_TAX_RATE, DEFAULT_TAX_RATE, cgst_amount, sgst_amount, final_total,
            pr_remarks, 'pending', currency, 1.0, 0, date + ' 00:00:00'
        ]
    );
    const po_id = poResult.lastID;

    // Remove automatic approval history for PO to allow editing
    /*
    await db.runAsync(
        'INSERT INTO approval_history (target_type, target_id, approver, status, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        ['PO', po_id, DEFAULT_REQUESTER, 'approved', 'Excel匯入補單', date + ' 00:00:00']
    );
    */

        for (const pItem of processedItems) {
            await db.runAsync(
                `INSERT INTO po_items (
                    po_id, material_number, description, quantity, unit, unit_price, total, 
                    subject_id, remark_zh, remark_en, demand_day, date_of_purchase
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    po_id, pItem.material_number, pItem.description, pItem.quantity, pItem.unit, pItem.unit_price, pItem.total, 
                    pItem.subject_id, pItem.remark_zh, pItem.remark_en, pItem.demand_day, pItem.date_of_purchase
                ]
            );
        }

        console.log(`Import of ${origPoNum} completed successfully.`);
    }

    console.log('All imports completed successfully.');
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
