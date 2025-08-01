# ZhugeExtract 项目总体规划

## 项目简介
ZhugeExtract 是一个基于诸葛亮智慧命名的在线解压缩软件，支持主流压缩格式的在线解压和预览功能。

## 核心特性
- 支持主流压缩格式：ZIP, RAR, 7Z, TAR.GZ, BZ2 等
- 压缩包内文件和目录列表预览
- 文件预览功能：文本、图片、PDF等
- 跨平台支持：PC、移动端浏览器、微信小程序
- 无云存储：完全本地处理，保护用户隐私

## 技术架构

### 系统架构
```
前端层: React/Vue + TypeScript
├── Web端 (响应式设计)
├── 移动端 (PWA)
└── 微信小程序 (独立版本)

处理层: WebAssembly + Service Worker
├── libarchive.js (解压缩引擎)
├── 文件预览处理器
└── 内存管理系统

存储层: 浏览器本地存储
├── IndexedDB (文件结构索引)
├── FileSystem Access API (临时文件)
└── Service Worker Cache (应用缓存)
```

### 技术栈选择
- **前端**: React + TypeScript + Tailwind CSS
- **解压缩**: libarchive.js (WebAssembly)
- **存储**: IndexedDB + FileSystem Access API
- **部署**: 静态托管 (GitHub Pages/Vercel)

## 功能设计

### 1. 文件上传与解析
- 支持拖拽上传、点击选择、URL导入
- 自动格式检测和验证
- 流式解析处理大文件

### 2. 目录结构预览
- 树形结构展示文件和文件夹
- 文件信息显示 (大小、修改时间等)
- 快速搜索和过滤功能

### 3. 文件预览系统
- 文本文件：代码高亮、Markdown渲染
- 图片文件：缩略图、图片查看器
- PDF文件：PDF.js 渲染
- 办公文档：在线预览或系统默认程序打开

### 4. 用户界面
- **桌面端**: 三栏布局 (上传区 | 文件树 | 预览区)
- **移动端**: 堆叠布局 + Tab切换
- **小程序**: 原生组件 + 自定义导航

## 开发计划

### 第一阶段 - MVP版本 (2-4周)
1. **基础Web界面搭建**
   - React项目初始化 + TypeScript配置
   - Tailwind CSS样式系统集成
   - 基础布局组件开发
   - 测试: 组件渲染测试

2. **ZIP格式解压支持**
   - libarchive.js集成和配置
   - 文件格式检测机制
   - ZIP解压核心功能
   - 测试: ZIP文件解压功能测试

3. **文件树展示功能**
   - 树形结构组件开发
   - 文件/文件夹图标系统
   - 交互逻辑实现
   - 测试: 文件树渲染和交互测试

4. **基础文件预览**
   - 文本文件预览器
   - 图片文件预览器  
   - 预览面板布局
   - 测试: 预览功能端到端测试

### 第二阶段 - 功能完善 (4-6周)
1. **完整压缩格式支持**
   - RAR, 7Z, TAR.GZ格式集成
   - 格式自动检测优化
   - 密码保护文件处理
   - 测试: 多格式兼容性测试

2. **高级预览功能**
   - PDF.js集成和PDF预览
   - 代码文件语法高亮
   - Markdown渲染支持
   - 测试: 预览功能回归测试

3. **响应式设计优化**
   - 移动端布局适配
   - 触摸交互优化
   - 性能监控集成
   - 测试: 跨设备兼容性测试

4. **性能优化和错误处理**
   - 内存管理系统
   - 错误边界和错误处理
   - 加载状态和进度显示
   - 测试: 性能测试和压力测试

### 第三阶段 - 跨平台支持 (6-8周)
1. **微信小程序开发**
   - 小程序架构设计
   - 核心功能移植
   - 小程序特殊限制处理
   - 测试: 小程序功能测试

2. **PWA功能集成**
   - Service Worker配置
   - 离线缓存策略
   - 应用清单配置
   - 测试: PWA功能测试

3. **系统文件处理程序集成**
   - FileSystem Access API集成
   - 系统默认程序调用
   - 文件保存和导出
   - 测试: 系统集成测试

4. **安全性和稳定性加固**
   - 安全审计和修复
   - 异常处理完善
   - 用户数据保护
   - 测试: 安全测试和渗透测试

## 技术难点与解决方案

### 1. RAR格式支持
- **挑战**: RAR格式专利保护，版本复杂
- **方案**: 使用libarchive.js，支持RAR 2-5版本

### 2. 大文件处理
- **挑战**: 浏览器内存限制
- **方案**: 流式处理 + 分块加载 + LRU缓存淘汰

### 3. 小程序限制
- **挑战**: 文件大小限制、API限制
- **方案**: 分片上传 + 格式转换 + 降级处理

### 4. 性能优化
- **挑战**: WebAssembly加载时间
- **方案**: 按需加载 + Service Worker缓存

## 部署方案
- **成本**: 零服务器成本 (纯静态部署)
- **安全**: 文件完全本地处理
- **性能**: CDN加速 + 离线支持
- **维护**: 自动化CI/CD部署

## 测试策略

### 测试金字塔架构
```
                    E2E测试
                 (关键用户流程)
                      ↑
                 集成测试
              (组件间交互测试)
                      ↑
                   单元测试
             (函数和组件单体测试)
```

### 1. 单元测试 (70%)
**覆盖范围:**
- 工具函数测试 (格式检测、文件处理等)
- React组件测试 (渲染、Props、事件)
- 服务类测试 (ArchiveService, PreviewService)
- Hook测试 (自定义React Hooks)

**测试工具:**
- **框架**: Vitest (快速、现代)
- **React测试**: React Testing Library
- **断言库**: 内置 expect API
- **覆盖率**: c8 coverage

**示例测试用例:**
```javascript
// 格式检测测试
describe('FormatDetector', () => {
  it('should detect ZIP format correctly', () => {
    const zipHeader = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
    expect(FormatDetector.detect(zipHeader)).toBe('zip');
  });
  
  it('should detect RAR format correctly', () => {
    const rarHeader = new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07]);
    expect(FormatDetector.detect(rarHeader)).toBe('rar');
  });
});

// 组件测试
describe('FileTree', () => {
  it('should render file structure correctly', () => {
    const mockFiles = [
      { name: 'folder1', type: 'directory', children: [...] },
      { name: 'file1.txt', type: 'file', size: 1024 }
    ];
    
    render(<FileTree files={mockFiles} />);
    expect(screen.getByText('folder1')).toBeInTheDocument();
    expect(screen.getByText('file1.txt')).toBeInTheDocument();
  });
});
```

### 2. 集成测试 (20%)
**覆盖范围:**
- 文件上传 → 解压 → 预览完整流程
- 组件间数据传递和状态同步
- WebAssembly模块集成测试
- 本地存储系统集成

**测试工具:**
- **环境**: jsdom + Vitest
- **模拟**: MSW (Mock Service Worker)
- **文件处理**: 模拟File和Blob对象

**示例测试用例:**
```javascript
describe('Archive Processing Integration', () => {
  it('should complete full extraction workflow', async () => {
    // 1. 上传文件
    const mockZipFile = createMockZipFile();
    const { result } = renderHook(() => useArchiveExtraction());
    
    // 2. 执行解压
    await act(async () => {
      await result.current.extractArchive(mockZipFile);
    });
    
    // 3. 验证结果
    expect(result.current.archive).toBeDefined();
    expect(result.current.archive.files.length).toBeGreaterThan(0);
  });
});
```

### 3. 端到端测试 (10%)
**覆盖范围:**
- 关键用户路径测试
- 跨浏览器兼容性测试
- 性能基准测试
- 错误场景测试

**测试工具:**
- **框架**: Playwright (跨浏览器支持)
- **视觉测试**: Percy 或 Chromatic
- **性能测试**: Lighthouse CI

**关键测试场景:**
```javascript
// 端到端测试示例
test('用户完整解压流程', async ({ page }) => {
  // 1. 访问应用
  await page.goto('/');
  
  // 2. 上传ZIP文件
  await page.setInputFiles('input[type="file"]', 'test-files/sample.zip');
  
  // 3. 等待解压完成
  await page.waitForSelector('[data-testid="file-tree"]');
  
  // 4. 点击文件预览
  await page.click('[data-testid="file-item"]');
  
  // 5. 验证预览内容
  await expect(page.locator('[data-testid="preview-content"]')).toBeVisible();
  
  // 6. 下载文件
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-testid="download-button"]');
  const download = await downloadPromise;
  
  expect(download.suggestedFilename()).toBe('extracted-file.txt');
});
```

### 测试数据管理
**测试文件准备:**
```javascript
// 测试用例数据
const testFiles = {
  zip: {
    small: 'test-files/small.zip',      // <1MB
    medium: 'test-files/medium.zip',    // 10-50MB  
    large: 'test-files/large.zip',      // 100MB+
    password: 'test-files/password.zip', // 密码保护
    corrupted: 'test-files/corrupted.zip' // 损坏文件
  },
  rar: {
    version2: 'test-files/rar2.rar',
    version5: 'test-files/rar5.rar',
    multipart: ['test-files/archive.part1.rar', 'test-files/archive.part2.rar']
  }
};
```

### 性能测试
**指标监控:**
```javascript
// 性能基准测试
describe('Performance Benchmarks', () => {
  it('should load application under 3 seconds', async () => {
    const startTime = performance.now();
    
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('app-ready')).toBeInTheDocument();
    });
    
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  it('should extract 10MB ZIP under 5 seconds', async () => {
    const file = await fetch('/test-files/10mb.zip').then(r => r.blob());
    const startTime = performance.now();
    
    const service = new ArchiveService();
    await service.loadArchive(file);
    
    const extractTime = performance.now() - startTime;
    expect(extractTime).toBeLessThan(5000);
  });
});
```

### 持续集成测试
**GitHub Actions 配置:**
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:coverage
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        
  cross-browser-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Run Playwright tests
        run: npx playwright test --browsers=chromium,firefox,webkit
```

### 测试覆盖率目标
- **单元测试覆盖率**: ≥85%
- **集成测试覆盖率**: ≥70%
- **关键路径E2E覆盖**: 100%
- **代码分支覆盖率**: ≥80%

## 成功指标
- 支持10+种主流压缩格式
- 处理文件大小上限: 1-2GB (取决于设备)
- 页面加载时间: <3秒
- 文件解析速度: 媲美桌面软件
- 跨平台兼容性: 99%现代浏览器
- **测试覆盖率**: ≥85%
- **缺陷逃逸率**: <2%
- **性能回归检测**: 100%

## 质量保证流程
1. **开发阶段**: TDD开发，实时单元测试
2. **功能完成**: 集成测试验证，代码审查
3. **阶段完成**: 端到端测试，性能测试
4. **发布前**: 全量回归测试，安全扫描
5. **发布后**: 生产监控，用户反馈收集

## 风险评估
- **技术风险**: 中等 (WebAssembly技术成熟，测试覆盖充分)
- **维护风险**: 低 (可控的技术栈，完善的测试体系)
- **用户接受度**: 高 (隐私保护 + 免费使用)
- **质量风险**: 低 (多层次测试策略，持续集成)