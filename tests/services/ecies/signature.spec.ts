import { ECIES } from '../../../src/defaults';
import { IECIESConfig } from '../../../src/interfaces';
import { EciesCryptoCore } from '../../../src/services/ecies/crypto-core';
import { EciesSignature } from '../../../src/services/ecies/signature';

const mockConfig: IECIESConfig = {
  curveName: ECIES.CURVE_NAME,
  primaryKeyDerivationPath: ECIES.PRIMARY_KEY_DERIVATION_PATH,
  mnemonicStrength: 128,
  symmetricAlgorithm: ECIES.SYMMETRIC_ALGORITHM_CONFIGURATION,
  symmetricKeyBits: 256,
  symmetricKeyMode: 'gcm',
};

describe('EciesSignature', () => {
  let cryptoCore: EciesCryptoCore;
  let signatureService: EciesSignature;
  let keyPair: { privateKey: Uint8Array; publicKey: Uint8Array };

  beforeAll(async () => {
    cryptoCore = new EciesCryptoCore(mockConfig);
    signatureService = new EciesSignature(cryptoCore);
    keyPair = await cryptoCore.generateEphemeralKeyPair();
  });

  it('should sign a message and verify the signature', () => {
    const message = new TextEncoder().encode(
      'This is a test message for signing',
    );
    const signature = signatureService.signMessage(keyPair.privateKey, message);

    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBe(64);

    const isValid = signatureService.verifyMessage(
      keyPair.publicKey,
      message,
      signature,
    );
    expect(isValid).toBe(true);
  });

  it('should fail to verify a signature with the wrong public key', async () => {
    const message = new TextEncoder().encode('Another test message');
    const signature = signatureService.signMessage(keyPair.privateKey, message);

    const wrongKeyPair = await cryptoCore.generateEphemeralKeyPair();
    const isValid = signatureService.verifyMessage(
      wrongKeyPair.publicKey,
      message,
      signature,
    );

    expect(isValid).toBe(false);
  });

  it('should fail to verify a signature for a different message', () => {
    const message1 = new TextEncoder().encode('Original message');
    const message2 = new TextEncoder().encode('Altered message');
    const signature = signatureService.signMessage(
      keyPair.privateKey,
      message1,
    );

    const isValid = signatureService.verifyMessage(
      keyPair.publicKey,
      message2,
      signature,
    );
    expect(isValid).toBe(false);
  });

  it('should convert a signature to and from a hex string', () => {
    const message = new TextEncoder().encode('Signature to string test');
    const signature = signatureService.signMessage(keyPair.privateKey, message);

    const signatureString =
      signatureService.signatureUint8ArrayToSignatureString(signature);
    expect(typeof signatureString).toBe('string');
    expect(signatureString.length).toBe(128);

    const signatureBytes =
      signatureService.signatureStringToSignatureUint8Array(signatureString);
    expect(signatureBytes).toEqual(signature);
  });
});
