module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@hx/contracts$': '<rootDir>/../../packages/contracts/src',
    '^@hx/settlement$': '<rootDir>/../settlement/src',
    '^@hx/persistence$': '<rootDir>/../../packages/persistence/src',
    '^@hx/config$': '<rootDir>/../../packages/config/src'
  },
  testMatch: ['**/src/smoke-test.ts']
};
