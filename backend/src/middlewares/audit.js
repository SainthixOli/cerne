const AuditLogger = require('../config/auditLogger');

/**
 * Middleware de auditoria automática
 * Registra ações sensíveis após execução bem-sucedida
 */
const auditMiddleware = (req, res, next) => {
    // Armazenar método original e dados originais
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const requestStartTime = Date.now();

    // Interceptar resposta JSON
    res.json = function(data) {
        // Registrar operações sensíveis se bem-sucedidas
        if (res.statusCode < 400 && req.body) {
            auditCheckAndLog(req, res.statusCode, data);
        }
        return originalJson(data);
    };

    // Interceptar resposta plain text
    res.send = function(data) {
        if (res.statusCode < 400 && req.body) {
            auditCheckAndLog(req, res.statusCode, data);
        }
        return originalSend(data);
    };

    next();
};

/**
 * Verifica e registra operações sensíveis
 */
function auditCheckAndLog(req, statusCode, responseData) {
    const userId = req.user?.id;
    const ip = req.ip;
    const path = req.path;
    const method = req.method;

    // Operações de dados sensíveis (POST/PUT/DELETE em affiliations, users, etc)
    if (path.includes('/affiliations') && method === 'POST') {
        // Registro de filiação
        AuditLogger.dataSensitiveChange(
            userId || 'anonymous',
            'CREATE',
            'affiliation',
            'new',
            req.body,
            ip
        );
    }

    if (path.includes('/affiliations') && method === 'PUT') {
        // Alteração de filiação
        AuditLogger.dataSensitiveChange(
            userId,
            'UPDATE',
            'affiliation',
            req.params.id || 'unknown',
            req.body,
            ip
        );
    }

    if (path.includes('/approve') || path.includes('/reject')) {
        // Operações administrativas
        AuditLogger.sensitiveOperation(
            userId,
            `AFFILIATION_${method === 'POST' ? 'APPROVE' : 'REJECT'}`,
            req.params.id || 'unknown',
            { path, method },
            ip
        );
    }

    if (path.includes('/profile') && method === 'PUT') {
        // Alteração de perfil
        AuditLogger.dataSensitiveChange(
            userId,
            'UPDATE',
            'profile',
            userId,
            req.body,
            ip
        );
    }

    if (path.includes('/admin/users') && method === 'POST') {
        // Criação de usuário administrativo
        AuditLogger.sensitiveOperation(
            userId,
            'ADMIN_USER_CREATE',
            req.body.id || 'new',
            { body: req.body },
            ip
        );
    }

    if (path.includes('/change-password') || path.includes('/reset-password')) {
        // Mudança de senha
        AuditLogger.passwordChange(
            userId || 'unknown',
            ip,
            statusCode < 400,
            'via ' + path
        );
    }
}

module.exports = { auditMiddleware, auditCheckAndLog };
