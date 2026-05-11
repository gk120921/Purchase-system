const http = require('http');

function post(url, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        req.write(JSON.stringify(data));
        req.end();
    });
}

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
    });
}

async function runTest() {
    console.log('--- Team Internal Test (No Axios) Start ---');
    const API_BASE = 'http://127.0.0.1:3001/api';
    try {
        console.log('1. Creating PR...');
        const pr = await post(`${API_BASE}/pr`, {
            requester: 'Agent3', department: 'R&D', subject_id: 1, 
            supplier_id: 'Test Supplier Name',
            items: [{ description: 'Auto Test Item', quantity: 1, unit: 'PCS', unit_price: 5000 }]
        });
        const prId = pr.id;
        console.log('PR Created:', prId);

        console.log('2. Approving PR...');
        await post(`${API_BASE}/approvals`, {
            target_type: 'PR', target_id: prId, approver: 'LeadAgent',
            status: 'approved', comment: 'Final Test'
        });

        console.log('3. Verifying PO...');
        const pos = await get(`${API_BASE}/po`);
        const latest = pos[0];
        if (latest && latest.pr_id === prId) {
            console.log('SUCCESS! PO Number:', latest.po_number, 'Total:', latest.total_amount);
        } else {
            console.error('FAILURE: PO NOT FOUND OR MISMATCH');
        }
    } catch (e) {
        console.error('TEST ERROR:', e.message);
    }
    console.log('--- Test End ---');
}

runTest();
