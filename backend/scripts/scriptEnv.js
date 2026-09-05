const PLACEHOLDER_PATTERN = /(change[-_ ]?me|replace[-_ ]?with|placeholder|example|default)/i;

function assertScriptSecret(value, name, minLength = 12) {
    if (value.length < minLength) {
        throw new Error(`${name} must contain at least ${minLength} characters`);
    }

    if (PLACEHOLDER_PATTERN.test(value) || new Set(value).size < 8) {
        throw new Error(`${name} must not use a weak, placeholder or default value`);
    }

    return value;
}

function requireScriptEnv(name, options = {}) {
    const { minLength = 1, secret = false } = options;
    const value = process.env[name];

    if (!value || value.trim().length < minLength) {
        throw new Error(`${name} is required and must contain at least ${minLength} characters`);
    }

    if (secret) {
        assertScriptSecret(value, name, minLength);
    }

    return value;
}

module.exports = { assertScriptSecret, requireScriptEnv };
