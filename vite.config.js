import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'pdfjs-worker';
          }
          if (id.includes('node_modules/@google/generative-ai')) {
            return 'gemini-sdk';
          }
          if (id.includes('src/features/admin')) {
            return 'admin-feature';
          }
          if (id.includes('src/features/reader')) {
            return 'reader-feature';
          }
        }
      }
    }
  }
})
