const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const hrRoutes = require('./routes/hrRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const financeRoutes = require('./routes/financeRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const systemRoutes = require('./routes/systemRoutes');

// Middleware Imports
const { auditLogger } = require('./middleware/audit');

// Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure Secure Uploads Directory Exists
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security & Utility Middleware
app.use(helmet()); // Sets secure HTTP headers to protect from vulnerabilities

// API Rate Limiting (Prevents Brute Force / DDoS)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 300, // Limit each IP to 300 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(express.json()); // Parses incoming JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded payloads
app.use('/uploads', express.static(uploadsDir)); // Secure static file serve for attachments

// Global Audit Logging (Automatically logs POST, PUT, DELETE requests)
app.use('/api/', auditLogger);

// ==========================================
// API Route Registration
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/system', systemRoutes);

// Health Check Endpoint (For monitoring tools)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Enterprise ERP API is running perfectly.' });
});

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API Endpoint not found or invalid.' });
});

// Start the Backend Server
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Enterprise ERP Backend Started`);
    console.log(`Port: ${PORT}`);
    console.log(`Environment: Production Ready`);
    console.log(`=========================================`);
});