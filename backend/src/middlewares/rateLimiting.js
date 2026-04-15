/**
 * Rate Limiting com estratégia específica por endpoint
 * Maior proteção em operações críticas e sensíveis
 */

const rateLimit = require('express-rate-limit');

// ==========================================
// CONFIGURAÇÕES GLOBAIS
// ==========================================

const DEFAULT_WINDOW = 15 * 60 * 1000;  // 15 minutos
const ONE_HOUR = 60 * 60 * 1000;        // 1 hora

// ==========================================
// RATE LIMITERS POR CATEGORIA
// ==========================================

/**
 * Limiter Global: proteção básica contra abuso genérico
 * 100 requisições por 15 minutos
 */
const globalLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.user?.role === 'super_admin',  // Admins são excluídos
});

/**
 * Limiter para Autenticação: proteção contra força bruta
 * 5 tentativas de login por 15 minutos
 */
const authLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: 5,
    message: { 
        error: 'Too many login attempts. Please try again in 15 minutes.',
        code: 'AUTH_RATE_LIMIT'
    },
    skipSuccessfulRequests: true,  // Reinicia contador após sucesso
    skipFailedRequests: false,     // Conta tentativas falhadas
});

/**
 * Limiter para Reset de Senha: proteção contra abuso
 * 3 tentativas de reset por hora
 */
const passwordResetLimiter = rateLimit({
    windowMs: ONE_HOUR,
    max: 3,
    message: { 
        error: 'Too many password reset attempts. Please try again in an hour.',
        code: 'PASSWORD_RESET_LIMIT'
    },
    skipSuccessfulRequests: true,
});

/**
 * Limiter para Mudança de Senha: proteção contra abuso
 * 5 mudanças por hora
 */
const changePasswordLimiter = rateLimit({
    windowMs: ONE_HOUR,
    max: 5,
    message: { 
        error: 'Too many password changes. Please try again in an hour.',
        code: 'PASSWORD_CHANGE_LIMIT'
    },
});

/**
 * Limiter para Admin Operations: RIGOROSO
 * 20 operações por 15 minutos
 * Reduz para apenas admins (filtragem adicional no controlador)
 */
const adminOperationLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: 20,
    message: { 
        error: 'Too many admin operations. Please try again later.',
        code: 'ADMIN_RATE_LIMIT'
    },
    skip: (req) => req.user?.role !== 'admin' && req.user?.role !== 'super_admin',
});

/**
 * Limiter para Upload de Arquivos: RESTRITIVO
 * 10 uploads por 15 minutos (com limite de tamanho adicional)
 */
const uploadLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: 10,
    message: { 
        error: 'Too many uploads. Please try again later.',
        code: 'UPLOAD_RATE_LIMIT'
    },
});

/**
 * Limiter para Endpoints Públicos: ABERTO
 * 50 requisições por 15 minutos
 */
const publicLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: 50,
    message: { 
        error: 'Too many requests. Please try again later.',
        code: 'PUBLIC_RATE_LIMIT'
    },
});

/**
 * Limiter para Operações Sensíveis: EXTREMO
 * 5 operações de aprovação/rejeição por 15 minutos
 */
const sensibleOperationLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: 5,
    message: { 
        error: 'Too many sensitive operations. Please try again later.',
        code: 'SENSITIVE_OPERATION_LIMIT'
    },
    skip: (req) => req.user?.role !== 'admin' && req.user?.role !== 'super_admin',
});

module.exports = {
    globalLimiter,
    authLimiter,
    passwordResetLimiter,
    changePasswordLimiter,
    adminOperationLimiter,
    uploadLimiter,
    publicLimiter,
    sensibleOperationLimiter,
};
