/**
 * Tests to verify SecureBuffer and SecureString are independent of Constants module
 * Validates Requirements 3.1, 3.2, 3.3
 */

describe('Secure Storage Independence from Constants', () => {
  it('should import SecureBuffer without loading Constants module', () => {
    // Clear module cache
    jest.resetModules();

    // Track which modules get loaded
    const loadedModules = new Set<string>();
    const Module = require('module');
    const originalRequire = Module.prototype.require;

    Module.prototype.require = function (id: string, ...args: unknown[]) {
      loadedModules.add(id);
      return originalRequire.apply(this, [id, ...args]);
    };

    // Import SecureBuffer
    const { SecureBuffer } = require('../src/secure-buffer');

    // Restore original require
    Module.prototype.require = originalRequire;

    // Verify Constants module was not loaded
    const constantsLoaded = Array.from(loadedModules).some(
      (mod) => mod.includes('constants') && !mod.includes('ecies-consts'),
    );

    expect(constantsLoaded).toBe(false);

    // Verify we can still create a SecureBuffer
    const {
      ObjectIdProvider,
    } = require('../src/lib/id-providers/objectid-provider');
    const provider = new ObjectIdProvider();
    const buffer = new SecureBuffer(new Uint8Array([1, 2, 3]), provider);

    expect(buffer).toBeDefined();
    expect(buffer.length).toBe(3);

    buffer.dispose();
  });

  it('should import SecureString without loading Constants module', () => {
    // Clear module cache
    jest.resetModules();

    // Track which modules get loaded
    const loadedModules = new Set<string>();
    const Module = require('module');
    const originalRequire = Module.prototype.require;

    Module.prototype.require = function (id: string, ...args: unknown[]) {
      loadedModules.add(id);
      return originalRequire.apply(this, [id, ...args]);
    };

    // Import SecureString
    const { SecureString } = require('../src/secure-string');

    // Restore original require
    Module.prototype.require = originalRequire;

    // Verify Constants module was not loaded
    const constantsLoaded = Array.from(loadedModules).some(
      (mod) => mod.includes('constants') && !mod.includes('ecies-consts'),
    );

    expect(constantsLoaded).toBe(false);

    // Verify we can still create a SecureString
    const {
      ObjectIdProvider,
    } = require('../src/lib/id-providers/objectid-provider');
    const provider = new ObjectIdProvider();
    const secureStr = new SecureString('test', provider);

    expect(secureStr).toBeDefined();
    expect(secureStr.value).toBe('test');

    secureStr.dispose();
  });

  it('should create SecureBuffer with default provider without Constants', () => {
    // Clear module cache
    jest.resetModules();

    const { SecureBuffer } = require('../src/secure-buffer');
    const {
      ObjectIdProvider,
    } = require('../src/lib/id-providers/objectid-provider');

    const provider = new ObjectIdProvider();
    const buffer = new SecureBuffer(new Uint8Array([1, 2, 3]), provider);

    expect(buffer).toBeDefined();
    expect(buffer.length).toBe(3);
    expect(buffer.id).toBeDefined();

    buffer.dispose();
  });

  it('should create SecureString with default provider without Constants', () => {
    // Clear module cache
    jest.resetModules();

    const { SecureString } = require('../src/secure-string');
    const {
      ObjectIdProvider,
    } = require('../src/lib/id-providers/objectid-provider');

    const provider = new ObjectIdProvider();
    const secureStr = new SecureString('test', provider);

    expect(secureStr).toBeDefined();
    expect(secureStr.value).toBe('test');
    expect(secureStr.id).toBeDefined();

    secureStr.dispose();
  });
});
