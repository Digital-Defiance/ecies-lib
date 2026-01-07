/**
 * EciesBuilder Tests - Critical Gap Coverage
 */

import { ECIESBuilder } from '../../src/builders/ecies-builder';

describe('EciesBuilder', () => {
  it('should create builder instance', () => {
    const builder = ECIESBuilder.create();
    expect(builder).toBeDefined();
  });

  it('should chain configuration methods', () => {
    const builder = ECIESBuilder.create()
      .withServiceConfig({ curveName: 'secp256k1' })
      .withConstants({ COMPRESSED_PUBLIC_KEY_SIZE: 33 });

    expect(builder).toBeDefined();
  });

  it('should build ECIESService', () => {
    const service = ECIESBuilder.create()
      .withServiceConfig({ curveName: 'secp256k1' })
      .build();

    expect(service).toBeDefined();
  });

  it('should use defaults when not specified', () => {
    const service = ECIESBuilder.create().build();
    expect(service).toBeDefined();
  });
});
