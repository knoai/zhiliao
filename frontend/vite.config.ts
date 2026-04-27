import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react'
          }
          // Slate editor ecosystem
          if (id.includes('node_modules/slate')) {
            return 'vendor-slate'
          }
          // React Query
          if (id.includes('node_modules/@tanstack/react-query') || id.includes('node_modules/@tanstack/query-core')) {
            return 'vendor-query'
          }
          // UI / icons
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-ui'
          }
          // Other shared vendors
          if (id.includes('node_modules/axios') || id.includes('node_modules/zustand')) {
            return 'vendor-libs'
          }
        },
      },
    },
  },
})
