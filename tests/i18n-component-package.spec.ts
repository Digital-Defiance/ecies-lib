/**
 * Unit tests for createEciesComponentPackage.
 *
 * Verifies the returned package has the correct config and stringKeyEnum,
 * and that the existing createEciesComponentConfig remains unchanged.
 */

import { isBrandedEnum } from '@digitaldefiance/i18n-lib';
import { EciesComponentId } from '../src/enumerations/ecies-string-key';
import {
  createEciesComponentConfig,
  createEciesComponentPackage,
} from '../src/i18n-setup';

describe('createEciesComponentPackage', () => {
  it('should return an object with config and stringKeyEnum', () => {
    const pkg = createEciesComponentPackage();
    expect(pkg.config).toBeDefined();
    expect(pkg.stringKeyEnum).toBeDefined();
  });

  it('should have config with correct component id', () => {
    const pkg = createEciesComponentPackage();
    expect(pkg.config.id).toBe(EciesComponentId);
  });

  it('should have config with strings for en-US', () => {
    const pkg = createEciesComponentPackage();
    expect(pkg.config.strings['en-US']).toBeDefined();
    expect(Object.keys(pkg.config.strings['en-US']).length).toBeGreaterThan(0);
  });

  it('should have a branded enum as stringKeyEnum', () => {
    const pkg = createEciesComponentPackage();
    expect(isBrandedEnum(pkg.stringKeyEnum)).toBe(true);
  });

  it('should return the same config as createEciesComponentConfig', () => {
    const pkg = createEciesComponentPackage();
    const directConfig = createEciesComponentConfig();
    expect(pkg.config.id).toBe(directConfig.id);
    expect(pkg.config.strings).toEqual(directConfig.strings);
  });
});

describe('createEciesComponentConfig backward compatibility', () => {
  it('should still return a valid ComponentConfig', () => {
    const config = createEciesComponentConfig();
    expect(config.id).toBe(EciesComponentId);
    expect(config.strings).toBeDefined();
  });
});
