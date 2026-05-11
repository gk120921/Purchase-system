const express = require('express');
const cors = require('cors');
const { setupDatabase } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Request Logging
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Import Routes
const userRoutes = require('./routes/userRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const materialRoutes = require('./routes/materialRoutes');
const prRoutes = require('./routes/prRoutes');
const poRoutes = require('./routes/poRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const settingRoutes = require('./routes/settingRoutes');
const exportRoutes = require('./routes/exportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const deptRoutes = require('./routes/deptRoutes');
const historyRoutes = require('./routes/historyRoutes');
const paymentVoucherRoutes = require('./routes/paymentVoucherRoutes');


// API Routes Mapping
app.get('/api/ping', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), version: '2.0.0 (Modularized)' }));
app.use('/api', userRoutes); // Login and basic user info
app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/pr', prRoutes);
app.use('/api/po', poRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/departments', deptRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/payment-vouchers', paymentVoucherRoutes);


// Initialize DB and Start Server
async function startServer() {
    try {
        await setupDatabase();
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on http://127.0.0.1:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
    }
}

startServer();
