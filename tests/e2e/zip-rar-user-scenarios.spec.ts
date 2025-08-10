import { test, expect } from '@playwright/test';

/**
 * ZIP和RAR格式的端到端用户场景测试
 * 模拟真实用户操作和使用场景
 */
test.describe('ZIP/RAR用户场景测试', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('ZIP文件用户场景', () => {
    test('用户上传并浏览标准ZIP文件', async ({ page }) => {
      // 准备测试文件
      const zipFileBuffer = Buffer.from([
        0x50, 0x4b, 0x03, 0x04, // ZIP签名
        // ... 简化的ZIP文件内容
      ]);

      // 1. 上传ZIP文件
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-documents.zip',
        mimeType: 'application/zip',
        buffer: zipFileBuffer
      });

      // 2. 等待文件解析完成
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="file-structure"]')).toBeVisible({ timeout: 10000 });

      // 3. 验证文件结构显示
      await expect(page.locator('[data-testid="file-item"]')).toHaveCount(3);
      await expect(page.locator('text=document.pdf')).toBeVisible();
      await expect(page.locator('text=image.jpg')).toBeVisible();
      await expect(page.locator('text=readme.txt')).toBeVisible();

      // 4. 展开目录
      await page.locator('[data-testid="folder-toggle"]').first().click();
      await expect(page.locator('[data-testid="folder-content"]')).toBeVisible();

      // 5. 检查文件信息显示
      const fileInfo = page.locator('[data-testid="file-info"]').first();
      await expect(fileInfo).toContainText('PDF');
      await expect(fileInfo).toContainText('KB');
    });

    test('用户预览ZIP内的不同文件类型', async ({ page }) => {
      // 上传包含多种文件类型的ZIP
      const multiTypeZip = Buffer.from([/* ZIP with various file types */]);
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'mixed-content.zip',
        mimeType: 'application/zip',
        buffer: multiTypeZip
      });

      await expect(page.locator('[data-testid="file-structure"]')).toBeVisible();

      // 预览文本文件
      await page.locator('[data-testid="file-item"]:has-text("readme.txt")').click();
      await expect(page.locator('[data-testid="text-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="text-content"]')).toContainText('Welcome to ZhugeExtract');

      // 预览图片文件
      await page.locator('[data-testid="file-item"]:has-text("photo.jpg")').click();
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="image-viewer"] img')).toBeVisible();

      // 预览PDF文件
      await page.locator('[data-testid="file-item"]:has-text("document.pdf")').click();
      await expect(page.locator('[data-testid="pdf-preview"]')).toBeVisible();
      await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible();

      // 预览不支持的文件类型
      await page.locator('[data-testid="file-item"]:has-text("data.bin")').click();
      await expect(page.locator('[data-testid="download-prompt"]')).toBeVisible();
      await expect(page.locator('text=无法预览此文件类型')).toBeVisible();
    });

    test('用户处理密码保护的ZIP文件', async ({ page }) => {
      const passwordZip = Buffer.from([/* Password protected ZIP */]);
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'protected.zip',
        mimeType: 'application/zip',
        buffer: passwordZip
      });

      // 应该显示密码输入框
      await expect(page.locator('[data-testid="password-dialog"]')).toBeVisible();
      await expect(page.locator('text=此文件需要密码')).toBeVisible();

      // 尝试错误密码
      await page.locator('[data-testid="password-input"]').fill('wrong123');
      await page.locator('[data-testid="password-submit"]').click();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
      await expect(page.locator('text=密码错误')).toBeVisible();

      // 输入正确密码
      await page.locator('[data-testid="password-input"]').fill('correct123');
      await page.locator('[data-testid="password-submit"]').click();

      // 验证文件解锁成功
      await expect(page.locator('[data-testid="password-dialog"]')).toBeHidden();
      await expect(page.locator('[data-testid="file-structure"]')).toBeVisible();
      await expect(page.locator('[data-testid="file-item"]')).toHaveCount(2);
    });

    test('用户下载ZIP中的单个文件', async ({ page }) => {
      const testZip = Buffer.from([/* ZIP with downloadable files */]);
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'download-test.zip',
        mimeType: 'application/zip',
        buffer: testZip
      });

      await expect(page.locator('[data-testid="file-structure"]')).toBeVisible();

      // 准备下载监听
      const downloadPromise = page.waitForEvent('download');

      // 点击下载按钮
      await page.locator('[data-testid="file-item"]:has-text("important.doc")').hover();
      await page.locator('[data-testid="download-file-btn"]').click();

      // 验证下载
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('important.doc');
    });
  });

  test.describe('RAR文件用户场景', () => {
    test('用户上传并浏览RAR文件', async ({ page }) => {
      const rarFileBuffer = Buffer.from([
        0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00, // RAR5签名
        // ... 简化的RAR文件内容
      ]);

      // 上传RAR文件
      await page.locator('input[type="file"]').setInputFiles({
        name: 'archive.rar',
        mimeType: 'application/x-rar-compressed',
        buffer: rarFileBuffer
      });

      // 等待RAR文件解析
      await expect(page.locator('[data-testid="format-indicator"]')).toContainText('RAR');
      await expect(page.locator('[data-testid="file-structure"]')).toBeVisible({ timeout: 15000 });

      // 验证RAR特有信息显示
      await expect(page.locator('[data-testid="archive-info"]')).toContainText('固实压缩');
      await expect(page.locator('[data-testid="compression-ratio"]')).toBeVisible();

      // 检查文件列表
      await expect(page.locator('[data-testid="file-item"]')).toHaveCount(5);
      
      // 验证RAR特有的文件属性
      const solidIndicator = page.locator('[data-testid="solid-indicator"]');
      await expect(solidIndicator).toBeVisible();
      await expect(solidIndicator).toContainText('固实');
    });

    test('用户处理RAR分卷文件', async ({ page }) => {
      // 模拟上传第一个分卷
      const rarPart1 = Buffer.from([/* RAR part 1 */]);
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'archive.part1.rar',
        mimeType: 'application/x-rar-compressed',
        buffer: rarPart1
      });

      // 应该显示分卷提示
      await expect(page.locator('[data-testid="volume-warning"]')).toBeVisible();
      await expect(page.locator('text=检测到分卷文件')).toBeVisible();
      await expect(page.locator('text=请上传所有分卷以完整解压')).toBeVisible();

      // 显示缺失的分卷列表
      await expect(page.locator('[data-testid="missing-volumes"]')).toBeVisible();
      await expect(page.locator('text=archive.part2.rar')).toBeVisible();
      await expect(page.locator('text=archive.part3.rar')).toBeVisible();

      // 上传其他分卷
      const rarPart2 = Buffer.from([/* RAR part 2 */]);
      const rarPart3 = Buffer.from([/* RAR part 3 */]);

      await page.locator('[data-testid="add-volume-btn"]').click();
      await page.locator('input[type="file"]').setInputFiles([
        {
          name: 'archive.part2.rar',
          mimeType: 'application/x-rar-compressed',
          buffer: rarPart2
        },
        {
          name: 'archive.part3.rar',
          mimeType: 'application/x-rar-compressed',
          buffer: rarPart3
        }
      ]);

      // 验证所有分卷已上传
      await expect(page.locator('[data-testid="volume-complete"]')).toBeVisible();
      await expect(page.locator('text=所有分卷已就绪')).toBeVisible();
      
      // 开始解压
      await page.locator('[data-testid="extract-volumes-btn"]').click();
      await expect(page.locator('[data-testid="file-structure"]')).toBeVisible({ timeout: 20000 });
    });

    test('用户处理RAR文件名加密', async ({ page }) => {
      const encryptedRar = Buffer.from([/* Header encrypted RAR */]);
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'encrypted-headers.rar',
        mimeType: 'application/x-rar-compressed',
        buffer: encryptedRar
      });

      // 应该立即显示密码对话框（文件名加密）
      await expect(page.locator('[data-testid="password-dialog"]')).toBeVisible();
      await expect(page.locator('text=文件名已加密')).toBeVisible();
      await expect(page.locator('text=需要密码才能查看文件列表')).toBeVisible();

      // 输入密码
      await page.locator('[data-testid="password-input"]').fill('secret123');
      await page.locator('[data-testid="password-submit"]').click();

      // 验证解密成功
      await expect(page.locator('[data-testid="password-dialog"]')).toBeHidden();
      await expect(page.locator('[data-testid="file-structure"]')).toBeVisible();
      
      // 文件应该显示加密标识
      const encryptedFiles = page.locator('[data-testid="encrypted-file-indicator"]');
      await expect(encryptedFiles).toHaveCount(3);
    });

    test('用户使用RAR恢复记录修复损坏文件', async ({ page }) => {
      const damagedRar = Buffer.from([/* Damaged RAR with recovery record */]);
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'damaged.rar',
        mimeType: 'application/x-rar-compressed',
        buffer: damagedRar
      });

      // 应该显示损坏提示和恢复选项
      await expect(page.locator('[data-testid="damage-warning"]')).toBeVisible();
      await expect(page.locator('text=文件可能已损坏')).toBeVisible();
      await expect(page.locator('[data-testid="recovery-option"]')).toBeVisible();
      await expect(page.locator('text=检测到恢复记录')).toBeVisible();

      // 尝试恢复
      await page.locator('[data-testid="try-recovery-btn"]').click();
      
      // 显示恢复进度
      await expect(page.locator('[data-testid="recovery-progress"]')).toBeVisible();
      await expect(page.locator('text=正在尝试恢复...')).toBeVisible();

      // 恢复成功
      await expect(page.locator('[data-testid="recovery-success"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=恢复成功')).toBeVisible();
      await expect(page.locator('[data-testid="file-structure"]')).toBeVisible();

      // 显示恢复的文件（可能有标识）
      const recoveredFiles = page.locator('[data-testid="recovered-file-indicator"]');
      await expect(recoveredFiles).toHaveCount(2);
    });
  });

  test.describe('性能和用户体验测试', () => {
    test('大文件上传应显示进度和性能指标', async ({ page }) => {
      // 模拟大文件
      const largeZip = Buffer.alloc(50 * 1024); // 50KB
      
      // 开始上传
      const uploadPromise = page.locator('input[type="file"]').setInputFiles({
        name: 'large-archive.zip',
        mimeType: 'application/zip',
        buffer: largeZip
      });

      // 验证进度显示
      await expect(page.locator('[data-testid="upload-progress-bar"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-percentage"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-speed"]')).toBeVisible();
      await expect(page.locator('[data-testid="remaining-time"]')).toBeVisible();

      await uploadPromise;

      // 验证处理进度
      await expect(page.locator('[data-testid="processing-progress"]')).toBeVisible();
      await expect(page.locator('text=正在解析文件结构...')).toBeVisible();

      // 验证性能指标
      await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="processing-time"]')).toBeVisible();
      await expect(page.locator('[data-testid="memory-usage"]')).toBeVisible();
    });

    test('用户应能取消长时间操作', async ({ page }) => {
      const veryLargeRar = { length: 200 * 1024 } as Buffer; // 200KB RAR (模拟)
      
      // 开始处理
      await page.locator('input[type="file"]').setInputFiles({
        name: 'very-large.rar',
        mimeType: 'application/x-rar-compressed',
        buffer: veryLargeRar
      });

      // 等待处理开始
      await expect(page.locator('[data-testid="processing-progress"]')).toBeVisible();
      
      // 点击取消按钮
      await page.locator('[data-testid="cancel-processing-btn"]').click();
      
      // 确认取消
      await page.locator('[data-testid="confirm-cancel-btn"]').click();
      
      // 验证取消成功
      await expect(page.locator('[data-testid="processing-cancelled"]')).toBeVisible();
      await expect(page.locator('text=操作已取消')).toBeVisible();
      
      // 界面应该回到初始状态
      await expect(page.locator('[data-testid="upload-area"]')).toBeVisible();
    });

    test('多文件并行处理的用户体验', async ({ page }) => {
      // 准备多个不同格式的文件
      const files = [
        {
          name: 'documents.zip',
          mimeType: 'application/zip',
          buffer: Buffer.alloc(10 * 1024) // 10KB
        },
        {
          name: 'media.rar',
          mimeType: 'application/x-rar-compressed',
          buffer: Buffer.alloc(15 * 1024) // 15KB
        },
        {
          name: 'backup.zip',
          mimeType: 'application/zip',
          buffer: Buffer.alloc(8 * 1024) // 8KB
        }
      ];

      // 批量上传
      await page.locator('input[type="file"][multiple]').setInputFiles(files);

      // 验证批处理界面
      await expect(page.locator('[data-testid="batch-processing"]')).toBeVisible();
      await expect(page.locator('[data-testid="file-queue"]')).toBeVisible();
      
      // 验证每个文件的处理状态
      for (const file of files) {
        const fileItem = page.locator(`[data-testid="queue-item"][data-filename="${file.name}"]`);
        await expect(fileItem).toBeVisible();
        await expect(fileItem.locator('[data-testid="file-status"]')).toBeVisible();
      }

      // 验证整体进度
      await expect(page.locator('[data-testid="overall-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="completed-count"]')).toBeVisible();
      
      // 等待所有文件处理完成
      await expect(page.locator('[data-testid="all-completed"]')).toBeVisible({ timeout: 30000 });
      
      // 验证结果展示
      await expect(page.locator('[data-testid="batch-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-files-extracted"]')).toBeVisible();
    });
  });

  test.describe('错误处理和用户提示', () => {
    test('用户友好的错误提示', async ({ page }) => {
      // 测试各种错误场景
      const errorScenarios = [
        {
          file: 'corrupted.zip',
          buffer: Buffer.from([0x50, 0x4b, 0xFF, 0xFF]), // 损坏的ZIP
          expectedError: '文件已损坏或格式不正确'
        },
        {
          file: 'unsupported.xyz',
          buffer: Buffer.from([0x00, 0x01, 0x02, 0x03]),
          expectedError: '不支持的文件格式'
        },
        {
          file: 'too-large.zip',
          buffer: { length: 1024 * 1024 } as Buffer, // 1MB (模拟)
          expectedError: '文件过大'
        }
      ];

      for (const scenario of errorScenarios) {
        // 上传问题文件
        await page.locator('input[type="file"]').setInputFiles({
          name: scenario.file,
          mimeType: 'application/octet-stream',
          buffer: scenario.buffer
        });

        // 验证错误提示
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator(`text=${scenario.expectedError}`)).toBeVisible();
        
        // 验证提供解决建议
        await expect(page.locator('[data-testid="error-suggestions"]')).toBeVisible();
        
        // 清除错误，准备下一个测试
        await page.locator('[data-testid="clear-error-btn"]').click();
        await expect(page.locator('[data-testid="error-message"]')).toBeHidden();
      }
    });

    test('网络错误的处理和重试', async ({ page }) => {
      // 模拟网络错误
      await page.route('**/api/upload', route => {
        route.abort('failed');
      });

      const testFile = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // ZIP signature
      
      await page.locator('input[type="file"]').setInputFiles({
        name: 'network-test.zip',
        mimeType: 'application/zip',
        buffer: testFile
      });

      // 验证网络错误提示
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      await expect(page.locator('text=网络连接出现问题')).toBeVisible();
      
      // 验证重试按钮
      await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
      
      // 恢复网络并重试
      await page.unroute('**/api/upload');
      await page.locator('[data-testid="retry-btn"]').click();
      
      // 验证重试成功
      await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    });
  });

  test.describe('移动端适配测试', () => {
    test('移动设备上的文件上传体验', async ({ page, isMobile }) => {
      test.skip(!isMobile, '仅在移动设备上运行');

      const mobileZip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
      
      // 验证移动端界面适配
      await expect(page.locator('[data-testid="mobile-upload-area"]')).toBeVisible();
      
      // 上传文件
      await page.locator('input[type="file"]').setInputFiles({
        name: 'mobile-test.zip',
        mimeType: 'application/zip',
        buffer: mobileZip
      });

      // 验证移动端优化的界面
      await expect(page.locator('[data-testid="mobile-file-list"]')).toBeVisible();
      
      // 验证触摸友好的操作
      await page.locator('[data-testid="mobile-file-item"]').first().tap();
      await expect(page.locator('[data-testid="mobile-file-actions"]')).toBeVisible();
      
      // 验证滑动操作
      const fileItem = page.locator('[data-testid="mobile-file-item"]').first();
      await fileItem.swipe({ direction: 'left' });
      await expect(page.locator('[data-testid="swipe-actions"]')).toBeVisible();
    });
  });
});

test.describe('可访问性测试', () => {
  test('键盘导航支持', async ({ page }) => {
    await page.goto('/');
    
    const testZip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'keyboard-test.zip',
      mimeType: 'application/zip',
      buffer: testZip
    });

    await expect(page.locator('[data-testid="file-structure"]')).toBeVisible();

    // Tab键导航
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="file-item"]:focus')).toBeVisible();
    
    // 回车键选择
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="file-preview"]')).toBeVisible();
    
    // Escape键关闭
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="file-preview"]')).toBeHidden();
  });

  test('屏幕阅读器支持', async ({ page }) => {
    await page.goto('/');
    
    // 验证ARIA标签
    await expect(page.locator('[aria-label="文件上传区域"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    
    const testRar = Buffer.from([0x52, 0x61, 0x72, 0x21]);
    await page.locator('input[type="file"]').setInputFiles({
      name: 'accessibility-test.rar',
      mimeType: 'application/x-rar-compressed',
      buffer: testRar
    });

    // 验证语义化标记
    await expect(page.locator('[role="tree"]')).toBeVisible(); // 文件树
    await expect(page.locator('[role="treeitem"]')).toHaveCount(3);
    
    // 验证状态通知
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();
    await expect(page.locator('[aria-describedby]')).toBeVisible();
  });
});