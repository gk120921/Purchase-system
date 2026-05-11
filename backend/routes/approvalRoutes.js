const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// 執行簽核動作
router.post('/', async (req, res) => {
    const { target_type, target_id, approver, status, comment } = req.body;
    try {
        const db = getDb();
        
        // 1. 寫入簽核歷程
        await db.runAsync(
            'INSERT INTO approval_history (target_type, target_id, approver, status, comment) VALUES (?, ?, ?, ?, ?)',
            [target_type, target_id, approver, status, comment]
        );

        // 2. 更新目標單據狀態與自動轉換邏輯
        if (target_type === 'PR') {
            console.log(`[Approval] Processing PR ${target_id} with status ${status}`);
            await db.runAsync('UPDATE purchase_requests SET status = ? WHERE id = ?', [status, target_id]);
            
            // 如果是核准通過，自動轉成 PO
            if (status === 'approved') {
                // 獲取 PR 及其品項
                const pr = await db.getAsync('SELECT * FROM purchase_requests WHERE id = ?', [target_id]);
                const prItems = await db.allAsync('SELECT * FROM pr_items WHERE pr_id = ?', [target_id]);
                
                if (!pr || prItems.length === 0) {
                    throw new Error('PR or Items not found');
                }

                // [自動代入] 抓取第一個品項的廠商作為 PO 供應商
                const firstItem = prItems[0];
                let supplier_id = pr.supplier_id;
                let supplier_name = pr.supplier_name;

                if (!supplier_id && !supplier_name && firstItem.manufacturer) {
                    const mfg = firstItem.manufacturer;
                    // 嘗試解析 "CODE - NAME" 格式
                    if (mfg.includes(' - ')) {
                        const parts = mfg.split(' - ');
                        const code = parts[0].trim();
                        const name = parts[1].trim();
                        const found = await db.getAsync('SELECT id FROM suppliers WHERE supplier_code = ?', [code]);
                        if (found) {
                            supplier_id = found.id;
                            supplier_name = name;
                        } else {
                            supplier_name = mfg;
                        }
                    } else {
                        supplier_name = mfg;
                    }
                }
                
                console.log(`[Approval] Converting PR ${pr.pr_number} to PO. Items found: ${prItems.length}`);
                
                const po_number = `PO-${Date.now()}`;
                const subtotal = pr.total_amount || 0;
                const cgst_amount = subtotal * 0.09;
                const sgst_amount = subtotal * 0.09;
                const total_with_tax = subtotal + cgst_amount + sgst_amount;

                // 建立 PO (全欄位同步)
                const poResult = await db.runAsync(
                    `INSERT INTO purchase_orders (
                        po_number, pr_id, supplier_id, supplier_name, requester, department, 
                        subtotal, cgst_rate, sgst_rate, cgst_amount, sgst_amount, shipping_fee, total_amount, 
                        remarks, status, currency, exchange_rate
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        po_number, pr.id, supplier_id, supplier_name, pr.requester, pr.department, 
                        subtotal, 9, 9, cgst_amount, sgst_amount, 0, total_with_tax, 
                        `From ${pr.pr_number}: ${pr.remarks || ''}`, 'pending', pr.currency || 'INR', pr.exchange_rate || 1.0
                    ]
                );
                
                const po_id = poResult.lastID;

                // [紀錄繼承] 將 PR 的所有簽核紀錄複製一份給新的 PO
                const prHistory = await db.allAsync('SELECT approver, status, comment, created_at FROM approval_history WHERE target_type = "PR" AND target_id = ?', [pr.id]);
                for (const h of prHistory) {
                    await db.runAsync(
                        'INSERT INTO approval_history (target_type, target_id, approver, status, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                        ['PO', po_id, h.approver, h.status, h.comment, h.created_at]
                    );
                }

                const stmt = await db.prepareAsync(`
                    INSERT INTO po_items (
                        po_id, material_number, description, quantity, unit, 
                        demand_day, purchase_quantity, manufacturer, date_of_purchase, 
                        remark_zh, remark_en, unit_price, total, subject_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `);

                for (const item of prItems) {
                    await stmt.runAsync(
                        po_id, item.material_number || '', item.description || '', 
                        item.quantity || 0, item.unit || '', item.demand_day || '', 
                        item.purchase_quantity || 0, item.manufacturer || '', 
                        item.date_of_purchase || '', item.remark_zh || '', 
                        item.remark_en || '', item.unit_price || 0, 
                        item.total || 0, item.subject_id || null
                    );
                }
                await stmt.finalizeAsync();
                
                // 將 PR 標記為已轉換
                await db.runAsync('UPDATE purchase_requests SET status = "converted" WHERE id = ?', [target_id]);
                console.log(`[Approval] Successfully converted PR ${pr.pr_number} to PO ${po_number}`);
            }
        } else if (target_type === 'PO') {
            await db.runAsync('UPDATE purchase_orders SET status = ? WHERE id = ?', [status, target_id]);
            
            // 如果採購單被核准，自動產生付款憑單
            if (status === 'approved') {
                const po = await db.getAsync('SELECT * FROM purchase_orders WHERE id = ?', [target_id]);
                if (po) {
                    const voucher_number = `PV-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${target_id}`;
                    
                    // 檢查是否已存在
                    const existing = await db.getAsync('SELECT id FROM payment_vouchers WHERE po_id = ?', [target_id]);
                    if (!existing) {
                        await db.runAsync(
                            `INSERT INTO payment_vouchers (po_id, voucher_number, net_amount, status) 
                             VALUES (?, ?, ?, ?)`,
                            [target_id, voucher_number, po.total_amount, 'pending']
                        );
                        console.log(`[Approval] Created Payment Voucher for PO ${po.po_number}`);
                    }
                }
            }
        }

        res.json({ success: true, message: 'Approval processed' });
    } catch (err) {
        console.error('*** Approval Process Critical Error ***');
        console.error('Error details:', err);
        res.status(500).json({ error: err.message });
    }
});

// 獲取簽核歷程
router.get('/history/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        const db = getDb();
        const history = await db.allAsync(
            'SELECT * FROM approval_history WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC',
            [type, id]
        );
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
