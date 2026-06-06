import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        sac:  resolve(__dirname, 'sac.html'),
      },
    },
    cssMinify: true,
    assetsInlineLimit: 4096,
  },
});
