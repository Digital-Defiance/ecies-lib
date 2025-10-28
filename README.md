# @digitaldefiance/ecies-lib

A production-ready, browser-friendly implementation of Elliptic Curve Integrated Encryption Scheme (ECIES) and related cryptographic primitives for modern TypeScript runtimes. Built on Web Crypto API and @noble/curves, this library provides comprehensive encryption, key management, and authentication services with full internationalization support. This package is also binary compatible with @digitaldefiance/node-ecies-lib, enabling seamless cross-platform cryptographic operations.

## Key Features

### Core Cryptography
- **ECIES Encryption** – Three modes: Simple (minimal overhead), Single (length-prefixed), and Multiple (multi-recipient)
- **Elliptic Curve Operations** – secp256k1 curve for ECDH key exchange and ECDSA signatures
- **AES-GCM Encryption** – Authenticated symmetric encryption with Web Crypto API
- **PBKDF2 Key Derivation** – Configurable profiles for password-based key generation

### Key Management
- **BIP39 Mnemonic Support** – Generate and derive keys from 12/15/18/21/24-word mnemonics
- **HD Wallet Integration** – BIP32/BIP44 hierarchical deterministic key derivation
- **Member System** – Complete user/member abstraction with cryptographic operations
- **Secure Storage** – Memory-safe SecureString and SecureBuffer with auto-zeroing

### Advanced Features
- **Multi-Recipient Encryption** – Efficiently encrypt for up to 65,535 recipients
- **File Encryption Service** – Chunked file encryption with streaming support
- **Password Login System** – Complete authentication flow with encrypted key storage
- **Signature Operations** – ECDSA message signing and verification

### Developer Experience
- **Full TypeScript Support** – Comprehensive type definitions and interfaces
- **Internationalization** – Error messages in English, French, Spanish, Chinese, and Ukrainian
- **Runtime Configuration** – Injectable configuration profiles for different security requirements
- **Extensive Testing** – 380+ test specs covering unit, integration, and e2e scenarios
- **Cross-Platform** – Works in Node.js 18+ and modern browsers

## Installation

```bash
npm install @digitaldefiance/ecies-lib
# or
yarn add @digitaldefiance/ecies-lib
# or
pnpm add @digitaldefiance/ecies-lib
```

### Runtime Requirements

- **Node.js**: Version 18+ (includes Web Crypto API)
  - For Node < 18, polyfill `globalThis.crypto` before importing
- **Browsers**: Modern browsers with Web Crypto API and BigInt support
  - Chrome/Edge 60+
  - Firefox 60+
  - Safari 14+
  - Opera 47+

### Dependencies

The library has minimal peer dependencies:
- `@digitaldefiance/i18n-lib` - Internationalization engine
- `@noble/curves` - Elliptic curve cryptography
- `@scure/bip32`, `@scure/bip39` - HD wallet and mnemonic support
- `@ethereumjs/wallet` - Ethereum wallet compatibility

## Quick Start

### Basic Encryption/Decryption

```typescript
import { ECIESService } from '@digitaldefiance/ecies-lib';

// Initialize the service
const ecies = new ECIESService();

// Generate a mnemonic and derive keys
const mnemonic = ecies.generateNewMnemonic();
const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

// Encrypt a message
const message = new TextEncoder().encode('Hello, World!');
const encrypted = await ecies.encryptSimpleOrSingle(
  false, // false = Single mode (with length prefix)
  publicKey,
  message
);

// Decrypt the message
const decrypted = await ecies.decryptSimpleOrSingleWithHeader(
  false,
  privateKey,
  encrypted
);

console.log(new TextDecoder().decode(decrypted)); // "Hello, World!"
```

### Using the Member System

```typescript
import { ECIESService, Member, MemberType, EmailString } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();

// Create a new member with generated keys
const { member, mnemonic } = Member.newMember(
  ecies,
  MemberType.User,
  'Alice',
  new EmailString('alice@example.com')
);

// Encrypt data for the member
const data = 'Sensitive information';
const encrypted = await member.encryptData(data);

// Decrypt the data
const decrypted = await member.decryptData(encrypted);
console.log(new TextDecoder().decode(decrypted));

// Sign and verify messages
const signature = member.sign(new TextEncoder().encode('Message'));
const isValid = member.verify(signature, new TextEncoder().encode('Message'));
```

## Core Services

### ECIESService - Main Encryption Service

The primary service for ECIES operations:

```typescript
import { ECIESService, EciesEncryptionTypeEnum } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();

// Generate keys
const mnemonic = ecies.generateNewMnemonic();
const { wallet, seed } = ecies.walletAndSeedFromMnemonic(mnemonic);
const { privateKey, publicKey } = ecies.seedToSimpleKeyPair(seed);

// Simple mode - minimal overhead, no length prefix
const simpleEncrypted = await ecies.encryptSimpleOrSingle(
  true,  // true = Simple mode
  publicKey,
  message
);

// Single mode - includes length prefix for validation
const singleEncrypted = await ecies.encryptSimpleOrSingle(
  false, // false = Single mode
  publicKey,
  message
);

// Decrypt with automatic header parsing
const decrypted = await ecies.decryptSimpleOrSingleWithHeader(
  false,
  privateKey,
  singleEncrypted
);
```

### Multi-Recipient Encryption

Encrypt once for multiple recipients efficiently:

```typescript
import {
  EciesMultiRecipient,
  EciesCryptoCore,
  ECIES,
  concatUint8Arrays,
} from '@digitaldefiance/ecies-lib';

const config = {
  curveName: ECIES.CURVE_NAME,
  primaryKeyDerivationPath: ECIES.PRIMARY_KEY_DERIVATION_PATH,
  mnemonicStrength: ECIES.MNEMONIC_STRENGTH,
  symmetricAlgorithm: ECIES.SYMMETRIC.ALGORITHM,
  symmetricKeyBits: ECIES.SYMMETRIC.KEY_BITS,
  symmetricKeyMode: ECIES.SYMMETRIC.MODE,
};

const multi = new EciesMultiRecipient(config);
const core = new EciesCryptoCore(config);

// Generate recipients
const recipients = await Promise.all(
  [...Array(3)].map(async () => {
    const { privateKey, publicKey } = await core.generateEphemeralKeyPair();
    return {
      id: crypto.getRandomValues(new Uint8Array(ECIES.MULTIPLE.RECIPIENT_ID_SIZE)),
      privateKey,
      publicKey,
    };
  })
);

// Encrypt for all recipients
const message = new TextEncoder().encode('Broadcast message');
const encrypted = await multi.encryptMultiple(
  recipients.map(({ id, publicKey }) => ({ id, publicKey })),
  message
);

// Build transport frame
const frame = concatUint8Arrays(
  multi.buildHeader(encrypted),
  encrypted.encryptedMessage
);

// Any recipient can decrypt
const decrypted = await multi.decryptMultipleForRecipient(
  multi.parseMessage(frame),
  recipients[0].id,
  recipients[0].privateKey
);
```

### File Encryption Service

Chunked file encryption for large files:

```typescript
import { ECIESService, EciesFileService } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();
const mnemonic = ecies.generateNewMnemonic();
const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

// Initialize file service with user's private key
const fileService = new EciesFileService(ecies, privateKey);

// Encrypt a file (browser File object)
const file = fileInput.files[0];
const encrypted = await fileService.encryptFile(file, publicKey);

// Decrypt the file
const decrypted = await fileService.decryptFile(encrypted);

// Download encrypted file
fileService.downloadEncryptedFile(encrypted, 'document.enc');

// Download decrypted file
fileService.downloadDecryptedFile(decrypted, 'document.pdf');
```

The file service:
- Chunks files into 1MB segments for memory efficiency
- Encrypts each chunk independently
- Includes metadata header with chunk information
- Supports files of any size within browser memory limits

### Password Login Service

Complete password-based authentication system:

```typescript
import {
  ECIESService,
  PasswordLoginService,
  Pbkdf2Service,
  Pbkdf2ProfileEnum,
  SecureString,
  getEciesI18nEngine,
} from '@digitaldefiance/ecies-lib';

const engine = getEciesI18nEngine();
const ecies = new ECIESService();
const pbkdf2 = new Pbkdf2Service(engine);
const passwordLogin = new PasswordLoginService(ecies, pbkdf2, engine);

// Setup password login (first time)
const mnemonic = ecies.generateNewMnemonic();
const password = new SecureString('MySecurePassword123!');

const wallet = await passwordLogin.setupPasswordLoginLocalStorageBundle(
  mnemonic,
  password,
  Pbkdf2ProfileEnum.BROWSER_PASSWORD
);

// Later: Login with password
const { wallet: recoveredWallet, mnemonic: recoveredMnemonic } =
  await passwordLogin.getWalletAndMnemonicFromLocalStorageBundle(password);

// Check if password login is configured
if (PasswordLoginService.isPasswordLoginSetup()) {
  console.log('Password login is ready');
}
```

### PBKDF2 Service

Flexible key derivation with configurable profiles:

```typescript
import {
  Pbkdf2Service,
  Pbkdf2ProfileEnum,
  IPbkdf2Config,
  getEciesI18nEngine,
} from '@digitaldefiance/ecies-lib';

const engine = getEciesI18nEngine();
const pbkdf2 = new Pbkdf2Service(engine);

// Use predefined profiles
const password = new TextEncoder().encode('password123');
const result = await pbkdf2.deriveKeyFromPasswordWithProfileAsync(
  password,
  Pbkdf2ProfileEnum.HIGH_SECURITY
);

console.log(result.hash);       // Derived key
console.log(result.salt);       // Random salt used
console.log(result.iterations); // Iteration count

// Custom profiles
const customProfiles: Record<string, IPbkdf2Config> = {
  ULTRA_SECURE: {
    hashBytes: 64,
    saltBytes: 32,
    iterations: 5000000,
    algorithm: 'SHA-512',
  },
  FAST_DEV: {
    hashBytes: 32,
    saltBytes: 16,
    iterations: 1000,
    algorithm: 'SHA-256',
  },
};

const customPbkdf2 = new Pbkdf2Service(engine, customProfiles);
const customResult = await customPbkdf2.deriveKeyFromPasswordWithProfileAsync(
  password,
  'ULTRA_SECURE'
);
```

**Built-in Profiles:**
- `BROWSER_PASSWORD`: 2M iterations, SHA-512, 32-byte hash
- `HIGH_SECURITY`: 5M iterations, SHA-256, 64-byte hash
- `TEST_FAST`: 1K iterations, SHA-512, 32-byte hash (testing only)

## Runtime configuration registry

Many applications need different cryptographic trade-offs for different surfaces—e.g., a login form that prioritizes speed versus an administrative workflow that prefers extreme iteration counts. The library ships a registry that lets you register, retrieve, and extend immutable configuration profiles without mutating the global defaults.

```ts
import {
  DefaultsRegistry,
  registerRuntimeConfiguration,
  getRuntimeConfiguration,
  unregisterRuntimeConfiguration,
  ECIESService,
  Pbkdf2Service,
} from '@digitaldefiance/ecies-lib';

// 1. Register two named profiles
registerRuntimeConfiguration('security-first', {
  PBKDF2: {
    ITERATIONS_PER_SECOND: 3_000_000,
  },
});

registerRuntimeConfiguration(
  'performance-first',
  {
    PBKDF2: {
      ITERATIONS_PER_SECOND: 250_000,
    },
  },
  { baseKey: DefaultsRegistry.DEFAULT_KEY },
);

// 2. Spin up services that honor those profiles
const secureDefaults = getRuntimeConfiguration('security-first');
const secureEcies = new ECIESService(undefined, secureDefaults.ECIES);
const securePbkdf2 = new Pbkdf2Service(engine, secureDefaults.PBKDF2_PROFILES, secureDefaults.ECIES, secureDefaults.PBKDF2);

const perfDefaults = getRuntimeConfiguration('performance-first');
const perfEcies = new ECIESService(undefined, perfDefaults.ECIES);

// 3. Optional: create throwaway profiles without registering them
const temporaryDefaults = DefaultsRegistry.create({ BcryptRounds: 8 });

// 4. Clean up when a profile is no longer needed
unregisterRuntimeConfiguration('performance-first');
```

### Available helpers

All helpers live in `src/defaults.ts` and are re-exported from the package entry point:

- **`Defaults`** – immutable snapshot of the baked-in configuration. It exposes `Defaults.ECIES`, `Defaults.PBKDF2`, regexes, and other primitives used across the library.
- **`createRuntimeConfiguration(overrides, base?)`** – clones a base configuration, applies partial overrides (deep merge), validates invariants, and returns a deeply frozen instance without touching the registry.
- **`DefaultsRegistry`** – registry API with `get`, `register`, `create`, `listKeys`, `has`, `unregister`, and `clear`. Registered profiles are validated and frozen, so consumers can safely share references.
- **Convenience functions** – `getRuntimeConfiguration`, `registerRuntimeConfiguration`, `unregisterRuntimeConfiguration`, and `clearRuntimeConfigurations` wrap the registry for common flows.
- **Regex exports** – `PASSWORD_REGEX` and `MNEMONIC_REGEX` are exported alongside the defaults for consumers that need the raw patterns.

Every configuration produced by these helpers is deeply frozen and validated so low-level invariants (public key length, recipient counts, checksum parameters, etc.) stay consistent. Use `clearRuntimeConfigurations()` in tests to reset back to the default profile.

> **Tip:** Services such as `ECIESService`, `Pbkdf2Service`, `AESGCMService`, and `PasswordLoginService` accept their respective configuration slices as constructor parameters. Wire them up with values from `getRuntimeConfiguration(key)` to scope behavior per feature area or tenant.

### Secure Memory Primitives

Protect sensitive data in memory:

```typescript
import { SecureString, SecureBuffer } from '@digitaldefiance/ecies-lib';

// SecureString - for passwords and mnemonics
const password = new SecureString('MyPassword123');
console.log(password.value);           // Access the value
console.log(password.valueAsHexString); // As hex
console.log(password.length);          // Get length
password.dispose();                    // Zero memory

// SecureBuffer - for binary secrets
const privateKey = new Uint8Array(32);
const secureKey = new SecureBuffer(privateKey);
console.log(secureKey.value);          // Access as Uint8Array
console.log(secureKey.valueAsString);  // As string
console.log(secureKey.valueAsBase64String); // As base64
secureKey.dispose();                   // Zero memory

// Both types:
// - XOR obfuscate data in memory
// - Include checksums for integrity
// - Auto-detect disposal attempts
// - Provide stack traces for debugging
```

### Value Objects

Type-safe wrappers for common data:

```typescript
import { EmailString, GuidV4 } from '@digitaldefiance/ecies-lib';

// Validated email addresses
const email = new EmailString('user@example.com');
console.log(email.toString());
console.log(email.length);

// Will throw on invalid email:
// new EmailString('invalid'); // throws InvalidEmailError

// Type-safe GUIDs with multiple formats
const guid = GuidV4.new();
console.log(guid.asFullHexGuid);    // "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
console.log(guid.asShortHexGuid);   // "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
console.log(guid.asBase64Guid);     // Base64 encoded
console.log(guid.asBigIntGuid);     // As BigInt

// Create from various formats
const fromHex = new GuidV4('550e8400-e29b-41d4-a716-446655440000');
const fromBase64 = new GuidV4('VQ6EAOKbQdSnFkRmVUQAAA==');

// Compare GUIDs
if (guid.equals(fromHex)) {
  console.log('GUIDs match');
}
```

## Error Handling

Comprehensive typed error system with internationalization:

```typescript
import {
  ECIESError,
  ECIESErrorTypeEnum,
  MemberError,
  MemberErrorType,
  GuidError,
  GuidErrorType,
  Pbkdf2Error,
  Pbkdf2ErrorType,
} from '@digitaldefiance/ecies-lib';

// ECIES errors
try {
  await ecies.decryptSimpleOrSingleWithHeader(false, privateKey, tamperedData);
} catch (error) {
  if (error instanceof ECIESError) {
    switch (error.type) {
      case ECIESErrorTypeEnum.DecryptionFailed:
        console.error('Decryption failed - data may be corrupted');
        break;
      case ECIESErrorTypeEnum.InvalidEncryptionType:
        console.error('Invalid encryption type in header');
        break;
      case ECIESErrorTypeEnum.InvalidPublicKey:
        console.error('Public key format is invalid');
        break;
    }
  }
}

// Member errors
try {
  const member = Member.newMember(ecies, MemberType.User, '', email);
} catch (error) {
  if (error instanceof MemberError) {
    if (error.type === MemberErrorType.MissingMemberName) {
      console.error('Member name is required');
    }
  }
}

// All errors include:
// - Typed error codes (enums)
// - Localized messages (6 languages)
// - Stack traces
// - Optional context data
```

**Error Categories:**
- `ECIESError` - Encryption/decryption failures
- `MemberError` - Member operations
- `GuidError` - GUID validation
- `Pbkdf2Error` - Key derivation
- `LengthError` - Data length validation
- `SecureStorageError` - Secure memory operations
- `InvalidEmailError` - Email validation

## Architecture

### Project Structure

```
packages/digitaldefiance-ecies-lib/
├── src/
│   ├── services/
│   │   ├── ecies/              # ECIES implementation
│   │   │   ├── service.ts      # Main ECIESService
│   │   │   ├── crypto-core.ts  # Core crypto operations
│   │   │   ├── multi-recipient.ts  # Multi-recipient encryption
│   │   │   ├── single-recipient.ts # Single recipient encryption
│   │   │   ├── file.ts         # File encryption service
│   │   │   └── signature.ts    # ECDSA signatures
│   │   ├── aes-gcm.ts          # AES-GCM encryption
│   │   ├── pbkdf2.ts           # PBKDF2 key derivation
│   │   ├── password-login.ts   # Password authentication
│   │   └── xor.ts              # XOR obfuscation
│   ├── enumerations/           # Type-safe enums
│   ├── errors/                 # Typed error classes
│   ├── interfaces/             # TypeScript interfaces
│   ├── types/                  # Type definitions
│   ├── constants.ts            # Library constants
│   ├── defaults.ts             # Default configurations
│   ├── member.ts               # Member abstraction
│   ├── secure-string.ts        # Secure string storage
│   ├── secure-buffer.ts        # Secure buffer storage
│   ├── email-string.ts         # Validated email
│   ├── guid.ts                 # GUID utilities
│   ├── utils.ts                # Helper functions
│   ├── i18n-setup.ts           # Internationalization
│   └── index.ts                # Public API
├── tests/
│   ├── services/               # Service tests
│   ├── *.spec.ts               # Unit tests
│   ├── *.e2e.spec.ts           # Integration tests
│   └── support/                # Test utilities
└── package.json
```

### Key Concepts

**Encryption Modes:**
- **Simple**: Minimal overhead, no length prefix (98 bytes overhead)
- **Single**: Includes 8-byte length prefix (106 bytes overhead)
- **Multiple**: Shared symmetric key encrypted for each recipient

**Key Derivation:**
- BIP39 mnemonics → BIP32 HD keys → secp256k1 key pairs
- Deterministic key generation from mnemonic phrases
- Support for custom derivation paths

**Security Features:**
- AES-GCM authenticated encryption (256-bit keys)
- ECDH key agreement on secp256k1 curve
- PBKDF2 password hashing with configurable iterations
- Memory-safe storage with automatic zeroing
- XOR obfuscation for in-memory secrets

## Quality gates

The project ships with mandatory linting, formatting, and testing commands:

```bash
yarn lint           # ESLint across src/**/*.ts
yarn prettier:check # Enforce formatting
yarn test           # Jest unit + e2e suites
yarn build          # Compile TypeScript into dist/
```

Continuous integration mirrors these gates, and the repository currently passes 389 Jest specs (unit + e2e).

## Browser vs. Node tips

- **Node**: Node 18+ exposes `globalThis.crypto`. If you target older runtimes, polyfill before importing the library:

  ```ts
  import { webcrypto } from 'crypto';
  globalThis.crypto = webcrypto as unknown as Crypto;
  ```

- **Browser bundlers**: the package ships TypeScript sources; rely on your bundler (Vite, Webpack, Next.js) to tree-shake unused exports. All external dependencies are ESM-friendly.
- **Memory hygiene**: many helpers (e.g., `SecureBuffer`) provide `.dispose()` to zero sensitive data. Call them when you’re done.

## API Reference

### Main Exports

```typescript
// Services
export { ECIESService } from './services/ecies/service';
export { EciesCryptoCore } from './services/ecies/crypto-core';
export { EciesMultiRecipient } from './services/ecies/multi-recipient';
export { EciesFileService } from './services/ecies/file';
export { AESGCMService } from './services/aes-gcm';
export { Pbkdf2Service } from './services/pbkdf2';
export { PasswordLoginService } from './services/password-login';
export { XorService } from './services/xor';

// Member System
export { Member } from './member';
export { MemberType } from './enumerations/member-type';

// Secure Primitives
export { SecureString } from './secure-string';
export { SecureBuffer } from './secure-buffer';
export { EmailString } from './email-string';
export { GuidV4 } from './guid';

// Configuration
export { Defaults, ECIES, PBKDF2, CHECKSUM } from './defaults';
export { DefaultsRegistry } from './defaults';
export { Constants } from './constants';

// Enumerations
export { EciesEncryptionTypeEnum } from './enumerations/ecies-encryption-type';
export { Pbkdf2ProfileEnum } from './enumerations/pbkdf2-profile';
export { MemberErrorType } from './enumerations/member-error-type';
export { ECIESErrorTypeEnum } from './enumerations/ecies-error-type';

// Errors
export { ECIESError } from './errors/ecies';
export { MemberError } from './errors/member';
export { GuidError } from './errors/guid';
export { Pbkdf2Error } from './errors/pbkdf2';

// Utilities
export * from './utils';

// Internationalization
export { getEciesI18nEngine } from './i18n-setup';
```

## Development

### Building

```bash
yarn install    # Install dependencies
yarn build      # Compile TypeScript
yarn test       # Run test suite
yarn lint       # Check code style
yarn format     # Fix formatting and linting
```

### Testing

```bash
yarn test                  # Run all tests
yarn test:stream          # Stream output
yarn test --watch         # Watch mode
yarn test file.spec.ts    # Run specific test
```

The library includes 380+ test specifications covering:
- Unit tests for all services and utilities
- Integration tests for encryption workflows
- E2E tests for password login and file encryption
- Cross-platform compatibility tests
- Error handling and edge cases

### Code Quality

```bash
yarn lint              # ESLint check
yarn lint:fix          # Auto-fix issues
yarn prettier:check    # Format check
yarn prettier:fix      # Auto-format
yarn format            # Fix all issues
```

## Platform-Specific Notes

### Node.js

Node.js 18+ includes Web Crypto API by default. For older versions:

```typescript
import { webcrypto } from 'crypto';
globalThis.crypto = webcrypto as unknown as Crypto;
```

### Browser

The library works in all modern browsers:
- Uses Web Crypto API for cryptographic operations
- No polyfills required for modern browsers
- Tree-shakeable with modern bundlers (Vite, Webpack, Rollup)
- All dependencies are ESM-compatible

### Bundler Configuration

**Vite:**
```javascript
// vite.config.js
export default {
  optimizeDeps: {
    include: ['@digitaldefiance/ecies-lib']
  }
}
```

**Webpack:**
```javascript
// webpack.config.js
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

Always dispose of sensitive data:

```typescript
const password = new SecureString('secret');
try {
  // Use password
} finally {
  password.dispose(); // Zeros memory
}

const privateKey = new SecureBuffer(keyBytes);
try {
  // Use key
} finally {
  privateKey.dispose(); // Zeros memory
}
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

## Repository

[https://github.com/Digital-Defiance/ecies-lib](https://github.com/Digital-Defiance/ecies-lib)

## ChangeLog

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
