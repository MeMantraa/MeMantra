module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^expo/src/winter/ImportMetaRegistry$': '<rootDir>/test/mocks/expoImportMetaRegistry.ts',
    '^expo/src/winter$': '<rootDir>/test/mocks/expoWinter.ts',
  },
  collectCoverageFrom: [
    '<rootDir>/**/*.{ts,tsx}',
    '!<rootDir>/**/__mocks__/**',
    '!<rootDir>/**/test/**',
    '!<rootDir>/**/coverage/**',
    '!<rootDir>/**/dist/**',
    '!<rootDir>/**/node_modules/**',
    '!<rootDir>/**/*.d.ts',
    '!<rootDir>/**/metro.config.js',
    '!<rootDir>/**/jest.config.js',
    '!<rootDir>/**/jest.setup.js',
    '!<rootDir>/**/tailwind.config.js',
    '!<rootDir>/**/babel.config.js',
    '!<rootDir>/**/sentry/**',
  ],
};
