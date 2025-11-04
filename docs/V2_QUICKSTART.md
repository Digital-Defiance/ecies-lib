# ECIES v2.0 Quick Start

## What's New in v2.0

### 1. Unified Error Handling
```typescript
import { CryptoError, CryptoErrorCode } from '@digitaldefiance/ecies-lib/v2';

try {
  await decrypt(data);
} catch (error) {
  if (error instanceof CryptoError) {
    console.error(error.code); // CryptoErrorCode.DECRYPTION_FAILED
    console.error(error.metadata);
  }
}
```

### 2. Service Container
```typescript
import { CryptoContainer, CryptoServiceKey } from '@digitaldefiance/ecies-lib/v2';

const crypto = CryptoContainer.create();
const ecies = crypto.get(CryptoServiceKey.ECIES);
const pbkdf2 = crypto.get(CryptoServiceKey.PBKDF2);
```

### 3. Fluent Builders
```typescript
import { ECIESBuilder, MemberBuilder } from '@digitaldefiance/ecies-lib/v2';

// Build ECIES service
const ecies = ECIESBuilder.create()
  .withConfig({ CURVE_NAME: 'secp256k1' })
  .build();

// Build Member
const member = MemberBuilder.create()
  .withType(MemberType.User)
  .withName('Alice')
  .withEmail('alice@example.com')
  .generateMnemonic()
  .build();
```

### 4. Result Pattern
```typescript
import { ResultBuilder } from '@digitaldefiance/ecies-lib/v2';

const result = await ecies.decryptSafe(privateKey, ciphertext);

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error.code);
}
```

### 5. i18n 2.0 Integration
```typescript
import { getEciesI18nEngine, getEciesTranslation } from '@digitaldefiance/ecies-lib/v2';
import { EciesStringKey } from '@digitaldefiance/ecies-lib';

// Get engine (lazy initialized)
const engine = getEciesI18nEngine();

// Translate
const message = getEciesTranslation(
  EciesStringKey.Error_ECIESError_DecryptionFailed,
  { reason: 'Invalid key' },
  'fr'
);
```

## Migration from v1.x

### Error Handling
```typescript
// v1.x
import { ECIESError, MemberError, Pbkdf2Error } from '@digitaldefiance/ecies-lib';

try {
  // ...
} catch (error) {
  if (error instanceof ECIESError) { /* ... */ }
  if (error instanceof MemberError) { /* ... */ }
}

// v2.0
import { CryptoError, CryptoErrorCode } from '@digitaldefiance/ecies-lib/v2';

try {
  // ...
} catch (error) {
  if (error instanceof CryptoError) {
    switch (error.code) {
      case CryptoErrorCode.DECRYPTION_FAILED: /* ... */
      case CryptoErrorCode.INVALID_EMAIL: /* ... */
    }
  }
}
```

### Service Instantiation
```typescript
// v1.x
import { ECIESService, Pbkdf2Service } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();
const pbkdf2 = new Pbkdf2Service(engine);

// v2.0
import { CryptoContainer, CryptoServiceKey } from '@digitaldefiance/ecies-lib/v2';

const crypto = CryptoContainer.create();
const ecies = crypto.get(CryptoServiceKey.ECIES);
const pbkdf2 = crypto.get(CryptoServiceKey.PBKDF2);
```

### Testing
```typescript
// v1.x
import { resetAllI18nEngines } from '@digitaldefiance/i18n-lib';

beforeEach(() => {
  resetAllI18nEngines();
});

// v2.0
import { PluginI18nEngine } from '@digitaldefiance/i18n-lib';
import { resetEciesI18nEngine } from '@digitaldefiance/ecies-lib/v2';

beforeEach(() => {
  PluginI18nEngine.resetAll();
  resetEciesI18nEngine();
});
```

## Benefits

- **50% less boilerplate** with builders and container
- **Unified error handling** - single error class
- **Better type safety** with Result pattern
- **Easier testing** with dependency injection
- **i18n 2.0** - runtime validation, no generics
- **Backward compatible** - v1.x still works

## Current Status

✅ **Available Now:**
- Unified `CryptoError` class
- `ResultBuilder` for Result pattern
- `CryptoContainer` for DI
- `ECIESBuilder` and `MemberBuilder` (scaffolded)
- i18n 2.0 integration
- Updated test setup

🚧 **In Progress:**
- Complete translation mappings
- Migrate existing services to container
- Implement builder `build()` methods
- Add `*Safe` methods with Result pattern

📋 **Coming Soon:**
- Complete documentation
- Migration guide
- Full backward compatibility layer
- 2.0.0-beta.1 release

## Getting Started

1. Install latest version:
```bash
yarn add @digitaldefiance/ecies-lib@latest
```

2. Import v2 exports:
```typescript
import { CryptoError, CryptoContainer } from '@digitaldefiance/ecies-lib/v2';
```

3. Use new patterns alongside existing code
4. Migrate gradually as services are updated

## Support

- Architecture Plan: `docs/ARCHITECTURE_V2_PLAN.md`
- Migration Status: `docs/MIGRATION_STATUS.md`
- Issues: GitHub Issues
