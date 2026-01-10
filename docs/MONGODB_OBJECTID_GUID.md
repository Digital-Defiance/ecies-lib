# MongoDB ObjectId to Guid Conversion

## Overview

The `Guid` class now supports converting MongoDB ObjectId hex strings (24 characters) into Guid instances. This is useful when you need to work with MongoDB ObjectIds in a frontend context where you can't import the `bson` or `mongoose` packages.

## Type Brand

A new branded type `MongoObjectIdHexString` has been added to provide type safety:

```typescript
import { MongoObjectIdHexString } from '@digitaldefiance/ecies-lib';

// Type-safe MongoDB ObjectId hex string
const objectIdHex: MongoObjectIdHexString = '507f1f77bcf86cd799439011' as MongoObjectIdHexString;
```

## Usage

### Converting ObjectId to Guid

```typescript
import { ObjectId } from 'bson';
import { Guid } from '@digitaldefiance/ecies-lib';

// Method 1: From hex string using fromMongoObjectId
const objectIdHex = '507f1f77bcf86cd799439011';
const guid1 = Guid.fromMongoObjectId(objectIdHex);

// Method 2: From hex string using constructor
const guid2 = new Guid(objectIdHex);

// Method 3: From BSON ObjectId using fromMongoObjectId
const objectId = new ObjectId('507f1f77bcf86cd799439011');
const guid3 = Guid.fromMongoObjectId(objectId);

// Method 4: From BSON ObjectId using constructor
const guid4 = new Guid(objectId);

// Use the Guid instance
console.log(guid1.asFullHexGuid);  // '507f1f77-bcf8-6cd7-9943-901100000000'
console.log(guid1.asShortHexGuid); // '507f1f77bcf86cd79943901100000000'
console.log(guid1.asBase64Guid);   // Base64 encoded version
```

### Converting Guid back to ObjectId

```typescript
import { Guid } from '@digitaldefiance/ecies-lib';

const objectIdHex = '507f1f77bcf86cd799439011';
const guid = Guid.fromMongoObjectId(objectIdHex);

// Convert back to ObjectId
const backToObjectId = guid.asMongoObjectId;
console.log(backToObjectId); // '507f1f77bcf86cd799439011'
```

### Round-trip Conversion

```typescript
import { Guid } from '@digitaldefiance/ecies-lib';

const objectIdHex = '507f1f77bcf86cd799439011';

// Convert to GUID and back
const guid = Guid.fromMongoObjectId(objectIdHex);
const base64 = guid.asBase64Guid;
const guid2 = new Guid(base64);
const backToObjectId = guid2.asMongoObjectId;

console.log(objectIdHex === backToObjectId); // true
```

### Implementation Details

The conversion works by:
1. Validating the input is a 24-character hex string
2. Padding the ObjectId with zeros to create a 32-character hex string
3. Creating a Guid instance from the padded hex string

**Note:** The ObjectId is padded with zeros at the end, so:
- ObjectId: `507f1f77bcf86cd799439011` (24 chars)
- Becomes: `507f1f77bcf86cd79943901100000000` (32 chars)

### Validation

```typescript
import { ObjectId } from 'bson';
import { Guid, GuidBrandType } from '@digitaldefiance/ecies-lib';

const objectIdHex = '507f1f77bcf86cd799439011';

// Check if a string is a valid MongoDB ObjectId hex string
if (Guid.isMongoObjectIdGuid(objectIdHex)) {
  const guid = new Guid(objectIdHex);
  // ... use guid
}

// Determine the brand of a value
const brand = Guid.whichBrand(objectIdHex);
if (brand === GuidBrandType.MongoObjectId) {
  console.log('This is a MongoDB ObjectId');
}

// Works with BSON ObjectId too
const objectId = new ObjectId();
const brand2 = Guid.whichBrand(objectId);
console.log(brand2); // GuidBrandType.MongoObjectId
```

### Error Handling

The methods throw `GuidError` with type `GuidErrorType.Invalid` for:
- Invalid length (not 24 characters)
- Non-hexadecimal characters
- Null or undefined input

```typescript
import { Guid, GuidError } from '@digitaldefiance/ecies-lib';

try {
  const guid = Guid.fromMongoObjectId(invalidObjectId);
} catch (error) {
  if (error instanceof GuidError) {
    console.error('Invalid ObjectId:', error.type);
  }
}
```

## Use Cases

- Frontend applications that receive MongoDB ObjectIds from APIs
- Backend services that need to work with both ObjectIds and GUIDs
- Type-safe handling of ObjectIds with full BSON support
- Converting ObjectIds to various GUID formats (Base64, BigInt, etc.)
- Maintaining consistency between backend ObjectIds and frontend identifiers
- Storing ObjectIds in systems that expect standard GUID formats

## Features

✅ **Hex String Support** - Convert 24-character hex strings  
✅ **BSON ObjectId Support** - Direct support for `bson` ObjectId instances  
✅ **Bidirectional** - Convert to and from ObjectId format  
✅ **Type-Safe** - Branded types for compile-time safety  
✅ **Format Conversion** - Convert to Base64, BigInt, Uint8Array, etc.  
✅ **Validation** - Built-in validation for ObjectId format  
✅ **Brand Detection** - Automatically detect ObjectId vs Base64
