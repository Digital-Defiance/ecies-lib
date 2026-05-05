/**
 * Test Vector Validation Tests
 *
 * Runs each test vector from the DD-ECIES specification (Section 18)
 * through ecies-lib functions and verifies outputs match the spec.
 *
 * Requirements: 17.1, 17.2, 17.3
 */
import { secp256k1 } from '@noble/curves/secp256k1';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha2';
import { SecureString } from '../../src/secure-string';
import { EciesCryptoCore } from '../../src/services/ecies/crypto-core';
import { EciesSignature } from '../../src/services/ecies/signature';

// ── AES-256-GCM helpers using Web Crypto API ─────────────────────────────────

async function aesGcmEncrypt(
  key: Uint8Array,
  iv: Uint8Array,
  plaintext: Uint8Array,
  aad: Uint8Array,
): Promise<{ ciphertext: Uint8Array; authTag: Uint8Array }> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );
  const result = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 },
    cryptoKey,
    plaintext,
  );
  const resultBytes = new Uint8Array(result);
  return {
    ciphertext: resultBytes.slice(0, resultBytes.length - 16),
    authTag: resultBytes.slice(resultBytes.length - 16),
  };
}

async function aesGcmDecrypt(
  key: Uint8Array,
  iv: Uint8Array,
  ciphertext: Uint8Array,
  authTag: Uint8Array,
  aad: Uint8Array,
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );
  // Web Crypto expects ciphertext + tag concatenated
  const sealed = new Uint8Array(ciphertext.length + authTag.length);
  sealed.set(ciphertext, 0);
  sealed.set(authTag, ciphertext.length);
  const result = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData: aad, tagLength: 128 },
    cryptoKey,
    sealed,
  );
  return new Uint8Array(result);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a hex string to Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Convert Uint8Array to hex string */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Test Vectors from DD-ECIES Specification Section 18 ──────────────────────

/** 18.1 Common Parameters */
const VECTORS = {
  identityPrivateKey:
    '1053fae1b3ac64f178bcc21026fd06a3f4544ec2f35338b001f02d1d8efa3d5f',
  identityPublicKey:
    '02dc286c821c7490afbe20a79d13123b9f41f3d7ef21e4a9caacd22f5983b28eca',
  mnemonic:
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
  ephemeralPrivateKey:
    'bc4313f0c6e23ae0366e40d80387f49a2e4f64069dcb5a447f22dabefb79dc2f',
  ephemeralPublicKey:
    '02fbb6f2f3ee200f9cd9f33b86e7de3412eb9aee09f6b10709a595f5ede231494b',
  ecdhSharedSecret:
    '0933f1546610b5bdbe4349b25b783d07fd5185b84b3efee2e92dc9bf2a034a11',
  derivedSymmetricKey:
    '7c4fd382f540c37c6bee1e9c24a5d15e8a7a8f474a4882f4c8606520f2b801ab',
  fixedIV: '31fe1b062e5639622cfc0439',
};

/** 18.3 ECDSA Test Vector */
const ECDSA_VECTOR = {
  message: 'DD-ECIES signature test vector',
  sha256Hash:
    'a1fc0896b3b1a9b1e0eaf1434a04d26e679a422a8d21a9104f458bb7bf6a2d2e',
  signature:
    '6596fb18720a906b5b20eaaa259bfecaef35555208c15c61022216f373a306f90deb13d6cfd91e73b405a46a131fc98f13e410c1c89d3a960ee29f489da25e9d',
};

/** 18.5 AES-256-GCM Test Vector */
const AES_VECTOR = {
  plaintext: 'DD-ECIES test vector plaintext',
  plaintextHex: '44442d4543494553207465737420766563746f7220706c61696e74657874',
  aad: '01012102fbb6f2f3ee200f9cd9f33b86e7de3412eb9aee09f6b10709a595f5ede231494b',
  ciphertext: 'f3c70450f1ac074e93508eb3caed91a900ebc463d4eaa78c4c56389f36ee',
  authTag: 'e6dbf735d3ef9a4235d5513f9e8829ce',
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DD-ECIES Specification Test Vector Validation', () => {
  const cryptoCore = new EciesCryptoCore();
  const signatureService = new EciesSignature(cryptoCore);

  describe('18.1 Mnemonic-to-Key Derivation (Req 17.1)', () => {
    it('should derive the correct private key from the spec mnemonic', () => {
      const mnemonic = new SecureString(VECTORS.mnemonic);
      const keyPair = cryptoCore.mnemonicToSimpleKeyPair(mnemonic);

      const derivedPrivateKeyHex = bytesToHex(keyPair.privateKey);
      expect(derivedPrivateKeyHex).toBe(VECTORS.identityPrivateKey);
    });

    it('should derive the correct compressed public key from the spec mnemonic', () => {
      const mnemonic = new SecureString(VECTORS.mnemonic);
      const keyPair = cryptoCore.mnemonicToSimpleKeyPair(mnemonic);

      const derivedPublicKeyHex = bytesToHex(keyPair.publicKey);
      expect(derivedPublicKeyHex).toBe(VECTORS.identityPublicKey);
    });

    it('should derive the correct public key from the identity private key directly', () => {
      const privateKey = hexToBytes(VECTORS.identityPrivateKey);
      const publicKey = cryptoCore.getPublicKey(privateKey);

      expect(bytesToHex(publicKey)).toBe(VECTORS.identityPublicKey);
    });
  });

  describe('18.3 ECDSA Signing (Req 17.2)', () => {
    it('should produce the correct SHA-256 hash of the test message', () => {
      const messageBytes = new TextEncoder().encode(ECDSA_VECTOR.message);
      const hash = sha256(messageBytes);

      expect(bytesToHex(hash)).toBe(ECDSA_VECTOR.sha256Hash);
    });

    it('should produce the correct 64-byte compact signature', () => {
      const privateKey = hexToBytes(VECTORS.identityPrivateKey);
      const messageBytes = new TextEncoder().encode(ECDSA_VECTOR.message);

      // Use the EciesSignature service (which hashes internally)
      const signature = signatureService.signMessage(privateKey, messageBytes);

      expect(signature.length).toBe(64);
      expect(bytesToHex(signature)).toBe(ECDSA_VECTOR.signature);
    });

    it('should verify the spec signature using the identity public key', () => {
      const publicKey = hexToBytes(VECTORS.identityPublicKey);
      const messageBytes = new TextEncoder().encode(ECDSA_VECTOR.message);
      const signature = hexToBytes(ECDSA_VECTOR.signature);

      const isValid = signatureService.verifyMessage(
        publicKey,
        messageBytes,
        signature as any,
      );
      expect(isValid).toBe(true);
    });

    it('should produce the same signature via crypto-core sign method', () => {
      const privateKey = hexToBytes(VECTORS.identityPrivateKey);
      const messageBytes = new TextEncoder().encode(ECDSA_VECTOR.message);

      const signature = cryptoCore.sign(privateKey, messageBytes);

      expect(signature.length).toBe(64);
      expect(bytesToHex(signature)).toBe(ECDSA_VECTOR.signature);
    });
  });

  describe('18.2 ECDH Shared Secret (Req 17.2)', () => {
    it('should compute the correct shared secret from ephemeral private key and identity public key', () => {
      const ephemeralPrivateKey = hexToBytes(VECTORS.ephemeralPrivateKey);
      const identityPublicKey = hexToBytes(VECTORS.identityPublicKey);

      const sharedSecret = cryptoCore.computeSharedSecret(
        ephemeralPrivateKey,
        identityPublicKey,
      );

      expect(sharedSecret.length).toBe(32);
      expect(bytesToHex(sharedSecret)).toBe(VECTORS.ecdhSharedSecret);
    });

    it('should produce the same shared secret from the reverse direction', () => {
      // ECDH is symmetric: privA * pubB == privB * pubA
      const identityPrivateKey = hexToBytes(VECTORS.identityPrivateKey);
      const ephemeralPublicKey = hexToBytes(VECTORS.ephemeralPublicKey);

      const sharedSecret = cryptoCore.computeSharedSecret(
        identityPrivateKey,
        ephemeralPublicKey,
      );

      expect(bytesToHex(sharedSecret)).toBe(VECTORS.ecdhSharedSecret);
    });

    it('should match the shared secret computed directly via @noble/curves', () => {
      const ephemeralPrivateKey = hexToBytes(VECTORS.ephemeralPrivateKey);
      const identityPublicKey = hexToBytes(VECTORS.identityPublicKey);

      // Direct computation: getSharedSecret returns uncompressed point
      const sharedPoint = secp256k1.getSharedSecret(
        ephemeralPrivateKey,
        identityPublicKey,
        false,
      );
      // x-coordinate is bytes 1..33 (skip the 0x04 prefix)
      const xCoordinate = sharedPoint.slice(1, 33);

      expect(bytesToHex(xCoordinate)).toBe(VECTORS.ecdhSharedSecret);
    });
  });

  describe('18.2 HKDF Key Derivation (Req 17.2)', () => {
    it('should derive the correct symmetric key via HKDF-SHA256', () => {
      const sharedSecret = hexToBytes(VECTORS.ecdhSharedSecret);
      const info = new TextEncoder().encode('ecies-v2-key-derivation');

      const derivedKey = cryptoCore.deriveSharedKey(
        sharedSecret,
        new Uint8Array(0), // empty salt
        info,
        32,
      );

      expect(derivedKey.length).toBe(32);
      expect(bytesToHex(derivedKey)).toBe(VECTORS.derivedSymmetricKey);
    });

    it('should match HKDF output computed directly via @noble/hashes', () => {
      const sharedSecret = hexToBytes(VECTORS.ecdhSharedSecret);
      const info = new TextEncoder().encode('ecies-v2-key-derivation');

      const derivedKey = hkdf(
        sha256,
        sharedSecret,
        new Uint8Array(0),
        info,
        32,
      );

      expect(bytesToHex(derivedKey)).toBe(VECTORS.derivedSymmetricKey);
    });
  });

  describe('18.5 AES-256-GCM Encryption/Decryption (Req 17.3)', () => {
    it('should produce the correct ciphertext and auth tag', async () => {
      const key = hexToBytes(VECTORS.derivedSymmetricKey);
      const iv = hexToBytes(VECTORS.fixedIV);
      const plaintext = hexToBytes(AES_VECTOR.plaintextHex);
      const aad = hexToBytes(AES_VECTOR.aad);

      const { ciphertext, authTag } = await aesGcmEncrypt(
        key,
        iv,
        plaintext,
        aad,
      );

      expect(bytesToHex(ciphertext)).toBe(AES_VECTOR.ciphertext);
      expect(bytesToHex(authTag)).toBe(AES_VECTOR.authTag);
    });

    it('should decrypt the spec ciphertext back to the original plaintext', async () => {
      const key = hexToBytes(VECTORS.derivedSymmetricKey);
      const iv = hexToBytes(VECTORS.fixedIV);
      const ciphertext = hexToBytes(AES_VECTOR.ciphertext);
      const authTag = hexToBytes(AES_VECTOR.authTag);
      const aad = hexToBytes(AES_VECTOR.aad);

      const decrypted = await aesGcmDecrypt(key, iv, ciphertext, authTag, aad);

      expect(bytesToHex(decrypted)).toBe(AES_VECTOR.plaintextHex);

      // Also verify the plaintext as a string
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(AES_VECTOR.plaintext);
    });

    it('should verify the plaintext hex matches the text encoding', () => {
      const textBytes = new TextEncoder().encode(AES_VECTOR.plaintext);
      expect(bytesToHex(textBytes)).toBe(AES_VECTOR.plaintextHex);
    });

    it('should verify the AAD structure matches the spec format', () => {
      // AAD = version(0x01) || cipherSuite(0x01) || type(0x21) || ephemeralPublicKey(33 bytes)
      const aadBytes = hexToBytes(AES_VECTOR.aad);

      // First byte: version = 0x01
      expect(aadBytes[0]).toBe(0x01);
      // Second byte: cipher suite = 0x01
      expect(aadBytes[1]).toBe(0x01);
      // Third byte: encryption type = 0x21 (Basic)
      expect(aadBytes[2]).toBe(0x21);
      // Bytes 3..35: ephemeral public key (33 bytes, starts with 0x02 or 0x03)
      const ephPubKey = aadBytes.slice(3, 36);
      expect(ephPubKey.length).toBe(33);
      expect(ephPubKey[0]).toBe(0x02); // compressed key prefix
      expect(bytesToHex(ephPubKey)).toBe(VECTORS.ephemeralPublicKey);
    });
  });

  describe('End-to-end: Full ECIES flow with spec vectors', () => {
    it('should complete the full encrypt flow: mnemonic → keys → ECDH → HKDF → AES-GCM', async () => {
      // Step 1: Derive identity keys from mnemonic
      const mnemonic = new SecureString(VECTORS.mnemonic);
      const identityKeyPair = cryptoCore.mnemonicToSimpleKeyPair(mnemonic);
      expect(bytesToHex(identityKeyPair.privateKey)).toBe(
        VECTORS.identityPrivateKey,
      );
      expect(bytesToHex(identityKeyPair.publicKey)).toBe(
        VECTORS.identityPublicKey,
      );

      // Step 2: Compute ECDH shared secret (ephemeral → identity)
      const ephemeralPrivateKey = hexToBytes(VECTORS.ephemeralPrivateKey);
      const sharedSecret = cryptoCore.computeSharedSecret(
        ephemeralPrivateKey,
        identityKeyPair.publicKey,
      );
      expect(bytesToHex(sharedSecret)).toBe(VECTORS.ecdhSharedSecret);

      // Step 3: Derive symmetric key via HKDF
      const info = new TextEncoder().encode('ecies-v2-key-derivation');
      const symKey = cryptoCore.deriveSharedKey(
        sharedSecret,
        new Uint8Array(0),
        info,
        32,
      );
      expect(bytesToHex(symKey)).toBe(VECTORS.derivedSymmetricKey);

      // Step 4: Encrypt with AES-256-GCM
      const iv = hexToBytes(VECTORS.fixedIV);
      const plaintext = hexToBytes(AES_VECTOR.plaintextHex);
      const aad = hexToBytes(AES_VECTOR.aad);

      const { ciphertext, authTag } = await aesGcmEncrypt(
        symKey,
        iv,
        plaintext,
        aad,
      );

      expect(bytesToHex(ciphertext)).toBe(AES_VECTOR.ciphertext);
      expect(bytesToHex(authTag)).toBe(AES_VECTOR.authTag);

      // Step 5: Decrypt (recipient side)
      const recipientSharedSecret = cryptoCore.computeSharedSecret(
        identityKeyPair.privateKey,
        hexToBytes(VECTORS.ephemeralPublicKey),
      );
      expect(bytesToHex(recipientSharedSecret)).toBe(VECTORS.ecdhSharedSecret);

      const recipientSymKey = cryptoCore.deriveSharedKey(
        recipientSharedSecret,
        new Uint8Array(0),
        info,
        32,
      );
      expect(bytesToHex(recipientSymKey)).toBe(VECTORS.derivedSymmetricKey);

      const decrypted = await aesGcmDecrypt(
        recipientSymKey,
        iv,
        ciphertext,
        authTag,
        aad,
      );
      expect(bytesToHex(decrypted)).toBe(AES_VECTOR.plaintextHex);
    });
  });
});
