const securityPlugin = require('eslint-plugin-security');

module.exports = [
    {
        files: ["**/*.js"],
        plugins: {
            security: securityPlugin
        },
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: "commonjs"
        },
        rules: {
            ...securityPlugin.configs.recommended.rules,
            "security/detect-object-injection": "off"
        }
    }
];
