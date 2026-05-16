const { setupDatabase, getDb } = require('./database');

async function syncAllDates() {
    try {
        await setupDatabase();
        const db = getDb();
        
        const prs = await db.allAsync("SELECT id, pr_number FROM purchase_requests");
        
        console.log(`[GlobalSync] Analyzing ${prs.length} Purchase Requests...`);

        for (const pr of prs) {
            const matches = pr.pr_number.match(/PR-(\d{4})(\d{2})(\d{2})\d{3}/);
            
            if (matches) {
                const [_, yyyy, mm, dd] = matches;
                const dateOnly = `${yyyy}-${mm}-${dd}`;
                const fullDateTime = `${yyyy}-${mm}-${dd} 10:00:00`;
                
                console.log(`[GlobalSync] Synchronizing ${pr.pr_number} to ${dateOnly}...`);
                
                // 1. 更新請購單
                await db.runAsync("UPDATE purchase_requests SET created_at = ? WHERE id = ?", [fullDateTime, pr.id]);
                
                // 2. 更新簽核紀錄 (使用正確的 target_type 欄位)
                await db.runAsync("UPDATE approvals SET created_at = ? WHERE target_id = ? AND target_type = 'PR'", [fullDateTime, pr.id]);
                await db.runAsync("UPDATE approval_history SET created_at = ? WHERE target_id = ? AND target_type = 'PR'", [fullDateTime, pr.id]);
                
                // 3. 更新關聯的 PO
                const po = await db.getAsync("SELECT id, po_number FROM purchase_orders WHERE pr_id = ?", [pr.id]);
                if (po) {
                    await db.runAsync("UPDATE purchase_orders SET created_at = ? WHERE id = ?", [fullDateTime, po.id]);
                    await db.runAsync("UPDATE approvals SET created_at = ? WHERE target_id = ? AND target_type = 'PO'", [fullDateTime, po.id]);
                    await db.runAsync("UPDATE approval_history SET created_at = ? WHERE target_id = ? AND target_type = 'PO'", [fullDateTime, po.id]);
                }
            }
        }

        console.log("[GlobalSync] ALL tables synchronized and verified.");
        process.exit(0);
    } catch (err) {
        console.error("[GlobalSync] Fatal Error:", err);
        process.exit(1);
    }
}

syncAllDates();
