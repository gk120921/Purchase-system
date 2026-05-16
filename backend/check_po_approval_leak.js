const { setupDatabase, getDb } = require('./database');

async function checkApprovals() {
    try {
        await setupDatabase();
        const db = getDb();
        
        // 1. 檢查 PO 主表狀態
        const po = await db.getAsync("SELECT id, po_number, status, requester FROM purchase_orders WHERE po_number = 'PO-20260516001'");
        console.log('--- PO Info ---');
        console.log(po);

        if (po) {
            // 2. 檢查簽核任務表
            const tasks = await db.allAsync("SELECT * FROM approvals WHERE target_id = ? AND target_type = 'PO'", [po.id]);
            console.log('\n--- Active Approval Tasks ---');
            console.log(tasks);

            // 3. 檢查簽核歷史
            const history = await db.allAsync("SELECT * FROM approval_history WHERE target_id = ? AND target_type = 'PO' ORDER BY id DESC", [po.id]);
            console.log('\n--- Approval History ---');
            console.log(history);
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkApprovals();
