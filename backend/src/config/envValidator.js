/**
 * Validação de variáveis de ambiente críticas
 * Executa no startup para garantir configuração segura
 */

const path = require('path');
const fs = require('fs');

class EnvironmentValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Valida se uma variável de ambiente obrigatória está definida
     */
    requireEnv(varName, minLength = 1) {
        const value = process.env[varName];

        if (!value) {
            this.errors.push(`[CRITICAL] ${varName} não definida. Esta variável é obrigatória.`);
            return false;
        }

        if (value.length < minLength) {
            this.errors.push(
                `[CRITICAL] ${varName} muito curta. Mínimo ${minLength} caracteres, ` +
                `atual: ${value.length} caracteres.`
            );
            return false;
        }

        return true;
    }

    /**
     * Validação completa de environment
     */
    validate() {
        // Variáveis críticas
        this.requireEnv('PORT', 1);
        this.requireEnv('NODE_ENV', 1);
        this.requireEnv('JWT_SECRET', 32);  // Mínimo 32 chars para segurança

        // Avisos
        if (process.env.NODE_ENV === 'development') {
            if (process.env.JWT_SECRET.includes('your_super_safe') || 
                process.env.JWT_SECRET.includes('placeholder')) {
                this.warnings.push(
                    '[WARNING] JWT_SECRET ainda está com valor placeholder. ' +
                    'Use valor real gerado com crypto.randomBytes(32).toString("hex")'
                );
            }
        }

        if (process.env.NODE_ENV === 'production') {
            // Validações mais rigorosas para produção
            if (!process.env.DB_HOST) {
                this.errors.push('[CRITICAL] DB_HOST não definida em produção');
            }
            if (!process.env.SMTP_HOST) {
                this.warnings.push('[WARNING] SMTP não configurado - emails não serão enviados');
            }
        }

        // Exibir erros e warnings
        if (this.warnings.length > 0) {
            console.warn('\n⚠️  AVISOS DE CONFIGURAÇÃO:');
            this.warnings.forEach(w => console.warn(`  ${w}`));
        }

        if (this.errors.length > 0) {
            console.error('\n❌ ERROS CRÍTICOS DE CONFIGURAÇÃO:');
            this.errors.forEach(e => console.error(`  ${e}`));
            console.error('\nAplicação não pode iniciar. Corrija as variáveis de ambiente.\n');
            process.exit(1);
        }

        console.log('✅ Configuração de ambiente validada com sucesso.\n');
        return true;
    }
}

// Executar validação
const validator = new EnvironmentValidator();
validator.validate();

module.exports = validator;
