import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ArchiveService } from '@/services/archive-service';
import { FormatDetector } from '@/utils/format-detector';
import { MemoryManager } from '@/utils/memory-manager';

// Mock dependencies
vi.mock('@/utils/format-detector');
vi.mock('@/utils/memory-manager');
vi.mock('libarchive.js', () => ({
  default: {
    open: vi.fn(),
    extract: vi.fn()
  }
}));

describe('ArchiveService', () => {
  let archiveService: ArchiveService;
  let mockFormatDetector: any;
  let mockMemoryManager: any;

  beforeEach(() => {
    archiveService = new ArchiveService();
    mockFormatDetector = vi.mocked(FormatDetector);
    mockMemoryManager = vi.mocked(MemoryManager);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('文件加载', () => {
    it('应该成功加载ZIP文件', async () => {
      const mockFile = new File(['zip content'], 'test.zip', { 
        type: 'application/zip' 
      });
      
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      const mockStructure = [
        { name: 'file1.txt', type: 'file', size: 100, path: 'file1.txt' },
        { name: 'folder1', type: 'directory', size: 0, path: 'folder1/' },
        { name: 'file2.txt', type: 'file', size: 200, path: 'folder1/file2.txt' }
      ];
      
      // Mock libarchive.js
      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue(mockStructure.map(item => ({
          file: item.type === 'file' ? {
            name: item.name,
            size: item.size,
            extract: vi.fn().mockReturnValue(new Uint8Array(item.size))
          } : null
        })))
      };
      
      vi.doMock('libarchive.js', () => ({
        default: vi.fn().mockReturnValue(mockArchive)
      }));

      const result = await archiveService.loadArchive(mockFile);

      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'test.zip',
        format: 'zip',
        structure: expect.any(Array)
      });
      
      expect(result.structure).toHaveLength(3);
      expect(mockFormatDetector.detect).toHaveBeenCalled();
    });

    it('应该处理不支持的文件格式', async () => {
      const mockFile = new File(['unknown content'], 'test.unknown');
      
      mockFormatDetector.detect.mockResolvedValue('unknown');

      await expect(archiveService.loadArchive(mockFile))
        .rejects.toThrow('Unsupported archive format: unknown');
    });

    it('应该验证文件大小限制', async () => {
      const largeContent = new Array(3 * 1024 * 1024 * 1024).fill('a').join(''); // 3GB
      const largeFile = new File([largeContent], 'large.zip');

      await expect(archiveService.loadArchive(largeFile))
        .rejects.toThrow('File too large');
    });

    it('应该处理损坏的压缩文件', async () => {
      const mockFile = new File(['corrupted'], 'corrupted.zip');
      
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      // Mock libarchive throwing error
      vi.doMock('libarchive.js', () => ({
        default: vi.fn().mockImplementation(() => {
          throw new Error('Invalid archive');
        })
      }));

      await expect(archiveService.loadArchive(mockFile))
        .rejects.toThrow('Failed to parse archive');
    });
  });

  describe('密码保护处理', () => {
    it('应该检测密码保护的文件', async () => {
      const mockFile = new File(['protected content'], 'protected.zip');
      
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      // Mock libarchive throwing password error
      vi.doMock('libarchive.js', () => ({
        default: vi.fn().mockImplementation(() => {
          throw new Error('Password required');
        })
      }));

      await expect(archiveService.loadArchive(mockFile))
        .rejects.toThrow('Password required');
    });

    it('应该使用密码解压保护文件', async () => {
      const mockFile = new File(['protected content'], 'protected.zip');
      const password = 'test123';
      
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          { 
            file: { 
              name: 'protected.txt', 
              size: 100,
              extract: vi.fn().mockReturnValue(new Uint8Array(100))
            } 
          }
        ])
      };
      
      vi.doMock('libarchive.js', () => ({
        default: vi.fn().mockReturnValue(mockArchive)
      }));

      const result = await archiveService.loadArchive(mockFile, { password });

      expect(result.structure).toHaveLength(1);
      expect(result.structure[0].name).toBe('protected.txt');
    });

    it('应该处理错误密码', async () => {
      const mockFile = new File(['protected content'], 'protected.zip');
      const wrongPassword = 'wrong';
      
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      vi.doMock('libarchive.js', () => ({
        default: vi.fn().mockImplementation(() => {
          throw new Error('Invalid password');
        })
      }));

      await expect(archiveService.loadArchive(mockFile, { password: wrongPassword }))
        .rejects.toThrow('Invalid password');
    });
  });

  describe('文件提取', () => {
    beforeEach(async () => {
      const mockFile = new File(['zip content'], 'test.zip');
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          { 
            file: { 
              name: 'test.txt', 
              size: 11,
              extract: vi.fn().mockReturnValue(new TextEncoder().encode('Hello World'))
            } 
          }
        ])
      };
      
      vi.doMock('libarchive.js', () => ({
        default: vi.fn().mockReturnValue(mockArchive)
      }));

      await archiveService.loadArchive(mockFile);
    });

    it('应该提取单个文件', async () => {
      const fileContent = await archiveService.extractFile('test.txt');
      
      expect(fileContent).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(fileContent)).toBe('Hello World');
    });

    it('应该处理不存在的文件', async () => {
      await expect(archiveService.extractFile('nonexistent.txt'))
        .rejects.toThrow('File not found: nonexistent.txt');
    });

    it('应该支持批量提取', async () => {
      const paths = ['test.txt'];
      const results = await archiveService.extractMultiple(paths);
      
      expect(results).toHaveLength(1);
      expect(results[0].path).toBe('test.txt');
      expect(results[0].content).toBeInstanceOf(Uint8Array);
    });
  });

  describe('内存管理', () => {
    it('应该监控内存使用', async () => {
      const mockFile = new File(['content'], 'test.zip');
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      mockMemoryManager.prototype.allocate.mockResolvedValue('mem-id-1');
      mockMemoryManager.prototype.getCurrentUsage.mockReturnValue(10 * 1024 * 1024);

      await archiveService.loadArchive(mockFile);

      expect(mockMemoryManager.prototype.allocate).toHaveBeenCalled();
    });

    it('应该在内存不足时清理缓存', async () => {
      const mockFile = new File(['large content'], 'large.zip');
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      // 模拟内存不足
      mockMemoryManager.prototype.allocate
        .mockRejectedValueOnce(new Error('Insufficient memory'))
        .mockResolvedValueOnce('mem-id-1');
      
      mockMemoryManager.prototype.forceGC.mockImplementation(() => {
        // 模拟GC释放内存
      });

      await archiveService.loadArchive(mockFile);

      expect(mockMemoryManager.prototype.forceGC).toHaveBeenCalled();
    });

    it('应该在服务销毁时释放内存', () => {
      mockMemoryManager.prototype.freeAll.mockImplementation(() => {});

      archiveService.destroy();

      expect(mockMemoryManager.prototype.freeAll).toHaveBeenCalled();
    });
  });

  describe('进度报告', () => {
    it('应该报告加载进度', async () => {
      const mockFile = new File(['content'], 'test.zip');
      const progressCallback = vi.fn();
      
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      archiveService.onProgress(progressCallback);
      await archiveService.loadArchive(mockFile);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'detecting',
          progress: expect.any(Number)
        })
      );
    });

    it('应该报告提取进度', async () => {
      const mockFile = new File(['content'], 'test.zip');
      const progressCallback = vi.fn();
      
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          { 
            file: { 
              name: 'test.txt', 
              size: 100,
              extract: vi.fn().mockImplementation(() => {
                // 模拟提取进度
                progressCallback({ stage: 'extracting', progress: 50 });
                return new Uint8Array(100);
              })
            } 
          }
        ])
      };
      
      vi.doMock('libarchive.js', () => ({
        default: vi.fn().mockReturnValue(mockArchive)
      }));

      await archiveService.loadArchive(mockFile);
      archiveService.onProgress(progressCallback);
      
      await archiveService.extractFile('test.txt');

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'extracting',
          progress: 50
        })
      );
    });
  });

  describe('错误处理', () => {
    it('应该提供详细的错误信息', async () => {
      const mockFile = new File(['invalid'], 'invalid.zip');
      
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      vi.doMock('libarchive.js', () => ({
        default: vi.fn().mockImplementation(() => {
          throw new Error('CRC mismatch');
        })
      }));

      try {
        await archiveService.loadArchive(mockFile);
      } catch (error: any) {
        expect(error.message).toContain('Failed to parse archive');
        expect(error.cause).toBe('CRC mismatch');
        expect(error.file).toBe('invalid.zip');
      }
    });

    it('应该处理网络中断', async () => {
      const mockFile = new File(['content'], 'test.zip');
      
      // 模拟网络错误
      mockFormatDetector.detect.mockRejectedValue(new Error('Network error'));

      await expect(archiveService.loadArchive(mockFile))
        .rejects.toThrow('Network error');
    });

    it('应该处理内存溢出', async () => {
      const mockFile = new File(['huge content'], 'huge.zip');
      
      mockFormatDetector.detect.mockResolvedValue('zip');
      mockMemoryManager.prototype.allocate
        .mockRejectedValue(new Error('Out of memory'));

      await expect(archiveService.loadArchive(mockFile))
        .rejects.toThrow('Out of memory');
    });
  });

  describe('缓存管理', () => {
    it('应该缓存已解析的文件结构', async () => {
      const mockFile = new File(['content'], 'test.zip');
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([])
      };
      
      vi.doMock('libarchive.js', () => ({
        default: vi.fn().mockReturnValue(mockArchive)
      }));

      // 第一次加载
      const result1 = await archiveService.loadArchive(mockFile);
      
      // 第二次加载相同文件（应该使用缓存）
      const result2 = await archiveService.loadArchive(mockFile);

      expect(result1.id).toBe(result2.id);
      expect(mockArchive.getFilesArray).toHaveBeenCalledTimes(1); // 只调用一次
    });

    it('应该清理过期缓存', async () => {
      const mockFile = new File(['content'], 'test.zip');
      
      // 设置短的缓存时间
      archiveService.setCacheTimeout(100); // 100ms
      
      await archiveService.loadArchive(mockFile);
      
      // 等待缓存过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const cacheSize = archiveService.getCacheSize();
      expect(cacheSize).toBe(0);
    });
  });

  describe('性能测试', () => {
    it('应该快速检测文件格式', async () => {
      const mockFile = new File(['PK'], 'test.zip');
      
      const startTime = performance.now();
      
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      for (let i = 0; i < 100; i++) {
        await archiveService.detectFormat(mockFile);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 100;
      
      expect(avgTime).toBeLessThan(10); // 平均每次检测少于10ms
    });

    it('应该高效处理大量小文件', async () => {
      const mockFile = new File(['content'], 'many-files.zip');
      mockFormatDetector.detect.mockResolvedValue('zip');
      
      // 模拟1000个小文件
      const manyFiles = Array.from({ length: 1000 }, (_, i) => ({
        file: {
          name: `file${i}.txt`,
          size: 100,
          extract: vi.fn().mockReturnValue(new Uint8Array(100))
        }
      }));
      
      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue(manyFiles)
      };
      
      vi.doMock('libarchive.js', () => ({
        default: vi.fn().mockReturnValue(mockArchive)
      }));

      const startTime = performance.now();
      
      const result = await archiveService.loadArchive(mockFile);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      expect(result.structure).toHaveLength(1000);
      expect(loadTime).toBeLessThan(1000); // 应该在1秒内完成
    });
  });
});