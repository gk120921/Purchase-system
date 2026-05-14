const sqlite3 = require('sqlite3');
const { promisify } = require('util');

async function migrate() {
    const db = new sqlite3.Database('./procurement.db');
    db.getAsync = promisify(db.get).bind(db);
    db.allAsync = promisify(db.all).bind(db);
    db.runAsync = promisify(db.run).bind(db);

    console.log('Starting PR/PO Number Migration...');

    // 處理 PR
    const prs = await db.allAsync("SELECT id, created_at, pr_number FROM purchase_requests WHERE pr_number LIKE 'PR-%'");
    for (const pr of prs) {
        if (pr.pr_number.length > 15) { // 判定為舊格式 PR-1778...
            const date = new Date(pr.created_at);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const todayStr = `${y}${m}${d}`;
            const pattern = `PR-${todayStr}%`;
            
            const last = await db.getAsync("SELECT pr_number FROM purchase_requests WHERE pr_number LIKE ? AND id < ? ORDER BY id DESC LIMIT 1", [pattern, pr.id]);
            let seq = 1;
            if (last) {
                const lastSeq = parseInt(last.pr_number.slice(-3));
                seq = lastSeq + 1;
            }
            const newNum = `PR-${todayStr}${String(seq).padStart(3, '0')}`;
            await db.runAsync("UPDATE purchase_requests SET pr_number = ? WHERE id = ?", [newNum, pr.id]);
            console.log(`Migrated PR: ${pr.pr_number} -> ${newNum}`);
        }
    }

    // 處理 PO
    const pos = await db.allAsync("SELECT id, created_at, po_number FROM purchase_orders WHERE po_number LIKE 'PO-%'");
    for (const po of pos) {
        if (po.po_number.length > 15) {
            const date = new Date(po.created_at);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const todayStr = `${y}${m}${d}`;
            const pattern = `PO-${todayStr}%`;
            
            const last = await db.getAsync("SELECT po_number FROM purchase_orders WHERE po_number LIKE ? AND id < ? ORDER BY id DESC LIMIT 1", [pattern, po.id]);
            let seq = 1;
            if (last) {
                const lastSeq = parseInt(last.po_number.slice(-3));
                seq = lastSeq + 1;
            }
            const newNum = `PO-${todayStr}${String(seq).padStart(3, '0')}`;
            await db.runAsync("UPDATE purchase_orders SET po_number = ? WHERE id = ?", [newNum, po.id]);
            console.log(`Migrated PO: ${po.po_number} -> ${newNum}`);
        }
    }

    console.log('Migration Completed.');
    db.close();
}

migrate().catch(console.error);
