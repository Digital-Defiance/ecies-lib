import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ecies-lib/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      // Transform CommonJS modules to ES modules
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    // Force pre-bundling of these dependencies to resolve bare imports like 'tslib'
    include: [
      'tslib',
      '@digitaldefiance/ecies-lib',
      '@digitaldefiance/i18n-lib',
      '@ethereumjs/wallet',
      '@noble/curves/secp256k1.js',
      '@noble/curves/ed25519.js',
      '@noble/hashes/sha256',
      '@noble/hashes/sha512',
      '@noble/hashes/ripemd160',
      '@scure/bip32',
      '@scure/bip39',
      'ethereum-cryptography/hdkey.js',
      'bson',
      'uuid',
    ],
    esbuildOptions: {
      // Ensure all packages are treated as ESM
      mainFields: ['module', 'main'],
    },
  },
  resolve: {
    // Ensure proper module resolution
    // NOTE: Don't dedupe @noble/curves - @scure/bip32 needs v1.9.x while secp256k1 uses v2.0.x
    dedupe: ['tslib', '@noble/hashes'],
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  define: {
    // Required for some packages that check for Node.js environment
    global: 'globalThis',
  },
});
