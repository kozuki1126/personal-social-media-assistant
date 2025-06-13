import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './src/renderer',
  base: './',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/renderer/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/renderer/components'),
      '@/hooks': resolve(__dirname, 'src/renderer/hooks'),
      '@/stores': resolve(__dirname, 'src/renderer/stores'),
      '@/utils': resolve(__dirname, 'src/shared/utils'),
      '@/types': resolve(__dirname, 'src/shared/types'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  define: {
    __VIE_APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
