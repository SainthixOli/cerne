/**
 * Middleware para prevenir IDOR (Insecure Direct Object Reference)
 * Valida se o usuário autenticado é proprietário do recurso ou tem permissão admin
 * 
 * Exemplo de uso:
 * router.get('/affiliations/:userId/history', 
 *     authenticateToken,
 *     checkResourceOwnership('userId'),
 *     controller.getHistory
 * );
 */

const checkResourceOwnership = (resourceParamName = 'id') => {
    return (req, res, next) => {
        try {
            const resourceId = req.params[resourceParamName];
            const userId = req.user.id;
            const userRole = req.user.role;

            // Admins sempre podem acessar qualquer recurso
            if (userRole === 'admin' || userRole === 'super_admin') {
                return next();
            }

            // Usuários comuns podem acessar apenas seu próprio recurso
            if (userId !== resourceId) {
                return res.status(403).json({ 
                    error: 'Acesso negado: você não tem permissão para acessar este recurso',
                    code: 'FORBIDDEN_RESOURCE_ACCESS'
                });
            }

            next();
        } catch (error) {
            console.error('resourceOwnership middleware error:', error);
            res.status(500).json({ error: 'Erro ao validar acesso' });
        }
    };
};

module.exports = {
    checkResourceOwnership
};
