const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '預算費用會計科目對照表Comparison Table of Accounting Subjects for Budgetary Expenses.xlsx');

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log('Sheet Name:', sheetName);
    console.log('First 5 rows of data:');
    console.log(JSON.stringify(data.slice(0, 5), null, 2));
} catch (error) {
    console.error('Error reading Excel:', error.message);
}
