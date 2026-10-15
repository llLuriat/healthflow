import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env       = loadEnv(mode, process.cwd(), '');
  const apiTarget = process.env.VITE_API_URL || env.VITE_API_URL || 'http://localhost:3000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // Usa import.meta.url — não precisa de @types/node nem de __dirname
        '@': fileURLToPath(new URL('./app', import.meta.url)),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
    optimizeDeps: { include: ['react', 'react-dom', 'react-router'] },
    build: {
      commonjsOptions: { include: [/node_modules/] },
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react':  ['react', 'react-dom', 'react-router'],
            'vendor-radix':  [
              '@radix-ui/react-dialog',         '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',         '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',        '@radix-ui/react-popover',
              '@radix-ui/react-navigation-menu','@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',   '@radix-ui/react-checkbox',
              '@radix-ui/react-radio-group',    '@radix-ui/react-scroll-area',
              '@radix-ui/react-slider',         '@radix-ui/react-switch',
            ],
            'vendor-charts': ['recharts'],
            'vendor-forms':  ['react-hook-form'],
            'vendor-mui':    ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      // Proxy em dev: chamadas da API saem do mesmo origin → sem CORS
      proxy: {
        '/auth':          { target: apiTarget, changeOrigin: true },
        '/patients':      { target: apiTarget, changeOrigin: true },
        '/consultas':     { target: apiTarget, changeOrigin: true },
        '/professionals': { target: apiTarget, changeOrigin: true },
        '/health':        { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
