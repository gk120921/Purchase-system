const { setupDatabase, getDb } = require('./database');

async function fixPRNumbersDeep() {
    try {
        await setupDatabase();
        const db = getDb();
        
        // 1. 抓取所有 PR
        const prs = await db.allAsync("SELECT id, created_at, pr_number FROM purchase_requests");
        
        console.log(`[DeepFix] Processing ${prs.length} records...`);

        const dateGroups = {};

        for (const pr of prs) {
            // 嘗試從 pr_items 中抓取最早的需求日作為該單據的「實際日期」
            const firstItem = await db.getAsync("SELECT demand_day FROM pr_items WHERE pr_id = ? AND demand_day IS NOT NULL AND demand_day != '-' ORDER BY demand_day ASC LIMIT 1", [pr.id]);
            
            let targetDate;
            if (firstItem && firstItem.demand_day) {
                targetDate = new Date(firstItem.demand_day);
            } else {
                targetDate = new Date(pr.created_at);
            }

            const yyyy = targetDate.getFullYear();
            const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
            const dd = String(targetDate.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}${mm}${dd}`;

            if (!dateGroups[dateStr]) dateGroups[dateStr] = 0;
            dateGroups[dateStr]++;

            const seq = String(dateGroups[dateStr]).padStart(3, '0');
            const newNumber = `PR-${dateStr}${seq}`;

            if (newNumber !== pr.pr_number) {
                console.log(`[DeepFix] Updating ID ${pr.id}: ${pr.pr_number} -> ${newNumber} (Based on ${dateStr})`);
                await db.runAsync("UPDATE purchase_requests SET pr_number = ? WHERE id = ?", [newNumber, pr.id]);
            }
        }

        console.log("[DeepFix] Deep synchronization complete.");
        process.exit(0);
    } catch (err) {
        console.error("[DeepFix] Error:", err);
        process.exit(1);
    }
}

fixPRNumbersDeep();
