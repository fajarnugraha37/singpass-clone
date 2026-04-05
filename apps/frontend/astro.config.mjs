import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://localhost',
  i18n: {
    locales: ["es", "en", "pt-br"],
    defaultLocale: "en",
  },
  outDir: "./dist",
  integrations: [
    svelte()
  ],
  vite: {
    plugins: [
      tailwindcss()
    ],
    server: {
      proxy: {
        '/api': {
          target: 'https://localhost',
          changeOrigin: true,
          secure: false,
        }
      }
    }
  }
});
