module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/test/**/*.test.ts', '**/*.test.ts'],
  setupFiles: ['<rootDir>/setupEnv.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/test/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  // No setupFilesAfterEnv needed - backend doesn't use React Testing Library
};
