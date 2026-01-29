const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../tsconfig.base.json');

// Suppress TypeScript ESLint deprecation warnings
const originalWarn = process.emitWarning;
process.emitWarning = function(warning, type, code) {
  if (
    typeof warning === 'string' &&
    warning.includes('The \'argument\' property is deprecated on TSImportType nodes')
  ) {
    return;
  }
  originalWarn.call(process, warning, type, code);
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/test-setup.ts'],
  detectOpenHandles: true,
  maxWorkers: 1, // Use single worker for memory-intensive tests
  workerIdleMemoryLimit: '1GB',
  transform: {
    '^.+\\.(ts|tsx)$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          target: 'es2020',
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
    '^.+\\.(js|jsx)$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'ecmascript',
          },
          target: 'es2020',
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@faker-js|@noble|@scure|@ethereumjs|uuid))',
  ],
  moduleNameMapper: {
    '^@noble/hashes/(.*)\\.js$':
      '<rootDir>/../../node_modules/@noble/hashes/$1.js',
    '^@noble/curves/(.*)\\.js$':
      '<rootDir>/../../node_modules/@noble/curves/$1.js',
    ...pathsToModuleNameMapper(compilerOptions.paths, {
      prefix: '<rootDir>/../../',
    }),
  },
};
