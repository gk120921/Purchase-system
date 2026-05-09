const axios = require('axios');

async function testHistoryAPI() {
    try {
        const res = await axios.get('http://127.0.0.1:3001/api/history');
        console.log('API Response Status:', res.status);
        console.log('API Response Data Length:', res.data.length);
        console.log('Sample Data:', res.data.slice(0, 2));
    } catch (err) {
        console.error('API Request Failed:', err.message);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', err.response.data);
        }
    }
}

testHistoryAPI();
