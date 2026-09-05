const { redactString, redactValue } = require('../src/config/logger');

describe('logger sensitive-data redaction', () => {
    it('redacts sensitive object keys recursively', () => {
        const redacted = redactValue({
            password: 'runtime-value',
            nested: {
                reset_token: 'runtime-value',
                payloadPreview: 'sensitive request content',
                status: 'ok',
            },
        });

        expect(redacted).toEqual({
            password: '[REDACTED]',
            nested: {
                reset_token: '[REDACTED]',
                payloadPreview: '[REDACTED]',
                status: 'ok',
            },
        });
    });

    it('redacts bearer credentials, reset links and CPF-shaped values in strings', () => {
        const input = [
            'Authorization: Bearer runtime-value',
            'url=https://example.invalid/reset?token=runtime-value',
            'cpf=123.456.789-01',
            'email=user@example.invalid',
        ].join(' ');
        const output = redactString(input);

        expect(output).not.toContain('runtime-value');
        expect(output).not.toContain('123.456.789-01');
        expect(output).not.toContain('user@example.invalid');
        expect(output).toContain('[REDACTED]');
        expect(output).toContain('[REDACTED_CPF]');
        expect(output).toContain('[REDACTED_EMAIL]');
    });
});
