/**
 * Rate Limiting com estratégia específica por endpoint
 * Maior proteção em operações críticas e sensíveis
 */

const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/apiResponse');

// ==========================================
// CONFIGURAÇÕES GLOBAIS
// ==========================================

const DEFAULT_WINDOW = 15 * 60 * 1000;  // 15 minutos
const ONE_HOUR = 60 * 60 * 1000;        // 1 hora
const limitHandler = (code, message) => (req, res) => sendError(res, 429, message, code);

// ==========================================
// RATE LIMITERS POR CATEGORIA
// ==========================================

/**
 * Limiter Global: proteção básica contra abuso genérico
 * 100 requisições por 15 minutos
 */
const globalLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: process.env.NODE_ENV === 'test' ? 10000 : 100,
    handler: limitHandler('GLOBAL_RATE_LIMIT', 'Muitas requisições. Tente novamente mais tarde.'),
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Limiter para Autenticação: proteção contra força bruta
 * 5 tentativas de login por 15 minutos
 */
const authLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: 5,
    handler: limitHandler('AUTH_RATE_LIMIT', 'Muitas tentativas de login. Tente novamente em 15 minutos.'),
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
    handler: limitHandler('PASSWORD_RESET_LIMIT', 'Muitas tentativas de redefinição. Tente novamente em uma hora.'),
    skipSuccessfulRequests: true,
});

/**
 * Limiter para Mudança de Senha: proteção contra abuso
 * 5 mudanças por hora
 */
const changePasswordLimiter = rateLimit({
    windowMs: ONE_HOUR,
    max: 5,
    handler: limitHandler('PASSWORD_CHANGE_LIMIT', 'Muitas alterações de senha. Tente novamente em uma hora.'),
});

/**
 * Limiter para Admin Operations: RIGOROSO
 * 20 operações por 15 minutos
 * Contabiliza apenas admins; autorização é responsabilidade do requireRole nas rotas.
 */
const adminOperationLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: 20,
    handler: limitHandler('ADMIN_RATE_LIMIT', 'Muitas operações administrativas. Tente novamente mais tarde.'),
});

/**
 * Limiter para Upload de Arquivos: RESTRITIVO
 * 10 uploads por 15 minutos (com limite de tamanho adicional)
 */
const uploadLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: 10,
    handler: limitHandler('UPLOAD_RATE_LIMIT', 'Muitos uploads. Tente novamente mais tarde.'),
});

/**
 * Limiter para Endpoints Públicos: ABERTO
 * 50 requisições por 15 minutos
 */
const publicLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: 50,
    handler: limitHandler('PUBLIC_RATE_LIMIT', 'Muitas requisições. Tente novamente mais tarde.'),
});

/**
 * Limiter para Operações Sensíveis: EXTREMO
 * 5 operações de aprovação/rejeição por 15 minutos
 */
const sensibleOperationLimiter = rateLimit({
    windowMs: DEFAULT_WINDOW,
    max: 5,
    handler: limitHandler('SENSITIVE_OPERATION_LIMIT', 'Muitas operações sensíveis. Tente novamente mais tarde.'),
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
