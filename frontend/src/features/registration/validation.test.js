import { describe, expect, it } from 'vitest';
import { normalizeRegistrationField, validateRegistration, validateRegistrationField } from './validation';

describe('validação do cadastro', () => {
    it('normaliza CPF antes do envio', () => {
        expect(normalizeRegistrationField('cpf', '12345678901')).toBe('123.456.789-01');
    });

    it('rejeita identificadores incompletos e email inválido', () => {
        expect(validateRegistrationField('cpf', '123')).toBe('CPF incompleto');
        expect(validateRegistrationField('email', 'invalido')).toBe('Email inválido');
    });

    it('retorna somente os campos inválidos', () => {
        expect(validateRegistration({ nome: 'Nome', email: 'ok@example.test', cidade: '' }))
            .toEqual({ nome: 'Digite seu nome completo' });
    });
});
