import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.API_URL || process.env.API_URL || 'http://localhost:5002';
  const basePath = env.VITE_BASE_PATH || process.env.VITE_BASE_PATH || '/';
  console.log('Vite proxy target:', apiUrl);
  
  return {
    base: basePath,
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
        '/genomes': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
