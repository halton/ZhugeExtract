import { test, expect, devices } from '@playwright/test';
import path from 'path';

// 定义测试设备配置
const testDevices = [
  { name: 'Desktop Chrome', ...devices['Desktop Chrome'] },
  { name: 'Desktop Firefox', ...devices['Desktop Firefox'] },
  { name: 'Desktop Safari', ...devices['Desktop Safari'] },
  { name: 'Mobile Chrome', ...devices['Pixel 5'] },
  { name: 'Mobile Safari', ...devices['iPhone 12'] },
  { name: 'Tablet', ...devices['iPad Pro'] }
];

for (const device of testDevices) {
  test.describe(`${device.name} - 跨浏览器兼容性测试`, () => {
    test.use(device);

    test('基础功能兼容性', async ({ page, browserName }) => {
      await page.goto('/');
      
      // 验证页面加载
      await expect(page).toHaveTitle(/ZhugeExtract/);
      await expect(page.getByTestId('file-upload-zone')).toBeVisible();
      
      // 检查WebAssembly支持
      const wasmSupported = await page.evaluate(() => {
        return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
      });
      
      if (!wasmSupported) {
        console.warn(`WebAssembly not supported in ${browserName}`);
        return; // 跳过后续测试
      }
      
      // 上传测试文件
      const zipFilePath = path.join(__dirname, '../fixtures/archives/compatibility_test.zip');
      await page.setInputFiles('input[type="file"]', zipFilePath);
      
      // 验证解压功能
      await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('test_file.txt')).toBeVisible();
      
      // 验证预览功能
      await page.getByText('test_file.txt').click();
      await expect(page.getByTestId('preview-content')).toBeVisible();
    });

    test('文件API兼容性', async ({ page, browserName }) => {
      await page.goto('/');
      
      // 检查File API支持
      const fileApiSupport = await page.evaluate(() => {
        return {
          fileReader: typeof FileReader !== 'undefined',
          fileApi: typeof File !== 'undefined',
          dragDrop: 'ondrop' in document.createElement('div'),
          fileSystemAccess: 'showOpenFilePicker' in window
        };
      });
      
      console.log(`${browserName} API Support:`, fileApiSupport);
      
      // 验证基础文件操作
      if (fileApiSupport.fileReader && fileApiSupport.fileApi) {
        const zipFilePath = path.join(__dirname, '../fixtures/archives/api_test.zip');
        await page.setInputFiles('input[type="file"]', zipFilePath);
        await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });
      }
      
      // 测试拖拽功能（如果支持）
      if (fileApiSupport.dragDrop) {
        const dropZone = page.getByTestId('file-upload-zone');
        await expect(dropZone).toHaveAttribute('ondrop');
      }
      
      // 测试FileSystem Access API（Chrome专用）
      if (fileApiSupport.fileSystemAccess) {
        await expect(page.getByTestId('advanced-file-operations')).toBeVisible();
      } else {
        // 验证降级方案
        await expect(page.getByTestId('fallback-file-operations')).toBeVisible();
      }
    });

    test('CSS和布局兼容性', async ({ page, browserName, viewport }) => {
      await page.goto('/');
      
      // 检查CSS Grid和Flexbox支持
      const cssSupport = await page.evaluate(() => {
        const testElement = document.createElement('div');
        return {
          grid: CSS.supports('display', 'grid'),
          flexbox: CSS.supports('display', 'flex'),
          customProperties: CSS.supports('color', 'var(--test)'),
          aspectRatio: CSS.supports('aspect-ratio', '1/1')
        };
      });
      
      console.log(`${browserName} CSS Support:`, cssSupport);
      
      // 验证响应式布局
      const container = page.getByTestId('main-container');
      
      if (viewport && viewport.width < 768) {
        // 移动端布局
        await expect(container).toHaveClass(/mobile-layout/);
        await expect(page.getByTestId('mobile-menu-button')).toBeVisible();
      } else {
        // 桌面端布局
        await expect(container).toHaveClass(/desktop-layout/);
        await expect(page.getByTestId('sidebar')).toBeVisible();
      }
      
      // 验证关键元素的可见性和位置
      await expect(page.getByTestId('file-upload-zone')).toBeVisible();
      
      const uploadZone = page.getByTestId('file-upload-zone');
      const boundingBox = await uploadZone.boundingBox();
      
      expect(boundingBox).not.toBeNull();
      expect(boundingBox!.width).toBeGreaterThan(200);
      expect(boundingBox!.height).toBeGreaterThan(100);
    });

    test('JavaScript兼容性', async ({ page, browserName }) => {
      await page.goto('/');
      
      // 检查现代JavaScript特性支持
      const jsSupport = await page.evaluate(() => {
        const testArray = [1, 2, 3];
        return {
          arrowFunctions: (() => true)(),
          asyncAwait: typeof (async () => {})().then === 'function',
          destructuring: (() => { const [a] = testArray; return a === 1; })(),
          spread: [...testArray].length === 3,
          promises: typeof Promise !== 'undefined',
          modules: typeof import !== 'undefined',
          classes: (() => { class Test {} return typeof Test === 'function'; })(),
          mapSet: typeof Map !== 'undefined' && typeof Set !== 'undefined',
          symbolIterator: typeof Symbol !== 'undefined' && typeof Symbol.iterator !== 'undefined'
        };
      });
      
      console.log(`${browserName} JS Features:`, jsSupport);
      
      // 如果不支持某些特性，验证polyfill是否正常工作
      if (!jsSupport.promises) {
        // 验证Promise polyfill
        const promiseWorks = await page.evaluate(() => {
          return new Promise(resolve => resolve(true));
        });
        expect(promiseWorks).toBe(true);
      }
      
      // 验证错误处理
      const errorHandlerWorks = await page.evaluate(() => {
        try {
          throw new Error('Test error');
        } catch (e) {
          return e.message === 'Test error';
        }
      });
      expect(errorHandlerWorks).toBe(true);
    });

    test('性能基准测试', async ({ page, browserName }) => {
      await page.goto('/');
      
      // 测试页面加载性能
      const navigationTiming = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
          loadComplete: timing.loadEventEnd - timing.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
      
      console.log(`${browserName} Performance:`, navigationTiming);
      
      // 验证性能指标在合理范围内
      expect(navigationTiming.domContentLoaded).toBeLessThan(3000); // 3秒内
      expect(navigationTiming.loadComplete).toBeLessThan(5000); // 5秒内
      
      // 测试文件处理性能
      const smallZipPath = path.join(__dirname, '../fixtures/archives/small_1mb.zip');
      await page.setInputFiles('input[type="file"]', smallZipPath);
      
      const startTime = Date.now();
      await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });
      const processingTime = Date.now() - startTime;
      
      console.log(`${browserName} File Processing Time: ${processingTime}ms`);
      expect(processingTime).toBeLessThan(5000); // 5秒内处理1MB文件
    });

    test('内存使用监控', async ({ page, browserName }) => {
      await page.goto('/');
      
      // 检查内存API支持
      const memoryApiSupported = await page.evaluate(() => {
        return 'memory' in performance;
      });
      
      if (memoryApiSupported) {
        const initialMemory = await page.evaluate(() => {
          const memory = (performance as any).memory;
          return {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          };
        });
        
        console.log(`${browserName} Initial Memory:`, initialMemory);
        
        // 处理文件并监控内存变化
        const mediumZipPath = path.join(__dirname, '../fixtures/archives/medium_10mb.zip');
        await page.setInputFiles('input[type="file"]', mediumZipPath);
        await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
        
        const afterProcessingMemory = await page.evaluate(() => {
          const memory = (performance as any).memory;
          return {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          };
        });
        
        console.log(`${browserName} After Processing Memory:`, afterProcessingMemory);
        
        // 验证内存增长在合理范围内
        const memoryIncrease = afterProcessingMemory.used - initialMemory.used;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB内存增长限制
      }
    });

    test('安全功能测试', async ({ page, browserName }) => {
      await page.goto('/');
      
      // 测试内容安全策略 (CSP)
      const cspViolations: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
          cspViolations.push(msg.text());
        }
      });
      
      // 上传文件触发各种操作
      const zipFilePath = path.join(__dirname, '../fixtures/archives/security_test.zip');
      await page.setInputFiles('input[type="file"]', zipFilePath);
      await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });
      
      // 验证没有CSP违规
      expect(cspViolations).toHaveLength(0);
      
      // 测试XSS防护
      const fileTree = page.getByTestId('file-tree');
      await expect(fileTree.getByText('<script>alert("xss")</script>')).not.toBeVisible();
      
      // 验证安全的文件名处理
      const suspiciousFile = '..\\..\\malicious.exe';
      await expect(fileTree.getByText(suspiciousFile)).not.toBeVisible();
    });

    test('辅助功能 (A11y) 测试', async ({ page, browserName }) => {
      await page.goto('/');
      
      // 注入axe-core进行辅助功能测试
      await page.addScriptTag({
        url: 'https://unpkg.com/axe-core@4.6.3/axe.min.js'
      });
      
      // 运行辅助功能检查
      const accessibilityResults = await page.evaluate(() => {
        return (window as any).axe.run();
      });
      
      // 验证没有严重的辅助功能问题
      const violations = accessibilityResults.violations.filter(
        (violation: any) => violation.impact === 'critical' || violation.impact === 'serious'
      );
      
      if (violations.length > 0) {
        console.warn(`${browserName} A11y Violations:`, violations);
      }
      
      expect(violations.length).toBe(0);
      
      // 手动测试一些关键的辅助功能
      const uploadZone = page.getByTestId('file-upload-zone');
      await expect(uploadZone).toHaveAttribute('role');
      await expect(uploadZone).toHaveAttribute('aria-label');
      await expect(uploadZone).toHaveAttribute('tabindex');
      
      // 测试键盘导航
      await page.keyboard.press('Tab');
      await expect(uploadZone).toBeFocused();
      
      // 测试屏幕阅读器支持
      const srOnly = page.locator('.sr-only').first();
      if (await srOnly.isVisible()) {
        await expect(srOnly).toHaveText(/可访问性信息/);
      }
    });

    test('网络条件测试', async ({ page, browserName, context }) => {
      // 模拟慢速网络
      await context.route('**/*', route => {
        setTimeout(() => route.continue(), 100); // 100ms延迟
      });
      
      await page.goto('/');
      await expect(page.getByTestId('file-upload-zone')).toBeVisible({ timeout: 10000 });
      
      // 在慢速网络下测试文件上传
      const zipFilePath = path.join(__dirname, '../fixtures/archives/network_test.zip');
      await page.setInputFiles('input[type="file"]', zipFilePath);
      
      // 验证加载指示器
      await expect(page.getByTestId('loading-spinner')).toBeVisible();
      await expect(page.getByTestId('progress-bar')).toBeVisible();
      
      // 等待处理完成
      await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
      
      // 模拟网络中断
      await context.setOffline(true);
      
      // 验证离线处理能力
      const offlineFilePath = path.join(__dirname, '../fixtures/archives/offline.zip');
      await page.setInputFiles('input[type="file"]', offlineFilePath);
      
      // 即使离线也应该能处理本地文件
      await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });
      
      // 恢复网络
      await context.setOffline(false);
    });

    test('存储配额测试', async ({ page, browserName }) => {
      await page.goto('/');
      
      // 检查存储API支持
      const storageSupport = await page.evaluate(async () => {
        const hasStorageManager = 'storage' in navigator && 'estimate' in navigator.storage;
        let quota = { usage: 0, quota: 0 };
        
        if (hasStorageManager) {
          quota = await navigator.storage.estimate();
        }
        
        return {
          hasStorageManager,
          indexedDB: 'indexedDB' in window,
          localStorage: 'localStorage' in window,
          quota: quota
        };
      });
      
      console.log(`${browserName} Storage Support:`, storageSupport);
      
      if (storageSupport.hasStorageManager) {
        // 测试大文件存储能力
        const largeFilePath = path.join(__dirname, '../fixtures/archives/large_25mb.zip');
        await page.setInputFiles('input[type="file"]', largeFilePath);
        await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 20000 });
        
        // 检查存储使用情况
        const storageAfter = await page.evaluate(async () => {
          return await navigator.storage.estimate();
        });
        
        console.log(`${browserName} Storage After Large File:`, storageAfter);
        
        // 验证存储管理
        const storageUsage = storageAfter.usage! / (1024 * 1024); // MB
        expect(storageUsage).toBeLessThan(100); // 不应超过100MB
      }
    });
  });
}

// 特殊的浏览器特定测试
test.describe('Chrome特定功能测试', () => {
  test.use({ ...devices['Desktop Chrome'] });

  test('FileSystem Access API', async ({ page }) => {
    await page.goto('/');
    
    const hasFileSystemAccess = await page.evaluate(() => {
      return 'showOpenFilePicker' in window;
    });
    
    if (hasFileSystemAccess) {
      // 验证高级文件操作按钮存在
      await expect(page.getByTestId('advanced-file-picker')).toBeVisible();
      
      // 测试目录选择功能
      await expect(page.getByTestId('directory-picker')).toBeVisible();
    }
  });

  test('Origin Private File System (OPFS)', async ({ page }) => {
    await page.goto('/');
    
    const hasOPFS = await page.evaluate(async () => {
      try {
        const opfsRoot = await navigator.storage.getDirectory();
        return opfsRoot !== null;
      } catch {
        return false;
      }
    });
    
    if (hasOPFS) {
      console.log('OPFS supported in Chrome');
      
      // 测试大文件的OPFS存储
      const largeFilePath = path.join(__dirname, '../fixtures/archives/large_50mb.zip');
      await page.setInputFiles('input[type="file"]', largeFilePath);
      
      // 验证使用OPFS存储
      await expect(page.getByTestId('opfs-storage-indicator')).toBeVisible();
    }
  });
});

test.describe('Safari特定限制测试', () => {
  test.use({ ...devices['Desktop Safari'] });

  test('Safari限制处理', async ({ page }) => {
    await page.goto('/');
    
    // Safari对某些API有限制，验证降级方案
    const safariLimitations = await page.evaluate(() => {
      return {
        noFileSystemAccess: !('showOpenFilePicker' in window),
        limitedWorkers: typeof SharedWorker === 'undefined',
        restrictedStorage: false // 根据实际情况调整
      };
    });
    
    console.log('Safari Limitations:', safariLimitations);
    
    if (safariLimitations.noFileSystemAccess) {
      // 验证传统文件选择降级方案
      await expect(page.getByTestId('traditional-file-picker')).toBeVisible();
      await expect(page.getByTestId('advanced-file-picker')).not.toBeVisible();
    }
    
    // 测试基础功能仍然正常
    const zipFilePath = path.join(__dirname, '../fixtures/archives/safari_test.zip');
    await page.setInputFiles('input[type="file"]', zipFilePath);
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('移动设备特定测试', () => {
  test('iOS Safari触摸交互', async ({ page }) => {
    test.use({ ...devices['iPhone 12'] });
    
    await page.goto('/');
    
    const zipFilePath = path.join(__dirname, '../fixtures/archives/mobile_test.zip');
    await page.setInputFiles('input[type="file"]', zipFilePath);
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
    
    // 测试触摸手势
    const fileItem = page.getByText('mobile_file.txt').first();
    
    // 点击选择
    await fileItem.tap();
    await expect(page.getByTestId('preview-panel')).toBeVisible();
    
    // 测试长按菜单（如果支持）
    await fileItem.tap({ delay: 500 });
    // 验证上下文菜单或相关功能
  });

  test('Android Chrome性能', async ({ page }) => {
    test.use({ ...devices['Pixel 5'] });
    
    await page.goto('/');
    
    // 在移动设备上测试性能
    const mediumFilePath = path.join(__dirname, '../fixtures/archives/mobile_medium.zip');
    
    const startTime = Date.now();
    await page.setInputFiles('input[type="file"]', mediumFilePath);
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 20000 });
    const processingTime = Date.now() - startTime;
    
    console.log(`Mobile Processing Time: ${processingTime}ms`);
    
    // 移动设备性能要求相对宽松
    expect(processingTime).toBeLessThan(15000); // 15秒内
  });
});