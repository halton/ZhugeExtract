import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types')
    },
  },
  
  server: {
    port: 3000,
    open: true,
    headers: {
      // 启用SharedArrayBuffer支持 (WebAssembly需要)
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // 将大型依赖分离到单独的chunk
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          'archive-vendor': ['libarchive.js'],
          'preview-vendor': ['prismjs', 'pdfjs-dist']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'libarchive.js'
    ],
    exclude: [
      // WebAssembly模块需要特殊处理
      'libarchive.js/dist/worker-bundle.js'
    ]
  },
  
  worker: {
    format: 'es'
  },
  
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})