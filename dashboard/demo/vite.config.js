import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use the repository name for GitHub Pages base path
  // Ensure this matches the actual repo slug exactly (case-sensitive)
  base: process.env.NODE_ENV === 'production' ? '/Leaper-Fx/' : '/',
  server: {
    // CORS configuration for development
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    },
    // Security headers - Disabled CSP for development to allow email backend
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  },
  build: {
    // Security optimizations for production build
    rollupOptions: {
      output: {
        // Prevent information disclosure through file names
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    // Enable source map for debugging but not in production
    sourcemap: process.env.NODE_ENV !== 'production',
    // Add .nojekyll file to disable Jekyll processing
    assetsInlineLimit: 0,
    emptyOutDir: true
  },
  // Environment variables security
  define: {
    __DEV__: process.env.NODE_ENV !== 'production'
  }
})
