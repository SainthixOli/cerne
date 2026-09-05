const crypto = require('crypto');
const {
    EnvironmentValidationError,
    EnvironmentValidator,
} = require('../src/config/envValidator');

function validEnvironment(overrides = {}) {
    return {
        NODE_ENV: 'test',
        JWT_SECRET: crypto.randomBytes(32).toString('hex'),
        ...overrides,
    };
}

describe('EnvironmentValidator', () => {
    it('accepts a cryptographically strong JWT secret', () => {
        expect(new EnvironmentValidator(validEnvironment()).validate()).toEqual({
            valid: true,
            warnings: [],
        });
    });

    it('rejects a missing JWT secret without exposing a value', () => {
        const environment = validEnvironment();
        delete environment.JWT_SECRET;

        expect(() => new EnvironmentValidator(environment).validate()).toThrow(EnvironmentValidationError);
        expect(() => new EnvironmentValidator(environment).validate()).toThrow(/JWT_SECRET/);
    });

    it('rejects an obvious placeholder even when it is long enough', () => {
        expect(() => new EnvironmentValidator(validEnvironment({
            JWT_SECRET: 'replace-with-a-unique-cryptographically-random-value',
        })).validate()).toThrow(/placeholder/);
    });

    it('rejects a long secret with insufficient diversity', () => {
        expect(() => new EnvironmentValidator(validEnvironment({
            JWT_SECRET: 'a'.repeat(64),
        })).validate()).toThrow(/diversidade/);
    });

    it('rejects a weak optional encryption key when one is configured', () => {
        expect(() => new EnvironmentValidator(validEnvironment({
            ENCRYPTION_KEY: 'replace-with-an-independent-random-encryption-key',
        })).validate()).toThrow(/ENCRYPTION_KEY/);
    });
});
