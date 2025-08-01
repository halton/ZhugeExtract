# ZhugeExtract 测试策略详细规划

## 测试理念

### 测试驱动开发 (TDD)
我们采用TDD方法，确保代码质量和功能正确性：
1. **Red**: 先写失败的测试
2. **Green**: 编写最少代码让测试通过
3. **Refactor**: 重构代码，保持测试通过

### 测试金字塔
```
        E2E (5-10%)
      ────────────────
     集成测试 (15-25%)
    ────────────────────
   单元测试 (70-80%)
  ──────────────────────
```

## 详细测试计划

### 第一阶段测试 - MVP版本

#### 1.1 基础组件单元测试
```typescript
// FileUpload.test.tsx
describe('FileUpload Component', () => {
  it('应该渲染上传区域', () => {
    render(<FileUpload />);
    expect(screen.getByText('拖拽文件到此处')).toBeInTheDocument();
  });

  it('应该处理文件拖拽事件', async () => {
    const onFileDrop = vi.fn();
    render(<FileUpload onFileDrop={onFileDrop} />);
    
    const dropZone = screen.getByTestId('drop-zone');
    const file = new File(['content'], 'test.zip', { type: 'application/zip' });
    
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] }
    });
    
    expect(onFileDrop).toHaveBeenCalledWith(file);
  });

  it('应该验证文件类型', () => {
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    render(<FileUpload />);
    
    const dropZone = screen.getByTestId('drop-zone');
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [invalidFile] }
    });
    
    expect(screen.getByText('不支持的文件格式')).toBeInTheDocument();
  });
});
```

#### 1.2 格式检测单元测试
```typescript
// FormatDetector.test.ts
describe('FormatDetector', () => {
  const testCases = [
    {
      name: 'ZIP文件',
      signature: new Uint8Array([0x50, 0x4B, 0x03, 0x04]),
      expected: 'zip'
    },
    {
      name: 'RAR文件',
      signature: new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]),
      expected: 'rar'
    },
    {
      name: '7Z文件',
      signature: new Uint8Array([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C]),
      expected: '7z'
    }
  ];

  testCases.forEach(({ name, signature, expected }) => {
    it(`应该正确检测${name}`, () => {
      expect(FormatDetector.detect(signature)).toBe(expected);
    });
  });

  it('应该处理未知格式', () => {
    const unknownSignature = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(FormatDetector.detect(unknownSignature)).toBe('unknown');
  });
  
  it('应该处理空文件', () => {
    const emptySignature = new Uint8Array([]);
    expect(FormatDetector.detect(emptySignature)).toBe('unknown');
  });
});
```

#### 1.3 ZIP解压集成测试
```typescript
// ZipExtraction.integration.test.ts
describe('ZIP Extraction Integration', () => {
  let archiveService: ArchiveService;
  
  beforeEach(() => {
    archiveService = new ArchiveService();
  });

  it('应该解压简单ZIP文件', async () => {
    const zipBuffer = await loadTestFile('simple.zip');
    const result = await archiveService.loadArchive(
      new File([zipBuffer], 'simple.zip')
    );

    expect(result.format).toBe('zip');
    expect(result.structure.length).toBe(3);
    expect(result.structure[0].name).toBe('file1.txt');
    expect(result.structure[1].name).toBe('folder1/');
    expect(result.structure[2].name).toBe('folder1/file2.txt');
  });

  it('应该处理嵌套文件夹', async () => {
    const zipBuffer = await loadTestFile('nested.zip');
    const result = await archiveService.loadArchive(
      new File([zipBuffer], 'nested.zip')
    );

    const deepFile = result.structure.find(f => 
      f.path === 'level1/level2/level3/deep.txt'
    );
    expect(deepFile).toBeDefined();
    expect(deepFile?.type).toBe('file');
  });

  it('应该提取文件内容', async () => {
    const zipBuffer = await loadTestFile('content.zip');
    await archiveService.loadArchive(new File([zipBuffer], 'content.zip'));
    
    const fileContent = await archiveService.extractFile('hello.txt');
    const textContent = new TextDecoder().decode(fileContent);
    
    expect(textContent).toBe('Hello, World!');
  });
});
```

### 第二阶段测试 - 功能完善

#### 2.1 多格式支持测试
```typescript
// MultiFormat.test.ts
describe('Multi-Format Support', () => {
  const formats = ['zip', 'rar', '7z', 'tar.gz'];
  
  formats.forEach(format => {
    describe(`${format.toUpperCase()} format`, () => {
      it(`应该检测${format}格式`, async () => {
        const file = await loadTestFile(`sample.${format}`);
        const detected = await FormatDetector.detect(file.slice(0, 16));
        expect(detected).toBe(format.split('.')[0]);
      });

      it(`应该解压${format}文件`, async () => {
        const service = new ArchiveService();
        const file = await loadTestFile(`sample.${format}`);
        
        const result = await service.loadArchive(
          new File([file], `sample.${format}`)
        );
        
        expect(result.structure.length).toBeGreaterThan(0);
      });
    });
  });
});
```

#### 2.2 密码保护测试
```typescript
// PasswordProtection.test.ts
describe('Password Protection', () => {
  it('应该检测密码保护的文件', async () => {
    const protectedZip = await loadTestFile('protected.zip');
    const service = new ArchiveService();
    
    await expect(
      service.loadArchive(new File([protectedZip], 'protected.zip'))
    ).rejects.toThrow('Password required');
  });

  it('应该用正确密码解压', async () => {
    const protectedZip = await loadTestFile('protected.zip');
    const service = new ArchiveService();
    
    const result = await service.loadArchive(
      new File([protectedZip], 'protected.zip'),
      { password: 'test123' }
    );
    
    expect(result.structure.length).toBeGreaterThan(0);
  });

  it('应该拒绝错误密码', async () => {
    const protectedZip = await loadTestFile('protected.zip');
    const service = new ArchiveService();
    
    await expect(
      service.loadArchive(
        new File([protectedZip], 'protected.zip'),
        { password: 'wrong' }
      )
    ).rejects.toThrow('Invalid password');
  });
});
```

#### 2.3 预览功能测试
```typescript
// PreviewService.test.ts
describe('PreviewService', () => {
  let previewService: PreviewService;

  beforeEach(() => {
    previewService = new PreviewService();
  });

  it('应该预览文本文件', async () => {
    const textContent = new TextEncoder().encode('Hello World');
    const result = await previewService.preview({
      name: 'test.txt',
      data: textContent,
      mimeType: 'text/plain'
    });

    expect(result.type).toBe('text');
    expect(result.content).toBe('Hello World');
  });

  it('应该预览图片文件', async () => {
    const imageData = await loadTestFile('sample.png');
    const result = await previewService.preview({
      name: 'sample.png',
      data: imageData,
      mimeType: 'image/png'
    });

    expect(result.type).toBe('image');
    expect(result.content).toContain('data:image/png;base64,');
  });

  it('应该处理不支持的文件类型', async () => {
    const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    const result = await previewService.preview({
      name: 'unknown.bin',
      data: binaryData,
      mimeType: 'application/octet-stream'
    });

    expect(result.type).toBe('binary');
    expect(result.content).toContain('二进制文件');
  });
});
```

### 第三阶段测试 - 跨平台支持

#### 3.1 响应式设计测试
```typescript
// ResponsiveDesign.test.ts
describe('Responsive Design', () => {
  const viewports = [
    { width: 320, height: 568, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1920, height: 1080, name: 'Desktop' }
  ];

  viewports.forEach(({ width, height, name }) => {
    it(`应该在${name}设备上正确显示`, () => {
      Object.defineProperty(window, 'innerWidth', { value: width });
      Object.defineProperty(window, 'innerHeight', { value: height });
      
      render(<App />);
      
      // 触发resize事件
      fireEvent(window, new Event('resize'));
      
      const layout = screen.getByTestId('main-layout');
      expect(layout).toHaveClass(width < 768 ? 'mobile-layout' : 'desktop-layout');
    });
  });
});
```

#### 3.2 PWA功能测试
```typescript
// PWA.test.ts
describe('PWA Functionality', () => {
  it('应该注册Service Worker', async () => {
    // 模拟Service Worker环境
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue({}),
        ready: Promise.resolve({})
      }
    });

    await registerSW();
    
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
  });

  it('应该支持离线缓存', async () => {
    // 模拟离线环境
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    const response = await fetch('/api/test');
    
    // 应该从缓存返回
    expect(response.headers.get('x-cache')).toBe('hit');
  });
});
```

## 性能测试详细方案

### 内存使用测试
```typescript
// MemoryUsage.test.ts
describe('Memory Management', () => {
  it('应该在处理大文件时管理内存', async () => {
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
    
    // 加载100MB的ZIP文件
    const largeFile = await loadTestFile('large-100mb.zip');
    const service = new ArchiveService();
    
    await service.loadArchive(new File([largeFile], 'large.zip'));
    
    const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = memoryAfter - memoryBefore;
    
    // 内存增长应该合理（不超过200MB）
    expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
  });

  it('应该释放不使用的内存', async () => {
    const service = new ArchiveService();
    const files = [];
    
    // 加载多个文件
    for (let i = 0; i < 10; i++) {
      const file = await loadTestFile(`test-${i}.zip`);
      files.push(await service.loadArchive(new File([file], `test-${i}.zip`)));
    }
    
    const memoryPeak = (performance as any).memory?.usedJSHeapSize || 0;
    
    // 触发垃圾回收
    service.cleanup();
    
    // 等待内存释放
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const memoryAfterCleanup = (performance as any).memory?.usedJSHeapSize || 0;
    
    expect(memoryAfterCleanup).toBeLessThan(memoryPeak * 0.8);
  });
});
```

### 性能基准测试
```typescript
// Performance.benchmark.test.ts
describe('Performance Benchmarks', () => {
  const benchmarks = [
    { file: 'small-1mb.zip', maxTime: 1000 },
    { file: 'medium-10mb.zip', maxTime: 5000 },
    { file: 'large-50mb.zip', maxTime: 15000 }
  ];

  benchmarks.forEach(({ file, maxTime }) => {
    it(`应该在${maxTime}ms内处理${file}`, async () => {
      const startTime = performance.now();
      
      const fileBuffer = await loadTestFile(file);
      const service = new ArchiveService();
      
      await service.loadArchive(new File([fileBuffer], file));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(maxTime);
    });
  });
});
```

## 端到端测试场景

### 关键用户路径
```typescript
// E2E.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test.describe('ZhugeExtract E2E Tests', () => {
  test('完整的文件解压流程', async ({ page }) => {
    // 1. 访问应用
    await page.goto('/');
    await expect(page).toHaveTitle(/ZhugeExtract/);

    // 2. 上传ZIP文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-files/sample.zip');

    // 3. 等待解压完成
    await page.waitForSelector('[data-testid="file-tree"]', { 
      timeout: 10000 
    });

    // 4. 验证文件列表
    const fileItems = page.locator('[data-testid="file-item"]');
    await expect(fileItems).toHaveCount.greaterThan(0);

    // 5. 点击文件进行预览
    await fileItems.first().click();

    // 6. 验证预览面板
    const previewPanel = page.locator('[data-testid="preview-panel"]');
    await expect(previewPanel).toBeVisible();

    // 7. 下载文件
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-button"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('错误处理 - 无效文件', async ({ page }) => {
    await page.goto('/');

    // 上传无效文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-files/invalid.txt');

    // 验证错误信息
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('不支持的文件格式');
  });

  test('性能 - 大文件处理', async ({ page }) => {
    await page.goto('/');

    const startTime = Date.now();

    // 上传大文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-files/large-50mb.zip');

    // 等待处理完成
    await page.waitForSelector('[data-testid="file-tree"]', { 
      timeout: 30000 
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // 性能要求：50MB文件应在30秒内处理完成
    expect(duration).toBeLessThan(30000);
  });
});
```

### 跨浏览器测试
```typescript
// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
};

export default config;
```

## 测试数据管理

### 测试文件生成脚本
```javascript
// scripts/generate-test-files.js
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function generateTestFiles() {
  const testDir = path.join(__dirname, '../test-files');
  
  // 创建测试目录
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // 生成不同大小的ZIP文件
  const sizes = [
    { name: 'small-1mb.zip', size: 1024 * 1024 },
    { name: 'medium-10mb.zip', size: 10 * 1024 * 1024 },
    { name: 'large-50mb.zip', size: 50 * 1024 * 1024 }
  ];

  for (const { name, size } of sizes) {
    const zip = new JSZip();
    
    // 添加文件到ZIP
    const content = Buffer.alloc(size, 'a');
    zip.file(`content-${size}.txt`, content);
    
    // 生成ZIP文件
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(path.join(testDir, name), zipBuffer);
  }

  console.log('测试文件生成完成');
}

generateTestFiles().catch(console.error);
```

## 持续集成配置

### GitHub Actions 完整配置
```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate test files
        run: npm run generate:test-files
        
      - name: Lint code
        run: npm run lint
        
      - name: Type check
        run: npm run type-check
        
      - name: Run unit tests
        run: npm run test:unit -- --coverage
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  e2e-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
        
      - name: Build application
        run: npm run build
        
      - name: Start dev server
        run: npm run preview &
        
      - name: Wait for server
        run: npx wait-on http://localhost:4173
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-results
          path: test-results/

  performance-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

这个详细的测试策略确保了ZhugeExtract项目在各个开发阶段都有充分的测试覆盖，从单元测试到端到端测试，从性能测试到跨浏览器兼容性测试，为项目的稳定性和质量提供了全面保障。