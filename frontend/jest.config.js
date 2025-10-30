/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', {
      useESM: true
    }]
  },
  testEnvironment: 'node',
  transformIgnorePatterns: [
    'node_modules/(?!(ipfs-http-client|@ipld|multiformats|uint8arrays)/)'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.[jt]s$': '$1'
  }
};