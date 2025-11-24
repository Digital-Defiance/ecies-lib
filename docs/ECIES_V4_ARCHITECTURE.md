# ECIES Library v4.0 Architecture & Protocol Specification

## Overview

The Digital Defiance ECIES (Elliptic Curve Integrated Encryption Scheme) library provides a secure, authenticated encryption scheme using **secp256k1** for key pairs and **AES-256-GCM** for symmetric encryption. Version 4.0 introduces significant improvements in security, efficiency, and payload size.

## Related Documentation

- **[Circular Dependency Prevention Guide](CIRCULAR_DEPENDENCY_PREVENTION.md)** - Module dependency architecture and import rules
- **[Contributing Guide](CONTRIBUTING.md)** - Guidelines for contributors including module dependency rules
- **[Streaming Encryption Architecture](STREAMING_ENCRYPTION_ARCHITECTURE.md)** - Memory-efficient streaming encryption design

## Core Cryptographic Primitives

* **Curve**: `secp256k1`
* **Symmetric Encryption**: `AES-256-GCM` (Galois/Counter Mode)
* **Key Derivation Function (KDF)**: `HKDF-SHA256` (HMAC-based Extract-and-Expand Key Derivation Function)
* **Hash Function**: `SHA-256`
* **Signature Scheme**: `ECDSA` (Optional Sign-then-Encrypt)

## Key Formats

### Public Keys

* **Format**: Compressed
* **Length**: 33 bytes
* **Prefix**: `0x02` (even y) or `0x03` (odd y)
* **Legacy Support**: The library can import uncompressed (65-byte) keys but converts them to compressed format for operations and storage.

### Private Keys

* **Length**: 32 bytes

## Protocol Flow

### 1. Key Derivation (HKDF)

Shared secrets derived via ECDH are no longer used directly as symmetric keys. Instead, they are passed through HKDF to derive a cryptographically strong encryption key.

```typescript
Input: SharedSecret (32 bytes, x-coordinate)
Salt: Empty (0 bytes)
Info: "ecies-v2-key-derivation"
Output: SymmetricKey (32 bytes)
```

### 2. Authenticated Encryption with Associated Data (AAD)

Version 4.0 enforces strict AAD binding to prevent context manipulation attacks.

* **Key Encryption**: Binds the **Recipient ID** to the encrypted key.
* **Message Encryption**: Binds the **Message Header** to the encrypted payload.

### 3. Multi-Recipient Encryption (Shared Ephemeral Key)

To reduce payload size, a **single ephemeral key pair** is generated for the entire message, rather than one per recipient.

1. Sender generates Ephemeral Key Pair ($E_{priv}, E_{pub}$).
2. $E_{pub}$ is stored in the message header (33 bytes).
3. For each recipient $R_i$:
    * Compute Shared Secret: $S_i = ECDH(E_{priv}, R_{pub,i})$
    * Derive Key: $K_i = HKDF(S_i)$
    * Encrypt Message Key ($M_K$) using $K_i$ via AES-GCM.
    * **AAD**: Recipient ID ($ID_i$).

## Message Formats

### Multi-Recipient Message Structure

| Field | Size (Bytes) | Description |
| :--- | :--- | :--- |
| **Header** | **Variable** | **Authenticated Data (AAD)** |
| Version | 1 | `0x01` (v1) |
| Cipher Suite | 1 | `0x01` (Secp256k1_Aes256Gcm_Sha256) |
| Encryption Type | 1 | `0x02` (Multiple) |
| Ephemeral Public Key | 33 | Compressed Ephemeral Public Key (Shared) |
| Data Length | 8 | MSB = Recipient ID Size, Lower 56 bits = Length |
| Recipient Count | 2 | Number of recipients ($N$) |
| Recipient IDs | $N \times ID\_Size$ | List of Recipient IDs |
| Encrypted Keys | $N \times 64$ | Encrypted Message Key for each recipient |
| **Body** | **Variable** | **Encrypted Payload** |
| IV | 16 | Initialization Vector for Message |
| Auth Tag | 16 | GCM Authentication Tag |
| Ciphertext | Variable | Encrypted Data (Optional: Prepend Signature) |

#### Encrypted Key Format (64 bytes)

Each entry in the "Encrypted Keys" list contains:

* **IV**: 16 bytes
* **Auth Tag**: 16 bytes
* **Ciphertext**: 32 bytes (Encrypted Message Key)

### Single-Recipient Message Structure

| Field | Size (Bytes) | Description |
| :--- | :--- | :--- |
| Preamble | Variable | Optional application preamble |
| Version | 1 | `0x01` |
| Cipher Suite | 1 | `0x01` |
| Encryption Type | 1 | `0x01` (Single) |
| Ephemeral Public Key | 33 | Compressed |
| IV | 16 | |
| Auth Tag | 16 | |
| Data Length | 8 | |
| Ciphertext | Variable | |

## Security Features

### 1. Context Binding (AAD)

By using the Header as AAD for the message body, and Recipient IDs as AAD for key encryption, we ensure that:

* A recipient cannot be surreptitiously swapped.
* Header metadata (e.g., recipient count, data length) cannot be tampered with without invalidating the decryption.

### 2. Sign-then-Encrypt (Optional)

If a sender private key is provided:

1. Calculate `Signature = ECDSA_Sign(SenderPriv, Plaintext)`.
2. Prepend `Signature` (64 bytes, compact) to `Plaintext`.
3. Encrypt `[Signature + Plaintext]`.
4. On decryption, if a sender public key is provided, verify the signature after decryption.

### 3. Forward Secrecy (Per Message)

A new random symmetric key is generated for every message. A new ephemeral key pair is generated for every message.

## Constants

* **IV Size**: 16 bytes
* **Auth Tag Size**: 16 bytes
* **Symmetric Key Size**: 32 bytes
* **Public Key Length**: 33 bytes
* **Header Min Size**: 46 bytes


## Module Organization and Dependency Management

### Hierarchical Module Structure

The library follows a strict 5-level hierarchical module dependency structure to prevent circular dependencies and ensure reliable initialization. This architecture was implemented to resolve runtime errors caused by undefined enum values during module initialization.

```
Level 1: Enumerations (Pure, no dependencies)
    ↓
Level 2: Translations (Depends only on Level 1)
    ↓
Level 3: i18n Setup (Depends on Levels 1-2)
    ↓
Level 4: Errors & Utilities (Depends on Levels 1-3)
    ↓
Level 5: Constants & Services (Depends on Levels 1-4)
```

### Key Principles

1. **Enumerations are pure** - No imports except TypeScript types
2. **Translations are data-only** - Only import enumerations
3. **Errors use lazy i18n** - Translation lookup deferred until message access
4. **Constants validate safely** - Use fallback messages during initialization
5. **Services respect the hierarchy** - Avoid circular dependencies

### Module Import Rules

Each level has strict rules about what it can import:

- **Level 1 (Enumerations)**: Can only import TypeScript types
- **Level 2 (Translations)**: Can import Level 1 + external libraries
- **Level 3 (i18n Setup)**: Can import Levels 1-2 + external libraries
- **Level 4 (Errors & Utils)**: Can import Levels 1-3 + external libraries
- **Level 5 (Constants & Services)**: Can import all previous levels

### Circular Dependency Detection

The project uses `madge` to detect circular dependencies:

```bash
# Check for circular dependencies
npx madge --circular --extensions ts src/index.ts

# Check specific module
npx madge --circular --extensions ts src/enumerations/index.ts
```

For detailed information on module dependency rules and best practices, see:
- [Circular Dependency Prevention Guide](CIRCULAR_DEPENDENCY_PREVENTION.md)
- [Contributing Guide](CONTRIBUTING.md)

## Version History

### v4.2.x - Type Safety and Circular Dependency Fixes

- Resolved circular dependency issue in enumeration modules
- Implemented strict module hierarchy
- Added comprehensive circular dependency prevention documentation
- Removed ~60 type safety escape hatches
- Enhanced error handling with lazy i18n initialization

### v4.0.0 - Protocol Upgrade

- Introduced HKDF key derivation
- Implemented AAD binding for context security
- Optimized multi-recipient encryption with shared ephemeral keys
- Standardized on compressed public keys (33 bytes)
