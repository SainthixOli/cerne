import { maskCPF, maskPhone } from '../../utils/masks';

export const INITIAL_REGISTRATION_DATA = Object.freeze({
    nome: '', cpf: '', email: '', telefone: '', matricula: '',
    rg: '', orgao_emissor: '', nacionalidade: '', estado_civil: '',
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', uf: ''
});

export function normalizeRegistrationField(name, value) {
    if (name === 'cpf') return maskCPF(value);
    if (name === 'telefone') return maskPhone(value);
    return value;
}

export function validateRegistrationField(fieldName, value) {
    if (!value) return '';
    if (fieldName === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
    if (fieldName === 'cpf' && value.length < 14) return 'CPF incompleto';
    if (fieldName === 'nome' && value.trim().split(/\s+/).length < 2) return 'Digite seu nome completo';
    return '';
}

export function validateRegistration(data) {
    return Object.fromEntries(Object.entries(data)
        .map(([key, value]) => [key, validateRegistrationField(key, value)])
        .filter(([, message]) => message));
}
