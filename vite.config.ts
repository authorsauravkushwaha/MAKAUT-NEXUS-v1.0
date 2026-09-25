import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // Relative base so the same build works at `/` (dev/preview) and under a
  // sub-path like GitHub Pages `/MAKAUT-NEXUS-v1.0/` (HashRouter-safe).
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('./data', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Arena preview proxies through a dynamic *.e2b.app host — allow it.
    allowedHosts: true as unknown as string[],
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true as unknown as string[],
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
