const { setupDatabase, getDb } = require('./database');

async function fixPRNumbers() {
    try {
        await setupDatabase();
        const db = getDb();
        
        // 1. 抓取所有 PR，依建立時間排序
        const prs = await db.allAsync("SELECT id, created_at, pr_number FROM purchase_requests ORDER BY created_at ASC, id ASC");
        
        const dateGroups = {};
        
        console.log(`[FixPR] Found ${prs.length} records to process.`);
        
        for (const pr of prs) {
            const date = new Date(pr.created_at);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}${mm}${dd}`;
            
            if (!dateGroups[dateStr]) dateGroups[dateStr] = 0;
            dateGroups[dateStr]++;
            
            const seq = String(dateGroups[dateStr]).padStart(3, '0');
            const newNumber = `PR-${dateStr}${seq}`;
            
            if (newNumber !== pr.pr_number) {
                console.log(`[FixPR] Updating ID ${pr.id}: ${pr.pr_number} -> ${newNumber}`);
                await db.runAsync("UPDATE purchase_requests SET pr_number = ? WHERE id = ?", [newNumber, pr.id]);
            }
        }
        
        console.log("[FixPR] All PR numbers have been synchronized with their creation dates.");
        process.exit(0);
    } catch (err) {
        console.error("[FixPR] Error:", err);
        process.exit(1);
    }
}

fixPRNumbers();
