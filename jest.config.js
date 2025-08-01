/** @type {import('jest').Config} */
module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 根目录
  rootDir: '.',
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // 设置文件
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts',
    '@testing-library/jest-dom'
  ],
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/tests/unit/**/*.{test,spec}.{js,ts,tsx}',
    '<rootDir>/tests/integration/**/*.{test,spec}.{js,ts,tsx}'
  ],
  
  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/fixtures/'
  ],
  
  // 模块文件扩展名
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'node'
  ],
  
  // 转换配置
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx'
      }
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  
  // 不转换的模块
  transformIgnorePatterns: [
    'node_modules/(?!(libarchive\\.js|other-esm-package)/)'
  ],
  
  // 模块目录
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/tests'
  ],
  
  // 覆盖率配置
  collectCoverage: false, // 默认关闭，通过命令行参数启用
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,ts,tsx}',
    '!src/**/*.test.{js,ts,tsx}',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85
    }
  },
  
  // 报告器配置
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      ancestorSeparator: ' › ',
      uniqueOutputName: 'false',
      suiteNameTemplate: '{filepath}',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}'
    }],
    ['jest-json-reporter', {
      outputPath: 'test-results/results.json'
    }]
  ],
  
  // 全局变量
  globals: {
    __TEST__: true,
    __DEV__: true
  },
  
  // 超时设置
  testTimeout: 10000,
  
  // 清理模拟
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  
  // 错误输出
  verbose: true,
  errorOnDeprecated: true,
  
  // 监听模式配置
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
    '<rootDir>/.git/'
  ],
  
  // 缓存配置
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // 并发配置
  maxWorkers: '50%',
  
  // 静态资源处理
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  
  // 预设配置
  preset: 'ts-jest/presets/default-esm',
  
  // ESM 支持
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // 环境变量
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // 自定义解析器 (如果需要)
  resolver: undefined,
  
  // 快照配置
  snapshotSerializers: [
    'jest-serializer-html'
  ],
  
  // 性能监控
  logHeapUsage: false,
  detectOpenHandles: true,
  detectLeaks: false,
  
  // 强制退出
  forceExit: false,
  
  // 项目配置 (多项目支持)
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.{test,spec}.{js,ts,tsx}']
    },
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/tests/integration/**/*.{test,spec}.{js,ts,tsx}']
    }
  ]
};