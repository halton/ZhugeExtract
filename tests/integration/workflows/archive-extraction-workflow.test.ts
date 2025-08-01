import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ArchiveViewer } from '@/components/ArchiveViewer';
import { ArchiveService } from '@/services/archive-service';
import { PreviewService } from '@/services/preview-service';
import { StorageService } from '@/services/storage-service';
import { createTestArchive, createMockFile } from '../../utils/test-helpers';

// Mock services
vi.mock('@/services/archive-service');
vi.mock('@/services/preview-service');
vi.mock('@/services/storage-service');

describe('Archive Extraction Workflow Integration', () => {
  let mockArchiveService: any;
  let mockPreviewService: any;
  let mockStorageService: any;

  beforeEach(() => {
    mockArchiveService = vi.mocked(ArchiveService);
    mockPreviewService = vi.mocked(PreviewService);
    mockStorageService = vi.mocked(StorageService);

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('完整解压流程', () => {
    it('应该完成从上传到预览的完整流程', async () => {
      // 准备测试数据
      const mockArchiveData = {
        id: 'archive-1',
        name: 'test.zip',
        format: 'zip',
        size: 1024,
        structure: [
          {
            name: 'readme.txt',
            type: 'file',
            size: 100,
            path: 'readme.txt',
            mimeType: 'text/plain'
          },
          {
            name: 'images',
            type: 'directory',
            size: 0,
            path: 'images/',
            children: [
              {
                name: 'photo.jpg',
                type: 'file',
                size: 50000,
                path: 'images/photo.jpg',
                mimeType: 'image/jpeg'
              }
            ]
          }
        ]
      };

      // Mock服务返回
      mockArchiveService.prototype.loadArchive.mockResolvedValue(mockArchiveData);
      mockArchiveService.prototype.extractFile.mockResolvedValue(
        new TextEncoder().encode('Hello World')
      );
      mockPreviewService.prototype.preview.mockResolvedValue({
        type: 'text',
        content: 'Hello World'
      });
      mockStorageService.prototype.store.mockResolvedValue('storage-id');

      // 渲染组件
      render(<ArchiveViewer />);

      // 1. 上传文件
      const fileInput = screen.getByTestId('file-input');
      const zipFile = createMockFile('test.zip', 'application/zip', 1024);
      
      fireEvent.change(fileInput, { target: { files: [zipFile] } });

      // 2. 等待解压完成
      await waitFor(() => {
        expect(screen.getByTestId('file-tree')).toBeInTheDocument();
      }, { timeout: 5000 });

      // 3. 验证文件树显示
      expect(screen.getByText('readme.txt')).toBeInTheDocument();
      expect(screen.getByText('images')).toBeInTheDocument();
      expect(screen.getByText('photo.jpg')).toBeInTheDocument();

      // 4. 点击文件进行预览
      const readmeFile = screen.getByText('readme.txt');
      fireEvent.click(readmeFile);

      // 5. 等待预览加载
      await waitFor(() => {
        expect(screen.getByTestId('preview-content')).toBeInTheDocument();
      });

      // 6. 验证预览内容
      expect(screen.getByText('Hello World')).toBeInTheDocument();

      // 7. 验证服务调用
      expect(mockArchiveService.prototype.loadArchive).toHaveBeenCalledWith(zipFile);
      expect(mockArchiveService.prototype.extractFile).toHaveBeenCalledWith('readme.txt');
      expect(mockPreviewService.prototype.preview).toHaveBeenCalled();
      expect(mockStorageService.prototype.store).toHaveBeenCalled();
    });

    it('应该处理RAR文件的完整流程', async () => {
      const mockRarData = {
        id: 'archive-2',
        name: 'test.rar',
        format: 'rar',
        size: 2048,
        structure: [
          {
            name: 'document.pdf',
            type: 'file',
            size: 100000,
            path: 'document.pdf',
            mimeType: 'application/pdf'
          }
        ]
      };

      mockArchiveService.prototype.loadArchive.mockResolvedValue(mockRarData);
      mockArchiveService.prototype.extractFile.mockResolvedValue(
        new Uint8Array(1000) // Mock PDF data
      );
      mockPreviewService.prototype.preview.mockResolvedValue({
        type: 'pdf',
        content: 'data:application/pdf;base64,mock-pdf-data'
      });

      render(<ArchiveViewer />);

      const fileInput = screen.getByTestId('file-input');
      const rarFile = createMockFile('test.rar', 'application/x-rar-compressed', 2048);
      
      fireEvent.change(fileInput, { target: { files: [rarFile] } });

      await waitFor(() => {
        expect(screen.getByTestId('file-tree')).toBeInTheDocument();
      });

      expect(screen.getByText('document.pdf')).toBeInTheDocument();

      const pdfFile = screen.getByText('document.pdf');
      fireEvent.click(pdfFile);

      await waitFor(() => {
        expect(screen.getByTestId('pdf-preview')).toBeInTheDocument();
      });

      expect(mockArchiveService.prototype.loadArchive).toHaveBeenCalledWith(rarFile);
    });

    it('应该处理大文件的分步加载', async () => {
      const largeMockData = {
        id: 'large-archive',
        name: 'large.zip',
        format: 'zip',
        size: 100 * 1024 * 1024, // 100MB
        structure: Array.from({ length: 1000 }, (_, i) => ({
          name: `file${i}.txt`,
          type: 'file',
          size: 1000,
          path: `file${i}.txt`,
          mimeType: 'text/plain'
        }))
      };

      let loadProgress = 0;
      mockArchiveService.prototype.loadArchive.mockImplementation(async (file) => {
        // 模拟分步加载
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            loadProgress += 20;
            // 模拟进度事件
            if (loadProgress >= 100) {
              clearInterval(interval);
              resolve(largeMockData);
            }
          }, 100);
        });
      });

      render(<ArchiveViewer />);

      const fileInput = screen.getByTestId('file-input');
      const largeFile = createMockFile('large.zip', 'application/zip', 100 * 1024 * 1024);
      
      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      // 验证加载状态
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // 等待加载完成
      await waitFor(() => {
        expect(screen.getByTestId('file-tree')).toBeInTheDocument();
      }, { timeout: 10000 });

      // 验证文件数量
      const fileItems = screen.getAllByTestId('file-item');
      expect(fileItems).toHaveLength(1000);
    });
  });

  describe('错误处理集成', () => {
    it('应该处理文件解压失败', async () => {
      mockArchiveService.prototype.loadArchive.mockRejectedValue(
        new Error('Archive is corrupted')
      );

      render(<ArchiveViewer />);

      const fileInput = screen.getByTestId('file-input');
      const corruptedFile = createMockFile('corrupted.zip', 'application/zip', 1024);
      
      fireEvent.change(fileInput, { target: { files: [corruptedFile] } });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByText(/Archive is corrupted/)).toBeInTheDocument();
      expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    });

    it('应该处理预览失败并提供降级方案', async () => {
      const mockArchiveData = {
        id: 'archive-3',
        name: 'test.zip',
        format: 'zip',
        structure: [
          {
            name: 'binary.exe',
            type: 'file',
            size: 1000,
            path: 'binary.exe',
            mimeType: 'application/octet-stream'
          }
        ]
      };

      mockArchiveService.prototype.loadArchive.mockResolvedValue(mockArchiveData);
      mockArchiveService.prototype.extractFile.mockResolvedValue(
        new Uint8Array([0x4D, 0x5A]) // PE header
      );
      mockPreviewService.prototype.preview.mockRejectedValue(
        new Error('Cannot preview binary file')
      );

      render(<ArchiveViewer />);

      const fileInput = screen.getByTestId('file-input');
      const zipFile = createMockFile('test.zip', 'application/zip', 1024);
      
      fireEvent.change(fileInput, { target: { files: [zipFile] } });

      await waitFor(() => {
        expect(screen.getByText('binary.exe')).toBeInTheDocument();
      });

      const binaryFile = screen.getByText('binary.exe');
      fireEvent.click(binaryFile);

      await waitFor(() => {
        expect(screen.getByTestId('binary-preview')).toBeInTheDocument();
      });

      // 应该显示十六进制预览
      expect(screen.getByText(/4D 5A/)).toBeInTheDocument();
      expect(screen.getByTestId('download-button')).toBeInTheDocument();
    });

    it('应该处理网络中断后的重试', async () => {
      let attemptCount = 0;
      mockArchiveService.prototype.loadArchive.mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network error');
        }
        return {
          id: 'archive-retry',
          name: 'test.zip',
          format: 'zip',
          structure: [{ name: 'file.txt', type: 'file', size: 100, path: 'file.txt' }]
        };
      });

      render(<ArchiveViewer />);

      const fileInput = screen.getByTestId('file-input');
      const zipFile = createMockFile('test.zip', 'application/zip', 1024);
      
      fireEvent.change(fileInput, { target: { files: [zipFile] } });

      // 第一次失败
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      // 点击重试
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // 第二次失败
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });

      // 再次重试
      fireEvent.click(retryButton);

      // 第三次成功
      await waitFor(() => {
        expect(screen.getByTestId('file-tree')).toBeInTheDocument();
      });

      expect(screen.getByText('file.txt')).toBeInTheDocument();
      expect(attemptCount).toBe(3);
    });
  });

  describe('性能优化集成', () => {
    it('应该实现虚拟滚动处理大量文件', async () => {
      const manyFilesMockData = {
        id: 'many-files',
        name: 'many-files.zip',
        format: 'zip',
        structure: Array.from({ length: 10000 }, (_, i) => ({
          name: `file${i.toString().padStart(5, '0')}.txt`,
          type: 'file',
          size: 100,
          path: `file${i.toString().padStart(5, '0')}.txt`,
          mimeType: 'text/plain'
        }))
      };

      mockArchiveService.prototype.loadArchive.mockResolvedValue(manyFilesMockData);

      render(<ArchiveViewer />);

      const fileInput = screen.getByTestId('file-input');
      const zipFile = createMockFile('many-files.zip', 'application/zip', 1024);
      
      const startTime = performance.now();
      
      fireEvent.change(fileInput, { target: { files: [zipFile] } });

      await waitFor(() => {
        expect(screen.getByTestId('virtual-file-tree')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 虚拟滚动应该在合理时间内渲染
      expect(renderTime).toBeLessThan(2000);

      // 应该只渲染可视区域的文件
      const visibleItems = screen.getAllByTestId('file-item');
      expect(visibleItems.length).toBeLessThan(100); // 远少于10000个
    });

    it('应该实现预览内容的缓存', async () => {
      const mockArchiveData = {
        id: 'cache-test',
        name: 'test.zip',
        format: 'zip',
        structure: [
          {
            name: 'cached.txt',
            type: 'file',
            size: 1000,
            path: 'cached.txt',
            mimeType: 'text/plain'
          }
        ]
      };

      mockArchiveService.prototype.loadArchive.mockResolvedValue(mockArchiveData);
      mockArchiveService.prototype.extractFile.mockResolvedValue(
        new TextEncoder().encode('Cached content')
      );
      mockPreviewService.prototype.preview.mockResolvedValue({
        type: 'text',
        content: 'Cached content'
      });

      render(<ArchiveViewer />);

      const fileInput = screen.getByTestId('file-input');
      const zipFile = createMockFile('test.zip', 'application/zip', 1024);
      
      fireEvent.change(fileInput, { target: { files: [zipFile] } });

      await waitFor(() => {
        expect(screen.getByText('cached.txt')).toBeInTheDocument();
      });

      // 第一次点击
      const cachedFile = screen.getByText('cached.txt');
      fireEvent.click(cachedFile);

      await waitFor(() => {
        expect(screen.getByText('Cached content')).toBeInTheDocument();
      });

      // 点击其他地方然后再回来
      fireEvent.click(screen.getByTestId('file-tree'));
      fireEvent.click(cachedFile);

      // 第二次应该更快（使用缓存）
      await waitFor(() => {
        expect(screen.getByText('Cached content')).toBeInTheDocument();
      });

      // 预览服务应该只被调用一次（第二次使用缓存）
      expect(mockPreviewService.prototype.preview).toHaveBeenCalledTimes(1);
    });
  });

  describe('状态管理集成', () => {
    it('应该正确管理多个压缩包的状态', async () => {
      const archive1Data = {
        id: 'archive-1',
        name: 'first.zip',
        format: 'zip',
        structure: [{ name: 'file1.txt', type: 'file', size: 100, path: 'file1.txt' }]
      };

      const archive2Data = {
        id: 'archive-2',
        name: 'second.zip',
        format: 'zip',
        structure: [{ name: 'file2.txt', type: 'file', size: 200, path: 'file2.txt' }]
      };

      mockArchiveService.prototype.loadArchive
        .mockResolvedValueOnce(archive1Data)
        .mockResolvedValueOnce(archive2Data);

      render(<ArchiveViewer />);

      const fileInput = screen.getByTestId('file-input');

      // 上传第一个文件
      const firstZip = createMockFile('first.zip', 'application/zip', 1024);
      fireEvent.change(fileInput, { target: { files: [firstZip] } });

      await waitFor(() => {
        expect(screen.getByText('file1.txt')).toBeInTheDocument();
      });

      // 上传第二个文件
      const secondZip = createMockFile('second.zip', 'application/zip', 2048);
      fireEvent.change(fileInput, { target: { files: [secondZip] } });

      await waitFor(() => {
        expect(screen.getByText('file2.txt')).toBeInTheDocument();
      });

      // 验证可以在两个压缩包之间切换
      const archiveTabs = screen.getAllByTestId('archive-tab');
      expect(archiveTabs).toHaveLength(2);

      fireEvent.click(archiveTabs[0]);
      expect(screen.getByText('file1.txt')).toBeInTheDocument();

      fireEvent.click(archiveTabs[1]);
      expect(screen.getByText('file2.txt')).toBeInTheDocument();
    });

    it('应该持久化用户偏好设置', async () => {
      mockStorageService.prototype.getPreferences.mockResolvedValue({
        theme: 'dark',
        defaultPreviewMode: 'hex',
        autoExtract: false
      });

      render(<ArchiveViewer />);

      // 验证偏好设置被应用
      const container = screen.getByTestId('archive-viewer');
      expect(container).toHaveClass('dark-theme');

      // 修改设置
      const settingsButton = screen.getByTestId('settings-button');
      fireEvent.click(settingsButton);

      const themeToggle = screen.getByTestId('theme-toggle');
      fireEvent.click(themeToggle);

      // 验证设置被保存
      await waitFor(() => {
        expect(mockStorageService.prototype.savePreferences).toHaveBeenCalledWith({
          theme: 'light',
          defaultPreviewMode: 'hex',
          autoExtract: false
        });
      });
    });
  });

  describe('内存管理集成', () => {
    it('应该在组件卸载时清理资源', async () => {
      const mockArchiveData = {
        id: 'cleanup-test',
        name: 'test.zip',
        format: 'zip',
        structure: [{ name: 'file.txt', type: 'file', size: 100, path: 'file.txt' }]
      };

      mockArchiveService.prototype.loadArchive.mockResolvedValue(mockArchiveData);
      mockArchiveService.prototype.destroy = vi.fn();

      const { unmount } = render(<ArchiveViewer />);

      const fileInput = screen.getByTestId('file-input');
      const zipFile = createMockFile('test.zip', 'application/zip', 1024);
      
      fireEvent.change(fileInput, { target: { files: [zipFile] } });

      await waitFor(() => {
        expect(screen.getByText('file.txt')).toBeInTheDocument();
      });

      // 卸载组件
      unmount();

      // 验证资源被清理
      expect(mockArchiveService.prototype.destroy).toHaveBeenCalled();
    });

    it('应该在内存压力下自动清理缓存', async () => {
      const mockArchiveData = {
        id: 'memory-test',
        name: 'test.zip',
        format: 'zip',
        structure: [{ name: 'large.txt', type: 'file', size: 50 * 1024 * 1024, path: 'large.txt' }]
      };

      mockArchiveService.prototype.loadArchive.mockResolvedValue(mockArchiveData);
      
      // 模拟内存不足
      const originalMemory = (performance as any).memory;
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 500 * 1024 * 1024, // 500MB used
          totalJSHeapSize: 512 * 1024 * 1024, // 512MB total
          jsHeapSizeLimit: 512 * 1024 * 1024
        },
        configurable: true
      });

      render(<ArchiveViewer />);

      const fileInput = screen.getByTestId('file-input');
      const zipFile = createMockFile('test.zip', 'application/zip', 1024);
      
      fireEvent.change(fileInput, { target: { files: [zipFile] } });

      await waitFor(() => {
        expect(screen.getByTestId('memory-warning')).toBeInTheDocument();
      });

      // 恢复原始memory对象
      Object.defineProperty(performance, 'memory', { value: originalMemory });
    });
  });
});