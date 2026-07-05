import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
    open: false,
  },
  build: {
    target: 'esnext',
  },
});
