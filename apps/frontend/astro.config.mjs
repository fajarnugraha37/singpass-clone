import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  i18n: {
    locales: ["es", "en", "pt-br"],
    defaultLocale: "en",
  },
  outDir: "../backend/static",
  integrations: [
    svelte()
  ],
  vite: {
    plugins: [
      tailwindcss()
    ]
  }
});
