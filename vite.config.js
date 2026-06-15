import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'page-admin':   ['./src/pages/AdminPanel.jsx'],
          'page-about':   ['./src/pages/AboutUs.jsx'],
          'page-landing': ['./src/pages/Landing.jsx'],
          'page-live':    ['./src/pages/LiveTrack.jsx'],
        },
      },
    },
    chunkSizeWarningLimit: 400,
  },
})
