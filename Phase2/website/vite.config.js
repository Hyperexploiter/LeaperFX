import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000, // Use a different port than the dashboard
    open: true, // Automatically open the browser
    cors: true, // Enable CORS
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});