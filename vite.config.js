import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020', // Updated to ES2020 which supports BigInt
    sourcemap: true,  // Enable source maps for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          transformers: ['@huggingface/transformers']
        }
      }
    },
    chunkSizeWarningLimit: 2000, // Increase chunk size limit for ML models
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers'] // Prevent optimization of transformers.js
  }
});
