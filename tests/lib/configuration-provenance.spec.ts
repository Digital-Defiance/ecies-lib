import { ConstantsRegistry, Constants, createRuntimeConfiguration } from '../../src/constants';
import { calculateConfigChecksum } from '../../src/interfaces/configuration-provenance';
import { ObjectIdProvider, GuidV4Provider } from '../../src/lib/id-providers';

describe('Configuration Provenance Tracking', () => {
  afterEach(() => {
    ConstantsRegistry.clear();
  });

  describe('Default Configuration Provenance', () => {
    it('should have provenance for default configuration', () => {
      const provenance = ConstantsRegistry.getProvenance(ConstantsRegistry.DEFAULT_KEY);

      expect(provenance).toBeDefined();
      expect(provenance?.source).toBe('default');
      expect(provenance?.baseConfigKey).toBe('none');
      expect(provenance?.description).toContain('default');
    });

    it('should have valid checksum', () => {
      const provenance = ConstantsRegistry.getProvenance(ConstantsRegistry.DEFAULT_KEY);
      const actualChecksum = calculateConfigChecksum(Constants);

      expect(provenance?.checksum).toBe(actualChecksum);
    });
  });

  describe('Runtime Configuration Provenance', () => {
    it('should track provenance for registered configuration', () => {
      const before = new Date();
      
      ConstantsRegistry.register('test-config', {
        idProvider: new GuidV4Provider(),
      }, {
        description: 'Test configuration for GUID provider',
      });

      const after = new Date();
      const provenance = ConstantsRegistry.getProvenance('test-config');

      expect(provenance).toBeDefined();
      expect(provenance?.source).toBe('runtime');
      expect(provenance?.baseConfigKey).toBe('Symbol(digitaldefiance.ecies.constants.default)');
      expect(provenance?.description).toBe('Test configuration for GUID provider');
      expect(provenance?.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(provenance?.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should track overrides', () => {
      const overrides = {
        idProvider: new GuidV4Provider(),
      };

      ConstantsRegistry.register('test-config', overrides);
      const provenance = ConstantsRegistry.getProvenance('test-config');

      expect(provenance?.overrides).toEqual(overrides);
    });

    it('should calculate checksum', () => {
      ConstantsRegistry.register('test-config', {
        idProvider: new ObjectIdProvider(),
      });

      const config = ConstantsRegistry.get('test-config');
      const provenance = ConstantsRegistry.getProvenance('test-config');
      const actualChecksum = calculateConfigChecksum(config);

      expect(provenance?.checksum).toBe(actualChecksum);
      expect(provenance?.checksum).toHaveLength(64); // SHA-256 hex
    });

    it('should capture creation stack', () => {
      ConstantsRegistry.register('test-config', {
        idProvider: new ObjectIdProvider(),
      });

      const provenance = ConstantsRegistry.getProvenance('test-config');

      expect(provenance?.creationStack).toBeTruthy();
      expect(provenance?.creationStack).toContain('at');
    });
  });

  describe('Custom Base Configuration', () => {
    it('should track custom base config key', () => {
      // Register a base config
      ConstantsRegistry.register('base-config', {
        idProvider: new GuidV4Provider(),
      });

      // Register derived config
      ConstantsRegistry.register('derived-config', {}, {
        baseKey: 'base-config',
        description: 'Derived from base-config',
      });

      const provenance = ConstantsRegistry.getProvenance('derived-config');

      expect(provenance?.baseConfigKey).toBe('base-config');
      expect(provenance?.description).toBe('Derived from base-config');
    });
  });

  describe('Full Configuration Provenance', () => {
    it('should track full configuration as custom', () => {
      const fullConfig = createRuntimeConfiguration();

      ConstantsRegistry.register('full-config', fullConfig);
      const provenance = ConstantsRegistry.getProvenance('full-config');

      expect(provenance?.source).toBe('custom');
      expect(provenance?.overrides).toEqual({});
    });
  });

  describe('Listing Configurations with Provenance', () => {
    it('should list all configurations with provenance', () => {
      ConstantsRegistry.register('config1', { idProvider: new ObjectIdProvider() });
      ConstantsRegistry.register('config2', { idProvider: new GuidV4Provider() });

      const list = ConstantsRegistry.listWithProvenance();

      expect(list.length).toBeGreaterThanOrEqual(3); // default + config1 + config2
      
      const config1Entry = list.find(e => e.key === 'config1');
      expect(config1Entry).toBeDefined();
      expect(config1Entry?.provenance).toBeDefined();
      expect(config1Entry?.provenance?.source).toBe('runtime');
    });
  });

  describe('Provenance After Unregister', () => {
    it('should remove provenance when configuration is unregistered', () => {
      ConstantsRegistry.register('temp-config', { idProvider: new ObjectIdProvider() });
      expect(ConstantsRegistry.getProvenance('temp-config')).toBeDefined();

      ConstantsRegistry.unregister('temp-config');
      expect(ConstantsRegistry.getProvenance('temp-config')).toBeUndefined();
    });
  });

  describe('Provenance After Clear', () => {
    it('should preserve default provenance after clear', () => {
      ConstantsRegistry.register('temp1', { idProvider: new ObjectIdProvider() });
      ConstantsRegistry.register('temp2', { idProvider: new GuidV4Provider() });

      ConstantsRegistry.clear();

      expect(ConstantsRegistry.getProvenance(ConstantsRegistry.DEFAULT_KEY)).toBeDefined();
      expect(ConstantsRegistry.getProvenance('temp1')).toBeUndefined();
      expect(ConstantsRegistry.getProvenance('temp2')).toBeUndefined();
    });
  });

  describe('Checksum Stability', () => {
    it('should produce same checksum for identical configurations', () => {
      const config1 = createRuntimeConfiguration({ idProvider: new ObjectIdProvider() });
      const config2 = createRuntimeConfiguration({ idProvider: new ObjectIdProvider() });

      const checksum1 = calculateConfigChecksum(config1);
      const checksum2 = calculateConfigChecksum(config2);

      expect(checksum1).toBe(checksum2);
    });

    it('should produce different checksums for different configurations', () => {
      const config1 = createRuntimeConfiguration({ idProvider: new ObjectIdProvider() });
      const config2 = createRuntimeConfiguration({ idProvider: new GuidV4Provider() });

      const checksum1 = calculateConfigChecksum(config1);
      const checksum2 = calculateConfigChecksum(config2);

      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('Debugging Use Cases', () => {
    it('should help trace configuration lineage', () => {
      // Simulate a production issue where we need to know configuration history
      ConstantsRegistry.register('prod-config', {
        idProvider: new ObjectIdProvider(),
      }, {
        description: 'Production configuration deployed 2025-11-20',
      });

      const provenance = ConstantsRegistry.getProvenance('prod-config');

      // Can answer: When was this config created?
      expect(provenance?.timestamp).toBeInstanceOf(Date);

      // Can answer: What was changed from default?
      expect(provenance?.overrides).toHaveProperty('idProvider');

      // Can answer: What's the exact configuration hash?
      expect(provenance?.checksum).toHaveLength(64);

      // Can answer: Where was this config created?
      expect(provenance?.creationStack).toContain('at');
    });

    it('should verify configuration integrity', () => {
      ConstantsRegistry.register('secure-config', {
        idProvider: new ObjectIdProvider(),
      });

      const config = ConstantsRegistry.get('secure-config');
      const provenance = ConstantsRegistry.getProvenance('secure-config');

      // Verify config hasn't been tampered with
      const currentChecksum = calculateConfigChecksum(config);
      expect(currentChecksum).toBe(provenance?.checksum);
    });
  });
});
