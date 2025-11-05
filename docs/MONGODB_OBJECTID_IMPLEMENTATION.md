# MongoDB ObjectId Implementation Summary

## Overview

Complete implementation of MongoDB ObjectId support in GuidV4 class, allowing seamless conversion between MongoDB ObjectIds and GUIDs.

## Implementation Details

### 1. Type System

**New Types Added:**
- `MongoObjectIdGuid` - Branded type for ObjectId stored as GUID
- `MongoObjectIdHexString` - Branded type for 24-char hex strings
- `GuidInput` - Extended to include `ObjectId` from bson

**Location:** `src/types.ts`

### 2. Enum Extension

**Added to GuidBrandType:**
```typescript
MongoObjectId = 'MongoObjectId'  // 24-character hex string
```

**Location:** `src/enumerations/guid-brand-type.ts`

### 3. Core Implementation

**Key Methods:**

#### `fromMongoObjectId(objectId)`
- Accepts: BSON `ObjectId` instance OR 24-char hex string
- Returns: `GuidV4` instance
- Validates format and length
- Pads to 32 characters with zeros

#### `asMongoObjectId` (getter)
- Returns: 24-char hex string (`MongoObjectIdGuid`)
- Strips padding zeros from internal representation

#### `whichBrand(value)`
- Enhanced to detect BSON ObjectId instances
- Distinguishes between Base64 and ObjectId (both 24 chars)
- Uses regex `/^[0-9a-f]{24}$/i` for hex detection

#### `isMongoObjectIdGuid(value)`
- Validates 24-char hex string format
- Returns boolean

#### `toRawGuidUint8Array(value)`
- Handles `GuidBrandType.MongoObjectId` case
- Supports both BSON ObjectId and hex string
- Pads to 32 chars before conversion

#### `toFullHexGuid(guid)` & `toShortHexGuid(guid)`
- Detect 24-char hex strings
- Pad to 32 chars before processing

**Location:** `src/guid.ts`

### 4. Constructor Support

The `GuidV4` constructor now accepts:
```typescript
new GuidV4('507f1f77bcf86cd799439011')  // Hex string
new GuidV4(new ObjectId())               // BSON ObjectId
```

### 5. Conversion Flow

**ObjectId → GUID:**
```
24-char hex → Pad to 32 chars → Convert to 16-byte Uint8Array
```

**GUID → ObjectId:**
```
16-byte Uint8Array → 32-char hex → Slice to 24 chars
```

## Test Coverage

### Test Categories

1. **From Hex String**
   - Valid 24-char conversion
   - Uppercase handling
   - Round-trip conversion
   - Constructor usage
   - Brand detection

2. **From BSON ObjectId**
   - BSON ObjectId conversion
   - Constructor usage
   - Brand detection
   - Newly created ObjectIds

3. **Round-trip Conversions**
   - ObjectId ↔ Base64
   - ObjectId ↔ BigInt
   - ObjectId ↔ Uint8Array
   - ObjectId ↔ FullHexGuid
   - Multiple format conversions

4. **Validation**
   - Correct format validation
   - Invalid format rejection
   - Base64 vs ObjectId distinction

5. **Error Handling**
   - Invalid length
   - Non-hex characters
   - Null/undefined
   - Empty string

6. **Edge Cases**
   - All zeros (000...000)
   - All fs (fff...fff)
   - Leading zeros
   - Case normalization

7. **Equality**
   - Same ObjectId equality
   - BSON vs hex string equality

**Location:** `tests/guid.spec.ts`

## Usage Examples

### Basic Conversion

```typescript
import { ObjectId } from 'bson';
import { GuidV4 } from '@digitaldefiance/ecies-lib';

// From hex string
const guid1 = new GuidV4('507f1f77bcf86cd799439011');
console.log(guid1.asMongoObjectId); // '507f1f77bcf86cd799439011'

// From BSON ObjectId
const objectId = new ObjectId();
const guid2 = new GuidV4(objectId);
console.log(guid2.asMongoObjectId); // ObjectId hex string
```

### Format Conversions

```typescript
const objectIdHex = '507f1f77bcf86cd799439011';
const guid = new GuidV4(objectIdHex);

// Convert to various formats
const base64 = guid.asBase64Guid;
const bigInt = guid.asBigIntGuid;
const uint8 = guid.asRawGuidUint8Array;
const fullHex = guid.asFullHexGuid;

// Convert back from any format
const guid2 = new GuidV4(base64);
console.log(guid2.asMongoObjectId); // '507f1f77bcf86cd799439011'
```

### Validation

```typescript
import { GuidV4, GuidBrandType } from '@digitaldefiance/ecies-lib';

const hex = '507f1f77bcf86cd799439011';

// Validate format
if (GuidV4.isMongoObjectIdGuid(hex)) {
  console.log('Valid ObjectId');
}

// Check brand
const brand = GuidV4.whichBrand(hex);
if (brand === GuidBrandType.MongoObjectId) {
  console.log('This is a MongoDB ObjectId');
}
```

## Technical Details

### Padding Strategy

ObjectIds are 24 hex characters (12 bytes), while GUIDs are 32 hex characters (16 bytes).

**Padding:** Append 8 zeros to the end
```
507f1f77bcf86cd799439011 → 507f1f77bcf86cd79943901100000000
```

**Unpadding:** Take first 24 characters
```
507f1f77bcf86cd79943901100000000 → 507f1f77bcf86cd799439011
```

### Brand Detection Logic

For 24-character strings:
1. Check if all characters are hex (`/^[0-9a-f]{24}$/i`)
2. If yes → `MongoObjectId`
3. If no → `Base64Guid`

For ObjectId instances:
1. Check `instanceof ObjectId`
2. If yes → `MongoObjectId`

### Case Normalization

All ObjectId hex strings are normalized to lowercase:
```typescript
'507F1F77BCF86CD799439011' → '507f1f77bcf86cd799439011'
```

## Dependencies

- `bson` - For ObjectId type support
- No mongoose dependency required

## Files Modified

1. `src/guid.ts` - Core implementation
2. `src/types.ts` - Type definitions
3. `src/enumerations/guid-brand-type.ts` - Enum extension
4. `tests/guid.spec.ts` - Comprehensive tests
5. `MONGODB_OBJECTID_GUID.md` - User documentation

## Compatibility

✅ Frontend - Works without mongoose  
✅ Backend - Full BSON ObjectId support  
✅ Type-safe - Branded types throughout  
✅ Backward compatible - No breaking changes  

## Performance

- O(1) conversion operations
- Minimal memory overhead (padding only)
- No external API calls
- Efficient regex validation

## Future Enhancements

Potential improvements:
- Support for ObjectId binary format (12 bytes)
- Timestamp extraction from ObjectId
- ObjectId generation with custom timestamps
- Validation of ObjectId timestamp ranges
