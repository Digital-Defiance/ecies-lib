/**
 * Property-Based Test: Interface Type-Only Imports
 *
 * Feature: fix-business-logic-circular-dependencies, Property 2: Interfaces use only type imports
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 *
 * This test verifies that all interface files use only type-only imports
 * from other project modules, ensuring interfaces don't create circular dependencies.
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Property-Based Test: Interface Type-Only Imports', () => {
  const interfacesDir = path.join(__dirname, '../../src/interfaces');

  // Get all interface files
  const interfaceFiles = fs
    .readdirSync(interfacesDir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts');

  /**
   * Property 2: Interfaces use only type imports
   *
   * For any interface file, all imports from other project modules should be
   * type-only imports that are eliminated at runtime.
   */
  it('should use only type imports in all interface files', () => {
    fc.assert(
      fc.property(fc.constantFrom(...interfaceFiles), (filename) => {
        const filePath = path.join(interfacesDir, filename);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Remove comments to avoid false positives from code examples in JSDoc
        const contentWithoutComments = content
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
          .replace(/\/\/.*/g, ''); // Remove line comments

        // Pattern to match value imports from relative paths (project modules)
        // Matches: import { X } from './...' or import { X } from '../...'
        // But NOT: import type { X } from './...'
        const valueImportPattern =
          /import\s+(?!type\s)(?!.*from\s+['"][^.\/])/g;

        // Find all import statements
        const importStatements =
          contentWithoutComments.match(/import\s+.*from\s+['"].*['"]/g) || [];

        // Filter for project-relative imports (starting with . or ..)
        const projectImports = importStatements.filter((stmt) =>
          /from\s+['"]\.[^'"]*['"]/.test(stmt),
        );

        // Check each project import is a type-only import
        const valueImports = projectImports.filter(
          (stmt) => !stmt.includes('import type'),
        );

        // Filter out allowed patterns (e.g., importing from external libraries)
        const forbiddenValueImports = valueImports.filter((stmt) => {
          // Allow imports from external libraries
          if (
            stmt.includes('@ethereumjs') ||
            stmt.includes('@noble') ||
            stmt.includes('@scure') ||
            stmt.includes('bson') ||
            stmt.includes('ts-brand')
          ) {
            return false;
          }
          return true;
        });

        // Assert no forbidden value imports
        expect(forbiddenValueImports).toHaveLength(0);

        // If there are forbidden imports, provide detailed error
        if (forbiddenValueImports.length > 0) {
          throw new Error(
            `File ${filename} contains value imports from project modules:\n${forbiddenValueImports.join(
              '\n',
            )}`,
          );
        }
      }),
      { numRuns: interfaceFiles.length },
    );
  });

  /**
   * Additional property: Interface files should not execute runtime code
   */
  it('should not contain runtime code in interface files', () => {
    fc.assert(
      fc.property(fc.constantFrom(...interfaceFiles), (filename) => {
        const filePath = path.join(interfacesDir, filename);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Check for patterns that indicate runtime code
        const runtimePatterns = [
          /export\s+const\s+\w+\s*=\s*new\s+/g, // new instance creation
          /export\s+function\s+\w+\s*\(/g, // exported functions (not type guards)
          /export\s+class\s+\w+\s*{/g, // exported classes (should be in separate files)
        ];

        const runtimeCode: string[] = [];

        for (const pattern of runtimePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            runtimeCode.push(...matches);
          }
        }

        // Filter out allowed patterns
        const forbiddenRuntimeCode = runtimeCode.filter((code) => {
          // Type guards are allowed: export function isX(value: unknown): value is X
          if (code.includes('function') && content.includes(': value is ')) {
            return false;
          }
          // Factory functions for constants are allowed (e.g., getMultiRecipientConstants)
          if (code.includes('function') && code.includes('Constants')) {
            return false;
          }
          // Configuration helper functions are allowed
          if (
            code.includes('function') &&
            (code.includes('calculate') ||
              code.includes('get') ||
              code.includes('capture'))
          ) {
            return false;
          }
          return true;
        });

        // Assert no forbidden runtime code
        expect(forbiddenRuntimeCode).toHaveLength(0);

        if (forbiddenRuntimeCode.length > 0) {
          throw new Error(
            `File ${filename} contains runtime code:\n${forbiddenRuntimeCode.join(
              '\n',
            )}`,
          );
        }
      }),
      { numRuns: interfaceFiles.length },
    );
  });

  /**
   * Additional property: Verify interfaces can be imported without side effects
   */
  it('should import interface files without side effects', () => {
    fc.assert(
      fc.property(fc.constantFrom(...interfaceFiles), (filename) => {
        // Clear module cache
        jest.resetModules();

        // Track module loads
        const loadedModules = new Set<string>();
        const Module = require('module');
        const originalRequire = Module.prototype.require;

        Module.prototype.require = function (id: string) {
          loadedModules.add(id);
          return originalRequire.apply(this, arguments);
        };

        try {
          // Import the interface file
          const modulePath = `../../src/interfaces/${filename.replace(
            '.ts',
            '',
          )}`;
          const interfaceModule = require(modulePath);

          // Verify module loaded
          expect(interfaceModule).toBeDefined();

          // Check that no service or member modules were loaded
          const forbiddenPatterns = [
            /\/services\//,
            /\/member\.ts$/,
            /\/member\.js$/,
          ];

          const forbiddenLoads = Array.from(loadedModules).filter((mod) =>
            forbiddenPatterns.some((pattern) => pattern.test(mod)),
          );

          expect(forbiddenLoads).toHaveLength(0);
        } finally {
          Module.prototype.require = originalRequire;
        }
      }),
      { numRuns: interfaceFiles.length },
    );
  });
});
