/**
 * Password Policy Validator
 * Enforça requisitos de força de senha seguindo NIST guidelines
 */

class PasswordPolicy {
    /**
     * Requisitos mínimos para uma senha forte:
     * - Mínimo 12 caracteres
     * - Pelo menos 1 maiúscula
     * - Pelo menos 1 minúscula
     * - Pelo menos 1 número (0-9)
     * - Pelo menos 1 símbolo especial
     */
    static MIN_LENGTH = 12;
    static REQUIRED_UPPERCASE = /[A-Z]/;
    static REQUIRED_LOWERCASE = /[a-z]/;
    static REQUIRED_NUMBER = /[0-9]/;
    static REQUIRED_SYMBOL = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;

    /**
     * Valida se senha atende a todos os requisitos
     */
    static validate(password) {
        if (!password || typeof password !== 'string') {
            return {
                valid: false,
                errors: ['Senha é obrigatória']
            };
        }

        const errors = [];

        // Check length
        if (password.length < this.MIN_LENGTH) {
            errors.push(`Senha deve ter no mínimo ${this.MIN_LENGTH} caracteres (atual: ${password.length})`);
        }

        // Check uppercase
        if (!this.REQUIRED_UPPERCASE.test(password)) {
            errors.push('Senha deve conter pelo menos 1 letra MAIÚSCULA');
        }

        // Check lowercase
        if (!this.REQUIRED_LOWERCASE.test(password)) {
            errors.push('Senha deve conter pelo menos 1 letra minúscula');
        }

        // Check number
        if (!this.REQUIRED_NUMBER.test(password)) {
            errors.push('Senha deve conter pelo menos 1 número (0-9)');
        }

        // Check symbol
        if (!this.REQUIRED_SYMBOL.test(password)) {
            errors.push('Senha deve conter pelo menos 1 símbolo especial (!@#$%^&*, etc)');
        }

        return {
            valid: errors.length === 0,
            errors,
            strength: this.calculateStrength(password)
        };
    }

    /**
     * Calcula força da senha em escala 0-100
     */
    static calculateStrength(password) {
        if (!password) return 0;

        let score = 0;

        // Base: tamanho
        if (password.length >= this.MIN_LENGTH) score += 20;
        if (password.length >= 16) score += 10;
        if (password.length >= 20) score += 10;

        // Complexidade
        if (this.REQUIRED_UPPERCASE.test(password)) score += 15;
        if (this.REQUIRED_LOWERCASE.test(password)) score += 15;
        if (this.REQUIRED_NUMBER.test(password)) score += 15;
        if (this.REQUIRED_SYMBOL.test(password)) score += 15;

        // Padrões fracos reduzem score
        if (/(.)\1{2,}/.test(password)) score -= 10; // Caracteres repetidos
        if (/^[a-z]+$|^[A-Z]+$|^[0-9]+$/.test(password)) score -= 20; // Apenas um tipo
        if (/password|admin|user|test|123/i.test(password)) score -= 20; // Palavras comuns

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Retorna rótulo de força da senha
     */
    static getStrengthLabel(password) {
        const strength = this.calculateStrength(password);

        if (strength < 30) return 'Fraca';
        if (strength < 60) return 'Média';
        if (strength < 80) return 'Forte';
        return 'Muito Forte';
    }

    /**
     * Verifica se duas senhas são iguais (para confirmar)
     */
    static validateConfirmation(password, confirmation) {
        if (password !== confirmation) {
            return {
                valid: false,
                error: 'As senhas não correspondem'
            };
        }

        return {
            valid: true
        };
    }
}

module.exports = PasswordPolicy;
