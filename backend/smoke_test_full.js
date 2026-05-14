const axios = require('axios');

async function smokeTest() {
    console.log('🚀 --- STARTING FULL FLOW SMOKE TEST --- 🚀');
    const API_URL = 'http://localhost:3001/api';
    let prId, poId;

    try {
        // 1. Create PR
        console.log('[Step 1] Creating Purchase Request...');
        const prRes = await axios.post(`${API_URL}/pr`, {
            requester: 'Smoke Test Bot',
            department: 'IT',
            items: [{ description: 'Test Machine', quantity: 1, unit_price: 50000, unit: 'SET' }],
            remarks: 'Automated Smoke Test'
        });
        prId = prRes.data.id;
        console.log(`✅ PR Created: ${prRes.data.pr_number} (ID: ${prId})`);

        // 2. Approve PR (Should convert to PO)
        console.log('\n[Step 2] Approving PR...');
        await axios.post(`${API_URL}/approvals`, {
            target_type: 'PR',
            target_id: prId,
            approver: 'Dept Manager',
            status: 'approved',
            comment: 'Looks good'
        });
        console.log('✅ PR Approved.');

        // 3. Verify PO Creation
        console.log('\n[Step 3] Verifying PO existence...');
        const posRes = await axios.get(`${API_URL}/po`);
        const linkedPO = posRes.data.find(po => po.pr_id === prId);
        if (!linkedPO) {
            throw new Error('❌ FAIL: PO was not automatically created after PR approval!');
        }
        poId = linkedPO.id;
        console.log(`✅ PO Found: ${linkedPO.po_number} (ID: ${poId})`);

        // 4. Approve PO
        console.log('\n[Step 4] Approving PO...');
        await axios.post(`${API_URL}/approvals`, {
            target_type: 'PO',
            target_id: poId,
            approver: 'GM',
            status: 'approved',
            comment: 'Approved for purchase'
        });
        console.log('✅ PO Approved.');

        // 5. Verify Payment Voucher
        console.log('\n[Step 5] Verifying Payment Voucher existence...');
        const pvRes = await axios.get(`${API_URL}/payment-vouchers`);
        const linkedPV = pvRes.data.find(pv => pv.po_id === poId);
        if (!linkedPV) {
            throw new Error('❌ FAIL: Payment Voucher was not created after PO approval!');
        }
        console.log(`✅ PV Found: ${linkedPV.voucher_number}`);

        console.log('\n🌟 --- ALL FLOWS PASSED SUCCESSFULLY! --- 🌟');

    } catch (err) {
        console.error('\n❌ SMOKE TEST FAILED!');
        console.error('Error Details:', err.response ? err.response.data : err.message);
        process.exit(1);
    }
}

smokeTest();
