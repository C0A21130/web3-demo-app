/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(helia|@helia|multiformats|uint8arrays|@libp2p|libp2p)/)'
  ],
  testEnvironment: 'node',
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
};