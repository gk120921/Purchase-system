const { setupDatabase } = require('./backend/database');

async function checkHistoryStructure() {
    const db = await setupDatabase();
    const prHistory = await db.allAsync(`
        SELECT 'PR' as type, pr.id, pr.pr_number as number
        FROM purchase_requests pr
        LIMIT 1
    `);
    console.log('PR Item:', prHistory[0]);

    const poHistory = await db.allAsync(`
        SELECT 'PO' as type, po.id, po.po_number as number
        FROM purchase_orders po
        LIMIT 1
    `);
    console.log('PO Item:', poHistory[0]);
    process.exit(0);
}

checkHistoryStructure();
