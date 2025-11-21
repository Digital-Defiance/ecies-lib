# Migration Guide: ecies-lib v3.6.x → v3.7.x

## Overview

Version 3.7.0 introduces a pluggable ID provider system that replaces hardcoded recipient ID sizes. This guide helps you migrate your code from v3.6.x to v3.7.x.

**Breaking Changes:**

- Recipient ID size is now determined by the configured ID provider
- Constants API has changed to support dynamic sizing
- New invariant validation system enforces configuration consistency

**Migration Effort:** Low to Medium
**Estimated Time:** 30 minutes - 2 hours depending on customization

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Breaking Changes](#breaking-changes)
3. [Step-by-Step Migration](#step-by-step-migration)
4. [ID Provider Selection](#id-provider-selection)
5. [Configuration Changes](#configuration-changes)
6. [Testing Your Migration](#testing-your-migration)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Minimal Migration (No Code Changes)

If you're using default ObjectID-based encryption (12 bytes), **no code changes are required**. The default configuration maintains backward compatibility.

```typescript
// v3.6.x - Still works in v3.7.x!
import { ECIESService } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();
const encrypted = await ecies.encrypt(data, publicKey);
```

### If You Were Using Custom Recipient ID Sizes

If you customized `MEMBER_ID_LENGTH` or `RECIPIENT_ID_SIZE` constants:

```typescript
// v3.6.x - Old way (BREAKS in v3.7.x)
import { createRuntimeConfiguration } from '@digitaldefiance/ecies-lib';

const config = createRuntimeConfiguration({
  MEMBER_ID_LENGTH: 32, // ❌ No longer supported
});

// v3.7.x - New way
import { createRuntimeConfiguration } from '@digitaldefiance/ecies-lib';

const config = createRuntimeConfiguration({
  idProvider: new Legacy32ByteProvider(), // ✅ Use ID provider
});
```

---

## Breaking Changes

### 1. Direct Constant Assignments No Longer Work

**Before (v3.6.x):**

```typescript
const config = createRuntimeConfiguration({
  MEMBER_ID_LENGTH: 16,
  ECIES: {
    MULTIPLE: {
      RECIPIENT_ID_SIZE: 16,
    },
  },
});
```

**After (v3.7.x):**

```typescript
import { GuidV4Provider } from '@digitaldefiance/ecies-lib';

const config = createRuntimeConfiguration({
  idProvider: new GuidV4Provider(), // Auto-syncs all size constants
});
```

### 2. Hardcoded Recipient ID Generation

**Before (v3.6.x):**

```typescript
const recipientId = crypto.getRandomValues(new Uint8Array(32)); // Hardcoded size
```

**After (v3.7.x):**

```typescript
import { Constants } from '@digitaldefiance/ecies-lib';

const recipientId = Constants.idProvider.generate(); // Dynamic size
// OR with custom config:
const recipientId = config.idProvider.generate();
```

### 3. Multi-Recipient Constants

**Before (v3.6.x):**

```typescript
import { MULTI_RECIPIENT_CONSTANTS } from '@digitaldefiance/ecies-lib';

const headerSize = MULTI_RECIPIENT_CONSTANTS.RECIPIENT_ID_SIZE; // Always 32
```

**After (v3.7.x):**

```typescript
import { Constants } from '@digitaldefiance/ecies-lib';

// Use dynamic sizing from configuration
const headerSize = Constants.ECIES.MULTIPLE.RECIPIENT_ID_SIZE; // Respects ID provider
```

---

## Step-by-Step Migration

### Step 1: Update Dependencies

```bash
yarn add @digitaldefiance/ecies-lib@^3.7.0
# or
npm install @digitaldefiance/ecies-lib@^3.7.0
```

### Step 2: Identify Your Current Recipient ID Size

Determine what size you're currently using:

- **12 bytes** → Use `ObjectIdProvider` (default, MongoDB compatible)
- **16 bytes** → Use `GuidV4Provider` or `UuidProvider`
- **32 bytes** → Use `Legacy32ByteProvider` (for backward compatibility)
- **Custom** → Use `CustomIdProvider` with your custom size

### Step 3: Update Configuration Code

Find all places where you create runtime configurations:

```typescript
// FIND THIS PATTERN:
const config = createRuntimeConfiguration({
  MEMBER_ID_LENGTH: X,
  ECIES: { MULTIPLE: { RECIPIENT_ID_SIZE: Y } },
});

// REPLACE WITH:
import { [YourProvider] } from '@digitaldefiance/ecies-lib';

const config = createRuntimeConfiguration({
  idProvider: new [YourProvider](),
});
```

### Step 4: Update Recipient ID Generation

Find all places where you generate recipient IDs:

```typescript
// FIND THIS PATTERN:
const id = crypto.getRandomValues(new Uint8Array(SIZE));
const id = new Uint8Array(SIZE);
const id = Buffer.alloc(SIZE);

// REPLACE WITH:
const id = config.idProvider.generate();
// OR
const id = Constants.idProvider.generate();
```

### Step 5: Update Recipient ID Validation

```typescript
// BEFORE:
if (recipientId.length !== 32) {
  throw new Error('Invalid recipient ID size');
}

// AFTER:
if (recipientId.length !== config.idProvider.byteLength) {
  throw new Error(`Invalid recipient ID size: expected ${config.idProvider.byteLength}, got ${recipientId.length}`);
}
```

### Step 6: Run Tests

```bash
yarn test
```

Fix any failing tests by following the patterns above.

---

## ID Provider Selection

### ObjectIdProvider (Default - 12 bytes)

**Use When:**

- Using MongoDB ObjectIDs
- Need compact recipient IDs
- Default choice for most applications

**Example:**

```typescript
import { ObjectIdProvider } from '@digitaldefiance/ecies-lib';

const config = createRuntimeConfiguration({
  idProvider: new ObjectIdProvider(),
});

// Generate IDs:
const id = config.idProvider.generate(); // 12-byte Uint8Array
```

### GuidV4Provider (16 bytes)

**Use When:**

- Need RFC 4122 compliant GUIDs
- Cross-platform compatibility with .NET/Windows
- Want standard GUID format

**Example:**

```typescript
import { GuidV4Provider } from '@digitaldefiance/ecies-lib';

const config = createRuntimeConfiguration({
  idProvider: new GuidV4Provider(),
});

// Works with both binary and string formats:
const id = config.idProvider.generate(); // 16-byte Uint8Array
const guidString = config.idProvider.serialize(id); // "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
```

### UuidProvider (16 bytes)

**Use When:**

- Need UUIDv4 with dash separators
- Standard UUID format required
- Similar to GUID but with standard formatting

**Example:**

```typescript
import { UuidProvider } from '@digitaldefiance/ecies-lib';

const config = createRuntimeConfiguration({
  idProvider: new UuidProvider(),
});
```

### Legacy32ByteProvider (32 bytes)

**Use When:**

- Migrating from systems using 32-byte IDs
- Backward compatibility required
- Cannot change existing encrypted data

**Example:**

```typescript
import { Legacy32ByteProvider } from '@digitaldefiance/ecies-lib';

const config = createRuntimeConfiguration({
  idProvider: new Legacy32ByteProvider(),
});
```

### CustomIdProvider (1-255 bytes)

**Use When:**

- Need custom ID format
- Specific size requirements
- Special ID generation logic

**Example:**

```typescript
import { CustomIdProvider } from '@digitaldefiance/ecies-lib';

const config = createRuntimeConfiguration({
  idProvider: new CustomIdProvider(24), // 24-byte IDs
});
```

---

## Configuration Changes

### Auto-Sync Behavior

When you set an ID provider, **all related constants are automatically synchronized**:

```typescript
const config = createRuntimeConfiguration({
  idProvider: new GuidV4Provider(), // 16 bytes
});

// These are ALL automatically set to 16:
console.log(config.MEMBER_ID_LENGTH); // 16
console.log(config.ECIES.MULTIPLE.RECIPIENT_ID_SIZE); // 16
console.log(config.idProvider.byteLength); // 16
```

### Invariant Validation

v3.7.0 includes automatic validation to prevent configuration errors:

```typescript
// This will THROW an error:
const badConfig = createRuntimeConfiguration({
  idProvider: new GuidV4Provider(), // 16 bytes
  MEMBER_ID_LENGTH: 12, // ❌ Mismatch! Will fail validation
});

// Validation error:
// "Configuration validation failed:
//  Invariant 'RecipientIdConsistency' failed:
//    MEMBER_ID_LENGTH (12) !== idProvider.byteLength (16)"
```

**This prevents the 12 vs 32-byte bug that existed in v3.6.x!**

### Configuration Provenance

Track where your configuration came from:

```typescript
import { ConstantsRegistry } from '@digitaldefiance/ecies-lib';

const config = ConstantsRegistry.register('my-config', {
  idProvider: new GuidV4Provider(),
}, {
  description: 'Production GUID configuration',
});

// Later, get provenance info:
const provenance = ConstantsRegistry.getProvenance('my-config');
console.log(provenance.description); // "Production GUID configuration"
console.log(provenance.timestamp); // When it was created
console.log(provenance.checksum); // Configuration hash
```

---

## Testing Your Migration

### Unit Tests

Update your tests to use ID providers:

```typescript
import { ObjectIdProvider } from '@digitaldefiance/ecies-lib';

describe('Encryption', () => {
  const provider = new ObjectIdProvider();
  
  it('should encrypt with generated recipient IDs', async () => {
    const recipientId = provider.generate();
    expect(recipientId.length).toBe(provider.byteLength); // Dynamic!
    
    const encrypted = await ecies.encrypt(data, publicKey, { recipientId });
    expect(encrypted).toBeDefined();
  });
});
```

### Integration Tests

Test cross-provider compatibility:

```typescript
import { ObjectIdProvider, GuidV4Provider } from '@digitaldefiance/ecies-lib';

describe('Cross-Provider Compatibility', () => {
  it('should encrypt with ObjectID and decrypt with GUID config', async () => {
    const config1 = createRuntimeConfiguration({
      idProvider: new ObjectIdProvider(),
    });
    
    const encrypted = await encrypt(data, publicKey, config1);
    
    // Decryption works regardless of ID provider
    // (as long as recipient has the right private key)
    const config2 = createRuntimeConfiguration({
      idProvider: new GuidV4Provider(),
    });
    
    const decrypted = await decrypt(encrypted, privateKey, config2);
    expect(decrypted).toEqual(data);
  });
});
```

### Regression Tests

Ensure backward compatibility:

```typescript
describe('Backward Compatibility', () => {
  it('should decrypt v3.6.x encrypted data', async () => {
    // Load data encrypted with v3.6.x (32-byte IDs)
    const legacyEncrypted = loadLegacyData();
    
    const config = createRuntimeConfiguration({
      idProvider: new Legacy32ByteProvider(), // Match old size
    });
    
    const decrypted = await decrypt(legacyEncrypted, privateKey, config);
    expect(decrypted).toEqual(expectedData);
  });
});
```

---

## Troubleshooting

### Problem: "Configuration validation failed: RecipientIdConsistency"

**Cause:** Mismatch between ID provider size and other constants.

**Solution:**

```typescript
// ❌ DON'T manually set size constants
const config = createRuntimeConfiguration({
  idProvider: new GuidV4Provider(),
  MEMBER_ID_LENGTH: 12, // Wrong!
});

// ✅ DO let auto-sync handle it
const config = createRuntimeConfiguration({
  idProvider: new GuidV4Provider(), // All sizes auto-synced
});
```

### Problem: "Invalid recipient ID length"

**Cause:** Using hardcoded size that doesn't match ID provider.

**Solution:**

```typescript
// ❌ DON'T hardcode sizes
if (id.length !== 32) { ... }

// ✅ DO use provider's byteLength
if (id.length !== config.idProvider.byteLength) { ... }
```

### Problem: "Cannot decrypt data encrypted with v3.6.x"

**Cause:** Using wrong ID provider for legacy data.

**Solution:**

```typescript
// If your v3.6.x used 32-byte IDs:
const config = createRuntimeConfiguration({
  idProvider: new Legacy32ByteProvider(),
});

// If your v3.6.x used 12-byte IDs (default):
const config = createRuntimeConfiguration({
  idProvider: new ObjectIdProvider(), // Or just use default
});
```

### Problem: Build errors after upgrade

**Cause:** Some exports may have changed location.

**Solution:**

```typescript
// Update imports:
import {
  ObjectIdProvider,
  GuidV4Provider,
  UuidProvider,
  Legacy32ByteProvider,
  CustomIdProvider,
  IIdProvider,
  BaseIdProvider,
} from '@digitaldefiance/ecies-lib';
```

---

## Advanced Topics

### Creating Custom ID Providers

Implement your own ID generation logic:

```typescript
import { BaseIdProvider } from '@digitaldefiance/ecies-lib';

class MyCustomProvider extends BaseIdProvider {
  constructor() {
    super('MyCustom', 20, 'My custom 20-byte ID format');
  }
  
  generate(): Uint8Array {
    // Your custom generation logic
    const id = new Uint8Array(20);
    // ... fill with your data ...
    return id;
  }
  
  validate(id: Uint8Array): boolean {
    // Your validation logic
    return id.length === 20 && /* your checks */;
  }
  
  serialize(id: Uint8Array): string {
    // Convert to string representation
    return Buffer.from(id).toString('hex');
  }
  
  deserialize(str: string): Uint8Array {
    // Convert from string representation
    return new Uint8Array(Buffer.from(str, 'hex'));
  }
}

// Use it:
const config = createRuntimeConfiguration({
  idProvider: new MyCustomProvider(),
});
```

### Runtime Provider Switching

Switch providers at runtime:

```typescript
// Start with ObjectID
let config = createRuntimeConfiguration({
  idProvider: new ObjectIdProvider(),
});

// Later, switch to GUID
config = createRuntimeConfiguration({
  idProvider: new GuidV4Provider(),
});

// All size constants automatically update!
```

---

## Migration Checklist

- [ ] Updated `@digitaldefiance/ecies-lib` to v3.7.0+
- [ ] Identified current recipient ID size(s)
- [ ] Replaced direct constant assignments with ID providers
- [ ] Updated recipient ID generation to use `idProvider.generate()`
- [ ] Updated recipient ID validation to use `idProvider.byteLength`
- [ ] Updated tests to use ID providers
- [ ] All tests passing
- [ ] Tested backward compatibility with existing encrypted data
- [ ] Updated documentation/comments
- [ ] Deployed and verified in production

---

## Need Help?

- **Documentation:** See [ID_PROVIDER_ARCHITECTURE.md](./ID_PROVIDER_ARCHITECTURE.md)
- **Examples:** Check [examples/id-providers/](../examples/id-providers/)
- **Issues:** [GitHub Issues](https://github.com/digitaldefiance/ecies-lib/issues)

---

## Summary

v3.7.0 makes recipient ID sizing flexible and prevents configuration bugs through:

1. **ID Provider System** - Pluggable, extensible ID generation
2. **Auto-Sync** - Constants stay synchronized automatically
3. **Invariant Validation** - Catches mismatches at configuration time
4. **Backward Compatible** - Default behavior unchanged

Most applications need minimal changes, and the new system prevents entire classes of bugs!
