const { setupDatabase } = require('./database');

async function checkData() {
    let db;
    try {
        db = await setupDatabase();
        const tables = [
            'purchase_requests', 'pr_items', 'purchase_orders', 'po_items', 
            'approvals', 'users', 'accounting_subjects', 'suppliers', 
            'materials', 'departments', 'units'
        ];
        
        console.log('--- Database Status Check ---');
        for (const table of tables) {
            try {
                const count = await db.getAsync(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`${table}: ${count.count} rows`);
            } catch (e) {
                console.log(`${table}: Table not found or error: ${e.message}`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
