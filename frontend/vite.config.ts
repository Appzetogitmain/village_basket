import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { compression } from 'vite-plugin-compression2'
import { serveAssetsPlugin } from './vite-plugin-serve-assets'

export default defineConfig({
  plugins: [
    react(),
    serveAssetsPlugin(),
    compression({ algorithm: 'gzip', exclude: [/\.(gz)$/] }),
    compression({ algorithm: 'brotliCompress', exclude: [/\.(br)$/, /\.(gz)$/] }),
  ],
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.webp'],
  server: {
    fs: { strict: false },
    middlewareMode: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './assets'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'prop-types',
    ],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          // Animation — lazy loaded, separate chunk
          if (id.includes('node_modules/framer-motion/')) return 'framer-motion';
          if (id.includes('node_modules/gsap/')) return 'gsap';
          if (id.includes('node_modules/lottie-react/') || id.includes('node_modules/lottie-web/')) return 'lottie';
          // Maps — lazy loaded
          if (id.includes('node_modules/@react-google-maps/') || id.includes('node_modules/leaflet/') || id.includes('node_modules/react-leaflet/')) return 'maps';
          // Charts — admin only, separate chunk
          if (id.includes('node_modules/apexcharts/') || id.includes('node_modules/react-apexcharts/') || id.includes('node_modules/recharts/')) return 'charts';
          // Firebase
          if (id.includes('node_modules/firebase/')) return 'firebase';
          // Razorpay / payment
          if (id.includes('node_modules/razorpay')) return 'payment';
        },
      },
    },
    chunkSizeWarningLimit: 800,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
  },
  esbuild: {
    // Strip console.log/debug in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
})
