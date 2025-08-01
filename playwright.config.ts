import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试目录
  testDir: './tests/e2e',
  
  // 全局设置
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // 报告器配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    ['list']
  ],
  
  // 全局测试配置
  use: {
    // 基准URL
    baseURL: 'http://localhost:4173',
    
    // 浏览器设置
    headless: process.env.CI ? true : false,
    
    // 视频录制
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 }
    },
    
    // 截图设置
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    
    // 追踪设置
    trace: 'retain-on-failure',
    
    // 网络设置
    ignoreHTTPSErrors: true,
    
    // 等待设置
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // 区域设置
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    
    // 权限设置
    permissions: ['clipboard-read', 'clipboard-write'],
    
    // 额外的浏览器上下文选项
    contextOptions: {
      // 启用 SharedArrayBuffer
      crossOriginIsolated: true
    }
  },

  // 项目配置 - 不同浏览器和设备
  projects: [
    // 桌面浏览器
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome特定设置
        launchOptions: {
          args: [
            '--enable-features=SharedArrayBuffer',
            '--cross-origin-embedder-policy=require-corp',
            '--cross-origin-opener-policy=same-origin'
          ]
        }
      },
    },
    
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox特定设置
        launchOptions: {
          firefoxUserPrefs: {
            'dom.postMessage.sharedArrayBuffer.bypassCOOP_COEP.insecure.enabled': true
          }
        }
      },
    },
    
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
    },

    // 移动设备
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // 平板设备
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },

    // 特殊测试配置
    {
      name: 'Slow Network',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          // 模拟慢速网络
          offline: false,
          httpCredentials: undefined
        }
      },
      testMatch: '**/network-*.spec.ts'
    },

    {
      name: 'High DPI',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2
      },
      testMatch: '**/visual-*.spec.ts'
    }
  ],

  // 输出目录
  outputDir: 'test-results/e2e-artifacts',

  // Web服务器配置 (用于测试)
  webServer: {
    command: 'npm run preview',
    port: 4173,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    
    // 环境变量
    env: {
      NODE_ENV: 'test'
    }
  },

  // 全局设置和清理
  globalSetup: require.resolve('./tests/utils/global-setup.ts'),
  globalTeardown: require.resolve('./tests/utils/global-teardown.ts'),

  // 测试匹配模式
  testMatch: [
    '**/*.spec.ts',
    '**/*.e2e.ts'
  ],

  // 超时设置
  timeout: 60000, // 60秒总超时
  expect: {
    timeout: 10000 // 10秒断言超时
  },

  // 并行执行设置
  maxFailures: process.env.CI ? 5 : undefined,

  // 元数据
  metadata: {
    'test-suite': 'ZhugeExtract E2E Tests',
    'version': '1.0.0',
    'environment': process.env.NODE_ENV || 'test'
  }
});