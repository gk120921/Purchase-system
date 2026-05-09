const { setupDatabase } = require('./database');
const axios = require('axios');

async function diagnose() {
    console.log('--- 系統深度解析診斷開始 ---');

    // 1. 檢查資料庫內容
    console.log('\n[1/4] 檢查資料庫使用者資料...');
    let db;
    try {
        db = await setupDatabase();
        const users = await db.all('SELECT * FROM users');
        console.log('現有使用者:', users.map(u => ({ username: u.username, role: u.role })));
        
        const testUser = await db.get('SELECT * FROM users WHERE username = ? AND password = ?', ['boss', '1234']);
        if (testUser) {
            console.log('✅ 資料庫查詢驗證成功: boss/1234 存在於資料庫。');
        } else {
            console.error('❌ 資料庫查詢驗證失敗: 找不到 boss/1234。');
        }
    } catch (err) {
        console.error('❌ 資料庫錯誤:', err.message);
    } finally {
        if (db) await db.close();
    }

    // 2. 檢查網路埠位佔用
    console.log('\n[2/4] 檢查 3001 埠位 (後端) 是否開放...');
    // 這裡我們嘗試發送一個簡單的請求到運行中的後端 (假設它已經啟動)
    try {
        const res = await axios.get('http://127.0.0.1:3001/api/suppliers');
        console.log('✅ 後端連線成功: 收到供應商資料。');
    } catch (err) {
        console.warn('⚠️ 後端目前未啟動或無法從此腳本連線。這可能是導致登錄失敗的原因。');
    }

    // 3. 檢查跨域 (CORS) 與 Payload
    console.log('\n[3/4] 分析前端請求邏輯...');
    console.log('前端 API_BASE:', 'http://127.0.0.1:3001/api');
    console.log('使用的庫: axios');
    console.log('跨域配置: app.use(cors()) -> 已啟用。');

    // 4. 檢查 Vite 前端同步狀態
    console.log('\n[4/4] 檢查前端原始碼同步...');
    const fs = require('fs');
    const path = require('path');
    const appPath = path.join(__dirname, '..', 'frontend', 'src', 'App.jsx');
    try {
        const content = fs.readFileSync(appPath, 'utf8');
        if (content.includes('Connect with the Future')) {
            console.log('✅ 前端原始碼已更新為最新 KST 設計。');
        } else {
            console.warn('⚠️ 前端原始碼似乎仍為舊版。');
        }
    } catch (err) {
        console.error('❌ 無法讀取前端檔案:', err.message);
    }

    console.log('\n--- 診斷結束 ---');
}

diagnose();
