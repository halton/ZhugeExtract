import { test, expect, Page, BrowserContext } from '@playwright/test';
import path from 'path';

test.describe('ZhugeExtract - 完整用户旅程', () => {
  let page: Page;
  let context: BrowserContext;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      // 启用权限
      permissions: ['clipboard-read', 'clipboard-write'],
      // 设置视口
      viewport: { width: 1280, height: 720 }
    });
    page = await context.newPage();
    
    // 导航到应用
    await page.goto('/');
    await expect(page).toHaveTitle(/ZhugeExtract/);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('用户完整解压和预览流程', async () => {
    // 步骤1: 验证初始页面状态
    await expect(page.getByTestId('file-upload-zone')).toBeVisible();
    await expect(page.getByText('拖拽文件到此处')).toBeVisible();
    await expect(page.getByText('支持格式')).toBeVisible();

    // 步骤2: 上传ZIP文件
    const zipFilePath = path.join(__dirname, '../fixtures/archives/sample.zip');
    
    await page.setInputFiles('input[type="file"]', zipFilePath);
    
    // 验证上传成功提示
    await expect(page.getByText('文件上传成功')).toBeVisible({ timeout: 5000 });

    // 步骤3: 等待解压完成
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('loading-spinner')).not.toBeVisible();

    // 验证解压结果
    await expect(page.getByText('解压完成')).toBeVisible();
    await expect(page.getByTestId('file-count')).toContainText('5 个文件');

    // 步骤4: 验证文件树结构
    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree.getByText('readme.txt')).toBeVisible();
    await expect(fileTree.getByText('images')).toBeVisible();
    await expect(fileTree.getByText('documents')).toBeVisible();

    // 展开文件夹
    await fileTree.getByText('images').click();
    await expect(fileTree.getByText('photo1.jpg')).toBeVisible();
    await expect(fileTree.getByText('photo2.png')).toBeVisible();

    // 步骤5: 预览文本文件
    await fileTree.getByText('readme.txt').click();
    
    await expect(page.getByTestId('preview-panel')).toBeVisible();
    await expect(page.getByTestId('preview-content')).toBeVisible();
    await expect(page.getByText('这是一个测试文件')).toBeVisible();
    
    // 验证预览元数据
    const metadataPanel = page.getByTestId('file-metadata');
    await expect(metadataPanel.getByText('文件大小: 48 B')).toBeVisible();
    await expect(metadataPanel.getByText('类型: 文本文件')).toBeVisible();

    // 步骤6: 预览图片文件
    await fileTree.getByText('photo1.jpg').click();
    
    await expect(page.getByTestId('image-preview')).toBeVisible();
    const image = page.getByTestId('preview-image');
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', /^data:image/);

    // 验证图片控制按钮
    await expect(page.getByTestId('zoom-in-button')).toBeVisible();
    await expect(page.getByTestId('zoom-out-button')).toBeVisible();
    await expect(page.getByTestId('rotate-button')).toBeVisible();

    // 步骤7: 测试图片缩放功能
    await page.getByTestId('zoom-in-button').click();
    await expect(image).toHaveClass(/zoomed-in/);
    
    await page.getByTestId('zoom-out-button').click();
    await expect(image).not.toHaveClass(/zoomed-in/);

    // 步骤8: 下载单个文件
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-file-button').click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('photo1.jpg');

    // 步骤9: 批量选择和下载
    await fileTree.getByTestId('select-checkbox-readme.txt').check();
    await fileTree.getByTestId('select-checkbox-photo1.jpg').check();
    
    await expect(page.getByTestId('selected-count')).toContainText('已选择 2 个文件');
    
    const batchDownloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-selected-button').click();
    
    const batchDownload = await batchDownloadPromise;
    expect(batchDownload.suggestedFilename()).toMatch(/selected_files.*\.zip/);

    // 步骤10: 搜索文件
    const searchInput = page.getByTestId('file-search-input');
    await searchInput.fill('photo');
    
    await expect(fileTree.getByText('photo1.jpg')).toBeVisible();
    await expect(fileTree.getByText('photo2.png')).toBeVisible();
    await expect(fileTree.getByText('readme.txt')).not.toBeVisible();

    // 清除搜索
    await searchInput.clear();
    await expect(fileTree.getByText('readme.txt')).toBeVisible();

    // 步骤11: 切换显示模式
    await page.getByTestId('view-mode-list').click();
    await expect(fileTree).toHaveClass(/list-view/);
    
    await page.getByTestId('view-mode-grid').click();
    await expect(fileTree).toHaveClass(/grid-view/);

    // 步骤12: 验证应用状态持久化
    await page.reload();
    
    // 验证文件仍然加载
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('readme.txt')).toBeVisible();
  });

  test('RAR文件处理流程', async () => {
    const rarFilePath = path.join(__dirname, '../fixtures/archives/sample.rar');
    
    await page.setInputFiles('input[type="file"]', rarFilePath);
    
    // 等待RAR解压完成（可能需要更多时间）
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 15000 });
    
    // 验证RAR特有的文件结构
    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree.getByText('compressed_data.bin')).toBeVisible();
    
    // 验证压缩信息显示
    const compressionInfo = page.getByTestId('compression-info');
    await expect(compressionInfo.getByText('格式: RAR')).toBeVisible();
    await expect(compressionInfo.getByText(/压缩比:/)).toBeVisible();
  });

  test('密码保护文件处理', async () => {
    const protectedZipPath = path.join(__dirname, '../fixtures/archives/protected.zip');
    
    await page.setInputFiles('input[type="file"]', protectedZipPath);
    
    // 应该出现密码输入对话框
    await expect(page.getByTestId('password-dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('此文件需要密码')).toBeVisible();
    
    // 输入错误密码
    await page.getByTestId('password-input').fill('wrongpassword');
    await page.getByTestId('password-submit').click();
    
    // 验证错误提示
    await expect(page.getByText('密码错误')).toBeVisible();
    
    // 输入正确密码
    await page.getByTestId('password-input').clear();
    await page.getByTestId('password-input').fill('test123');
    await page.getByTestId('password-submit').click();
    
    // 验证解压成功
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('protected_file.txt')).toBeVisible();
  });

  test('错误处理和恢复', async () => {
    // 测试无效文件上传
    const invalidFilePath = path.join(__dirname, '../fixtures/files/invalid.txt');
    
    await page.setInputFiles('input[type="file"]', invalidFilePath);
    
    // 验证错误信息
    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByText('不支持的文件格式')).toBeVisible();
    
    // 点击清除错误
    await page.getByTestId('clear-error-button').click();
    await expect(page.getByTestId('error-message')).not.toBeVisible();
    
    // 测试损坏的压缩文件
    const corruptedZipPath = path.join(__dirname, '../fixtures/archives/corrupted.zip');
    
    await page.setInputFiles('input[type="file"]', corruptedZipPath);
    
    // 验证错误处理
    await expect(page.getByTestId('error-message')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/文件损坏/)).toBeVisible();
    
    // 验证重试按钮
    await expect(page.getByTestId('retry-button')).toBeVisible();
  });

  test('大文件处理和性能', async () => {
    const largeZipPath = path.join(__dirname, '../fixtures/archives/large_50mb.zip');
    
    await page.setInputFiles('input[type="file"]', largeZipPath);
    
    // 验证进度指示器
    await expect(page.getByTestId('progress-bar')).toBeVisible();
    await expect(page.getByTestId('progress-text')).toBeVisible();
    
    // 监控进度更新
    const progressValues: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Progress:')) {
        progressValues.push(msg.text());
      }
    });
    
    // 等待解压完成
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 30000 });
    
    // 验证大量文件的虚拟滚动
    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree).toHaveClass(/virtual-scroll/);
    
    // 验证文件数量
    const fileCount = page.getByTestId('file-count');
    await expect(fileCount).toContainText(/\d+ 个文件/);
    
    // 测试虚拟滚动性能
    const scrollContainer = page.getByTestId('virtual-scroll-container');
    await scrollContainer.evaluate(element => {
      element.scrollTop = element.scrollHeight / 2;
    });
    
    // 验证滚动后的渲染性能
    await expect(page.getByTestId('file-item').first()).toBeVisible();
  });

  test('拖拽上传功能', async () => {
    const zipFilePath = path.join(__dirname, '../fixtures/archives/drag_test.zip');
    
    // 模拟文件拖拽
    const dropZone = page.getByTestId('file-upload-zone');
    
    // 创建文件对象并拖拽
    const fileBuffer = await require('fs').promises.readFile(zipFilePath);
    const dataTransfer = await page.evaluateHandle((data) => {
      const dt = new DataTransfer();
      const file = new File([new Uint8Array(data)], 'drag_test.zip', {
        type: 'application/zip'
      });
      dt.items.add(file);
      return dt;
    }, Array.from(fileBuffer));
    
    await dropZone.dispatchEvent('drop', { dataTransfer });
    
    // 验证拖拽上传成功
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('dragged_file.txt')).toBeVisible();
  });

  test('键盘导航和无障碍功能', async () => {
    const zipFilePath = path.join(__dirname, '../fixtures/archives/sample.zip');
    await page.setInputFiles('input[type="file"]', zipFilePath);
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });
    
    // 测试Tab键导航
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('file-tree')).toBeFocused();
    
    // 使用方向键导航文件
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter'); // 选择文件
    
    // 验证文件被选中和预览
    await expect(page.getByTestId('preview-panel')).toBeVisible();
    
    // 测试快捷键
    await page.keyboard.press('Control+A'); // 全选
    await expect(page.getByTestId('selected-count')).toContainText('已选择');
    
    await page.keyboard.press('Escape'); // 取消选择
    await expect(page.getByTestId('selected-count')).not.toBeVisible();
    
    // 验证ARIA标签
    const fileTree = page.getByTestId('file-tree');
    await expect(fileTree).toHaveAttribute('role', 'tree');
    
    const fileItems = page.getByTestId('file-item');
    await expect(fileItems.first()).toHaveAttribute('role', 'treeitem');
  });

  test('响应式设计 - 移动端体验', async () => {
    // 切换到移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    const zipFilePath = path.join(__dirname, '../fixtures/archives/sample.zip');
    await page.setInputFiles('input[type="file"]', zipFilePath);
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });
    
    // 验证移动端布局
    const container = page.getByTestId('main-container');
    await expect(container).toHaveClass(/mobile-layout/);
    
    // 验证Tab切换
    const tabButtons = page.getByTestId('tab-button');
    await expect(tabButtons).toHaveCount(2); // 文件列表和预览两个Tab
    
    // 切换到预览Tab
    await tabButtons.last().click();
    await expect(page.getByTestId('preview-panel')).toBeVisible();
    
    // 验证触摸手势（如果支持）
    const fileTree = page.getByTestId('file-tree');
    await fileTree.locator('text=readme.txt').tap();
    await expect(page.getByTestId('preview-content')).toBeVisible();
    
    // 验证移动端菜单
    const mobileMenu = page.getByTestId('mobile-menu-button');
    await expect(mobileMenu).toBeVisible();
    
    await mobileMenu.click();
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
  });

  test('多语言支持', async () => {
    // 切换到英文
    await page.getByTestId('language-selector').click();
    await page.getByText('English').click();
    
    // 验证界面语言切换
    await expect(page.getByText('Drag files here')).toBeVisible();
    await expect(page.getByText('Supported formats')).toBeVisible();
    
    // 上传文件并验证英文提示
    const zipFilePath = path.join(__dirname, '../fixtures/archives/sample.zip');
    await page.setInputFiles('input[type="file"]', zipFilePath);
    
    await expect(page.getByText('File uploaded successfully')).toBeVisible();
    await expect(page.getByText('Extraction complete')).toBeVisible({ timeout: 10000 });
    
    // 切换回中文
    await page.getByTestId('language-selector').click();
    await page.getByText('中文').click();
    
    await expect(page.getByText('拖拽文件到此处')).toBeVisible();
  });

  test('主题切换功能', async () => {
    // 验证默认主题
    const body = page.locator('body');
    await expect(body).toHaveClass(/light-theme/);
    
    // 切换到暗色主题
    await page.getByTestId('theme-toggle').click();
    await expect(body).toHaveClass(/dark-theme/);
    
    // 验证主题持久化
    await page.reload();
    await expect(body).toHaveClass(/dark-theme/);
    
    // 切换回亮色主题
    await page.getByTestId('theme-toggle').click();
    await expect(body).toHaveClass(/light-theme/);
  });

  test('离线功能测试', async () => {
    // 首先在线加载应用
    const zipFilePath = path.join(__dirname, '../fixtures/archives/sample.zip');
    await page.setInputFiles('input[type="file"]', zipFilePath);
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });
    
    // 模拟离线状态
    await context.setOffline(true);
    
    // 刷新页面，验证离线缓存
    await page.reload();
    await expect(page.getByTestId('file-upload-zone')).toBeVisible({ timeout: 5000 });
    
    // 验证离线提示
    await expect(page.getByTestId('offline-indicator')).toBeVisible();
    await expect(page.getByText('离线模式')).toBeVisible();
    
    // 验证基础功能仍然可用
    const offlineZipPath = path.join(__dirname, '../fixtures/archives/offline_test.zip');
    await page.setInputFiles('input[type="file"]', offlineZipPath);
    await expect(page.getByTestId('file-tree')).toBeVisible({ timeout: 10000 });
    
    // 恢复在线状态
    await context.setOffline(false);
    await expect(page.getByTestId('offline-indicator')).not.toBeVisible();
  });
});