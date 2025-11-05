# MongoDB ObjectId Quick Reference

## Import

```typescript
import { ObjectId } from 'bson';
import { GuidV4, GuidBrandType } from '@digitaldefiance/ecies-lib';
```

## Create from ObjectId

```typescript
// From hex string
const guid = new GuidV4('507f1f77bcf86cd799439011');
const guid = GuidV4.fromMongoObjectId('507f1f77bcf86cd799439011');

// From BSON ObjectId
const objectId = new ObjectId();
const guid = new GuidV4(objectId);
const guid = GuidV4.fromMongoObjectId(objectId);
```

## Convert to ObjectId

```typescript
const guid = new GuidV4('507f1f77bcf86cd799439011');
const objectIdHex = guid.asMongoObjectId; // '507f1f77bcf86cd799439011'
```

## Validation

```typescript
// Check if valid ObjectId hex
GuidV4.isMongoObjectIdGuid('507f1f77bcf86cd799439011'); // true
GuidV4.isMongoObjectIdGuid('invalid'); // false

// Check brand
GuidV4.whichBrand('507f1f77bcf86cd799439011'); // GuidBrandType.MongoObjectId
```

## Format Conversions

```typescript
const guid = new GuidV4('507f1f77bcf86cd799439011');

guid.asMongoObjectId;      // '507f1f77bcf86cd799439011'
guid.asShortHexGuid;       // '507f1f77bcf86cd79943901100000000'
guid.asFullHexGuid;        // '507f1f77-bcf8-6cd7-9943-901100000000'
guid.asBase64Guid;         // Base64 string
guid.asBigIntGuid;         // BigInt
guid.asRawGuidUint8Array;  // Uint8Array (16 bytes)
```

## Round-trip Example

```typescript
const original = '507f1f77bcf86cd799439011';
const guid = new GuidV4(original);
const base64 = guid.asBase64Guid;
const guid2 = new GuidV4(base64);
const back = guid2.asMongoObjectId;

console.log(original === back); // true
```

## Common Patterns

### API Response Handling
```typescript
interface ApiResponse {
  _id: string; // MongoDB ObjectId as hex
  // ...
}

const response: ApiResponse = await fetch('/api/resource');
const guid = new GuidV4(response._id);
```

### Database Query
```typescript
const guid = new GuidV4(userInput);
const objectIdHex = guid.asMongoObjectId;
const result = await collection.findOne({ _id: new ObjectId(objectIdHex) });
```

### Type-safe Storage
```typescript
import { MongoObjectIdGuid } from '@digitaldefiance/ecies-lib';

function storeId(id: MongoObjectIdGuid) {
  // Type-safe ObjectId handling
}

const guid = new GuidV4('507f1f77bcf86cd799439011');
storeId(guid.asMongoObjectId);
```

## Error Handling

```typescript
import { GuidError, GuidErrorType } from '@digitaldefiance/ecies-lib';

try {
  const guid = GuidV4.fromMongoObjectId(userInput);
} catch (error) {
  if (error instanceof GuidError && error.type === GuidErrorType.Invalid) {
    console.error('Invalid ObjectId format');
  }
}
```

## Key Points

✅ Accepts 24-char hex strings  
✅ Accepts BSON ObjectId instances  
✅ Pads to 32 chars internally  
✅ Strips padding on conversion back  
✅ Case-insensitive input  
✅ Lowercase output  
✅ No mongoose dependency  
