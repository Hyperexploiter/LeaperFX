import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/common': path.resolve(__dirname, './common'),
      '@/components': path.resolve(__dirname, './common/components'),
      '@/services': path.resolve(__dirname, './common/services'),
      '@/tabs': path.resolve(__dirname, './common/tabs'),
      '@/features': path.resolve(__dirname, './common/features'),
    },
  },
  server: {
    port: 3002,
    host: true,
    strictPort: false,
    // Enable CORS for development
    cors: true,
    // Proxy API requests to unified backend if running locally
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Ensure environment variables are available at runtime
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          utils: ['lucide-react', 'date-fns'],
        },
      },
    },
  },
  // Make environment variables available to the app
  define: {
    // Allow access to environment variables in production builds
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  // Ensure proper environment variable handling
  envPrefix: 'VITE_',
});