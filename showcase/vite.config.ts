import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import alias from '@rollup/plugin-alias';
import { resolve } from 'path';

// Noble ESM aliases for production build
const nobleAliases = [
  // @ethereumjs/wallet ESM
  {
    find: '@ethereumjs/wallet',
    replacement: resolve(
      __dirname,
      'node_modules/@ethereumjs/wallet/dist/esm/index.js',
    ),
  },
  // ethereum-cryptography ESM - must come first
  {
    find: 'ethereum-cryptography/hdkey',
    replacement: resolve(
      __dirname,
      'node_modules/ethereum-cryptography/esm/hdkey.js',
    ),
  },
  {
    find: 'ethereum-cryptography/secp256k1',
    replacement: resolve(
      __dirname,
      'node_modules/ethereum-cryptography/esm/secp256k1.js',
    ),
  },
  {
    find: 'ethereum-cryptography/keccak',
    replacement: resolve(
      __dirname,
      'node_modules/ethereum-cryptography/esm/keccak.js',
    ),
  },
  {
    find: 'ethereum-cryptography/utils',
    replacement: resolve(
      __dirname,
      'node_modules/ethereum-cryptography/esm/utils.js',
    ),
  },
  {
    find: 'ethereum-cryptography/random',
    replacement: resolve(
      __dirname,
      'node_modules/ethereum-cryptography/esm/random.js',
    ),
  },
  // @scure/bip32 ESM - must come first to catch the package import
  {
    find: '@scure/bip32',
    replacement: resolve(
      __dirname,
      'node_modules/@scure/bip32/lib/esm/index.js',
    ),
  },
  {
    find: '@noble/hashes/utils',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/utils.js'),
  },
  {
    find: '@noble/hashes/sha2',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/sha2.js'),
  },
  {
    find: '@noble/hashes/sha256',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/sha2.js'),
  },
  {
    find: '@noble/hashes/sha512',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/sha2.js'),
  },
  {
    find: '@noble/hashes/sha3',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/sha3.js'),
  },
  {
    find: '@noble/hashes/hmac',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/hmac.js'),
  },
  {
    find: '@noble/hashes/hkdf',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/hkdf.js'),
  },
  {
    find: '@noble/hashes/pbkdf2',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/pbkdf2.js'),
  },
  {
    find: '@noble/hashes/scrypt',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/scrypt.js'),
  },
  {
    find: '@noble/hashes/ripemd160',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/legacy.js'),
  },
  {
    find: '@noble/hashes/legacy',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/legacy.js'),
  },
  {
    find: '@noble/hashes/crypto',
    replacement: resolve(__dirname, 'node_modules/@noble/hashes/esm/crypto.js'),
  },
  {
    find: '@noble/hashes/_assert',
    replacement: resolve(
      __dirname,
      'node_modules/@noble/hashes/esm/_assert.js',
    ),
  },
  {
    find: '@noble/curves/secp256k1',
    replacement: resolve(
      __dirname,
      'node_modules/@noble/curves/esm/secp256k1.js',
    ),
  },
  {
    find: '@noble/curves/ed25519',
    replacement: resolve(
      __dirname,
      'node_modules/@noble/curves/esm/ed25519.js',
    ),
  },
  {
    find: '@noble/curves/abstract/modular',
    replacement: resolve(
      __dirname,
      'node_modules/@noble/curves/esm/abstract/modular.js',
    ),
  },
];

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [alias({ entries: nobleAliases }), react()],
  base: '/ecies-lib/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      // Transform CommonJS modules to ES modules
      transformMixedEsModules: true,
      // Ensure named exports are properly detected
      requireReturnsDefault: 'auto',
    },
    rollupOptions: {
      plugins: [
        // Apply aliases during rollup build phase too
        alias({ entries: nobleAliases }),
      ],
    },
  },
  optimizeDeps: {
    // Force pre-bundling of these dependencies to resolve bare imports like 'tslib'
    include: [
      'tslib',
      '@digitaldefiance/ecies-lib',
      '@digitaldefiance/i18n-lib',
      '@ethereumjs/wallet',
      '@scure/bip32',
      '@scure/bip39',
      '@noble/hashes',
      '@noble/hashes/utils',
      '@noble/hashes/sha2',
      '@noble/hashes/sha256',
      '@noble/hashes/sha512',
      '@noble/hashes/hmac',
      '@noble/hashes/hkdf',
      '@noble/hashes/pbkdf2',
      '@noble/hashes/ripemd160',
      '@noble/curves',
      '@noble/curves/secp256k1',
      'bson',
      'uuid',
    ],
    esbuildOptions: {
      // Ensure all packages are treated as ESM
      mainFields: ['module', 'main'],
    },
    // Force re-optimization even if cached
    force: true,
  },
  resolve: {
    // Ensure proper module resolution - dedupe @noble packages to avoid multiple Uint8Array captures
    dedupe: ['tslib', '@noble/hashes', '@noble/curves', '@scure/bip32'],
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      // Force @ethereumjs/wallet to use ESM
      '@ethereumjs/wallet': resolve(
        __dirname,
        'node_modules/@ethereumjs/wallet/dist/esm/index.js',
      ),
      // Force ethereum-cryptography to use ESM
      'ethereum-cryptography/hdkey': resolve(
        __dirname,
        'node_modules/ethereum-cryptography/esm/hdkey.js',
      ),
      'ethereum-cryptography/secp256k1': resolve(
        __dirname,
        'node_modules/ethereum-cryptography/esm/secp256k1.js',
      ),
      'ethereum-cryptography/keccak': resolve(
        __dirname,
        'node_modules/ethereum-cryptography/esm/keccak.js',
      ),
      'ethereum-cryptography/utils': resolve(
        __dirname,
        'node_modules/ethereum-cryptography/esm/utils.js',
      ),
      'ethereum-cryptography/random': resolve(
        __dirname,
        'node_modules/ethereum-cryptography/esm/random.js',
      ),
      // Force @scure/bip32 to use ESM
      '@scure/bip32': resolve(
        __dirname,
        'node_modules/@scure/bip32/lib/esm/index.js',
      ),
      // Map to ESM versions of @noble packages for proper browser bundling
      '@noble/hashes/sha2': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/sha2.js',
      ),
      '@noble/hashes/sha256': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/sha2.js',
      ),
      '@noble/hashes/sha512': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/sha2.js',
      ),
      '@noble/hashes/sha3': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/sha3.js',
      ),
      '@noble/hashes/utils': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/utils.js',
      ),
      '@noble/hashes/hmac': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/hmac.js',
      ),
      '@noble/hashes/hkdf': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/hkdf.js',
      ),
      '@noble/hashes/pbkdf2': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/pbkdf2.js',
      ),
      '@noble/hashes/scrypt': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/scrypt.js',
      ),
      '@noble/hashes/ripemd160': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/legacy.js',
      ),
      '@noble/hashes/legacy': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/legacy.js',
      ),
      '@noble/hashes/_assert': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/_assert.js',
      ),
      '@noble/hashes/crypto': resolve(
        __dirname,
        'node_modules/@noble/hashes/esm/crypto.js',
      ),
      '@noble/curves/secp256k1': resolve(
        __dirname,
        'node_modules/@noble/curves/esm/secp256k1.js',
      ),
      '@noble/curves/ed25519': resolve(
        __dirname,
        'node_modules/@noble/curves/esm/ed25519.js',
      ),
      '@noble/curves/abstract/modular': resolve(
        __dirname,
        'node_modules/@noble/curves/esm/abstract/modular.js',
      ),
    },
  },
  define: {
    // Required for some packages that check for Node.js environment
    global: 'globalThis',
  },
});
