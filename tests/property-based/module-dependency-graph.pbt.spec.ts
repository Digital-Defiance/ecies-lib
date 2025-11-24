/**
 * Property-Based Test: Module Dependency Graph
 *
 * Feature: fix-business-logic-circular-dependencies, Property 6: Module dependency graph is acyclic
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 *
 * This test verifies that the module dependency graph contains no circular dependencies.
 */

import madge from 'madge';
import * as path from 'path';

describe('Property-Based Test: Module Dependency Graph', () => {
  /**
   * Property 6: Module dependency graph is acyclic
   *
   * For any two modules A and B, if A imports from B, then B should not import
   * from A directly or indirectly.
   */
  it('should have no circular dependencies in the module graph', async () => {
    const srcPath = path.join(__dirname, '../../src/index.ts');
    const tsconfigPath = path.join(__dirname, '../../tsconfig.json');

    // Analyze the dependency graph (this is the slow part)
    const result = await madge(srcPath, {
      fileExtensions: ['ts'],
      tsConfig: tsconfigPath,
    });

    // Get circular dependencies
    const allCircular = result.circular();

    // Filter to only include circular dependencies within ecies-lib package
    // Exclude external dependencies like i18n-lib
    const circular = allCircular.filter((cycle: string[]) =>
      cycle.every((file) => !file.includes('digitaldefiance-i18n-lib')),
    );

    // Log any circular dependencies found for debugging
    if (circular.length > 0) {
      console.error('Circular dependencies found in ecies-lib:');
      circular.forEach((cycle, index) => {
        console.error(`  Cycle ${index + 1}: ${cycle.join(' -> ')}`);
      });
    }

    // Assert no circular dependencies exist within ecies-lib
    expect(circular).toHaveLength(0);
  }, 120000); // 2 minute timeout - madge can be slow on large codebases
});
