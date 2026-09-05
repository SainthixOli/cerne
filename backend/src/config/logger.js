const winston = require('winston');
const path = require('path');

const SENSITIVE_KEY_PATTERN = /(^|_)(authorization|body|content|cookie|cpf|documento|email|file(name)?|password|passwd|payload(preview)?|senha|secret|token|api_?key|private_?key)($|_)/i;
const CPF_PATTERN = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const BEARER_PATTERN = /\bBearer\s+[^\s,;]+/gi;
const URL_SECRET_PATTERN = /([?&](?:access_token|refresh_token|reset_token|token|key|secret)=)[^&\s]+/gi;
const JSON_SECRET_PATTERN = /("(?:authorization|cookie|cpf|password|senha|secret|token|api_?key|private_?key)"\s*:\s*)"[^"]*"/gi;

function redactString(value) {
    return value
        .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
        .replace(URL_SECRET_PATTERN, '$1[REDACTED]')
        .replace(JSON_SECRET_PATTERN, '$1"[REDACTED]"')
        .replace(CPF_PATTERN, '[REDACTED_CPF]')
        .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]');
}

function redactValue(value, key = '', seen = new WeakSet()) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
        return '[REDACTED]';
    }

    if (typeof value === 'string') {
        return redactString(value);
    }

    if (!value || typeof value !== 'object') {
        return value;
    }

    if (seen.has(value)) {
        return '[CIRCULAR]';
    }
    seen.add(value);

    if (Array.isArray(value)) {
        return value.map((item) => redactValue(item, '', seen));
    }

    return Object.fromEntries(
        Object.entries(value).map(([nestedKey, nestedValue]) => [
            nestedKey,
            redactValue(nestedValue, nestedKey, seen),
        ])
    );
}

const redactSensitiveData = winston.format((info) => {
    for (const key of Object.keys(info)) {
        info[key] = redactValue(info[key], key);
    }
    return info;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    format: winston.format.combine(
        redactSensitiveData(),
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'cerne-backend' },
    transports: [
        new winston.transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }),
        new winston.transports.File({ filename: path.join(__dirname, '../../logs/combined.log') }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            redactSensitiveData(),
            winston.format.simple()
        ),
    }));
}

module.exports = logger;
module.exports.redactString = redactString;
module.exports.redactValue = redactValue;
