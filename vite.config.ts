import { defineConfig } from 'vite';

export default defineConfig({
  // Vite dev server binds to localhost by default (not 0.0.0.0)
  // TODO(security): If deploying to production, add CSP headers via a plugin or server config
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
