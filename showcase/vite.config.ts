import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/ecies-lib/",
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    include: [
      'tslib',
      'validator',
      'uuid',
      '@scure/bip39',
      '@scure/bip39/wordlists/english',
      '@digitaldefiance/ecies-lib'
    ],
    force: true
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': '"production"',
    'process.env': '{}'
  }
});
