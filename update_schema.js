const { setupDatabase } = require('./backend/database');

async function fixSchema() {
    try {
        const db = await setupDatabase();
        console.log('Adding missing columns to payment_vouchers...');
        
        const columns = [
            'ALTER TABLE payment_vouchers ADD COLUMN authorized_by TEXT',
            'ALTER TABLE payment_vouchers ADD COLUMN requested_by TEXT',
            'ALTER TABLE payment_vouchers ADD COLUMN reviewed_by TEXT'
        ];

        for (const sql of columns) {
            try {
                await db.runAsync(sql);
                console.log(`Success: ${sql}`);
            } catch (err) {
                if (err.message.includes('duplicate column name')) {
                    console.warn(`Column already exists, skipping: ${sql}`);
                } else {
                    throw err;
                }
            }
        }
        console.log('Schema update complete.');
        process.exit(0);
    } catch (err) {
        console.error('Schema update failed:', err);
        process.exit(1);
    }
}

fixSchema();
