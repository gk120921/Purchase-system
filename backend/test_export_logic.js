const XLSX = require('xlsx');

function formatDataForExcel(type, data) {
    if (type === 'PO') {
        return data.map((row, index) => ({
            'S.No': index + 1,
            'PO Date': row.po_date || '-',
            'PO No': row.po_number || '-',
            'PR No': row.pr_number || '-',
            'Supplier': row.supplier_name || '-',
            'Supplier Code': row.supplier_code || '-',
            'Details': `${row.material_number || ''} ${row.description || ''}`.trim() || '-',
            'Unit': row.unit || '-',
            'Qty': row.quantity || 0,
            'Price': row.unit_price || 0,
            'Total': (row.quantity || 0) * (row.unit_price || 0),
            'Subject Code': row.subject_code || '-',
            'Remarks': row.remark_zh || '-',
            'Status': (row.status || 'draft').toUpperCase()
        }));
    } else {
        return data.map((row, index) => ({
            'S.No': index + 1,
            'PR Date': row.pr_date || '-',
            'PR No': row.pr_number || '-',
            'Requester': row.requester || '-',
            'Department': row.department || '-',
            'Details': `${row.material_number || ''} ${row.description || ''}`.trim() || '-',
            'Unit': row.unit || '-',
            'Qty': row.quantity || 0,
            'Est. Price': row.unit_price || 0,
            'Total': (row.quantity || 0) * (row.unit_price || 0),
            'Subject Code': row.subject_code || '-',
            'Remarks': row.remark_zh || '-',
            'Status': (row.status || 'draft').toUpperCase()
        }));
    }
}

const mockData = [
    { pr_number: 'PR1', pr_date: '2026-05-13', requester: 'Admin', department: 'IT', material_number: 'M1', description: 'Desc', unit: 'PC', quantity: 10, unit_price: 100, subject_code: 'S1', remark_zh: 'Rem', status: 'pending' }
];

try {
    console.log('Testing formatDataForExcel...');
    const excelData = formatDataForExcel('PR', mockData);
    console.log('Success:', excelData[0]);

    console.log('Testing XLSX generation...');
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    console.log('Buffer generated, length:', buffer.length);
} catch (err) {
    console.error('CRASH:', err);
}
