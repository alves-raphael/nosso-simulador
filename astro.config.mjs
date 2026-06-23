import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://nossosimulador.com.br',
  integrations: [sitemap()],
  vite: {
    build: { assetsInlineLimit: 4096 },
  },
});
