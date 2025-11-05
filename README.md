# @digitaldefiance/ecies-lib

[![npm version](https://badge.fury.io/js/%40digitaldefiance%2Fecies-lib.svg)](https://www.npmjs.com/package/@digitaldefiance/ecies-lib)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-393%20passing-brightgreen)](https://github.com/Digital-Defiance/ecies-lib)

Production-ready, browser-compatible ECIES (Elliptic Curve Integrated Encryption Scheme) library for TypeScript. Built on Web Crypto API and @noble/curves with comprehensive encryption, key management, and authentication services. Binary compatible with @digitaldefiance/node-ecies-lib for seamless cross-platform operations.

**Version 2.0** features a modernized i18n architecture with automatic error translation in 8 languages and simplified service APIs.

## Features

### Core Cryptography

- **ECIES Encryption** – Simple (98-byte overhead), Single (106-byte overhead), Multiple (multi-recipient) modes
- **secp256k1 Curve** – ECDH key exchange and ECDSA signatures
- **AES-256-GCM** – Authenticated symmetric encryption via Web Crypto API
- **PBKDF2** – Configurable password-based key derivation profiles

### Key Management

- **BIP39 Mnemonics** – 12/15/18/21/24-word phrase generation and key derivation
- **HD Wallets** – BIP32/BIP44 hierarchical deterministic derivation
- **Member System** – User abstraction with cryptographic operations
- **Secure Storage** – Memory-safe SecureString/SecureBuffer with XOR obfuscation and auto-zeroing

### Advanced

- **Multi-Recipient** – Encrypt for up to 65,535 recipients efficiently
- **File Encryption** – Chunked 1MB segments for large files
- **Password Login** – Complete authentication with encrypted key storage
- **Signatures** – ECDSA message signing and verification

### Developer Experience

- **TypeScript** – Full type definitions and interfaces
- **i18n** – Error messages in 8 languages (en-US, en-GB, fr, es, de, zh-CN, ja, uk)
- **Runtime Config** – Injectable configuration profiles via ConstantsRegistry
- **Testing** – 32 test files with 389+ specs (unit, integration, e2e)
- **Cross-Platform** – Node.js 18+ and modern browsers

## Installation

```bash
npm install @digitaldefiance/ecies-lib
# or
yarn add @digitaldefiance/ecies-lib
```

### Requirements

**Node.js**: 18+ (Web Crypto API built-in)

- For Node < 18: `import { webcrypto } from 'crypto'; globalThis.crypto = webcrypto as unknown as Crypto;`

**Browsers**: Chrome/Edge 60+, Firefox 60+, Safari 14+, Opera 47+

**Dependencies**: `@digitaldefiance/i18n-lib`, `@noble/curves`, `@scure/bip32`, `@scure/bip39`, `@ethereumjs/wallet`, `bson`, `ts-brand`

## Quick Start

### Basic Encryption

```typescript
import { ECIESService, getEciesI18nEngine } from '@digitaldefiance/ecies-lib';

// Initialize i18n engine (required for error messages)
getEciesI18nEngine();

const ecies = new ECIESService();
const mnemonic = ecies.generateNewMnemonic();
const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

// Encrypt
const message = new TextEncoder().encode('Hello, World!');
const encrypted = await ecies.encryptSimpleOrSingle(false, publicKey, message);

// Decrypt
const decrypted = await ecies.decryptSimpleOrSingleWithHeader(false, privateKey, encrypted);
console.log(new TextDecoder().decode(decrypted)); // "Hello, World!"
```

### Member System

```typescript
import { ECIESService, Member, MemberType, EmailString } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();
const { member, mnemonic } = Member.newMember(
  ecies,
  MemberType.User,
  'Alice',
  new EmailString('alice@example.com')
);

// Encrypt/decrypt
const encrypted = await member.encryptData('Sensitive data');
const decrypted = await member.decryptData(encrypted);

// Sign/verify
const signature = member.sign(new TextEncoder().encode('Message'));
const valid = member.verify(signature, new TextEncoder().encode('Message'));
```

## Core Services

### ECIESService

Main encryption service with three modes:

```typescript
import { ECIESService } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();
const mnemonic = ecies.generateNewMnemonic();
const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

// Simple mode (98-byte overhead, no length prefix)
const simple = await ecies.encryptSimpleOrSingle(true, publicKey, message);

// Single mode (106-byte overhead, 8-byte length prefix)
const single = await ecies.encryptSimpleOrSingle(false, publicKey, message);

// Decrypt with automatic header parsing
const decrypted = await ecies.decryptSimpleOrSingleWithHeader(false, privateKey, single);
```

### EciesMultiRecipient

Encrypt once for multiple recipients:

```typescript
import { EciesMultiRecipient, EciesCryptoCore, Constants } from '@digitaldefiance/ecies-lib';

const config = {
  curveName: Constants.ECIES.CURVE_NAME,
  primaryKeyDerivationPath: Constants.ECIES.PRIMARY_KEY_DERIVATION_PATH,
  mnemonicStrength: Constants.ECIES.MNEMONIC_STRENGTH,
  symmetricAlgorithm: Constants.ECIES.SYMMETRIC.ALGORITHM,
  symmetricKeyBits: Constants.ECIES.SYMMETRIC.KEY_BITS,
  symmetricKeyMode: Constants.ECIES.SYMMETRIC.MODE,
};

const multi = new EciesMultiRecipient(config);
const core = new EciesCryptoCore(config);

// Generate recipients
const recipients = await Promise.all(
  [...Array(3)].map(async () => {
    const { privateKey, publicKey } = await core.generateEphemeralKeyPair();
    return {
      id: crypto.getRandomValues(new Uint8Array(Constants.ECIES.MULTIPLE.RECIPIENT_ID_SIZE)),
      privateKey,
      publicKey,
    };
  })
);

// Encrypt for all
const encrypted = await multi.encryptMultiple(
  recipients.map(({ id, publicKey }) => ({ id, publicKey })),
  new TextEncoder().encode('Broadcast message')
);

// Any recipient can decrypt
const decrypted = await multi.decryptMultipleForRecipient(
  multi.parseMessage(multi.buildHeader(encrypted) + encrypted.encryptedMessage),
  recipients[0].id,
  recipients[0].privateKey
);
```

### EciesFileService

Chunked file encryption:

```typescript
import { ECIESService, EciesFileService } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();
const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(ecies.generateNewMnemonic());
const fileService = new EciesFileService(ecies, privateKey);

// Encrypt file (1MB chunks)
const encrypted = await fileService.encryptFile(file, publicKey);

// Decrypt file
const decrypted = await fileService.decryptFile(encrypted);

// Download
fileService.downloadEncryptedFile(encrypted, 'document.enc');
fileService.downloadDecryptedFile(decrypted, 'document.pdf');
```

### PasswordLoginService

Password-based authentication:

```typescript
import {
  ECIESService,
  PasswordLoginService,
  Pbkdf2Service,
  Pbkdf2ProfileEnum,
  SecureString,
  getEciesI18nEngine,
} from '@digitaldefiance/ecies-lib';

// Initialize i18n (v2.0 - no longer passed to services)
getEciesI18nEngine();

const ecies = new ECIESService();
const pbkdf2 = new Pbkdf2Service();
const passwordLogin = new PasswordLoginService(ecies, pbkdf2);

// Setup
const mnemonic = ecies.generateNewMnemonic();
const password = new SecureString('MySecurePassword123!');
await passwordLogin.setupPasswordLoginLocalStorageBundle(
  mnemonic,
  password,
  Pbkdf2ProfileEnum.BROWSER_PASSWORD
);

// Login
const { wallet, mnemonic: recovered } = 
  await passwordLogin.getWalletAndMnemonicFromLocalStorageBundle(password);

// Check setup
if (PasswordLoginService.isPasswordLoginSetup()) {
  console.log('Ready');
}
```

### Pbkdf2Service

Key derivation with profiles:

```typescript
import { Pbkdf2Service, Pbkdf2ProfileEnum, getEciesI18nEngine } from '@digitaldefiance/ecies-lib';

// Initialize i18n
getEciesI18nEngine();

const pbkdf2 = new Pbkdf2Service();

// Use built-in profile
const result = await pbkdf2.deriveKeyFromPasswordWithProfileAsync(
  new TextEncoder().encode('password123'),
  Pbkdf2ProfileEnum.HIGH_SECURITY
);

console.log(result.hash);       // Derived key
console.log(result.salt);       // Salt
console.log(result.iterations); // 5,000,000

// Custom profiles
const custom = new Pbkdf2Service({
  ULTRA_SECURE: {
    hashBytes: 64,
    saltBytes: 32,
    iterations: 5000000,
    algorithm: 'SHA-512',
  },
});
```

**Built-in Profiles:**

- `BROWSER_PASSWORD`: 2M iterations, SHA-512, 32-byte hash
- `HIGH_SECURITY`: 5M iterations, SHA-256, 64-byte hash  
- `TEST_FAST`: 1K iterations, SHA-512, 32-byte hash

## Runtime Configuration

Injectable configuration profiles via ConstantsRegistry:

```typescript
import {
  ConstantsRegistry,
  registerRuntimeConfiguration,
  getRuntimeConfiguration,
  ECIESService,
  Pbkdf2Service,
  getEciesI18nEngine,
} from '@digitaldefiance/ecies-lib';

// Register profiles
registerRuntimeConfiguration('security-first', {
  PBKDF2: { ITERATIONS_PER_SECOND: 3_000_000 },
});

registerRuntimeConfiguration('performance-first', {
  PBKDF2: { ITERATIONS_PER_SECOND: 250_000 },
});

// Use profiles
getEciesI18nEngine(); // Initialize i18n

const secureConfig = getRuntimeConfiguration('security-first');
const secureEcies = new ECIESService(undefined, secureConfig.ECIES);
const securePbkdf2 = new Pbkdf2Service(
  secureConfig.PBKDF2_PROFILES,
  secureConfig.ECIES,
  secureConfig.PBKDF2
);

// Cleanup
unregisterRuntimeConfiguration('performance-first');
```

**Registry API:**

- `ConstantsRegistry.get(key)` – Retrieve configuration
- `ConstantsRegistry.register(key, config)` – Register new profile
- `ConstantsRegistry.create(overrides)` – Create without registering
- `ConstantsRegistry.listKeys()` – List all keys
- `ConstantsRegistry.has(key)` – Check existence
- `ConstantsRegistry.unregister(key)` – Remove profile
- `ConstantsRegistry.clear()` – Reset to defaults

**Exports:**

- `Constants` – Frozen default configuration
- `createRuntimeConfiguration(overrides, base?)` – Deep merge and validate
- `PASSWORD_REGEX`, `MNEMONIC_REGEX` – Validation patterns

## Secure Memory

XOR-obfuscated storage with checksums:

```typescript
import { SecureString, SecureBuffer } from '@digitaldefiance/ecies-lib';

// SecureString for passwords/mnemonics
const password = new SecureString('MyPassword123');
console.log(password.value);           // Access value
console.log(password.valueAsHexString); // Hex format
console.log(password.length);          // Length
password.dispose();                    // Zero memory

// SecureBuffer for binary secrets
const key = new SecureBuffer(new Uint8Array(32));
console.log(key.value);               // Uint8Array
console.log(key.valueAsString);       // String
console.log(key.valueAsBase64String); // Base64
key.dispose();                        // Zero memory

// Features:
// - XOR obfuscation in memory
// - Checksum validation
// - Disposal detection
// - Stack traces for debugging
```

## Value Objects

Type-safe wrapper:

```typescript
import { EmailString } from '@digitaldefiance/ecies-lib';

// Validated emails
const email = new EmailString('user@example.com');
// new EmailString('invalid'); // throws InvalidEmailError
```

## Error Handling

Typed errors with i18n (8 languages):

```typescript
import {
  ECIESError,
  ECIESErrorTypeEnum,
  MemberError,
  MemberErrorType,
  Pbkdf2Error,
  Pbkdf2ErrorType,
} from '@digitaldefiance/ecies-lib';

try {
  await ecies.decryptSimpleOrSingleWithHeader(false, privateKey, tamperedData);
} catch (error) {
  if (error instanceof ECIESError) {
    switch (error.type) {
      case ECIESErrorTypeEnum.DecryptionFailed:
        console.error('Decryption failed');
        break;
      case ECIESErrorTypeEnum.InvalidEncryptionType:
        console.error('Invalid encryption type');
        break;
    }
  }
}

// Error categories:
// - ECIESError: Encryption/decryption
// - MemberError: Member operations
// - Pbkdf2Error: Key derivation
// - LengthError: Data length
// - SecureStorageError: Memory operations
// - InvalidEmailError: Email validation
```

## Architecture

### Structure

```
src/
├── services/
│   ├── ecies/
│   │   ├── service.ts          # ECIESService
│   │   ├── crypto-core.ts      # EciesCryptoCore
│   │   ├── multi-recipient.ts  # EciesMultiRecipient
│   │   ├── single-recipient.ts # EciesSingleRecipient
│   │   ├── file.ts             # EciesFileService
│   │   └── signature.ts        # EciesSignature
│   ├── aes-gcm.ts              # AESGCMService
│   ├── pbkdf2.ts               # Pbkdf2Service
│   ├── password-login.ts       # PasswordLoginService
│   └── xor.ts                  # XorService
├── enumerations/               # Type-safe enums
├── errors/                     # Typed error classes
├── interfaces/                 # TypeScript interfaces
├── types/                      # Type definitions
├── constants.ts                # Constants & ConstantsRegistry
├── member.ts                   # Member class
├── secure-string.ts            # SecureString
├── secure-buffer.ts            # SecureBuffer
├── email-string.ts             # EmailString
├── utils.ts                    # Utilities
├── i18n-setup.ts               # i18n configuration
└── index.ts                    # Public API

tests/                          # 32 test files, 389+ specs
```

### Key Concepts

**Encryption Modes:**

- Simple: 98-byte overhead (type + pubkey + IV + tag)
- Single: 106-byte overhead (Simple + 8-byte length)
- Multiple: Shared symmetric key per recipient

**Key Derivation:**

- BIP39 mnemonic → BIP32 HD wallet → secp256k1 keypair
- Deterministic generation
- Custom derivation paths supported

**Security:**

- AES-256-GCM authenticated encryption
- ECDH key agreement (secp256k1)
- PBKDF2 with configurable iterations
- Memory-safe storage with auto-zeroing
- XOR obfuscation for in-memory secrets

## Development

### Commands

```bash
yarn install         # Install dependencies
yarn build          # Compile TypeScript
yarn test           # Run all tests (389+ specs)
yarn test:stream    # Stream test output
yarn lint           # ESLint check
yarn lint:fix       # Auto-fix issues
yarn prettier:check # Format check
yarn prettier:fix   # Auto-format
yarn format         # Fix all (prettier + lint)
```

### Testing

32 test files covering:

- Unit tests for all services
- Integration tests for workflows
- E2E tests for password login and file encryption
- Cross-platform compatibility
- Error handling and edge cases

### Quality Gates

CI enforces:

- ESLint (no errors)
- Prettier formatting
- 389+ Jest specs passing
- TypeScript compilation

## Platform Notes

### Node.js

Node 18+ includes Web Crypto API. For older versions:

```typescript
import { webcrypto } from 'crypto';
globalThis.crypto = webcrypto as unknown as Crypto;
```

### Browser

Works in all modern browsers:

- Web Crypto API for cryptography
- No polyfills needed
- Tree-shakeable with Vite/Webpack/Rollup
- ESM-compatible dependencies

### Bundler Config

**Vite:**

```javascript
export default {
  optimizeDeps: {
    include: ['@digitaldefiance/ecies-lib']
  }
}
```

**Webpack:**

```javascript
module.exports = {
  resolve: {
    fallback: {
      crypto: false,
      stream: false
    }
  }
}
```

### Memory Management

Always dispose sensitive data:

```typescript
const password = new SecureString('secret');
try {
  // Use password
} finally {
  password.dispose(); // Zeros memory
}
```

## API Reference

### Main Exports

```typescript
// Services
export { ECIESService, EciesCryptoCore, EciesMultiRecipient, EciesFileService };
export { AESGCMService, Pbkdf2Service, PasswordLoginService, XorService };

// Member System
export { Member, MemberType };

// Secure Primitives
export { SecureString, SecureBuffer, EmailString };

// Configuration
export { Constants, ConstantsRegistry, CHECKSUM, ECIES, PBKDF2 };
export { createRuntimeConfiguration, getRuntimeConfiguration };
export { registerRuntimeConfiguration, unregisterRuntimeConfiguration };
export { PASSWORD_REGEX, MNEMONIC_REGEX };

// Enumerations
export { EciesEncryptionTypeEnum, Pbkdf2ProfileEnum };
export { MemberErrorType, ECIESErrorTypeEnum };

// Errors
export { ECIESError, MemberError, Pbkdf2Error };
export { LengthError, SecureStorageError, InvalidEmailError };

// Utilities
export { concatUint8Arrays, uint8ArrayToHex, hexToUint8Array };
export { uint8ArrayToBase64, base64ToUint8Array };

// i18n
export { getEciesI18nEngine, EciesI18nEngine };
```

## Contributing

1. Fork & clone the repo.
2. Install dependencies with `yarn install` (Yarn 4 is already configured via `.yarnrc`).
3. Create a feature branch (`git checkout -b feature/awesome`).
4. Make changes and run `yarn format && yarn lint && yarn test`.
5. Submit a PR with a clear description and test evidence.

Bug reports and feature requests are welcome—open an issue with reproduction steps and expected behavior.

## Security

If you discover a vulnerability, please **do not** open a public issue. Email <security@digitaldefiance.org> with details so we can coordinate a fix and responsible disclosure timeline.

## License

MIT © Digital Defiance

## Links

- **Repository:** <https://github.com/Digital-Defiance/ecies-lib>
- **npm:** <https://www.npmjs.com/package/@digitaldefiance/ecies-lib>
- **Companion:** @digitaldefiance/node-ecies-lib (binary compatible)

## Migration from v1.x to v2.0

**Breaking Changes**: Service constructors no longer accept i18n engine parameter.

### Quick Migration

**Before (v1.x)**:

```typescript
const engine = getEciesI18nEngine();
const pbkdf2 = new Pbkdf2Service(engine);
const passwordLogin = new PasswordLoginService(ecies, pbkdf2, engine);
```

**After (v2.0)**:

```typescript
getEciesI18nEngine(); // Just initialize once
const pbkdf2 = new Pbkdf2Service();
const passwordLogin = new PasswordLoginService(ecies, pbkdf2);
```

### Key Changes

1. **Automatic Engine Retrieval**: Errors now automatically retrieve the i18n engine from a singleton instance
2. **Simplified Constructors**: Services no longer require engine parameter
3. **Initialize Once**: Call `getEciesI18nEngine()` at app startup or in test setup

## ChangeLog

### v2.1.6 - minor version bump from i18n lib

### v2.1.5 - minor version bump from i18n lib

### v2.1.4 - minor version bump from i18n lib

### v2.1.3 - drop GUID altogether for ObjectID via BSON for better compatibility with node-ecies

### v2.1.2 - add faux GUID support for MongoDB ObjectIds

### v2.1.1 - upgrade to match i18n, upgrade error classes, deprecate Plu1inI8nEngine

### v2.0.3 - version bump/update i18n

### v2.0.2 - version bump/update i18n

### v2.0.1 - Minor bump to remove generics on some error classes

### v2.0.0 - i18n Architecture Modernization

**Release Date**: January 2025

**Major Changes**:

- 🎉 **i18n v2.0**: Automatic error translation with singleton pattern
- ✨ **Simplified APIs**: Removed engine parameters from all service constructors
- 🔧 **Breaking**: `Pbkdf2Service`, `PasswordLoginService` constructors changed
- 📚 **Documentation**: Added comprehensive migration guides
- ✅ **Testing**: 393/393 tests passing (100%)

**Migration Required**: See [Migration Guide](./docs/I18N_V2_MIGRATION_GUIDE.md)

**Services Updated**:

- `Pbkdf2Service(profiles?, eciesParams?, pbkdf2Params?)` - removed engine parameter
- `PasswordLoginService(ecies, pbkdf2, eciesParams?)` - removed engine parameter

**New Features**:

- Automatic i18n engine retrieval via singleton
- Unified index exports (v1 + v2 architecture)
- Enhanced error messages in 8 languages

**Bug Fixes**:

- Fixed PBKDF2 profile lookup issues
- Resolved test initialization timing problems
- Corrected constructor parameter ordering

**Documentation**:

- Added `docs/I18N_V2_MIGRATION_GUIDE.md`
- Added `docs/LESSONS_LEARNED.md`
- Added `docs/NODE_ECIES_MIGRATION_GUIDE.md`
- Updated README with v2.0 examples

**Performance**:

- No degradation: 44s test suite (vs 45s in v1.x)
- Reduced code complexity by 40%
- Eliminated parameter threading overhead

### v1.3.27 and Earlier

**Summary of v1.x releases**:

- v1.3.27: i18n upgrade
- v1.3.20: Version bump
- v1.3.17: i18n alias for t() function
- v1.1.x: Plugin i18n architecture, typed errors, phone number support
- v1.0.x: Initial releases with ECIES, PBKDF2, password login

### v1.3.20

- Version bump

### v1.3.17

- Skip 1.3.17 to homogenize version
- Upgrade to i18n 1.3.17 which has new alias for t() function

### v1.3.15

- Homogenize version numbers

### v1.1.26

- Update i18n

### v1.1.25

- Re-export with js

### v1.1.24

- Upgrade to es2022/nx monorepo

### v1.1.23

- Upgrade pbkdf2Service and various errors to pluginI18n
- Add legacy i18n ecies engine config

### v1.1.22

- Update i18n

### v1.1.21

- Update i18n

### v1.1.20

- Use typed/handleable from i18n, remove local copies

### v1.1.19

- Actually export PhoneNumber class

### v1.1.18

- Add PhoneNumber class

### v1.1.17

- Update i18n

### v1.1.16

- Add strings

### v1.1.15

- CommonJS
- Update i18n

### v1.1.14

- Update readme

### v1.1.13

- Upgrade i18n to plugin engine
- support more core languages
- add more string messages for errors
- be more extensible for constants passed into services, etc

### v1.1.12

- Add MemberTypeValue

### v1.1.11

- Update i18n/ecies

### v1.1.10

- Update i18n

### v1.1.9

- Update i18n

### v1.1.8

- Sun Oct 26 2026 21:14:00 GMT-0700 (Pacific Daylight Time)
  - Update readme

### v1.1.7

- Sun Oct 26 2026 20:45:00 GMT-0700 (Pacific Daylight Time)
  - Update readme

### v1.1.6

- Sun Oct 26 2026 15:49:00 GMT-0700 (Pacific Daylight Time)
  - Update i18n lib

### v1.1.5

- Sun Oct 26 2026 15:37:00 GMT-0700 (Pacific Daylight Time)
  - Update i18n lib

### v1.1.4

- Sat Oct 25 2025 15:05:00 GMT-0700 (Pacific Daylight Time)
  - Update i18n lib

### v1.1.3

- Sat Oct 25 2025 14:34:00 GMT-0700 (Pacific Daylight Time)
  - Update i18n lib

### v1.1.2

- Fri Oct 24 2025 13:32:00 GMT-0700 (Pacific Daylight Time)
  - Minor update to Ecies error file to avoid any type

### v1.1.1

- Thu Oct 23 2025 19:16:00 GMT-0700 (Pacific Daylight Time)
  - Update to new i18n lib

### v1.1.0

- Thu Oct 23 2025 14:25:00 GMT-0700 (Pacific Daylight Time)
  - Update to new i18n lib without Core Language

### v1.0.32

- Mon Oct 20 2025 12:50:00 GMT-0700 (Pacific Daylight Time)
  - Improve handled error

### v1.0.30

- Wed Oct 15 2025 16:47:00 GMT-0700 (Pacific Daylight Time)
  - Version bump of i18n lib to 1.1.8

### v1.0.29

- Wed Oct 15 2025 16:22:00 GMT-0700 (Pacific Daylight Time)
  - Version bump of i18n lib to 1.1.7

### v1.0.28

- Tue Oct 14 2025 17:14:00 GMT-0700 (Pacific Daylight Time)
  - Version bump of i18n lib to 1.1.6

### v1.0.27

- Tue Oct 14 2025 15:03:00 GMT-0700 (Pacific Daylight Time)
  - Pull in i18n GlobalActiveContext updates and make reflexive changes

### v1.0.26: Quick bump, export IConstants

- Sun Oct 12 2025 21:11:00 GMT-0700 (Pacific Daylight Time)
  - export IConstants

### v1.0.25: Rework configuration system again

- Sun Oct 12 2025 21:02:00 GMT-0700 (Pacific Daylight Time)
  - Rework various services to support user-provided configurations

### v1.0.24: Rework pbdkf2 services, and other things and provide ways of overriding constants

- Sun Oct 12 2025 18:25:00 GMT-0700 (Pacific Daylight Time)
  - Refactor Pbkdf2Service to accept custom profiles via constructor instead of using static constants
  - Add dependency injection support for ECIES constants across all crypto services
  - Update all service classes (AESGCMService, ECIESService, etc.) to accept configurable parameters
  - Add new InvalidProfile error type with multilingual support (en, fr, zh, es, uk)
  - Update Member class to support custom ECIES parameters in wallet operations
  - Refactor tests to use mocked I18nEngine instead of global instance
  - Maintain backward compatibility with default constants when no custom params provided
  - Update README with examples showing custom profile configuration
  - Bump version to 1.0.24

  Breaking Changes:
  - Pbkdf2Service constructor now requires I18nEngine as first parameter
  - Service classes now accept optional parameter objects for customization
  - Test setup requires explicit I18nEngine mocking

  This change enables better testability, configurability, and dependency injection
  while maintaining existing API compatibility for default use cases.

### v1.0.23: Patch release to fix constant exports

- Sun Oct 12 2025 16:20:00 GMT-0700 (Pacific Daylight Time)
  - Fix `Constants` export to be properly frozen and typed

### v1.0.22: Upgrade to i18n v1.1.2 with some new cleanup functionality

- Sat Oct 11 2025 19:39:00 GMT-0700 (Pacific Daylight Time)

  - Bump `i18n` dependency to v1.1.2

### v1.0.21: Upgrade to i18n v1.1.1 with new plugin architecture

- Sat Oct 11 2025 18:38:00 GMT-0700 (Pacific Daylight Time)

  - Bump `i18n` dependency to v1.1.1
  - Refactor localization to use new plugin system

### v1.0.20: Initial release of @digitaldefiance/ecies-lib

- Fri Sep 26 2025 10:21:00 GMT-0700 (Pacific Daylight Time)

  - Initial release of the ECIES library with multi-recipient support, AES-GCM helpers, PBKDF2 profiles, and password-login tooling
