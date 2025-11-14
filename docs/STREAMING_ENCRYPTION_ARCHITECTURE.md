# Streaming Encryption Architecture Plan

## Executive Summary

Add production-ready streaming encryption/decryption with progress tracking, cancellation, and resumability to `@digitaldefiance/ecies-lib`. This fills a critical gap in the ECIES ecosystem and positions the library as the premier choice for large-data encryption in browser and Node.js environments.

**Key Metrics:**
- **Memory Efficiency**: 99% reduction for 1GB+ files (1GB RAM → 10MB RAM)
- **User Experience**: Real-time progress, pause/resume, cancellation
- **Performance**: ~50MB/s throughput (Web Crypto API limited)
- **Compatibility**: Web Streams API (browsers) + Node.js Streams

## Problem Statement

### Current Limitations

1. **Memory Constraints**: `encryptSimpleOrSingle()` loads entire payload into memory
   - 1GB file = 1GB+ RAM usage
   - Browser tab crashes on large files
   - Mobile devices fail at ~100MB

2. **No User Feedback**: Encryption is black box
   - No progress indication
   - Can't cancel long operations
   - Poor UX for large files

3. **No Resumability**: Network/app interruptions = start over
   - Mobile apps with spotty connections
   - Long-running operations vulnerable to crashes

4. **File-Only Chunking**: `EciesFileService` is limited
   - Only works with File objects
   - No streaming data support
   - No progress callbacks

### Market Opportunity

**Competing Libraries:**
- `eccrypto`: No streaming, memory-bound
- `eth-crypto`: No streaming support
- `@toruslabs/eccrypto`: No streaming
- **Gap**: No production-ready ECIES streaming solution exists

**Target Use Cases:**
- Video/audio upload encryption (streaming media)
- Database backup encryption (multi-GB dumps)
- Real-time log encryption (continuous streams)
- Collaborative document encryption (dynamic recipients)
- IoT sensor data encryption (continuous telemetry)
- Medical imaging encryption (DICOM files, 100MB-2GB)

## Architecture Design

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    EncryptionStream                         │
│  - Stateful stream processor                                │
│  - Progress tracking                                        │
│  - Cancellation support                                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│ ChunkProcessor │  │ StateManager│  │ ProgressTracker │
│ - Encrypt      │  │ - Save      │  │ - Bytes/Total   │
│ - Decrypt      │  │ - Resume    │  │ - ETA           │
│ - Buffer       │  │ - Validate  │  │ - Throughput    │
└────────────────┘  └─────────────┘  └─────────────────┘
```

### 1. EncryptionStream Service

**Purpose**: Main API for streaming encryption/decryption

```typescript
export class EncryptionStream {
  constructor(
    private ecies: ECIESService,
    private config: StreamConfig = DEFAULT_STREAM_CONFIG
  ) {}

  // Encrypt stream with progress
  async *encryptStream(
    source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
    publicKey: Uint8Array,
    options?: EncryptStreamOptions
  ): AsyncGenerator<EncryptedChunk, void, unknown>

  // Decrypt stream with progress
  async *decryptStream(
    source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
    privateKey: Uint8Array,
    options?: DecryptStreamOptions
  ): AsyncGenerator<Uint8Array, void, unknown>

  // Multi-recipient streaming
  async *encryptStreamMultiple(
    source: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
    recipients: IMultiRecipient[],
    options?: EncryptStreamOptions
  ): AsyncGenerator<EncryptedChunk, void, unknown>
}
```

**Key Features:**
- AsyncGenerator for memory-efficient iteration
- Supports Web Streams API and AsyncIterable
- Yields chunks as they're processed (no buffering)
- Automatic backpressure handling

### 2. Progress Tracking

```typescript
export interface StreamProgress {
  bytesProcessed: number;
  totalBytes?: number;        // undefined for unknown-length streams
  chunksProcessed: number;
  percentComplete?: number;   // undefined if totalBytes unknown
  throughputBytesPerSec: number;
  estimatedTimeRemaining?: number; // seconds, undefined if unknown
  startTime: number;          // timestamp
  elapsedTime: number;        // milliseconds
}

export interface ProgressCallback {
  (progress: StreamProgress): void | Promise<void>;
}
```

**Implementation:**
- Track bytes/chunks in real-time
- Calculate throughput with moving average (last 5 chunks)
- Estimate ETA using throughput
- Support unknown-length streams (no total)

### 3. Cancellation Support

```typescript
export interface EncryptStreamOptions {
  chunkSize?: number;           // default: 1MB
  signal?: AbortSignal;         // standard cancellation
  onProgress?: ProgressCallback;
  onChunk?: ChunkCallback;      // called after each chunk
  metadata?: Record<string, unknown>; // stored in header
}
```

**Cancellation Behavior:**
- Check `signal.aborted` before each chunk
- Throw `AbortError` on cancellation
- Clean up resources (close streams, zero buffers)
- Partial results discarded (no incomplete files)

### 4. Resumable Encryption

```typescript
export interface EncryptionState {
  version: number;              // state format version
  chunkIndex: number;           // last completed chunk
  bytesProcessed: number;
  totalBytes?: number;
  publicKey: Uint8Array;
  encryptionType: EciesEncryptionTypeEnum;
  chunkSize: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export class ResumableEncryption {
  constructor(
    private stream: EncryptionStream,
    private state?: EncryptionState
  ) {}

  // Save current state
  saveState(): EncryptionState

  // Resume from saved state
  static resume(
    stream: EncryptionStream,
    state: EncryptionState,
    source: ReadableStream<Uint8Array>
  ): ResumableEncryption

  // Encrypt with auto-save
  async *encrypt(
    source: ReadableStream<Uint8Array>,
    publicKey: Uint8Array,
    options?: ResumableOptions
  ): AsyncGenerator<EncryptedChunk>
}

export interface ResumableOptions extends EncryptStreamOptions {
  autoSaveInterval?: number;    // save state every N chunks
  onStateSaved?: (state: EncryptionState) => void | Promise<void>;
}
```

**Resumption Strategy:**
- Save state after each chunk (or every N chunks)
- Skip already-processed chunks on resume
- Validate state version and parameters
- Support seeking in source stream (if available)

### 5. Chunk Format

```typescript
export interface EncryptedChunk {
  index: number;                // chunk sequence number
  data: Uint8Array;             // encrypted chunk data
  isLast: boolean;              // final chunk flag
  metadata?: ChunkMetadata;
}

export interface ChunkMetadata {
  originalSize: number;         // pre-encryption size
  encryptedSize: number;        // post-encryption size
  timestamp: number;
  checksum?: Uint8Array;        // optional integrity check
}
```

**Chunk Structure:**
```
┌──────────────────────────────────────────────────────┐
│ Chunk Header (32 bytes)                              │
│  - Magic (4 bytes): 0x45434945 ("ECIE")              │
│  - Version (2 bytes): 0x0001                         │
│  - Chunk Index (4 bytes): uint32                     │
│  - Original Size (4 bytes): uint32                   │
│  - Encrypted Size (4 bytes): uint32                  │
│  - Flags (2 bytes): isLast, hasChecksum, etc.        │
│  - Reserved (12 bytes): future use                   │
├──────────────────────────────────────────────────────┤
│ Encrypted Data (variable)                            │
│  - ECIES encrypted chunk (single-recipient format)   │
├──────────────────────────────────────────────────────┤
│ Optional Checksum (32 bytes)                         │
│  - SHA-256 of original chunk data                    │
└──────────────────────────────────────────────────────┘
```

### 6. Stream Header Format

**Purpose**: Store metadata for entire stream

```
┌──────────────────────────────────────────────────────┐
│ Stream Header (128 bytes fixed)                      │
│  - Magic (4 bytes): 0x45435354 ("ECST")              │
│  - Version (2 bytes): 0x0001                         │
│  - Encryption Type (1 byte): Simple/Single/Multiple  │
│  - Chunk Size (4 bytes): uint32                      │
│  - Total Chunks (4 bytes): uint32 (0 if unknown)     │
│  - Total Bytes (8 bytes): uint64 (0 if unknown)      │
│  - Recipient Count (2 bytes): uint16                 │
│  - Metadata Length (2 bytes): uint16                 │
│  - Timestamp (8 bytes): uint64                       │
│  - Reserved (93 bytes): future use                   │
├──────────────────────────────────────────────────────┤
│ Recipient Data (variable)                            │
│  - Public keys or encrypted keys (multi-recipient)   │
├──────────────────────────────────────────────────────┤
│ Metadata (variable, max 64KB)                        │
│  - JSON-encoded custom metadata                      │
└──────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Core Streaming (Week 1-2)

**Deliverables:**
- `EncryptionStream` service with basic encrypt/decrypt
- Chunk processor with 1MB default chunks
- AsyncGenerator-based API
- Basic progress tracking (bytes/chunks)
- Unit tests (20+ specs)

**Files:**
- `src/services/encryption-stream.ts` (new)
- `src/services/chunk-processor.ts` (new)
- `src/interfaces/stream-config.ts` (new)
- `tests/services/encryption-stream.spec.ts` (new)

**Success Criteria:**
- Encrypt/decrypt 1GB file with <10MB RAM
- 100+ chunks processed successfully
- Progress callbacks fire correctly

### Phase 2: Progress & Cancellation (Week 3)

**Deliverables:**
- Full `StreamProgress` implementation
- Throughput calculation with moving average
- ETA estimation
- `AbortSignal` integration
- Graceful cleanup on cancellation
- Integration tests

**Files:**
- `src/services/progress-tracker.ts` (new)
- `src/interfaces/stream-progress.ts` (new)
- `tests/services/progress-tracker.spec.ts` (new)
- `tests/integration/cancellation.e2e.spec.ts` (new)

**Success Criteria:**
- Accurate progress for known-length streams
- Throughput within 10% of actual
- Cancellation cleans up within 100ms

### Phase 3: Resumability (Week 4)

**Deliverables:**
- `EncryptionState` serialization
- `ResumableEncryption` class
- State validation and versioning
- Auto-save with configurable interval
- Resume from arbitrary chunk
- E2E tests

**Files:**
- `src/services/resumable-encryption.ts` (new)
- `src/interfaces/encryption-state.ts` (new)
- `tests/services/resumable-encryption.spec.ts` (new)
- `tests/e2e/resumable-workflow.e2e.spec.ts` (new)

**Success Criteria:**
- Resume 1GB encryption from 50% complete
- State serializes to <1KB
- No data corruption on resume

### Phase 4: Multi-Recipient Streaming (Week 5)

**Deliverables:**
- `encryptStreamMultiple()` implementation
- Efficient key management for streaming
- Dynamic recipient add/remove (stretch)
- Multi-recipient chunk format
- Performance tests

**Files:**
- Update `src/services/encryption-stream.ts`
- `src/services/multi-recipient-stream.ts` (new)
- `tests/services/multi-recipient-stream.spec.ts` (new)

**Success Criteria:**
- Encrypt for 10 recipients with <2x overhead
- Same memory efficiency as single-recipient

### Phase 5: Documentation & Examples (Week 6)

**Deliverables:**
- README section with examples
- API documentation
- Migration guide from `EciesFileService`
- Example apps (video upload, backup)
- Performance benchmarks

**Files:**
- Update `README.md`
- `docs/STREAMING_API.md` (new)
- `examples/video-upload-encryption.ts` (new)
- `examples/database-backup-encryption.ts` (new)
- `docs/STREAMING_BENCHMARKS.md` (new)

## API Examples

### Basic Streaming Encryption

```typescript
import { EncryptionStream, ECIESService } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();
const stream = new EncryptionStream(ecies);
const { publicKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

// Encrypt file stream
const fileStream = file.stream();
const encryptedChunks: Uint8Array[] = [];

for await (const chunk of stream.encryptStream(fileStream, publicKey)) {
  encryptedChunks.push(chunk.data);
  console.log(`Encrypted chunk ${chunk.index}`);
}

const encrypted = new Blob(encryptedChunks);
```

### With Progress Tracking

```typescript
const progressBar = document.querySelector('#progress');

for await (const chunk of stream.encryptStream(fileStream, publicKey, {
  onProgress: (progress) => {
    progressBar.value = progress.percentComplete ?? 0;
    console.log(`${progress.percentComplete}% - ETA: ${progress.estimatedTimeRemaining}s`);
  }
})) {
  await uploadChunk(chunk.data);
}
```

### With Cancellation

```typescript
const controller = new AbortController();
document.querySelector('#cancel').addEventListener('click', () => {
  controller.abort();
});

try {
  for await (const chunk of stream.encryptStream(fileStream, publicKey, {
    signal: controller.signal,
    onProgress: updateUI
  })) {
    await uploadChunk(chunk.data);
  }
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Encryption cancelled by user');
  }
}
```

### Resumable Encryption

```typescript
import { ResumableEncryption } from '@digitaldefiance/ecies-lib';

const resumable = new ResumableEncryption(stream);

// Start encryption with auto-save
for await (const chunk of resumable.encrypt(fileStream, publicKey, {
  autoSaveInterval: 10, // save every 10 chunks
  onStateSaved: (state) => {
    localStorage.setItem('encryptionState', JSON.stringify(state));
  },
  onProgress: updateUI
})) {
  await uploadChunk(chunk.data);
}

// Later: resume from saved state
const savedState = JSON.parse(localStorage.getItem('encryptionState'));
const resumed = ResumableEncryption.resume(stream, savedState, fileStream);

for await (const chunk of resumed.encrypt(fileStream, publicKey)) {
  await uploadChunk(chunk.data);
}
```

### Multi-Recipient Streaming

```typescript
const recipients = [
  { id: userId1, publicKey: publicKey1 },
  { id: userId2, publicKey: publicKey2 },
  { id: userId3, publicKey: publicKey3 }
];

for await (const chunk of stream.encryptStreamMultiple(fileStream, recipients, {
  onProgress: updateUI
})) {
  // All recipients can decrypt this chunk
  await uploadChunk(chunk.data);
}
```

### Decryption

```typescript
const encryptedStream = await fetch('/encrypted-file').then(r => r.body);

for await (const decryptedChunk of stream.decryptStream(
  encryptedStream,
  privateKey,
  { onProgress: updateUI }
)) {
  await writeToFile(decryptedChunk);
}
```

## Performance Targets

### Memory Usage
- **Target**: <10MB RAM for any file size
- **Baseline**: 1GB file = 1GB+ RAM (current)
- **Improvement**: 99% reduction

### Throughput
- **Target**: 50MB/s encryption (Web Crypto API limited)
- **Baseline**: ~100MB/s for in-memory operations
- **Overhead**: ~50% due to streaming + chunking

### Latency
- **Target**: <100ms first chunk
- **Target**: <50ms subsequent chunks
- **Target**: <100ms cancellation response

### Scalability
- **Target**: 10GB+ files without issues
- **Target**: 100+ concurrent streams (server-side)
- **Target**: 1000+ chunks per stream

## Testing Architecture

### Overview

**Testing Philosophy:**
- Test-driven development (TDD) for core components
- 100% code coverage for streaming features
- Performance regression tests in CI/CD
- Cross-platform compatibility validation
- Memory leak detection

**Test Pyramid:**
```
        E2E (10 tests)
       /              \
      /    Integration  \
     /      (20 tests)   \
    /____________________\
    Unit Tests (40 tests)
```

### Unit Tests (40+ specs)

#### ChunkProcessor Tests (12 specs)
**File**: `tests/services/chunk-processor.spec.ts`

```typescript
describe('ChunkProcessor', () => {
  describe('encryption', () => {
    it('should encrypt chunk with correct header');
    it('should handle chunk at max size (1MB)');
    it('should handle chunk smaller than max size');
    it('should include chunk index in header');
    it('should mark last chunk with isLast flag');
    it('should throw on chunk exceeding max size');
  });

  describe('decryption', () => {
    it('should decrypt chunk and verify header');
    it('should validate chunk index sequence');
    it('should detect corrupted chunk header');
    it('should detect tampered encrypted data');
    it('should handle last chunk correctly');
    it('should throw on invalid chunk format');
  });
});
```

**Coverage Targets:**
- Line: 100%
- Branch: 100%
- Function: 100%

#### ProgressTracker Tests (10 specs)
**File**: `tests/services/progress-tracker.spec.ts`

```typescript
describe('ProgressTracker', () => {
  describe('progress calculation', () => {
    it('should calculate percent complete with known total');
    it('should handle unknown total (streaming)');
    it('should track bytes processed accurately');
    it('should track chunks processed accurately');
  });

  describe('throughput calculation', () => {
    it('should calculate throughput with moving average');
    it('should update throughput on each chunk');
    it('should handle zero elapsed time');
  });

  describe('ETA estimation', () => {
    it('should estimate time remaining accurately');
    it('should return undefined for unknown total');
    it('should adjust ETA based on throughput changes');
  });
});
```

**Test Data:**
- Small file: 1MB (1 chunk)
- Medium file: 10MB (10 chunks)
- Large file: 100MB (100 chunks)
- Variable throughput scenarios

#### StateManager Tests (8 specs)
**File**: `tests/services/state-manager.spec.ts`

```typescript
describe('StateManager', () => {
  describe('serialization', () => {
    it('should serialize state to JSON');
    it('should deserialize state from JSON');
    it('should handle Uint8Array in state');
    it('should produce state under 1KB');
  });

  describe('validation', () => {
    it('should validate state version');
    it('should validate required fields');
    it('should reject corrupted state');
    it('should reject incompatible version');
  });
});
```

**Validation Tests:**
- Missing fields
- Invalid types
- Version mismatches
- Corrupted data

#### StreamHeader Tests (10 specs)
**File**: `tests/services/stream-header.spec.ts`

```typescript
describe('StreamHeader', () => {
  describe('building', () => {
    it('should build header with magic bytes');
    it('should include version number');
    it('should include encryption type');
    it('should include chunk size and count');
    it('should include total bytes');
    it('should handle unknown total (0)');
  });

  describe('parsing', () => {
    it('should parse valid header');
    it('should validate magic bytes');
    it('should validate version');
    it('should throw on invalid header');
  });
});
```

**Edge Cases:**
- Unknown total bytes (streaming)
- Maximum values (uint64)
- Minimum header size
- Invalid magic bytes

### Integration Tests (20+ specs)

#### End-to-End Encryption Tests (8 specs)
**File**: `tests/integration/encryption-e2e.spec.ts`

```typescript
describe('EncryptionStream E2E', () => {
  it('should encrypt and decrypt 1MB file');
  it('should encrypt and decrypt 10MB file');
  it('should encrypt and decrypt 100MB file');
  it('should handle empty file');
  it('should handle single-byte file');
  it('should preserve binary data integrity');
  it('should work with text data');
  it('should work with random data');
});
```

**Test Fixtures:**
- Text files (UTF-8, ASCII)
- Binary files (images, PDFs)
- Random data (crypto.getRandomValues)
- Edge cases (empty, 1 byte, max size)

#### Progress Callback Tests (4 specs)
**File**: `tests/integration/progress-callbacks.spec.ts`

```typescript
describe('Progress Callbacks', () => {
  it('should fire progress callback on each chunk');
  it('should provide accurate progress data');
  it('should calculate throughput correctly');
  it('should estimate ETA within 10% accuracy');
});
```

**Assertions:**
- Callback invocation count
- Progress values (0-100%)
- Throughput calculation
- ETA accuracy

#### Cancellation Tests (4 specs)
**File**: `tests/integration/cancellation.spec.ts`

```typescript
describe('Cancellation', () => {
  it('should cancel encryption mid-stream');
  it('should clean up resources on cancel');
  it('should throw AbortError on cancel');
  it('should not leave partial data');
});
```

**Cancellation Points:**
- Before first chunk
- After first chunk
- Mid-stream (50%)
- Before last chunk

#### Resumption Tests (4 specs)
**File**: `tests/integration/resumption.spec.ts`

```typescript
describe('Resumable Encryption', () => {
  it('should resume from 25% complete');
  it('should resume from 50% complete');
  it('should resume from 75% complete');
  it('should skip already-processed chunks');
});
```

**Resume Scenarios:**
- Early interruption (25%)
- Mid-point interruption (50%)
- Late interruption (75%)
- State validation

### E2E Tests (10+ specs)

#### Large File Tests (3 specs)
**File**: `tests/e2e/large-files.e2e.spec.ts`

```typescript
describe('Large File Encryption', () => {
  it('should encrypt 500MB file with <10MB RAM', async () => {
    const memBefore = process.memoryUsage().heapUsed;
    // encrypt 500MB file
    const memAfter = process.memoryUsage().heapUsed;
    expect(memAfter - memBefore).toBeLessThan(10 * 1024 * 1024);
  });

  it('should encrypt 1GB file with <10MB RAM');
  it('should handle 10GB file without crash');
});
```

**Memory Profiling:**
- Heap snapshots before/after
- Peak memory usage
- Memory leak detection

#### Browser Compatibility Tests (3 specs)
**File**: `tests/e2e/browser-compat.e2e.spec.ts`

```typescript
describe('Browser Compatibility', () => {
  it('should work in Chrome 89+');
  it('should work in Firefox 102+');
  it('should work in Safari 14.1+');
});
```

**Test Environment:**
- Playwright for browser automation
- Real browser instances
- Web Streams API detection

#### Performance Benchmarks (4 specs)
**File**: `tests/e2e/performance.e2e.spec.ts`

```typescript
describe('Performance Benchmarks', () => {
  it('should achieve 50MB/s throughput', async () => {
    const start = Date.now();
    // encrypt 100MB
    const elapsed = Date.now() - start;
    const throughput = (100 * 1024 * 1024) / (elapsed / 1000);
    expect(throughput).toBeGreaterThan(50 * 1024 * 1024);
  });

  it('should produce first chunk in <100ms');
  it('should produce subsequent chunks in <50ms');
  it('should handle 100 concurrent streams');
});
```

**Benchmarks:**
- Throughput (MB/s)
- Latency (first chunk, subsequent)
- Concurrency (multiple streams)
- Memory efficiency

### Performance Tests

#### Memory Profiling
**File**: `tests/performance/memory-profile.spec.ts`

```typescript
describe('Memory Profiling', () => {
  it('should not leak memory over 1000 chunks', async () => {
    const snapshots = [];
    for (let i = 0; i < 10; i++) {
      // encrypt 100MB (100 chunks)
      global.gc(); // force garbage collection
      snapshots.push(process.memoryUsage().heapUsed);
    }
    // Memory should stabilize (not grow linearly)
    const growth = snapshots[9] - snapshots[0];
    expect(growth).toBeLessThan(5 * 1024 * 1024); // <5MB growth
  });
});
```

**Tools:**
- Node.js `process.memoryUsage()`
- Chrome DevTools heap snapshots
- Memory leak detection

#### Throughput Benchmarks
**File**: `tests/performance/throughput.spec.ts`

```typescript
describe('Throughput Benchmarks', () => {
  const chunkSizes = [512 * 1024, 1024 * 1024, 2 * 1024 * 1024, 4 * 1024 * 1024];

  chunkSizes.forEach(size => {
    it(`should benchmark ${size / 1024}KB chunks`, async () => {
      // measure throughput for different chunk sizes
    });
  });
});
```

**Metrics:**
- Throughput vs chunk size
- Optimal chunk size determination
- Overhead analysis

### Test Infrastructure

#### Test Utilities
**File**: `tests/support/stream-test-utils.ts`

```typescript
export class StreamTestUtils {
  // Generate test data
  static generateRandomData(size: number): Uint8Array;
  static generateTextData(size: number): string;
  
  // Create test streams
  static createReadableStream(data: Uint8Array): ReadableStream<Uint8Array>;
  static createAsyncIterable(data: Uint8Array, chunkSize: number): AsyncIterable<Uint8Array>;
  
  // Mock progress callbacks
  static createProgressMock(): jest.Mock<void, [StreamProgress]>;
  
  // Memory helpers
  static measureMemory(fn: () => Promise<void>): Promise<number>;
  static forceGC(): void;
  
  // Timing helpers
  static measureThroughput(size: number, duration: number): number;
  static measureLatency(fn: () => Promise<void>): Promise<number>;
}
```

#### Test Fixtures
**Directory**: `tests/fixtures/`

```
tests/fixtures/
├── small-text.txt (1KB)
├── medium-text.txt (1MB)
├── large-text.txt (10MB)
├── small-binary.bin (1KB)
├── medium-binary.bin (1MB)
├── large-binary.bin (10MB)
└── test-image.png (500KB)
```

#### CI/CD Integration
**File**: `.github/workflows/streaming-tests.yml`

```yaml
name: Streaming Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: yarn test:streaming:unit

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: yarn test:streaming:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: yarn test:streaming:e2e

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: yarn test:streaming:performance
      - uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: test-results/performance/
```

### Test Coverage Requirements

**Minimum Coverage:**
- Line Coverage: 100%
- Branch Coverage: 95%
- Function Coverage: 100%
- Statement Coverage: 100%

### Security Audit Test Categories

**1. Cryptographic Validation (3 tests) ✅**
- ✅ Deterministic encryption verification (IV randomness)
- ✅ Key reuse safety across multiple messages
- ✅ Ephemeral key uniqueness per chunk
- ⏳ IV collision detection (future)

**2. Compatibility & Interoperability (2 tests + 2 future) ✅**
- ✅ Chunk format compatibility validation
- ✅ Endianness handling (big-endian)
- ⏳ Cross-version compatibility (v2.2.0 decrypt v2.1.0)
- ⏳ Cross-platform compatibility (Node.js vs Browser)

**3. Resource Exhaustion & DoS Protection (2 tests + 1 future) ✅**
- ✅ Malicious chunk size in header
- ✅ Rapid cancellation without memory leak
- ⏳ Infinite stream handling

**4. Error Information Leakage (2 tests) ✅**
- ✅ No key material in error messages
- ✅ Sanitized error messages for invalid data
- ⏳ Stack trace sanitization (future)

**5. Concurrency & Race Conditions (2 tests) ✅**
- ✅ Concurrent encryption streams
- ✅ Interleaved encrypt/decrypt operations
- ⏳ Thread safety validation (future)

**6. Timing & Side-Channel Attacks (future)**
- ⏳ Constant-time comparison for checksums
- ⏳ Early termination timing analysis
- ⏳ Cache timing attack resistance

**7. Compliance & Standards (future)**
- ⏳ FIPS 140-2 compliance (if required)
- ⏳ Key strength validation (reject weak keys)
- ⏳ NIST SP 800-38D compliance (GCM mode)

**Current Status: 11/11 security audit tests passing**
**Future Enhancements: 8 additional tests identified**

**Coverage Reports:**
- HTML report for local development
- JSON report for CI/CD
- Codecov integration
- Coverage badge in README

### Test Execution Strategy

**Local Development:**
```bash
yarn test:streaming           # All streaming tests
yarn test:streaming:unit      # Unit tests only
yarn test:streaming:watch     # Watch mode
yarn test:streaming:coverage  # With coverage
```

**CI/CD Pipeline:**
1. Unit tests (fast, every commit)
2. Integration tests (medium, every commit)
3. E2E tests (slow, every PR)
4. Performance tests (slow, nightly)

**Performance Regression:**
- Baseline measurements stored
- Compare against baseline
- Fail if >10% regression
- Alert on >5% regression

### Test Data Management

**Synthetic Data:**
- Generate on-the-fly (no large fixtures)
- Deterministic (seeded random)
- Various sizes (1KB - 1GB)

**Real-World Data:**
- Sample files (text, binary, images)
- Stored in `tests/fixtures/`
- Max 10MB per fixture

**Cleanup:**
- Delete generated files after tests
- No test artifacts in repo
- Temp directory for large files

### Debugging Support

**Debug Utilities:**
```typescript
export class StreamDebugger {
  static enableVerboseLogging(): void;
  static dumpChunkInfo(chunk: EncryptedChunk): void;
  static dumpStreamState(state: EncryptionState): void;
  static visualizeProgress(progress: StreamProgress): void;
}
```

**Debug Mode:**
```bash
DEBUG=streaming:* yarn test:streaming
```

### Test Maintenance

**Review Schedule:**
- Weekly: Review failing tests
- Monthly: Review test coverage
- Quarterly: Review test performance

**Test Quality:**
- No flaky tests (retry 3x, then fix)
- Fast tests (<1s per unit test)
- Isolated tests (no shared state)
- Descriptive test names

## Browser Compatibility

### Web Streams API Support
- **Chrome/Edge**: 89+ (March 2021)
- **Firefox**: 102+ (June 2022)
- **Safari**: 14.1+ (April 2021)
- **Node.js**: 16.5+ (native), 14+ (polyfill)

### Fallback Strategy
- Detect Web Streams API support
- Polyfill for older browsers (web-streams-polyfill)
- Graceful degradation to AsyncIterable
- Clear error messages for unsupported environments

## Security Considerations

### Chunk Independence
- Each chunk encrypted independently
- No cross-chunk dependencies
- Prevents partial decryption attacks

### State Security
- `EncryptionState` contains no secrets
- Public keys only (no private keys)
- Safe to store in localStorage/IndexedDB

### Memory Safety
- Zero buffers after use
- No secret material in state
- Automatic cleanup on errors

### Integrity
- Optional per-chunk checksums
- Detect tampering or corruption
- Fail fast on invalid chunks

## Migration Path

### From EciesFileService

**Before:**
```typescript
const fileService = new EciesFileService(ecies, privateKey);
const encrypted = await fileService.encryptFile(file, publicKey);
```

**After:**
```typescript
const stream = new EncryptionStream(ecies);
const chunks: Uint8Array[] = [];

for await (const chunk of stream.encryptStream(file.stream(), publicKey)) {
  chunks.push(chunk.data);
}

const encrypted = new Blob(chunks);
```

### Backward Compatibility
- Keep `EciesFileService` for simple use cases
- Add `EciesFileService.encryptFileStreaming()` wrapper
- Deprecate old methods in v3.0
- Remove in v4.0 (12+ months)

## Success Metrics

### Adoption
- 50+ GitHub stars in 3 months
- 10+ production deployments in 6 months
- Featured in "awesome-crypto" lists

### Performance
- 99% memory reduction for large files
- 50MB/s throughput achieved
- <100ms first chunk latency

### Quality
- 100% test coverage for streaming code
- Zero critical bugs in first 3 months
- <5% performance regression vs baseline

### Documentation
- 10+ code examples
- Video tutorial (YouTube)
- Blog post with benchmarks

## Future Enhancements (v3.0+)

### Dynamic Recipients
- Add/remove recipients mid-stream
- Re-encrypt only affected chunks
- Efficient key rotation

### Compression
- Optional pre-encryption compression
- Configurable algorithms (gzip, brotli)
- Automatic for text-heavy data

### Parallel Processing
- Multi-threaded encryption (Web Workers)
- Parallel chunk processing
- 2-4x throughput improvement

### Cloud Integration
- Direct S3/Azure/GCS upload
- Streaming to cloud storage
- Server-side encryption options

### Advanced Progress
- Detailed chunk-level progress
- Network upload progress
- Combined encryption + upload tracking

## Open Questions

1. **Chunk Size**: 1MB default optimal? Test 512KB, 2MB, 4MB
2. **State Storage**: localStorage sufficient? Add IndexedDB support?
3. **Checksum**: Always include or optional? Performance impact?
4. **Compression**: Include in v2.0 or defer to v3.0?
5. **Web Workers**: Worth the complexity for parallel processing?

## Timeline Summary

- **Week 1-2**: Core streaming (Phase 1)
- **Week 3**: Progress & cancellation (Phase 2)
- **Week 4**: Resumability (Phase 3)
- **Week 5**: Multi-recipient (Phase 4)
- **Week 6**: Documentation (Phase 5)
- **Week 7**: Beta testing & bug fixes
- **Week 8**: Release v2.2.0

**Total**: 8 weeks to production-ready streaming encryption
