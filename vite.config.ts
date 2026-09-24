import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
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
