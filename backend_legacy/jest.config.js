module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['./tests/setup.js'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetModules: true,
    restoreMocks: true,
};
