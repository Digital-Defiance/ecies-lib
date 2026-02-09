/**
 * Tests for GuardianRegistry
 *
 * Validates Guardian registration, status management, backup designation,
 * and event emission.
 */
import { describe, it, expect, jest } from '@jest/globals';
import { GuardianStatus } from './enumerations/guardian-status';
import {
  GuardianRegistry,
  GuardianAlreadyRegisteredError,
  GuardianNotFoundError,
  InvalidShareIndexError,
  RegistryFullError,
} from './guardian-registry';
import type { Guardian } from './interfaces/guardian';
import type { GuardianStatusChangeEvent } from './interfaces/guardian-status-change-event';

function makeGuardian(
  index: number,
  overrides?: Partial<Guardian<string>>,
): Guardian<string> {
  return {
    id: `guardian-${index}`,
    name: `Guardian ${index}`,
    shareIndex: index,
    verificationKey: new Uint8Array([index]),
    status: GuardianStatus.Registered,
    ...overrides,
  };
}

describe('GuardianRegistry', () => {
  describe('constructor', () => {
    it('should create a registry with valid totalShares', () => {
      const registry = new GuardianRegistry<string>(3);
      expect(registry.totalShares).toBe(3);
      expect(registry.count).toBe(0);
    });

    it('should reject totalShares < 2', () => {
      expect(() => new GuardianRegistry<string>(1)).toThrow();
    });

    it('should reject non-integer totalShares', () => {
      expect(() => new GuardianRegistry<string>(2.5)).toThrow();
    });
  });

  describe('register', () => {
    it('should register a Guardian successfully', () => {
      const registry = new GuardianRegistry<string>(3);
      const guardian = makeGuardian(1);
      registry.register(guardian);
      expect(registry.count).toBe(1);
      expect(registry.getGuardian('guardian-1')).toBeDefined();
    });

    it('should reject duplicate Guardian IDs', () => {
      const registry = new GuardianRegistry<string>(3);
      registry.register(makeGuardian(1));
      expect(() =>
        registry.register(makeGuardian(2, { id: 'guardian-1' })),
      ).toThrow(GuardianAlreadyRegisteredError);
    });

    it('should reject duplicate share indices', () => {
      const registry = new GuardianRegistry<string>(3);
      registry.register(makeGuardian(1));
      expect(() =>
        registry.register(makeGuardian(1, { id: 'guardian-other' })),
      ).toThrow(InvalidShareIndexError);
    });

    it('should reject share index out of range', () => {
      const registry = new GuardianRegistry<string>(3);
      expect(() => registry.register(makeGuardian(0))).toThrow(
        InvalidShareIndexError,
      );
      expect(() => registry.register(makeGuardian(4))).toThrow(
        InvalidShareIndexError,
      );
    });

    it('should reject registration when registry is full', () => {
      const registry = new GuardianRegistry<string>(2);
      registry.register(makeGuardian(1));
      registry.register(makeGuardian(2));
      expect(() => registry.register(makeGuardian(3))).toThrow(
        RegistryFullError,
      );
    });
  });

  describe('getGuardian / getGuardianByIndex', () => {
    it('should return undefined for unknown ID', () => {
      const registry = new GuardianRegistry<string>(3);
      expect(registry.getGuardian('nonexistent')).toBeUndefined();
    });

    it('should return undefined for unknown index', () => {
      const registry = new GuardianRegistry<string>(3);
      expect(registry.getGuardianByIndex(1)).toBeUndefined();
    });

    it('should retrieve Guardian by index', () => {
      const registry = new GuardianRegistry<string>(3);
      registry.register(makeGuardian(2));
      const found = registry.getGuardianByIndex(2);
      expect(found).toBeDefined();
      expect(found?.id).toBe('guardian-2');
    });
  });

  describe('getAllGuardians / getOnlineGuardians', () => {
    it('should return all registered Guardians', () => {
      const registry = new GuardianRegistry<string>(3);
      registry.register(makeGuardian(1));
      registry.register(makeGuardian(2));
      expect(registry.getAllGuardians()).toHaveLength(2);
    });

    it('should return only online Guardians', () => {
      const registry = new GuardianRegistry<string>(3);
      registry.register(makeGuardian(1, { status: GuardianStatus.Online }));
      registry.register(makeGuardian(2, { status: GuardianStatus.Offline }));
      registry.register(makeGuardian(3, { status: GuardianStatus.Online }));
      expect(registry.getOnlineGuardians()).toHaveLength(2);
    });
  });

  describe('updateStatus', () => {
    it('should update Guardian status', () => {
      const registry = new GuardianRegistry<string>(3);
      registry.register(makeGuardian(1));
      registry.updateStatus('guardian-1', GuardianStatus.Online);
      expect(registry.getGuardian('guardian-1')?.status).toBe(
        GuardianStatus.Online,
      );
    });

    it('should throw for unknown Guardian', () => {
      const registry = new GuardianRegistry<string>(3);
      expect(() =>
        registry.updateStatus('nonexistent', GuardianStatus.Online),
      ).toThrow(GuardianNotFoundError);
    });

    it('should emit status change event', () => {
      const registry = new GuardianRegistry<string>(3);
      registry.register(makeGuardian(1));

      const events: GuardianStatusChangeEvent<string>[] = [];
      registry.onStatusChange((e) => events.push(e));

      registry.updateStatus('guardian-1', GuardianStatus.Online);

      expect(events).toHaveLength(1);
      expect(events[0].guardianId).toBe('guardian-1');
      expect(events[0].previousStatus).toBe(GuardianStatus.Registered);
      expect(events[0].newStatus).toBe(GuardianStatus.Online);
    });

    it('should not emit event when status is unchanged', () => {
      const registry = new GuardianRegistry<string>(3);
      registry.register(makeGuardian(1));

      const listener = jest.fn();
      registry.onStatusChange(listener);

      registry.updateStatus('guardian-1', GuardianStatus.Registered);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('designateBackup', () => {
    it('should designate a backup Guardian', () => {
      const registry = new GuardianRegistry<string>(3);
      registry.register(makeGuardian(1));
      registry.register(makeGuardian(2));

      registry.designateBackup('guardian-1', 'guardian-2');

      const primary = registry.getGuardian('guardian-1');
      expect(primary?.backupGuardianId).toBe('guardian-2');
    });

    it('should throw if primary Guardian not found', () => {
      const registry = new GuardianRegistry<string>(3);
      registry.register(makeGuardian(1));
      expect(() =>
        registry.designateBackup('nonexistent', 'guardian-1'),
      ).toThrow(GuardianNotFoundError);
    });

    it('should throw if backup Guardian not found', () => {
      const registry = new GuardianRegistry<string>(3);
      registry.register(makeGuardian(1));
      expect(() =>
        registry.designateBackup('guardian-1', 'nonexistent'),
      ).toThrow(GuardianNotFoundError);
    });
  });

  describe('Uint8Array IDs', () => {
    it('should work with Uint8Array-based Guardian IDs', () => {
      const registry = new GuardianRegistry<Uint8Array>(2);
      const id1 = new Uint8Array([1, 2, 3]);
      const id2 = new Uint8Array([4, 5, 6]);

      registry.register({
        id: id1,
        name: 'Guardian 1',
        shareIndex: 1,
        verificationKey: new Uint8Array([10]),
        status: GuardianStatus.Registered,
      });
      registry.register({
        id: id2,
        name: 'Guardian 2',
        shareIndex: 2,
        verificationKey: new Uint8Array([20]),
        status: GuardianStatus.Registered,
      });

      expect(registry.count).toBe(2);
      // Lookup with a new Uint8Array with same bytes
      expect(registry.getGuardian(new Uint8Array([1, 2, 3]))).toBeDefined();
    });
  });
});
