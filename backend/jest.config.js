module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['./tests/setup.js'],
    verbose: true,
    maxWorkers: 1,
    clearMocks: true,
    resetModules: true,
    restoreMocks: true,
};
