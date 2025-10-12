module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/setupEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
};
