# ID Provider Testing Documentation

## Overview

The ID provider system has comprehensive test coverage across three test suites:

1. **Basic ID Provider Tests** (`tests/lib/id-providers/id-providers.spec.ts`) - 32 tests
2. **Comprehensive ID Provider Tests** (`tests/lib/id-providers/id-providers-comprehensive.spec.ts`) - 74 tests
3. **Integration Tests** - 26 tests across 2 files

**Total: 132 tests covering ID providers**

## Test Suites

### 1. Basic ID Provider Tests (32 tests)

Location: `tests/lib/id-providers/id-providers.spec.ts`

These tests provide basic functional validation for each ID provider:

#### ObjectIdProvider (7 tests)

- ✅ Correct byte length (12 bytes)
- ✅ Valid ObjectID generation
- ✅ 24-character hex serialization
- ✅ Serialization/deserialization round-trip
- ✅ Invalid ObjectID rejection (all zeros, wrong length)
- ✅ ID cloning
- ✅ Constant-time equality comparison

#### GuidV4Provider (6 tests)

- ✅ Correct byte length (16 bytes)
- ✅ Valid GUID generation
- ✅ Base64 serialization
- ✅ Serialization/deserialization round-trip
- ✅ v4 GUID validation
- ✅ Empty GUID detection

#### UuidProvider (6 tests)

- ✅ Correct byte length (16 bytes)
- ✅ Valid UUID generation
- ✅ UUID format with dashes (36 characters)
- ✅ Serialization/deserialization round-trip
- ✅ Version extraction
- ✅ Nil UUID detection

#### CustomIdProvider (6 tests)

- ✅ Custom byte length support (1-255 bytes)
- ✅ ID generation of specified length
- ✅ Hex serialization of correct length
- ✅ Serialization/deserialization round-trip
- ✅ Invalid byte length rejection
- ✅ Default name usage

#### Cross-Provider Tests (2 tests)

- ✅ Different providers generate non-comparable IDs
- ✅ Distinct serialization formats

### 2. Comprehensive ID Provider Tests (74 tests)

Location: `tests/lib/id-providers/id-providers-comprehensive.spec.ts`

These tests provide deep validation of correctness, security, and performance:

#### ObjectIdProvider (22 tests)

**Generation (4 tests)**

- ✅ Correct length for all generated IDs
- ✅ Uniqueness across 1000 generations
- ✅ Increasing timestamps in sequential generations
- ✅ Non-zero random and counter portions

**Validation (4 tests)**

- ✅ All generated IDs validate successfully
- ✅ All-zero IDs rejected
- ✅ Wrong-length IDs rejected
- ✅ Valid structure acceptance

**Serialization (4 tests)**

- ✅ 24-character hex string output
- ✅ Consistent serialization
- ✅ Leading zeros preserved
- ✅ Invalid input rejection

**Deserialization (5 tests)**

- ✅ Round-trip through serialization
- ✅ Uppercase/lowercase hex acceptance
- ✅ Invalid hex string rejection
- ✅ Non-string input rejection
- ✅ All-zero deserialized ID rejection

**Equality and Comparison (4 tests)**

- ✅ Identical IDs compare as equal
- ✅ Different IDs compare as not equal
- ✅ Constant-time comparison (timing-safe)
- ✅ Length mismatch handling

**Cloning (1 test)**

- ✅ Independent copies creation

#### GuidV4Provider (15 tests)

**Generation (5 tests)**

- ✅ Valid v4 GUIDs (100 iterations)
- ✅ v4 version bits set correctly
- ✅ RFC 4122 variant bits set correctly
- ✅ Uniqueness across 1000 generations
- ✅ Sufficient randomness (bit distribution)

**Validation (4 tests)**

- ✅ All generated GUIDs validate
- ✅ Empty GUID detection
- ✅ Wrong-length rejection
- ✅ Invalid version GUID rejection

**Serialization (2 tests)**

- ✅ Base64 string output (24 characters)
- ✅ Round-trip through serialization

**Deserialization (2 tests)**

- ✅ Multiple GUID format acceptance
- ✅ Invalid string rejection

**Special Methods (2 tests)**

- ✅ Empty GUID detection
- ✅ Version extraction

#### UuidProvider (9 tests)

**Generation (2 tests)**

- ✅ Valid UUID generation
- ✅ Uniqueness across 1000 generations

**Serialization (3 tests)**

- ✅ Standard UUID format with dashes
- ✅ Round-trip through serialization
- ✅ Dashes at correct positions

**Deserialization (2 tests)**

- ✅ UUID string with dashes acceptance
- ✅ Invalid UUID string rejection

**Special Methods (2 tests)**

- ✅ Nil UUID detection
- ✅ Version extraction

#### CustomIdProvider (8 tests)

**Construction (4 tests)**

- ✅ Custom byte lengths (1, 8, 16, 20, 24, 32, 48, 64, 128, 255)
- ✅ Custom names
- ✅ Default name usage
- ✅ Invalid byte length rejection (0, -1, 256, 1.5, NaN, Infinity)

**Generation (2 tests)**

- ✅ Correct length IDs
- ✅ Uniqueness across 1000 generations

**Serialization (2 tests)**

- ✅ Hex string of correct length
- ✅ Round-trip through serialization

#### Cross-Provider Tests (8 tests)

**Interface Compliance (5 tests)**

- ✅ All implement generate()
- ✅ All implement validate()
- ✅ All implement serialize()/deserialize()
- ✅ All implement equals()
- ✅ All implement clone()

**Length Verification (1 test)**

- ✅ Declared byte lengths respected

**Serialization Format Differences (1 test)**

- ✅ Distinct serialization formats:
  - ObjectID: 24 hex characters
  - GUIDv4: 24 base64 characters
  - UUID: 36 characters with dashes
  - Legacy32Byte: 64 hex characters
  - Custom20: 40 hex characters

**Non-Comparability (1 test)**

- ✅ IDs from different providers not considered equal

#### Security Properties (2 tests)

- ✅ Constant-time comparison for all providers
- ✅ No information leakage through validation timing

#### Performance Characteristics (3 tests)

- ✅ Generate >10,000 IDs per second
- ✅ Serialize 1000 IDs in <10ms
- ✅ Deserialize 1000 IDs in <10ms

### 3. Integration Tests (26 tests)

These tests validate that ID providers integrate correctly with the encryption system:

#### Recipient ID Consistency Tests (14 tests)

Location: `tests/integration/recipient-id-consistency.spec.ts`

- ✅ Configuration reflects ID provider byte length
- ✅ Runtime configuration can be changed
- ✅ ECIES.MULTIPLE.RECIPIENT_ID_SIZE auto-syncs with provider
- ✅ Encryption/decryption with ObjectID provider (12 bytes)
- ✅ Encryption/decryption with GUID provider (16 bytes)
- ✅ Encryption/decryption with Legacy32Byte provider (32 bytes)
- ✅ Multiple recipients with mixed ID types
- ✅ Large recipient count (100 recipients)
- ✅ Custom ID providers (8, 24, 48 bytes)
- ✅ ID provider change affects buffer length
- ✅ Configuration constants stay consistent
- ✅ ObjectID format validation in encrypted data
- ✅ GUID format validation in encrypted data
- ✅ Auto-sync prevents 12 vs 32 byte discrepancy (regression test)

#### Encrypted Message Structure Tests (12 tests)

Location: `tests/integration/encrypted-message-structure.spec.ts`

- ✅ SIMPLE mode length independent of ID provider
- ✅ SINGLE mode length independent of ID provider
- ✅ MULTIPLE mode length varies with ID provider
- ✅ Recipient IDs embedded correctly in buffer
- ✅ ObjectID provider structure calculation (12-byte IDs)
- ✅ GUID provider structure calculation (16-byte IDs)
- ✅ Legacy32Byte provider structure calculation (32-byte IDs)
- ✅ Linear scaling with recipient count
- ✅ Different ID providers produce different encrypted sizes
- ✅ Cross-algorithm validation (SIMPLE/SINGLE/MULTIPLE)
- ✅ Minimum ID size (1 byte) edge case
- ✅ Maximum ID size (255 bytes) edge case

## What These Tests Catch

### 1. The Original 12 vs 32 Byte Discrepancy

The bug that started Phase 3 is now caught by multiple tests:

- `recipient-id-consistency.spec.ts`: **"should auto-sync MEMBER_ID_LENGTH when ID provider changes"**
  - Directly validates that changing the ID provider updates all related constants
  - Tests would fail if 12-byte IDs were used with 32-byte buffer offsets

- `encrypted-message-structure.spec.ts`: **Structure calculation tests**
  - Validate exact byte-level structure of encrypted messages
  - Tests would fail if buffer offsets didn't match actual ID sizes

### 2. ID Provider Implementation Correctness

- **Format Compliance**: Tests validate ObjectID, UUID, GUID standards
- **Uniqueness**: Ensure 1000 sequential generations produce unique IDs
- **Serialization**: Round-trip testing catches encoding/decoding bugs
- **Validation**: Edge cases (empty, wrong length, invalid format) properly rejected

### 3. Security Properties

- **Constant-Time Operations**: Timing tests ensure no information leakage
- **Cryptographic Randomness**: Bit distribution tests catch weak RNGs
- **Timing Attack Resistance**: Validation and comparison timing consistency

### 4. Integration Issues

- **Buffer Structure**: Byte-level validation of encrypted message format
- **Length Calculations**: Correct overhead for different ID sizes
- **Multi-Recipient**: Proper handling of multiple recipients with different ID types
- **Configuration Sync**: Auto-update of dependent constants

### 5. Edge Cases

- **Minimum/Maximum ID Sizes**: 1 byte and 255 byte custom IDs
- **Empty/Nil IDs**: All-zero ID detection
- **Invalid Inputs**: Non-string deserialization, wrong lengths, invalid formats
- **High Recipient Counts**: 100+ recipients in a single message

## Test Execution

### Run All ID Provider Tests

```bash
# Basic tests
npm test -- id-providers.spec.ts

# Comprehensive tests
npm test -- id-providers-comprehensive.spec.ts

# Integration tests
npm test -- recipient-id-consistency.spec.ts
npm test -- encrypted-message-structure.spec.ts

# All integration tests together
npm test -- "integration/(recipient-id-consistency|encrypted-message-structure).spec.ts"
```

### Expected Results

- **Basic Tests**: 32 passing
- **Comprehensive Tests**: 74 passing
- **Integration Tests**: 26 passing (14 + 12)
- **Total**: 132 passing

## Coverage Summary

| Component | Test Files | Tests | Coverage |
|-----------|-----------|-------|----------|
| ID Providers (Unit) | 2 | 106 | Comprehensive |
| ID Providers (Integration) | 2 | 26 | Complete |
| **Total** | **4** | **132** | **Excellent** |

### Key Areas Covered

✅ **Generation**: Uniqueness, format compliance, randomness  
✅ **Validation**: Correct/incorrect inputs, edge cases  
✅ **Serialization**: Format correctness, round-trips  
✅ **Deserialization**: Multiple formats, error handling  
✅ **Equality**: Constant-time, correctness  
✅ **Security**: Timing safety, randomness quality  
✅ **Performance**: Speed benchmarks  
✅ **Integration**: Encryption system compatibility  
✅ **Regression**: Original 12 vs 32 byte bug  

## Maintenance

When adding a new ID provider:

1. Add basic tests to `id-providers.spec.ts`
2. Add comprehensive tests to `id-providers-comprehensive.spec.ts`
3. Add integration tests to both integration test files
4. Verify all 132+ tests still pass
5. Update this documentation

## Related Documentation

- [Phase 3 Implementation Summary](./PHASE_3_SUMMARY.md) *(to be created)*
- [ID Provider Architecture](./ID_PROVIDER_ARCHITECTURE.md) *(existing)*
- [Migration Checklist](../MIGRATION_CHECKLIST_NODE_LIB.md) *(existing)*
