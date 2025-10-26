# @digitaldefiance/ecies-lib

A production-ready, browser-friendly implementation of Elliptic Curve Integrated Encryption Scheme (ECIES) and related primitives for modern TypeScript runtimes. The library ships with end-to-end test coverage, high-level services for common workflows, and low-level utilities you can compose to build secure storage, file sharing, and password-login flows.

## Highlights

- **Web & Node compatible** – built around the Web Crypto API (`crypto.subtle`) and `secp256k1` from `@noble/curves`, tested against Node 18+ and headless browser environments.
- **Multiple ECIES modes** – "simple" (no length metadata), "single" (length-prefixed payloads), and a dedicated `EciesMultiRecipient` helper for wrapping symmetric keys across large recipient sets.
- **Typed safety net** – exhaustive error/enum catalog (e.g., `ECIESErrorTypeEnum`, `Pbkdf2ErrorType`, `InvalidEmailErrorType`) backed by strongly typed error classes.
- **Ancillary crypto services** – AES-GCM helpers, PBKDF2 profiles, secure buffers/strings, mnemonic-based key derivation, and password-login tooling.
- **Rock-solid tests** – 380+ Jest specs, including multi-recipient integration, file encryption round-trips, and e2e login flows.

## Installation

```bash
pnpm add @digitaldefiance/ecies-lib
# or
yarn add @digitaldefiance/ecies-lib
# or
npm install @digitaldefiance/ecies-lib
```

> **Runtime requirements**
>
> - Node.js 18+ (ships with the Web Crypto API). For earlier Node versions, polyfill `globalThis.crypto` before importing the library.
> - Browsers with Web Crypto + `BigInt` support (Chromium, Firefox, Safari >= 14).

## Quick start

```ts
import { ECIESService } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();

// 1. Generate deterministic recipient keys from a mnemonic
const recipientMnemonic = ecies.generateNewMnemonic();
const recipientKeys = ecies.mnemonicToSimpleKeyPair(recipientMnemonic);

// 2. Encrypt in "single" mode (length metadata included)
const message = new TextEncoder().encode('Sign the blocks.');
const encrypted = await ecies.encryptSimpleOrSingle(
  false, // false => EciesEncryptionTypeEnum.Single
  recipientKeys.publicKey,
  message,
);

// 3. Decrypt by honoring the header
const decrypted = await ecies.decryptSimpleOrSingleWithHeader(
  false,
  recipientKeys.privateKey,
  encrypted,
);

console.log(new TextDecoder().decode(decrypted)); // "Sign the blocks."
```

## Multi-recipient encryption

The high-level `ECIESService.encrypt` method intentionally throws for `EciesEncryptionTypeEnum.Multiple` until the orchestration layer is finalized. The lower-level `EciesMultiRecipient` helper is fully functional and end-to-end tested.

```ts
import {
  ECIES,
  EciesMultiRecipient,
  EciesCryptoCore,
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

const recipients = await Promise.all(
  [...Array(3)].map(async () => {
    const { privateKey, publicKey } = await core.generateEphemeralKeyPair();
    return {
      id: crypto.getRandomValues(new Uint8Array(ECIES.MULTIPLE.RECIPIENT_ID_SIZE)),
      privateKey,
      publicKey,
    };
  }),
);

const payload = new TextEncoder().encode('Broadcast to the ops team');
const encrypted = await multi.encryptMultiple(
  recipients.map(({ id, publicKey }) => ({ id, publicKey })),
  payload,
);

const transportFrame = concatUint8Arrays(
  multi.buildHeader(encrypted),
  encrypted.encryptedMessage,
);

// Recipient 0 decrypts
const cleartext = await multi.decryptMultipleForRecipient(
  multi.parseMessage(transportFrame),
  recipients[0].id,
  recipients[0].privateKey,
);
```

## File encryption service

`EciesFileService` wraps `ECIESService` to provide authenticated file encryption/decryption in the browser. It streams large files, supports zero-length payloads, and handles download flows.

```ts
import { ECIESService, EciesFileService } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();
const { privateKey, publicKey } = ecies.mnemonicToSimpleKeyPair(ecies.generateNewMnemonic());
const fileService = new EciesFileService(ecies, privateKey);

const encryptedBytes = await fileService.encryptFile(fileInput.files![0], publicKey);
const plainBytes = await fileService.decryptFile(encryptedBytes);
fileService.downloadEncryptedFile(encryptedBytes, `${Date.now()}.enc`);
```

See `src/services/ecies/file.ts` and `tests/services/ecies/file.spec.ts` for stream management details.

## Password login + PBKDF2 helpers

The library also addresses user authentication workflows. `PasswordLoginService` manages PBKDF2 hashing, login challenges, and secure storage, while `Pbkdf2Service` exposes low-level derivation utilities and hardened presets.

```ts
import { 
  PasswordLoginService, 
  Pbkdf2Service, 
  Pbkdf2ProfileEnum,
  I18nEngine 
} from '@digitaldefiance/ecies-lib';

const passwordService = new PasswordLoginService();

// Create a PBKDF2 service with default profiles
const engine = new I18nEngine(); // Your i18n engine instance
const pbkdf2Service = new Pbkdf2Service(engine);

// Or create with custom profiles
const customProfiles = {
  CUSTOM_PROFILE: {
    hashBytes: 32,
    saltBytes: 16,
    iterations: 100000,
    algorithm: 'SHA-256'
  }
};
const customPbkdf2Service = new Pbkdf2Service(engine, customProfiles);

// Derive a login hash with a hardened profile
const passwordBytes = new TextEncoder().encode('xX_password_Xx!');
const pbkdf2Result = await pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
  passwordBytes,
  Pbkdf2ProfileEnum.BROWSER_PASSWORD,
);

const loginPayload = await passwordService.generateLoginPayload({
  email: 'alice@example.org',
  password: passwordBytes,
});
```

Check `src/services/password-login.ts` and the comprehensive spec files in `tests/password-login*.spec.ts` and `tests/pbkdf2*.spec.ts` for concrete edge cases.

### PBKDF2 Service Configuration

The `Pbkdf2Service` constructor accepts an optional profiles parameter, allowing you to customize or extend the default PBKDF2 configurations:

```ts
import { Pbkdf2Service, IPbkdf2Config } from '@digitaldefiance/ecies-lib';

// Using default profiles from constants
const pbkdf2Service = new Pbkdf2Service(engine);

// Using custom profiles
const customProfiles: Record<string, IPbkdf2Config> = {
  HIGH_SECURITY: {
    hashBytes: 64,
    saltBytes: 32, 
    iterations: 200000,
    algorithm: 'SHA-512'
  },
  FAST_TESTING: {
    hashBytes: 32,
    saltBytes: 16,
    iterations: 1000,
    algorithm: 'SHA-256'
  }
};

const customPbkdf2Service = new Pbkdf2Service(engine, customProfiles);

// Use a custom profile
const result = await customPbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
  passwordBytes,
  'HIGH_SECURITY'
);
```

This design allows for dependency injection of PBKDF2 profiles while maintaining backward compatibility with the default configurations.

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

## Secure primitives & value objects

- `SecureString` / `SecureBuffer`: auto-zero, opt-in disposal, and helper methods for dealing with sensitive material.
- `EmailString`: validated wrapper around critical data, catching malformed inputs early.
- `Guid` utilities: strong typing via `ts-brand`, plus brand-aware error classes.

These primitives are exported via `src/index.ts` and come with targeted tests in `tests/email-string.spec.ts`, `src/guid.spec.ts`, etc.

## Error handling

Every failure path maps to a typed error, so consumers can branch without string comparisons. Example:

```ts
import { ECIESError, ECIESErrorTypeEnum } from '@digitaldefiance/ecies-lib';

try {
  await ecies.decryptSimpleOrSingleWithHeader(false, privateKey, tamperedData);
} catch (error) {
  if (error instanceof ECIESError) {
    if (error.type === ECIESErrorTypeEnum.DecryptionFailed) {
      // attempt recovery or alert the user
    }
  }
}
```

## Project structure

```text
packages/digitaldefiance-ecies-lib/
├─ src/
│  ├─ services/          # ECIES, AES-GCM, PBKDF2, password login
│  ├─ errors/            # Typed error classes
│  ├─ enumerations/      # Public enums exported via the barrel
│  ├─ interfaces/        # Shared type definitions
│  ├─ secure-*.ts        # SecureString / SecureBuffer implementations
│  └─ utils.ts           # Buffer/string helpers, CRC, etc.
├─ tests/
│  ├─ services/          # Service-level unit + integration suites
│  ├─ *.spec.ts          # Domain-specific validators and helpers
│  ├─ *.e2e.spec.ts      # Password login, PBKDF2, AES-GCM end-to-end coverage
│  └─ support/           # LocalStorage mocks, custom Jest matchers
└─ jest.config.js
```

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

## Contributing

1. Fork & clone the repo.
2. Install dependencies with `yarn install` (Yarn 4 is already configured via `.yarnrc`).
3. Create a feature branch (`git checkout -b feature/awesome`).
4. Make changes and run `yarn format && yarn lint && yarn test`.
5. Submit a PR with a clear description and test evidence.

Bug reports and feature requests are welcome—open an issue with reproduction steps and expected behavior.

## Security

If you discover a vulnerability, please **do not** open a public issue. Email <security@digitaldefiance.io> with details so we can coordinate a fix and responsible disclosure timeline.

## License

MIT © Digital Defiance

## Repository

[https://github.com/Digital-Defiance/ecies-lib](https://github.com/Digital-Defiance/ecies-lib)

## ChangeLog

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
