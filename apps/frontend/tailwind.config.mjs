/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        singpass: {
          red: '#E31C3D',
          dark: '#212121',
          light: '#F9F9F9',
          gray: {
            100: '#F2F2F2',
            200: '#E6E6E6',
            300: '#CCCCCC',
            400: '#999999',
            500: '#666666',
          }
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          'SF Pro Display',
          'SF Pro Text',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
      },
    },
  },
  plugins: [],
};
