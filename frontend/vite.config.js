// frontend/vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');
  const proxy = env.VITE_DEV_API_TARGET ? {
    '/api': { target: env.VITE_DEV_API_TARGET, changeOrigin: true }
  } : undefined;
  return {
    plugins: [react()],
    server: { proxy },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            query: ['@tanstack/react-query', 'axios'],
            motion: ['framer-motion'],
            charts: ['recharts']
          }
        }
      }
    }
  };
});
