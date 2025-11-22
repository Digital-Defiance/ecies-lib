# Migration Guide: Node ECIES Lib v3.7 -> v4.0

**Target Audience:** AI Coding Agent / Developer
**Goal:** Upgrade `digitaldefiance-node-ecies-lib` to match the architecture of `digitaldefiance-ecies-lib` v4.0.0.

## 1. Dependency Updates

Update `package.json` to include/update the following dependencies:
*   `@noble/curves`: `^1.4.0` (or latest compatible)
*   `@noble/hashes`: `^1.4.0` (Required for HKDF and SHA256)

## 2. Constants & Enums

### `src/constants.ts`
*   Update `ECIES_PUBLIC_KEY_LENGTH` to `33`.
*   Update `ECIES_PUBLIC_KEY_MAGIC` to `0x02`.
*   Add `ECIES_VERSION_SIZE = 1`.
*   Add `ECIES_CIPHER_SUITE_SIZE = 1`.
*   Update `expectedMultipleOverhead` calculation:
    ```typescript
    ECIES_VERSION_SIZE + ECIES_CIPHER_SUITE_SIZE + UINT8_SIZE + ECIES_PUBLIC_KEY_LENGTH + ECIES_IV_SIZE + ECIES_AUTH_TAG_SIZE
    ```
*   Update `expectedMultipleEncryptedKeySize` to `64` (IV + Tag + Key). **Remove Public Key from this calculation.**

### `src/enumerations/`
*   Create `ecies-version.ts`: `EciesVersionEnum { V1 = 1 }`
*   Create `ecies-cipher-suite.ts`: `EciesCipherSuiteEnum { Secp256k1_Aes256Gcm_Sha256 = 1 }`
*   Update `ecies-error-type.ts` and `ecies-string-key.ts` with new error types:
    *   `InvalidVersion`
    *   `InvalidCipherSuite`
    *   `MissingEphemeralPublicKey`

## 3. Crypto Core Updates (`src/services/ecies/crypto-core.ts`)

1.  **Imports**: Import `hkdf` and `sha256` from `@noble/hashes`.
2.  **`normalizePublicKey`**:
    *   Accept 33-byte keys starting with `0x02` or `0x03`.
    *   Accept 65-byte keys starting with `0x04` (legacy).
    *   Accept 64-byte keys (legacy) -> convert to 65-byte.
3.  **`deriveSharedKey`**: Implement HKDF-SHA256.
    ```typescript
    public deriveSharedKey(sharedSecret, salt, info, length): Uint8Array {
      return hkdf(sha256, sharedSecret, salt, info, length);
    }
    ```
4.  **`sign` / `verify`**: Implement ECDSA signing and verification using `secp256k1`. Ensure `sign` returns compact raw bytes.

## 4. Multi-Recipient Logic (`src/services/ecies/multi-recipient.ts`)

### `encryptMultiple`
*   **Change**: Generate **ONE** ephemeral key pair for the entire message.
*   **Change**: Pass `ephemeralPrivateKey` to `encryptKey`.
*   **Change**: Pass `recipient.id` as `aad` to `encryptKey`.
*   **Change**: Store `ephemeralPublicKey` in the header object.
*   **Change**: Use `buildHeader` to generate bytes, then pass those bytes as `aad` to the final `AESGCMService.encrypt` call for the message body.

### `encryptKey`
*   **Signature**: `(receiverPub, msgKey, ephemeralPriv, aad)`
*   **Logic**:
    1.  Compute ECDH shared secret.
    2.  Derive key using `deriveSharedKey` (HKDF).
    3.  Encrypt `msgKey` using derived key and `aad`.
    4.  Return `concat(iv, tag, encrypted)`. **Do NOT prepend ephemeral public key.**

### `decryptMultipleForRecipient`
*   **Change**: Extract `ephemeralPublicKey` from the parsed header.
*   **Change**: Pass `ephemeralPublicKey` and `recipientId` (as AAD) to `decryptKey`.
*   **Change**: Reconstruct header bytes using `buildHeader` and pass as `aad` to `AESGCMService.decrypt`.

### `buildHeader` / `parseHeader`
*   **Structure**:
    `[Version(1)][Suite(1)][Type(1)][EphemeralPubKey(33)][DataLen(8)][Count(2)][IDs...][Keys...]`
*   **Logic**:
    *   `buildHeader`: Prepend Version, Suite, Type, and Ephemeral Key.
    *   `parseHeader`: Validate Version, Suite, Type. Read Ephemeral Key (33 bytes).

## 5. Single-Recipient Logic (`src/services/ecies/single-recipient.ts`)

*   Update header construction to include `Version` and `CipherSuite`.
*   Update parsing to validate them.

## 6. AES-GCM Service (`src/services/aes-gcm.ts`)

*   Update `encrypt` and `decrypt` methods to accept an optional `aad: Uint8Array` parameter.
*   Pass `additionalData: aad` to the underlying crypto implementation (Node `crypto` or Web Crypto).

## 7. Testing

*   Ensure all tests pass with the new 33-byte key format.
*   Add tests for AAD tampering (header modification).
*   Add tests for signature verification.
