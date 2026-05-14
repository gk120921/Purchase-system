const axios = require('axios');

async function testNumberGeneration() {
    console.log('--- START INTERNAL TEST ---');
    const API_URL = 'http://localhost:3001/api';
    
    try {
        // 模擬新增 PR
        console.log('Testing PR creation...');
        const prRes = await axios.post(`${API_URL}/pr`, {
            requester: 'Internal Test',
            department: 'IT',
            items: [{ description: 'Test Item', quantity: 1, unit_price: 100 }],
            remarks: 'Test'
        });
        
        console.log('Created PR Number:', prRes.data.pr_number);
        
        if (prRes.data.pr_number.includes('PR-1778')) {
            console.error('FAIL: Still getting timestamp format!');
        } else if (/^PR-\d{11}$/.test(prRes.data.pr_number)) {
            console.log('SUCCESS: PR Number format is correct (YYYYMMDDXXX)');
        } else {
            console.error('FAIL: Unknown format:', prRes.data.pr_number);
        }

        // 模擬新增 PO
        console.log('\nTesting PO creation...');
        const poRes = await axios.post(`${API_URL}/po`, {
            requester: 'Internal Test',
            department: 'IT',
            items: [{ description: 'Test Item', quantity: 1, unit_price: 100 }],
            remarks: 'Test'
        });
        
        console.log('Created PO Number:', poRes.data.po_number);
        
        if (poRes.data.po_number.includes('PO-1778')) {
            console.error('FAIL: Still getting timestamp format!');
        } else if (/^PO-\d{11}$/.test(poRes.data.po_number)) {
            console.log('SUCCESS: PO Number format is correct (YYYYMMDDXXX)');
        } else {
            console.error('FAIL: Unknown format:', poRes.data.po_number);
        }

    } catch (err) {
        console.error('TEST ERROR:', err.message);
        console.log('Note: Ensure server is running on port 3001');
    }
    console.log('--- END INTERNAL TEST ---');
}

testNumberGeneration();
