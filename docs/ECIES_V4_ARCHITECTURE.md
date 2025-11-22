# ECIES Library v4.0 Architecture & Protocol Specification

## Overview

The Digital Defiance ECIES (Elliptic Curve Integrated Encryption Scheme) library provides a secure, authenticated encryption scheme using **secp256k1** for key pairs and **AES-256-GCM** for symmetric encryption. Version 4.0 introduces significant improvements in security, efficiency, and payload size.

## Core Cryptographic Primitives

*   **Curve**: `secp256k1`
*   **Symmetric Encryption**: `AES-256-GCM` (Galois/Counter Mode)
*   **Key Derivation Function (KDF)**: `HKDF-SHA256` (HMAC-based Extract-and-Expand Key Derivation Function)
*   **Hash Function**: `SHA-256`
*   **Signature Scheme**: `ECDSA` (Optional Sign-then-Encrypt)

## Key Formats

### Public Keys
*   **Format**: Compressed
*   **Length**: 33 bytes
*   **Prefix**: `0x02` (even y) or `0x03` (odd y)
*   **Legacy Support**: The library can import uncompressed (65-byte) keys but converts them to compressed format for operations and storage.

### Private Keys
*   **Length**: 32 bytes

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
*   **Key Encryption**: Binds the **Recipient ID** to the encrypted key.
*   **Message Encryption**: Binds the **Message Header** to the encrypted payload.

### 3. Multi-Recipient Encryption (Shared Ephemeral Key)
To reduce payload size, a **single ephemeral key pair** is generated for the entire message, rather than one per recipient.
1.  Sender generates Ephemeral Key Pair ($E_{priv}, E_{pub}$).
2.  $E_{pub}$ is stored in the message header (33 bytes).
3.  For each recipient $R_i$:
    *   Compute Shared Secret: $S_i = ECDH(E_{priv}, R_{pub,i})$
    *   Derive Key: $K_i = HKDF(S_i)$
    *   Encrypt Message Key ($M_K$) using $K_i$ via AES-GCM.
    *   **AAD**: Recipient ID ($ID_i$).

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
*   **IV**: 16 bytes
*   **Auth Tag**: 16 bytes
*   **Ciphertext**: 32 bytes (Encrypted Message Key)

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
*   A recipient cannot be surreptitiously swapped.
*   Header metadata (e.g., recipient count, data length) cannot be tampered with without invalidating the decryption.

### 2. Sign-then-Encrypt (Optional)
If a sender private key is provided:
1.  Calculate `Signature = ECDSA_Sign(SenderPriv, Plaintext)`.
2.  Prepend `Signature` (64 bytes, compact) to `Plaintext`.
3.  Encrypt `[Signature + Plaintext]`.
4.  On decryption, if a sender public key is provided, verify the signature after decryption.

### 3. Forward Secrecy (Per Message)
A new random symmetric key is generated for every message. A new ephemeral key pair is generated for every message.

## Constants

*   **IV Size**: 16 bytes
*   **Auth Tag Size**: 16 bytes
*   **Symmetric Key Size**: 32 bytes
*   **Public Key Length**: 33 bytes
*   **Header Min Size**: 46 bytes
