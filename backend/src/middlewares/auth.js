const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) throw new Error('JWT_SECRET missing in env');

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

exports.authenticateTokenOptional = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        req.user = null;
        return next();
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
};

// ✅ NOVO: Middleware para verificar se usuário é admin
exports.checkAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Acesso negado: requer privilégios de admin' });
    }
    next();
};
