import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(() => {
  // Docker passes API_URL via process.env
  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  console.log('Vite proxy target:', apiUrl);
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/api': path.resolve(__dirname, './src/api'),
      },
    },
    optimizeDeps: {
      include: [
        '@mui/material',
        '@mui/material/SvgIcon',
        '@mui/material/utils',
        '@mui/icons-material',
      ],
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
