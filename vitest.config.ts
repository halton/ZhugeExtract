import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    // 测试环境配置
    environment: 'jsdom',
    
    // 全局设置
    globals: true,
    
    // 设置文件
    setupFiles: ['./tests/setup.ts'],
    
    // 包含的测试文件
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts,tsx}',
      'tests/integration/**/*.{test,spec}.{js,ts,tsx}'
    ],
    
    // 排除的文件
    exclude: [
      'node_modules',
      'dist',
      'tests/e2e/**/*',
      'tests/fixtures/**/*'
    ],
    
    // 测试超时设置 - 增加超时时间
    testTimeout: 30000, // 30秒
    hookTimeout: 30000, // 30秒
    
    // 内存优化设置
    forceRerunTriggers: ['**/package.json/**', '**/vite.config.*/**'],
    cache: false, // 禁用缓存减少内存
    
    // 并发设置 - 极致内存优化
    threads: false, // 关闭多线程
    maxConcurrency: 1, // 最大并发数设为1
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1,
        minForks: 1,
        isolate: true
      }
    },
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // 覆盖率阈值
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        }
      },
      
      // 包含的文件
      include: [
        'src/**/*.{js,ts,tsx}'
      ],
      
      // 排除的文件
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{js,ts,tsx}',
        'src/**/*.test.{js,ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts'
      ]
    },
    
    // 监听模式配置
    watch: {
      ignore: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '.git/**'
      ]
    },
    
    // 报告器配置
    reporter: ['verbose', 'junit', 'json'],
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json'
    },
    
    // 性能基准测试
    benchmark: {
      include: ['tests/**/*.bench.{js,ts}'],
      exclude: ['node_modules/**']
    }
  },
  
  // 路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  },
  
  // 定义全局变量
  define: {
    __TEST__: true,
    __DEV__: true
  },
  
  // 优化配置
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@testing-library/react',
      '@testing-library/jest-dom'
    ]
  },
  
  // 服务器配置 (用于测试期间的开发服务器)
  server: {
    headers: {
      // 启用SharedArrayBuffer (用于WebAssembly测试)
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  }
});