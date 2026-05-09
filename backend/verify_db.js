const { setupDatabase } = require('./database');

async function verifyDatabase() {
    console.log('--- Database Connection and Integrity Verification ---');
    let db;
    try {
        db = await setupDatabase();
        console.log('✅ Successfully connected to SQLite database (procurement.db).');

        const tablesToCheck = [
            'users',
            'suppliers',
            'accounting_subjects',
            'materials',
            'purchase_requests',
            'purchase_orders',
            'approvals',
            'approval_thresholds',
            'departments',
            'pr_items',
            'po_items'
        ];

        console.log('\nChecking tables...');
        for (const table of tablesToCheck) {
            try {
                const countResult = await db.getAsync(`SELECT count(*) as count FROM ${table}`);
                console.log(`✅ Table '${table}' exists. Row count: ${countResult.count}`);
            } catch (err) {
                console.error(`❌ Table '${table}' check failed: ${err.message}`);
            }
        }

        // Check specific relationships if possible
        console.log('\nChecking data consistency...');
        
        // Example: Check if there are users with departments
        try {
            const userDeptCheck = await db.getAsync('SELECT count(*) as count FROM users WHERE dept_code IS NOT NULL');
            console.log(`✅ Users with dept_code: ${userDeptCheck.count}`);
        } catch (err) {
            console.warn(`⚠️ Could not check users/departments relationship: ${err.message}`);
        }

        console.log('\n--- Verification Finished ---');
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
    } finally {
        // SQLite connection might not have a closeAsync, we'll just let it finish or use the standard close
        // In database.js it's using the raw sqlite3 object.
    }
}

verifyDatabase();
