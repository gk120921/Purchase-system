const { setupDatabase, getDb } = require('./database');

async function cleanup() {
    try {
        await setupDatabase();
        const db = getDb();
        console.log('--- Starting Cleanup for 2026-05-16 ---');

        // Delete PO related data
        await db.runAsync("DELETE FROM po_items WHERE po_id IN (SELECT id FROM purchase_orders WHERE po_number LIKE 'PO-20260516%')");
        await db.runAsync("DELETE FROM approvals WHERE target_type = 'PO' AND target_id IN (SELECT id FROM purchase_orders WHERE po_number LIKE 'PO-20260516%')");
        await db.runAsync("DELETE FROM approval_history WHERE target_type = 'PO' AND target_id IN (SELECT id FROM purchase_orders WHERE po_number LIKE 'PO-20260516%')");
        await db.runAsync("DELETE FROM payment_vouchers WHERE po_id IN (SELECT id FROM purchase_orders WHERE po_number LIKE 'PO-20260516%')");
        await db.runAsync("DELETE FROM purchase_orders WHERE po_number LIKE 'PO-20260516%'");

        // Delete PR related data
        await db.runAsync("DELETE FROM pr_items WHERE pr_id IN (SELECT id FROM purchase_requests WHERE pr_number LIKE 'PR-20260516%')");
        await db.runAsync("DELETE FROM approvals WHERE target_type = 'PR' AND target_id IN (SELECT id FROM purchase_requests WHERE pr_number LIKE 'PR-20260516%')");
        await db.runAsync("DELETE FROM approval_history WHERE target_type = 'PR' AND target_id IN (SELECT id FROM purchase_requests WHERE pr_number LIKE 'PR-20260516%')");
        await db.runAsync("DELETE FROM purchase_requests WHERE pr_number LIKE 'PR-20260516%'");

        console.log('SUCCESS: All data for 2026-05-16 has been deleted.');
        process.exit(0);
    } catch (err) {
        console.error('Cleanup Error:', err);
        process.exit(1);
    }
}

cleanup();
