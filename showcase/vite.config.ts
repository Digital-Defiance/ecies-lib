import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ecies-lib/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Ensure tslib is bundled inline, not left as an external import
        inlineDynamicImports: false,
      },
    },
  },
  optimizeDeps: {
    // Force inclusion of tslib in the bundle
    include: ['tslib'],
  },
  resolve: {
    // Ensure proper module resolution
    dedupe: ['tslib'],
  },
});
