const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const helmet = require('helmet');
const { csrfProtection } = require('./middlewares/csrf');
const { sanitizationMiddleware } = require('./middlewares/sanitization');
const { auditMiddleware } = require('./middlewares/audit');
const { auditAccessDeniedMiddleware } = require('./middlewares/auditAccessDenied');
const { allowPublic } = require('./middlewares/requireRole');
const { globalLimiter } = require('./middlewares/rateLimiting');
const normalizeErrors = require('./middlewares/normalizeErrors');

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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug', 'X-Upload-Token'],
    exposedHeaders: ['X-Upload-Token']
}));

// CSRF Protection: Proteção leve contra CSRF
app.use(csrfProtection);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(normalizeErrors);
app.use(globalLimiter);

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

// Rotas
app.use('/api', routes);

const errorHandler = require('./middlewares/errorHandler');
app.get('/', allowPublic, (req, res) => {
    res.send('API CERNE System is running');
});

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada', code: 'NOT_FOUND' }));

// Global Error Handler
app.use(errorHandler);

module.exports = app;
