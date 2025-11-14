# Streaming Encryption API - Quick Start

## Overview

The streaming encryption API enables memory-efficient encryption/decryption of large files with minimal memory footprint (<10MB for any file size).

**Status**: Phase 1 Complete ✅ (Core streaming functionality)

## Basic Usage

### Encrypt a Stream

```typescript
import { ECIESService, EncryptionStream } from '@digitaldefiance/ecies-lib';

const ecies = new ECIESService();
const stream = new EncryptionStream(ecies);

// Generate keys
const mnemonic = ecies.generateNewMnemonic();
const { publicKey, privateKey } = ecies.mnemonicToSimpleKeyPair(mnemonic);

// Encrypt file stream
const file = document.querySelector('input[type="file"]').files[0];
const encryptedChunks: Uint8Array[] = [];

for await (const chunk of stream.encryptStream(file.stream(), publicKey)) {
  encryptedChunks.push(chunk.data);
  console.log(`Encrypted chunk ${chunk.index}, last: ${chunk.isLast}`);
}

const encryptedBlob = new Blob(encryptedChunks);
```

### Decrypt a Stream

```typescript
// Decrypt encrypted stream
const decryptedChunks: Uint8Array[] = [];

for await (const chunk of stream.decryptStream(
  (async function* () {
    for (const encrypted of encryptedChunks) {
      yield encrypted;
    }
  })(),
  privateKey
)) {
  decryptedChunks.push(chunk);
}

// Concatenate chunks
const totalLength = decryptedChunks.reduce((sum, c) => sum + c.length, 0);
const decrypted = new Uint8Array(totalLength);
let offset = 0;
for (const chunk of decryptedChunks) {
  decrypted.set(chunk, offset);
  offset += chunk.length;
}
```

### Using Member Class

```typescript
import { Member } from '@digitaldefiance/ecies-lib';

const member = await Member.fromMnemonic(mnemonic);

// Encrypt stream
const encryptedChunks: Uint8Array[] = [];
for await (const chunk of member.encryptDataStream(file.stream())) {
  encryptedChunks.push(chunk.data);
}

// Decrypt stream
const decryptedChunks: Uint8Array[] = [];
for await (const chunk of member.decryptDataStream(
  (async function* () {
    for (const encrypted of encryptedChunks) {
      yield encrypted;
    }
  })()
)) {
  decryptedChunks.push(chunk);
}
```

## Cancellation Support

```typescript
const controller = new AbortController();

// Cancel button
document.querySelector('#cancel').addEventListener('click', () => {
  controller.abort();
});

try {
  for await (const chunk of stream.encryptStream(file.stream(), publicKey, {
    signal: controller.signal
  })) {
    await uploadChunk(chunk.data);
  }
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Encryption cancelled');
  }
}
```

## Configuration Options

### Encryption Options

```typescript
interface IEncryptStreamOptions {
  chunkSize?: number;           // Default: 1MB
  signal?: AbortSignal;         // Cancellation support
  includeChecksums?: boolean;   // Default: false (AES-GCM provides auth)
}
```

### Decryption Options

```typescript
interface IDecryptStreamOptions {
  signal?: AbortSignal;         // Cancellation support
}
```

## Performance

- **Memory Usage**: <10MB for any file size
- **Throughput**: ~50MB/s (Web Crypto API limited)
- **Chunk Size**: 1MB default (configurable)

## Browser Compatibility

- Chrome/Edge 89+
- Firefox 102+
- Safari 14.1+
- Node.js 16.5+

## Coming Soon (Phase 2)

- Progress callbacks with throughput and ETA
- Real-time progress tracking
- Detailed performance metrics

## Coming Soon (Phase 3)

- Resumable encryption
- State serialization
- Auto-save intervals

## Examples

See `tests/integration/` for complete working examples:
- `encryption-e2e.spec.ts` - Basic encrypt/decrypt workflows
- `cancellation.spec.ts` - Cancellation examples
- `member-streaming.spec.ts` - Member class usage

## API Reference

See [STREAMING_ENCRYPTION_ARCHITECTURE.md](./STREAMING_ENCRYPTION_ARCHITECTURE.md) for complete API documentation.
