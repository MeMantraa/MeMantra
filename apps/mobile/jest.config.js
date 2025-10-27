module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^expo/src/winter/ImportMetaRegistry$': '<rootDir>/test/mocks/expoImportMetaRegistry.ts',
    '^expo/src/winter$': '<rootDir>/test/mocks/expoWinter.ts',
  },
};
