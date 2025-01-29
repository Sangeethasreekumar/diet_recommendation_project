import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  server: {
    proxy: {
      // Common proxy configuration for API requests
      '/api': {
        target: 'http://127.0.0.1:5000', // Flask backend URL
        changeOrigin: true,             // Ensures the host header matches the target
        secure: false,                  // Disable SSL verification for local development
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix before forwarding to backend
      },
    },
  },
});
