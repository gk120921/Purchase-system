const { setupDatabase } = require('./database');

async function checkHistoryCount() {
    let db;
    try {
        db = await setupDatabase();
        
        const prHistory = await db.allAsync(`
            SELECT status, count(*) as count 
            FROM purchase_requests 
            WHERE status IN ('approved', 'converted', 'rejected')
            GROUP BY status
        `);

        const poHistory = await db.allAsync(`
            SELECT status, count(*) as count 
            FROM purchase_orders 
            WHERE status IN ('approved', 'closed', 'rejected')
            GROUP BY status
        `);

        console.log('--- Current History Status ---');
        console.log('PR History Items:');
        if (prHistory.length === 0) console.log('  None');
        prHistory.forEach(r => console.log(`  - ${r.status}: ${r.count}`));

        console.log('\nPO History Items:');
        if (poHistory.length === 0) console.log('  None');
        poHistory.forEach(r => console.log(`  - ${r.status}: ${r.count}`));
        
        console.log('------------------------------');
    } catch (err) {
        console.error(err);
    }
}

checkHistoryCount();
