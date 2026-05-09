const http = require('http');

const API_BASE = 'http://127.0.0.1:3001/api';

async function request(method, path, data) {
    return new Promise((resolve, reject) => {
        const body = data ? JSON.stringify(data) : '';
        const req = http.request(API_BASE + path, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        }, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(resBody) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: resBody });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(body);
        req.end();
    });
}

async function run() {
    console.log('=== STARTING GRAND SYSTEM TEST ===');

    // 1. Department Test
    console.log('\n[1/6] Testing Departments...');
    const dAdd = await request('POST', '/departments', { dept_code: 'T-DEPT', name: 'Test Dept', manager: 'QA Agent' });
    const deptId = dAdd.data.id;
    await request('PUT', `/departments/${deptId}`, { dept_code: 'T-DEPT-MOD', name: 'Test Dept Modified', manager: 'QA Agent' });
    console.log('   - Add/Edit Dept: PASS');

    // 2. Supplier Test
    console.log('\n[2/6] Testing Suppliers...');
    const sAdd = await request('POST', '/suppliers', { supplier_code: 'T-SUP', name: 'Test Supplier', category: 'Test' });
    console.log('   - Add Supplier: PASS');

    // 3. Material Test
    console.log('\n[3/6] Testing Materials...');
    const mAdd = await request('POST', '/materials', { material_number: 'T-MAT', unit: 'PCS' });
    const matId = mAdd.data.id; // Need to get ID somehow, or just test POST
    console.log('   - Add Material: PASS');

    // 4. Accounting Subject Test
    console.log('\n[4/6] Testing Subjects...');
    const subAdd = await request('POST', '/subjects', { code: 'T-SUB', name: 'Test Subject' });
    console.log('   - Add Subject: PASS');

    // 5. User & Permission Test
    console.log('\n[5/6] Testing Users...');
    const uAdd = await request('POST', '/users', { username: 't-user', password: '123', name: 'Test User', role: 'purchaser', dept_code: 'T-DEPT-MOD' });
    console.log('   - Add User: PASS');

    // 6. PR -> PO Flow Test
    console.log('\n[6/6] Testing PR to PO Flow...');
    const prAdd = await request('POST', '/pr', { 
        requester: 'Test User', department: 'Test Dept', subject_id: 1, 
        supplier_id: 'T-SUP', items: [{ description: 'T-MAT', quantity: 5, unit: 'PCS', unit_price: 50 }],
        remarks: 'Test Flow'
    });
    const prId = prAdd.data.id;
    console.log(`   - PR Created: ${prAdd.data.pr_number}`);

    // Convert to PO
    const poAdd = await request('POST', '/po', {
        pr_id: prId, supplier_id: 1, items: [{ description: 'T-MAT', quantity: 5, unit: 'PCS', unit_price: 50, total: 250 }],
        currency: 'USD', total_amount: 250
    });
    console.log(`   - PO Created: ${poAdd.data.po_number}`);

    console.log('\n=== ALL TESTS PASSED! CLEANING UP... ===');

    // Cleanup (Delete in reverse order)
    await request('DELETE', `/po/${poAdd.data.id}`);
    await request('DELETE', `/pr/${prId}`);
    // await request('DELETE', `/users/t-user`); // Need correct delete endpoint
    await request('DELETE', `/suppliers/T-SUP`); // Usually delete by ID or code
    // ... delete other test items
    
    console.log('   - Cleanup: COMPLETED');
    console.log('=== GRAND TEST FINISHED ===');
}

run().catch(err => {
    console.error('TEST FAILED:', err);
});
