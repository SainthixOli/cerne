const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const helmet = require('helmet');
const { csrfProtection } = require('./middlewares/csrf');
const { sanitizationMiddleware } = require('./middlewares/sanitization');
const { auditMiddleware } = require('./middlewares/audit');
const { auditAccessDeniedMiddleware } = require('./middlewares/auditAccessDenied');
const {
    detectLoginAnomalies,
    detectAccessAnomalies,
    detectXSSAnomalies,
    detectSQLInjectionAnomalies,
    detectTokenAnomalies
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

// Note: Specific rate limiters are applied per-route in routes/index.js
// This approach allows granular control over sensitive operations

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// XSS Sanitization: Remove malicious scripts from input
app.use(sanitizationMiddleware);

// Security Detection Middleware: Detecta anomalias e padrões suspeitos
app.use(detectSQLInjectionAnomalies);  // Detecta SQL injection antes de outras operações
app.use(detectXSSAnomalies);            // Detecta XSS patterns
app.use(detectTokenAnomalies);          // Detecta token abuse
app.use(detectAccessAnomalies);         // Detecta access denied spikes
app.use(detectLoginAnomalies);          // Detecta brute force de login

// Audit Logging: Log sensitive operations
app.use(auditMiddleware);

// Audit Access Denied: Log 401/403 responses
app.use(auditAccessDeniedMiddleware);

// Static Files
const path = require('path');
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
