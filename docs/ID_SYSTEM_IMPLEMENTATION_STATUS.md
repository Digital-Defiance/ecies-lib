# Extensible ID System Implementation Guide

## Status: Phase 1 Complete ✓

We've successfully implemented the foundation for an extensible recipient ID system that allows library consumers to use ObjectIDs, GUIDs, UUIDs, or custom ID formats.

## What Was Completed

### 1. Core Infrastructure ✓

- **ID Provider Interface** (`src/interfaces/id-provider.ts`)
  - `IIdProvider` interface with generate, validate, serialize, deserialize methods
  - `BaseIdProvider` abstract class with common utilities
  - Constant-time comparison for security
  - Defensive cloning

### 2. ID Provider Implementations ✓

- **ObjectIdProvider** (12 bytes) - MongoDB/BSON compatible, DEFAULT
- **GuidV4Provider** (16 bytes) - Uses your GuidV4 class
- **UuidProvider** (16 bytes) - Standard RFC 4122 UUIDs with dashes
- **CustomIdProvider** (configurable) - User-defined byte length

### 3. Constants Integration ✓

- Added `idProvider: IIdProvider` to `IConstants` interface
- Updated default Constants to use `ObjectIdProvider`
- Updated `MEMBER_ID_LENGTH` to use `idProvider.byteLength`
- Enhanced validation to check ID provider configuration
- Validation now uses `idProvider.byteLength` instead of hardcoded `OBJECT_ID_LENGTH`

### 4. Documentation ✓

- **RECIPIENT_ID_DISCREPANCY_ANALYSIS.md** - Complete problem analysis
- Inline documentation for all provider classes
- JSDoc examples for usage

## Current State

### ✓ Working

- ID provider interface and implementations
- Constants configuration with ID provider
- Validation of ID provider in constants
- Default ObjectID provider (12 bytes)

### ⚠️ Not Yet Updated

- **CRITICAL**: `MULTI_RECIPIENT_CONSTANTS.RECIPIENT_ID_SIZE` still hardcoded to 32
- Multi-recipient processor still uses hardcoded constant
- Multi-recipient chunk interface needs updating
- All tests still use various hardcoded sizes (12, 32, etc.)

### 🔴 Breaking Change Not Applied Yet

The validation will now FAIL because:

- `ECIES.MULTIPLE.RECIPIENT_ID_SIZE = 12` (from constants.ts:84)
- `MULTI_RECIPIENT_CONSTANTS.RECIPIENT_ID_SIZE = 32` (from multi-recipient-chunk.ts:67)
- Validation requires: `ECIES.MULTIPLE.RECIPIENT_ID_SIZE === idProvider.byteLength`

This means **tests will fail** until we update the multi-recipient code.

## Next Steps (Phase 2 - URGENT)

### Step 1: Make MULTI_RECIPIENT_CONSTANTS Dynamic

Update `src/interfaces/multi-recipient-chunk.ts`:

```typescript
/**
 * Get multi-recipient constants for a specific configuration.
 * This allows recipient ID size to be dynamically determined.
 */
export function getMultiRecipientConstants(
  recipientIdSize: number
): Readonly<typeof MULTI_RECIPIENT_CONSTANTS> {
  return Object.freeze({
    MAGIC: 0x4D524543,
    VERSION: 0x0001,
    HEADER_SIZE: 32,
    RECIPIENT_ID_SIZE: recipientIdSize,  // DYNAMIC!
    KEY_SIZE_BYTES: 2,
    FLAG_IS_LAST: 0x01,
    FLAG_HAS_CHECKSUM: 0x02,
    MAX_RECIPIENTS: 65535,
  });
}

// For backward compatibility, export with default size
export const MULTI_RECIPIENT_CONSTANTS = getMultiRecipientConstants(12);
```

### Step 2: Update Multi-Recipient Processor

Update `src/services/multi-recipient-processor.ts`:

```typescript
export class MultiRecipientProcessor {
  private readonly recipientIdSize: number;
  private readonly multiRecipientConstants: ReturnType<typeof getMultiRecipientConstants>;

  constructor(
    private readonly ecies: ECIESService,
    private readonly config: IConstants = Constants
  ) {
    this.recipientIdSize = config.idProvider.byteLength;
    this.multiRecipientConstants = getMultiRecipientConstants(this.recipientIdSize);
  }

  async encryptChunk(/* ... */) {
    // Replace MULTI_RECIPIENT_CONSTANTS with this.multiRecipientConstants
    if (recipient.id.length !== this.recipientIdSize) {
      throw new Error(/* ... */);
    }
    // ... rest of method
  }
}
```

### Step 3: Update All Tests

Priority order:

1. **constants.spec.ts** - Update expectations for new validation
2. **multi-recipient.spec.ts** - Use `config.idProvider.generate()` for IDs
3. **multi-recipient-streaming.spec.ts** - Same updates
4. **multi-recipient-security.spec.ts** - Same updates
5. **multi-recipient-stream.spec.ts** - Same updates

Example test update:

```typescript
// OLD: Hardcoded size
const recipientId = crypto.getRandomValues(new Uint8Array(32));

// NEW: Use ID provider
const config = getRuntimeConfiguration();
const recipientId = config.idProvider.generate();
```

### Step 4: Add Provider Tests

Create `tests/lib/id-providers/`:

- `objectid-provider.spec.ts`
- `guidv4-provider.spec.ts`
- `uuid-provider.spec.ts`
- `custom-provider.spec.ts`

Test cases for each:

- Generation produces correct byte length
- Validation accepts valid IDs
- Validation rejects invalid IDs
- Serialization round-trips correctly
- Equality comparison works
- Provider-specific features (timestamp, version, etc.)

### Step 5: Integration Tests

Create `tests/integration/id-provider-interop.spec.ts`:

- Encrypt with ObjectID, decrypt with same
- Encrypt with GUID, decrypt with same
- Ensure different providers create incompatible formats
- Test configuration switching

### Step 6: Update Index Exports

Update `src/index.ts` to export:

```typescript
export * from './lib/id-providers';
export { getRuntimeConfiguration, createRuntimeConfiguration } from './constants';
```

## Usage Examples

### Using Default ObjectID Provider

```typescript
import { Constants } from '@digitaldefiance/ecies-lib';

// Use default (ObjectID, 12 bytes)
const id = Constants.idProvider.generate();
console.log(Constants.idProvider.byteLength); // 12
```

### Using GUID Provider

```typescript
import { createRuntimeConfiguration } from '@digitaldefiance/ecies-lib';
import { GuidV4Provider } from '@digitaldefiance/ecies-lib/lib/id-providers';

const config = createRuntimeConfiguration({
  idProvider: new GuidV4Provider()
});

const id = config.idProvider.generate();
console.log(config.idProvider.byteLength); // 16
```

### Custom ID Size

```typescript
import { CustomIdProvider } from '@digitaldefiance/ecies-lib/lib/id-providers';

// 20-byte SHA-1 hashes as IDs
const config = createRuntimeConfiguration({
  idProvider: new CustomIdProvider(20, 'SHA1Hash')
});
```
