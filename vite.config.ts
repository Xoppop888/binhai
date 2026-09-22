import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Было '/binhai/' — это было нужно, пока сайт жил в подпапке
  // xoppop888.github.io/binhai. Свой домен указывает прямо в корень,
  // поэтому base теперь '/'.
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
