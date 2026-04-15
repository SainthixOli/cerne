const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const path = require('path');

const helmet = require('helmet');
const { csrfProtection } = require('./middlewares/csrf');
const { sanitizationMiddleware } = require('./middlewares/sanitization');
const { auditMiddleware } = require('./middlewares/audit');
const { auditAccessDeniedMiddleware } = require('./middlewares/auditAccessDenied');

// Security Detection Middleware (Phase 2 - Alerts System)
const {
    detectSQLInjectionAnomalies,
    detectXSSAnomalies,
    detectTokenAnomalies,
    detectAccessAnomalies,
    detectLoginAnomalies
} = require('./middlewares/securityDetection');

const app = express();

// Security Middleware
app.use(helmet());

// CORS: Restritivo - whitelist de origens
const allowedOrigins = process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',') : 
    ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// CSRF Protection: Proteção leve contra CSRF
app.use(csrfProtection);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security Detection: Anomaly detection for real-time alerts
app.use(detectSQLInjectionAnomalies);
app.use(detectXSSAnomalies);
app.use(detectTokenAnomalies);
app.use(detectAccessAnomalies);
app.use(detectLoginAnomalies);

// XSS Sanitization: Remove malicious scripts from input
app.use(sanitizationMiddleware);

// Audit Logging: Log sensitive operations
app.use(auditMiddleware);

// Audit Access Denied: Log 401/403 responses
app.use(auditAccessDeniedMiddleware);

// Static Files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
app.use('/api', routes);

const errorHandler = require('./middlewares/errorHandler');
app.get('/', (req, res) => {
    res.send('API CERNE System is running');
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
