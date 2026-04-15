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

    // 1. Validar Content-Type (deve ser JSON)
    const contentType = req.get('Content-Type') || '';
    if (!contentType.includes('application/json') && req.body && Object.keys(req.body).length > 0) {
        return res.status(403).json({
            error: 'CSRF Protection: Invalid Content-Type. Must be application/json',
            code: 'CSRF_INVALID_CONTENT_TYPE'
        });
    }

    // 2. Validar Authorization header (JWT)
    // Se requer autenticação, JWT deve estar presente
    if (req.get('Authorization')) {
        // JWT presente, pode ser uma chamada legítima de API
        return next();
    }

    // 3. Para requisições sem Auth, usar User-Agent como verificação mínima
    const userAgent = req.get('User-Agent') || '';
    if (!userAgent) {
        return res.status(403).json({
            error: 'CSRF Protection: Suspicious request (missing User-Agent)',
            code: 'CSRF_MISSING_USER_AGENT'
        });
    }

    next();
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
