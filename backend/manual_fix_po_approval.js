const { setupDatabase, getDb } = require('./database');

async function fixApproval() {
    try {
        await setupDatabase();
        const db = getDb();
        
        // 1. 確保 PO 狀態是 pending
        await db.runAsync("UPDATE purchase_orders SET status = 'pending' WHERE id = 46");
        
        // 2. 建立簽核任務給 tkchen (身為審核人)
        await db.runAsync(
            "INSERT INTO approvals (target_type, target_id, approver, status, created_at) VALUES ('PO', 46, 'tkchen', 'pending', CURRENT_TIMESTAMP)"
        );
        
        console.log("SUCCESS: PO-20260516001 is now assigned to 'tkchen' in Approvals list.");
        process.exit(0);
    } catch (err) {
        console.error("Fix Error:", err);
        process.exit(1);
    }
}

fixApproval();
