const XLSX = require('xlsx');
const fs = require('fs');

try {
    const data = [
        { name: 'Test 1', value: 100 },
        { name: 'Test 2', value: 200 }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    fs.writeFileSync('test_export.xlsx', buf);
    console.log('Smoke test passed: Excel file generated locally.');
} catch (err) {
    console.error('Smoke test failed:', err);
}
