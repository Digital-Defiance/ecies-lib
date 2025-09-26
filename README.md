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
import { PasswordLoginService, Pbkdf2Service } from '@digitaldefiance/ecies-lib';

const passwordService = new PasswordLoginService();

// Derive a login hash with a hardened profile
const passwordBytes = new TextEncoder().encode('xX_password_Xx!');
const pbkdf2 = await Pbkdf2Service.deriveKeyFromPasswordWithProfileAsync(
  passwordBytes,
  'BROWSER_PASSWORD',
);

const loginPayload = await passwordService.generateLoginPayload({
  email: 'alice@example.org',
  password: passwordBytes,
});
```

Check `src/services/password-login.ts` and the comprehensive spec files in `tests/password-login*.spec.ts` and `tests/pbkdf2*.spec.ts` for concrete edge cases.

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

```
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

If you discover a vulnerability, please **do not** open a public issue. Email security@digitaldefiance.io with details so we can coordinate a fix and responsible disclosure timeline.

## License

MIT © Digital Defiance

## Repository

[https://github.com/Digital-Defiance/ecies-lib](https://github.com/Digital-Defiance/ecies-lib)
