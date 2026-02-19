/**
 * Jest Configuration
 * Configuration for running unit and integration tests
 */
module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Test directory
    testMatch: ['**/tests/**/*.test.js'],

    // Coverage configuration
    collectCoverageFrom: [
        'managers/**/*.js',
        '!managers/**/node_modules/**',
        '!managers/**/*.test.js'
    ],

    // Coverage thresholds (optional)
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50
        }
    },

    // Module directories
    moduleDirectories: ['node_modules', '.'],

    // Test timeout
    testTimeout: 10000,

    // Verbose output
    verbose: true,

    // Clear mocks between tests
    clearMocks: true,

    // Mock all external modules
    automock: false,

    // Show coverage after tests
    collectCoverage: false,

    // Coverage directory
    coverageDirectory: 'coverage',

    // Ignore patterns
    testPathIgnorePatterns: [
        'node_modules',
        'build'
    ],

    // Transform files
    transformIgnorePatterns: [
        'node_modules/(?!(nanoid)/)'
    ]
};
