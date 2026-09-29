export class ApiError extends Error {
    constructor({ message, status, code, details, cause }) {
        super(message, { cause });
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export function normalizeApiError(error) {
    if (error instanceof ApiError) return error;
    const response = error?.response;
    const status = response?.status || 0;
    const payload = response?.data;
    const fallback = status === 0
        ? 'Não foi possível conectar ao serviço.'
        : 'Não foi possível concluir a solicitação.';
    return new ApiError({
        message: payload?.error || payload?.message || fallback,
        status,
        code: payload?.code || 'REQUEST_FAILED',
        details: payload?.details,
        cause: error
    });
}

export function canRetryRequest(failureCount, error) {
    const normalized = normalizeApiError(error);
    if ([400, 401, 403, 404, 409, 422].includes(normalized.status)) return false;
    return failureCount < 2;
}
