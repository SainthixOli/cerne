import { describe, expect, it } from 'vitest';
import { canRetryRequest, normalizeApiError } from './apiErrors';

describe('apiErrors', () => {
    it('normaliza o contrato de erro sem expor detalhes internos', () => {
        const error = normalizeApiError({ response: { status: 403, data: { error: 'Acesso negado', code: 'FORBIDDEN' } } });
        expect(error).toMatchObject({ status: 403, code: 'FORBIDDEN', message: 'Acesso negado' });
    });

    it('não repete falhas de autenticação ou autorização', () => {
        expect(canRetryRequest(0, { response: { status: 401 } })).toBe(false);
        expect(canRetryRequest(0, { response: { status: 403 } })).toBe(false);
        expect(canRetryRequest(0, { response: { status: 503 } })).toBe(true);
        expect(canRetryRequest(2, { response: { status: 503 } })).toBe(false);
    });
});
