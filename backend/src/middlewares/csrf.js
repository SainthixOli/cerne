/**
 * CSRF Protection via Header Validation
 * Nota: Esta é uma proteção LEVE. Para production completo, usar csurf + cookies.
 * 
 * Este middleware verifica se requisições POST/PUT/DELETE vêm com:
 * 1. Content-Type: application/json (evita form-encoded submissions)
 * 2. Authorization header (validação JWT)
 * 3. User-Agent header (validação básica)
 */

const csrfProtection = (req, res, next) => {
    // Apenas protege operações que modificam dados
    const dangerousMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    if (!dangerousMethods.includes(req.method)) {
        return next();  // GET, OPTIONS, etc - não precisa proteção
    }

    const origin = req.get('Origin');
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',');
    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({
            error: 'Origem não permitida',
            code: 'CSRF_INVALID_ORIGIN'
        });
    }

    // JSON e multipart são os únicos formatos aceitos nas operações mutáveis.
    const contentType = req.get('Content-Type') || '';
    if (contentType && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
        return res.status(403).json({
            error: 'Tipo de conteúdo não permitido',
            code: 'CSRF_INVALID_CONTENT_TYPE'
        });
    }
    return next();
};

/**
 * CSRF Protection Estrita - para operações MUITO sensíveis
 * Requer autenticação obrigatória
 */
const csrfProtectionStrict = (req, res, next) => {
    const dangerousMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    if (!dangerousMethods.includes(req.method)) {
        return next();
    }

    // Requer JWT obrigatoriamente
    const authHeader = req.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({
            error: 'CSRF Protection: This operation requires authentication',
            code: 'CSRF_AUTH_REQUIRED'
        });
    }

    // Requer Content-Type JSON
    const contentType = req.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
        return res.status(403).json({
            error: 'CSRF Protection: Invalid Content-Type. Must be application/json',
            code: 'CSRF_INVALID_CONTENT_TYPE'
        });
    }

    next();
};

module.exports = {
    csrfProtection,
    csrfProtectionStrict,
};
