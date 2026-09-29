const STATUS_CODES = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHENTICATED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    413: 'PAYLOAD_TOO_LARGE',
    429: 'RATE_LIMITED'
};

module.exports = (req, res, next) => {
    const json = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode < 400) return json(body);
        if (res.statusCode >= 500) {
            return json({ error: 'Erro interno no servidor', code: 'INTERNAL_ERROR' });
        }
        if (body && typeof body === 'object' && !Array.isArray(body)) {
            const message = typeof body.error === 'string' ? body.error :
                (typeof body.message === 'string' ? body.message : 'Requisição inválida');
            const normalized = { ...body, error: message, code: body.code || STATUS_CODES[res.statusCode] || 'API_ERROR' };
            delete normalized.message;
            return json(normalized);
        }
        return json({ error: 'Requisição inválida', code: STATUS_CODES[res.statusCode] || 'API_ERROR' });
    };
    return next();
};
