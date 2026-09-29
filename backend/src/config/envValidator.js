/**
 * Startup validation for security-sensitive environment variables.
 * Secret values are never included in validation messages.
 */

const MIN_JWT_SECRET_LENGTH = 32;
const MIN_JWT_SECRET_ENTROPY_BITS = 128;
const MIN_UNIQUE_CHARACTERS = 10;

const PLACEHOLDER_MARKERS = [
    'changeme',
    'replacewith',
    'yoursecret',
    'yoursafesecret',
    'yoursupersafesecret',
    'placeholder',
    'example',
    'default',
    'testsecret',
    'jwtsecret',
    'secretkey',
    'secrethere',
];

function estimateEntropyBits(value) {
    const frequencies = new Map();

    for (const character of value) {
        frequencies.set(character, (frequencies.get(character) || 0) + 1);
    }

    let entropyPerCharacter = 0;
    for (const count of frequencies.values()) {
        const probability = count / value.length;
        entropyPerCharacter -= probability * Math.log2(probability);
    }

    return entropyPerCharacter * value.length;
}

function getSecretWeakness(value) {
    if (typeof value !== 'string' || value.trim() === '') {
        return 'ausente';
    }

    const normalized = value.trim();

    if (normalized.length < MIN_JWT_SECRET_LENGTH) {
        return `menor que ${MIN_JWT_SECRET_LENGTH} caracteres`;
    }

    const canonical = normalized.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (PLACEHOLDER_MARKERS.some((marker) => canonical.includes(marker))) {
        return 'valor padrão ou placeholder';
    }

    if (new Set(normalized).size < MIN_UNIQUE_CHARACTERS) {
        return 'baixa diversidade de caracteres';
    }

    if (estimateEntropyBits(normalized) < MIN_JWT_SECRET_ENTROPY_BITS) {
        return `entropia estimada inferior a ${MIN_JWT_SECRET_ENTROPY_BITS} bits`;
    }

    return null;
}

class EnvironmentValidationError extends Error {
    constructor(errors) {
        super(`Configuração de ambiente inválida:\n${errors.map((error) => `- ${error}`).join('\n')}`);
        this.name = 'EnvironmentValidationError';
        this.code = 'INVALID_ENVIRONMENT_CONFIGURATION';
        this.errors = errors;
    }
}

class EnvironmentValidator {
    constructor(environment = process.env) {
        this.environment = environment;
        this.errors = [];
        this.warnings = [];
    }

    validateRequiredSecret(name) {
        const weakness = getSecretWeakness(this.environment[name]);
        if (weakness) {
            this.errors.push(`${name} rejeitado: ${weakness}.`);
        }
    }

    validateOptionalSecret(name) {
        if (!this.environment[name]) return;

        const weakness = getSecretWeakness(this.environment[name]);
        if (weakness) {
            this.errors.push(`${name} rejeitado: ${weakness}.`);
        }
    }

    validateRuntimeConfiguration() {
        const { NODE_ENV, PORT } = this.environment;

        if (NODE_ENV && !['development', 'test', 'production'].includes(NODE_ENV)) {
            this.errors.push('NODE_ENV deve ser development, test ou production.');
        }

        if (PORT && (!/^\d+$/.test(PORT) || Number(PORT) < 1 || Number(PORT) > 65535)) {
            this.errors.push('PORT deve ser um número entre 1 e 65535.');
        }

        if (this.environment.LEGACY_BEARER_TOKEN_RESPONSE &&
            !['true', 'false'].includes(this.environment.LEGACY_BEARER_TOKEN_RESPONSE)) {
            this.errors.push('LEGACY_BEARER_TOKEN_RESPONSE deve ser true ou false.');
        }

        const databaseUrl = NODE_ENV === 'test'
            ? (this.environment.DATABASE_URL_TEST || this.environment.DATABASE_URL)
            : this.environment.DATABASE_URL;
        const databaseName = NODE_ENV === 'test'
            ? (this.environment.DB_NAME_TEST || this.environment.DB_NAME)
            : this.environment.DB_NAME;

        if (!databaseUrl) {
            for (const [name, value] of [
                ['DB_HOST', this.environment.DB_HOST],
                [NODE_ENV === 'test' ? 'DB_NAME_TEST ou DB_NAME' : 'DB_NAME', databaseName],
                ['DB_USER', this.environment.DB_USER],
                ['DB_PASSWORD', this.environment.DB_PASSWORD]
            ]) {
                if (!value) this.errors.push(`${name} deve ser definido para PostgreSQL.`);
            }
        }

        if (NODE_ENV === 'production') {
            for (const name of ['SUPABASE_URL', 'SUPABASE_KEY', 'OBJECT_STORAGE_BUCKET',
                'OUTBOX_ENCRYPTION_KEY', 'FRONTEND_PUBLIC_URL', 'SMTP_HOST', 'SMTP_FROM']) {
                if (!this.environment[name]) this.errors.push(`${name} deve ser definido em produção.`);
            }
        }
    }

    validate() {
        this.errors = [];
        this.warnings = [];

        this.validateRequiredSecret('JWT_SECRET');
        this.validateOptionalSecret('ENCRYPTION_KEY');
        this.validateOptionalSecret('OUTBOX_ENCRYPTION_KEY');
        this.validateRuntimeConfiguration();

        if (this.errors.length > 0) {
            throw new EnvironmentValidationError(this.errors);
        }

        return {
            valid: true,
            warnings: [...this.warnings],
        };
    }
}

function validateEnvironment(environment = process.env) {
    const result = new EnvironmentValidator(environment).validate();

    for (const warning of result.warnings) {
        console.warn(`[CONFIGURATION WARNING] ${warning}`);
    }

    console.log('Configuração de ambiente validada com sucesso.');
    return result;
}

module.exports = {
    EnvironmentValidationError,
    EnvironmentValidator,
    estimateEntropyBits,
    getSecretWeakness,
    validateEnvironment,
};
