const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const XLSX = require('xlsx');

// Helper to format data for Excel (Reuse logic from frontend)
function formatDataForExcel(type, data) {
    if (type === 'PO') {
        return data.map((row, index) => ({
            '序號 (S.No)': index + 1,
            '採購日期 (PO Date)': row.po_date || '-',
            '採購單號 (PO No)': row.po_number || '-',
            '請購單號 (PR No)': row.pr_number || '-',
            '供應商代碼 (Supplier Code)': row.supplier_code || '-',
            '供應商名稱 (Supplier Name)': row.supplier_name || '-',
            '料號 (Material No.)': row.material_number || '-',
            '品名規格 (Description)': row.description || '-',
            '單位 (Unit)': row.unit || '-',
            '數量 (Qty)': row.quantity || 0,
            '單價 (Unit Price)': row.unit_price || 0,
            '總價 (Total Amount)': (row.quantity || 0) * (row.unit_price || 0),
            '需求日 (Req. Day)': row.demand_day || '-',
            '會計科目代碼 (Subject Code)': row.subject_code || '-',
            '中文備註 (ZH Remark)': row.remark_zh || '-',
            '英文備註 (EN Remark)': row.remark_en || '-',
            '狀態 (Status)': (row.status || 'draft').toUpperCase()
        }));
    } else {
        return data.map((row, index) => ({
            '序號 (S.No)': index + 1,
            '請購日期 (PR Date)': row.pr_date || '-',
            '請購單號 (PR No)': row.pr_number || '-',
            '申請人 (Requester)': row.requester || '-',
            '部門 (Department)': row.department || '-',
            '供應商代碼 (Supplier Code)': row.supplier_code || '-',
            '供應商名稱 (Supplier Name)': row.supplier_name || '-',
            '料號 (Material No.)': row.material_number || '-',
            '品名規格 (Description)': row.description || '-',
            '單位 (Unit)': row.unit || '-',
            '數量 (Qty)': row.quantity || 0,
            '預估單價 (Est. Price)': row.unit_price || 0,
            '預估總價 (Est. Total)': (row.quantity || 0) * (row.unit_price || 0),
            '需求日 (Req. Day)': row.demand_day || '-',
            '會計科目代碼 (Subject Code)': row.subject_code || '-',
            '中文備註 (ZH Remark)': row.remark_zh || '-',
            '英文備註 (EN Remark)': row.remark_en || '-',
            '狀態 (Status)': (row.status || 'draft').toUpperCase()
        }));
    }
}

router.get('/download-excel', async (req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] EXPORT START:`, req.query);
    try {
        const { type, startDate, endDate, status } = req.query;
        console.log('Step 1: Connecting to DB...');
        const db = getDb();
        
        let query = '';
        if (type === 'PO') {
            query = `
                SELECT po.po_number, po.created_at as po_date, pr.pr_number,
                       COALESCE(s.name, po.supplier_name) as supplier_name, s.supplier_code,
                       pi.material_number, pi.description, pi.unit, pi.quantity, pi.unit_price,
                       sub.code as subject_code, pi.remark_zh, pi.remark_en, po.status, pi.demand_day
                FROM po_items pi
                JOIN purchase_orders po ON pi.po_id = po.id
                LEFT JOIN suppliers s ON po.supplier_id = s.id
                LEFT JOIN purchase_requests pr ON po.pr_id = pr.id
                LEFT JOIN accounting_subjects sub ON pi.subject_id = sub.id
                WHERE 1=1
            `;
        } else {
            query = `
                SELECT pr.pr_number, pr.created_at as pr_date, pr.requester, pr.department,
                       COALESCE(s.name, pr.supplier_name) as supplier_name, s.supplier_code,
                       pi.material_number, pi.description, pi.unit, pi.quantity, pi.unit_price,
                       sub.code as subject_code, pi.remark_zh, pi.remark_en, pr.status, pi.demand_day
                FROM pr_items pi
                JOIN purchase_requests pr ON pi.pr_id = pr.id
                LEFT JOIN suppliers s ON pr.supplier_id = s.id
                LEFT JOIN accounting_subjects sub ON pi.subject_id = sub.id
                WHERE 1=1
            `;
        }

        const params = [];
        if (startDate) {
            query += ` AND ${type === 'PO' ? 'po.created_at' : 'pr.created_at'} >= ?`;
            params.push(startDate + ' 00:00:00');
        }
        if (endDate) {
            query += ` AND ${type === 'PO' ? 'po.created_at' : 'pr.created_at'} <= ?`;
            params.push(endDate + ' 23:59:59');
        }
        if (status && status !== 'ALL') {
            query += ` AND UPPER(${type === 'PO' ? 'po.status' : 'pr.status'}) = ?`;
            params.push(status.toUpperCase());
        }

        query += ` ORDER BY ${type === 'PO' ? 'po.created_at' : 'pr.created_at'} DESC`;

        console.log('Step 2: Executing SQL...');
        const rows = await db.allAsync(query, params);
        
        if (!rows || !Array.isArray(rows)) {
            console.error('Database returned non-array result:', rows);
            throw new Error('Database Error: Result is not an array');
        }

        console.log(`Step 3: Found ${rows.length} rows.`);
        
        if (rows.length === 0) {
            console.warn('Export Warning: No data found.');
            return res.status(404).send('<h1>No Data Found</h1><p>The selected filters returned zero results.</p><button onclick="window.close()">Close</button>');
        }

        console.log('Step 4: Formatting for Excel...');
        const excelData = formatDataForExcel(type, rows);
        
        console.log('Step 5: Generating XLSX buffer...');
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        console.log('Step 6: Sending file...');
        const fileName = `KST_${type}_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
        console.log('EXPORT COMPLETED SUCCESSFULLY.');

    } catch (err) {
        console.error('CRITICAL BACKEND EXCEL EXPORT ERROR:', err);
        // Ensure we don't crash the server, just return a 500
        if (!res.headersSent) {
            res.status(500).send('<h1>Export Failed</h1><p>' + err.message + '</p>');
        }
    }
});

// Keep legacy endpoints for other potential uses
router.get('/po-details', async (req, res) => {
    try {
        const db = getDb();
        const rows = await db.allAsync(`
            SELECT 
                po.po_number,
                po.created_at as po_date,
                pr.pr_number,
                COALESCE(s.name, po.supplier_name) as supplier_name,
                s.supplier_code,
                pi.material_number,
                pi.description,
                pi.unit,
                pi.quantity,
                pi.unit_price,
                sub.code as subject_code,
                pi.remark_zh,
                po.status
            FROM po_items pi
            JOIN purchase_orders po ON pi.po_id = po.id
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN purchase_requests pr ON po.pr_id = pr.id
            LEFT JOIN accounting_subjects sub ON pi.subject_id = sub.id
            ORDER BY po.created_at DESC, pi.id ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('EXPORT PO API ERROR:', err);
        res.status(500).json({ error: 'EXPORT_DB_ERROR', message: err.message });
    }
});

router.get('/pr-details', async (req, res) => {
    try {
        const db = getDb();
        const rows = await db.allAsync(`
            SELECT 
                pr.pr_number,
                pr.created_at as pr_date,
                pr.requester,
                pr.department,
                pi.material_number,
                pi.description,
                pi.unit,
                pi.quantity,
                pi.unit_price,
                sub.code as subject_code,
                pi.remark_zh,
                pr.status
            FROM pr_items pi
            JOIN purchase_requests pr ON pi.pr_id = pr.id
            LEFT JOIN accounting_subjects sub ON pi.subject_id = sub.id
            ORDER BY pr.created_at DESC, pi.id ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('EXPORT PR API ERROR:', err);
        res.status(500).json({ error: 'EXPORT_DB_ERROR', message: err.message });
    }
});

module.exports = router;
