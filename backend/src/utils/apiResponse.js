const DEFAULT_MESSAGES = {
    400: 'Requisição inválida',
    401: 'Não autenticado',
    403: 'Acesso negado',
    404: 'Recurso não encontrado',
    409: 'Conflito de dados',
    429: 'Muitas requisições. Tente novamente mais tarde.',
    500: 'Erro interno no servidor'
};

function sendError(res, status, message, code = 'API_ERROR', details) {
    const safeMessage = status >= 500 ? DEFAULT_MESSAGES[500] : (message || DEFAULT_MESSAGES[status]);
    const payload = { error: safeMessage, code };
    if (status < 500 && Array.isArray(details) && details.length > 0) payload.details = details;
    return res.status(status).json(payload);
}

module.exports = { sendError, DEFAULT_MESSAGES };
