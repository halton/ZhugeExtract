import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ArchiveExtractor } from '@/services/archive-extractor';
import { createTestZip, createTestRar, createTest7z } from '../../utils/archive-generators';

// Mock libarchive.js
const mockLibArchive = {
  Archive: vi.fn(),
  open: vi.fn(),
  extract: vi.fn()
};

vi.mock('libarchive.js', () => mockLibArchive);

describe('LibArchive Integration Tests', () => {
  let archiveExtractor: ArchiveExtractor;

  beforeEach(() => {
    archiveExtractor = new ArchiveExtractor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ZIP格式集成', () => {
    it('应该解压标准ZIP文件', async () => {
      const zipBuffer = await createTestZip({
        'file1.txt': 'Hello World',
        'folder1/file2.txt': 'Nested file content',
        'empty-folder/': null // 空文件夹
      });

      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'file1.txt',
              size: 11,
              extract: vi.fn().mockReturnValue(new TextEncoder().encode('Hello World'))
            }
          },
          {
            file: null, // 文件夹
            name: 'folder1/',
            size: 0
          },
          {
            file: {
              name: 'folder1/file2.txt',
              size: 19,
              extract: vi.fn().mockReturnValue(new TextEncoder().encode('Nested file content'))
            }
          },
          {
            file: null,
            name: 'empty-folder/',
            size: 0
          }
        ])
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const result = await archiveExtractor.extract(zipBuffer, 'zip');

      expect(result.files).toHaveLength(4);
      expect(result.files[0].name).toBe('file1.txt');
      expect(result.files[0].type).toBe('file');
      expect(result.files[1].name).toBe('folder1/');
      expect(result.files[1].type).toBe('directory');
      expect(result.files[2].name).toBe('folder1/file2.txt');
      expect(result.files[3].name).toBe('empty-folder/');
    });

    it('应该处理ZIP文件的中文路径', async () => {
      const zipBuffer = await createTestZip({
        '中文文件夹/测试文件.txt': '中文内容',
        '特殊字符!@#$%^&*().txt': 'Special chars content'
      });

      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: null,
            name: '中文文件夹/',
            size: 0
          },
          {
            file: {
              name: '中文文件夹/测试文件.txt',
              size: 12,
              extract: vi.fn().mockReturnValue(new TextEncoder().encode('中文内容'))
            }
          },
          {
            file: {
              name: '特殊字符!@#$%^&*().txt',
              size: 21,
              extract: vi.fn().mockReturnValue(new TextEncoder().encode('Special chars content'))
            }
          }
        ])
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const result = await archiveExtractor.extract(zipBuffer, 'zip');

      expect(result.files).toHaveLength(3);
      expect(result.files[0].name).toBe('中文文件夹/');
      expect(result.files[1].name).toBe('中文文件夹/测试文件.txt');
      expect(result.files[2].name).toBe('特殊字符!@#$%^&*().txt');
    });

    it('应该处理ZIP文件的压缩方法', async () => {
      const zipBuffer = await createTestZip({
        'stored.txt': 'Stored without compression',
        'deflated.txt': 'Deflated with compression'
      }, {
        compression: 'mixed' // 混合压缩方法
      });

      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'stored.txt',
              size: 26,
              compressionMethod: 0, // stored
              extract: vi.fn().mockReturnValue(new TextEncoder().encode('Stored without compression'))
            }
          },
          {
            file: {
              name: 'deflated.txt',
              size: 26,
              compressionMethod: 8, // deflated
              extract: vi.fn().mockReturnValue(new TextEncoder().encode('Deflated with compression'))
            }
          }
        ])
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const result = await archiveExtractor.extract(zipBuffer, 'zip');

      expect(result.files).toHaveLength(2);
      expect(result.compressionInfo).toEqual({
        methods: [0, 8],
        ratio: expect.any(Number)
      });
    });

    it('应该处理密码保护的ZIP文件', async () => {
      const zipBuffer = await createTestZip({
        'protected.txt': 'Secret content'
      }, {
        password: 'test123'
      });

      const mockArchive = {
        getFilesArray: vi.fn().mockImplementation(() => {
          throw new Error('Password required');
        })
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      await expect(archiveExtractor.extract(zipBuffer, 'zip'))
        .rejects.toThrow('Password required');

      // 使用密码重试
      const mockArchiveWithPassword = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'protected.txt',
              size: 14,
              extract: vi.fn().mockReturnValue(new TextEncoder().encode('Secret content'))
            }
          }
        ])
      };

      mockLibArchive.Archive.mockReturnValue(mockArchiveWithPassword);

      const result = await archiveExtractor.extract(zipBuffer, 'zip', { password: 'test123' });

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('protected.txt');
    });
  });

  describe('RAR格式集成', () => {
    it('应该解压RAR4文件', async () => {
      const rarBuffer = await createTestRar({
        'readme.txt': 'RAR4 content',
        'data/info.json': '{"version": "4.x"}'
      }, {
        version: '4.x'
      });

      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'readme.txt',
              size: 13,
              extract: vi.fn().mockReturnValue(new TextEncoder().encode('RAR4 content'))
            }
          },
          {
            file: null,
            name: 'data/',
            size: 0
          },
          {
            file: {
              name: 'data/info.json',
              size: 18,
              extract: vi.fn().mockReturnValue(new TextEncoder().encode('{"version": "4.x"}'))
            }
          }
        ])
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const result = await archiveExtractor.extract(rarBuffer, 'rar');

      expect(result.files).toHaveLength(3);
      expect(result.format).toBe('rar');
      expect(result.version).toBe('4.x');
    });

    it('应该解压RAR5文件', async () => {
      const rarBuffer = await createTestRar({
        'modern.txt': 'RAR5 content with better compression'
      }, {
        version: '5.x'
      });

      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'modern.txt',
              size: 35,
              extract: vi.fn().mockReturnValue(
                new TextEncoder().encode('RAR5 content with better compression')
              )
            }
          }
        ])
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const result = await archiveExtractor.extract(rarBuffer, 'rar');

      expect(result.files).toHaveLength(1);
      expect(result.version).toBe('5.x');
    });

    it('应该处理RAR分卷文件', async () => {
      const rarPart1 = await createTestRar({
        'large_file.bin': new Uint8Array(5 * 1024 * 1024) // 5MB
      }, {
        multivolume: true,
        partNumber: 1
      });

      const rarPart2 = await createTestRar({}, {
        multivolume: true,
        partNumber: 2
      });

      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'large_file.bin',
              size: 5 * 1024 * 1024,
              extract: vi.fn().mockReturnValue(new Uint8Array(5 * 1024 * 1024))
            }
          }
        ]),
        addVolume: vi.fn()
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      // 添加第二个分卷
      mockArchive.addVolume(rarPart2);

      const result = await archiveExtractor.extract(rarPart1, 'rar');

      expect(result.files).toHaveLength(1);
      expect(result.files[0].size).toBe(5 * 1024 * 1024);
      expect(mockArchive.addVolume).toHaveBeenCalledWith(rarPart2);
    });
  });

  describe('7Z格式集成', () => {
    it('应该解压7Z文件', async () => {
      const sevenZBuffer = await createTest7z({
        'compressed.txt': 'Highly compressed content',
        'binary.dat': new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xFF])
      });

      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'compressed.txt',
              size: 25,
              extract: vi.fn().mockReturnValue(
                new TextEncoder().encode('Highly compressed content')
              )
            }
          },
          {
            file: {
              name: 'binary.dat',
              size: 5,
              extract: vi.fn().mockReturnValue(
                new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xFF])
              )
            }
          }
        ])
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const result = await archiveExtractor.extract(sevenZBuffer, '7z');

      expect(result.files).toHaveLength(2);
      expect(result.format).toBe('7z');
    });

    it('应该处理7Z的高压缩比', async () => {
      const largeContent = 'A'.repeat(1024 * 1024); // 1MB of 'A's
      const sevenZBuffer = await createTest7z({
        'repetitive.txt': largeContent
      }, {
        compressionLevel: 'ultra' // 最高压缩
      });

      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'repetitive.txt',
              size: 1024 * 1024,
              compressedSize: 1024, // 高压缩比
              extract: vi.fn().mockReturnValue(new TextEncoder().encode(largeContent))
            }
          }
        ])
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const result = await archiveExtractor.extract(sevenZBuffer, '7z');

      expect(result.files[0].size).toBe(1024 * 1024);
      expect(result.compressionInfo.ratio).toBeGreaterThan(1000); // 1000:1 压缩比
    });
  });

  describe('错误处理', () => {
    it('应该处理损坏的压缩文件', async () => {
      const corruptedBuffer = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x00, 0x00]); // 不完整的ZIP头

      mockLibArchive.Archive.mockImplementation(() => {
        throw new Error('Invalid archive format');
      });

      await expect(archiveExtractor.extract(corruptedBuffer, 'zip'))
        .rejects.toThrow('Invalid archive format');
    });

    it('应该处理CRC校验失败', async () => {
      const zipBuffer = await createTestZip({
        'corrupted.txt': 'Original content'
      });

      // 模拟CRC错误
      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'corrupted.txt',
              size: 16,
              extract: vi.fn().mockImplementation(() => {
                throw new Error('CRC32 checksum mismatch');
              })
            }
          }
        ])
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const result = await archiveExtractor.extract(zipBuffer, 'zip');
      
      expect(result.files).toHaveLength(1);
      
      await expect(archiveExtractor.extractFile(result.files[0]))
        .rejects.toThrow('CRC32 checksum mismatch');
    });

    it('应该处理内存不足错误', async () => {
      const hugeZipBuffer = new Uint8Array(2 * 1024 * 1024 * 1024); // 2GB

      mockLibArchive.Archive.mockImplementation(() => {
        throw new Error('Out of memory');
      });

      await expect(archiveExtractor.extract(hugeZipBuffer, 'zip'))
        .rejects.toThrow('Out of memory');
    });
  });

  describe('性能测试', () => {
    it('应该高效处理大量小文件', async () => {
      const manyFilesZip = await createTestZip(
        Object.fromEntries(
          Array.from({ length: 10000 }, (_, i) => [`file${i}.txt`, `Content ${i}`])
        )
      );

      const mockFiles = Array.from({ length: 10000 }, (_, i) => ({
        file: {
          name: `file${i}.txt`,
          size: `Content ${i}`.length,
          extract: vi.fn().mockReturnValue(new TextEncoder().encode(`Content ${i}`))
        }
      }));

      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue(mockFiles)
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const startTime = performance.now();
      const result = await archiveExtractor.extract(manyFilesZip, 'zip');
      const endTime = performance.now();

      expect(result.files).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(5000); // 应该在5秒内完成
    });

    it('应该流式处理大文件', async () => {
      const largeFileZip = await createTestZip({
        'huge.bin': new Uint8Array(100 * 1024 * 1024) // 100MB
      });

      let extractProgress = 0;
      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'huge.bin',
              size: 100 * 1024 * 1024,
              extract: vi.fn().mockImplementation(() => {
                // 模拟流式提取
                return new Promise((resolve) => {
                  const interval = setInterval(() => {
                    extractProgress += 10;
                    if (extractProgress >= 100) {
                      clearInterval(interval);
                      resolve(new Uint8Array(100 * 1024 * 1024));
                    }
                  }, 100);
                });
              })
            }
          }
        ])
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const result = await archiveExtractor.extract(largeFileZip, 'zip');
      
      expect(result.files).toHaveLength(1);
      expect(result.files[0].size).toBe(100 * 1024 * 1024);
    });

    it('应该并行提取多个文件', async () => {
      const multiFileZip = await createTestZip({
        'file1.txt': 'Content 1',
        'file2.txt': 'Content 2',
        'file3.txt': 'Content 3',
        'file4.txt': 'Content 4'
      });

      const extractTimes: number[] = [];
      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'file1.txt',
              size: 9,
              extract: vi.fn().mockImplementation(() => {
                const start = Date.now();
                return new Promise(resolve => {
                  setTimeout(() => {
                    extractTimes.push(Date.now() - start);
                    resolve(new TextEncoder().encode('Content 1'));
                  }, 100);
                });
              })
            }
          },
          {
            file: {
              name: 'file2.txt',
              size: 9,
              extract: vi.fn().mockImplementation(() => {
                const start = Date.now();
                return new Promise(resolve => {
                  setTimeout(() => {
                    extractTimes.push(Date.now() - start);
                    resolve(new TextEncoder().encode('Content 2'));
                  }, 100);
                });
              })
            }
          },
          {
            file: {
              name: 'file3.txt',
              size: 9,
              extract: vi.fn().mockImplementation(() => {
                const start = Date.now();
                return new Promise(resolve => {
                  setTimeout(() => {
                    extractTimes.push(Date.now() - start);
                    resolve(new TextEncoder().encode('Content 3'));
                  }, 100);
                });
              })
            }
          },
          {
            file: {
              name: 'file4.txt',
              size: 9,
              extract: vi.fn().mockImplementation(() => {
                const start = Date.now();
                return new Promise(resolve => {
                  setTimeout(() => {
                    extractTimes.push(Date.now() - start);
                    resolve(new TextEncoder().encode('Content 4'));
                  }, 100);
                });
              })
            }
          }
        ])
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const result = await archiveExtractor.extract(multiFileZip, 'zip');
      
      // 并行提取所有文件
      const startTime = Date.now();
      await Promise.all(result.files.map(file => archiveExtractor.extractFile(file)));
      const totalTime = Date.now() - startTime;

      // 并行提取应该比串行快
      expect(totalTime).toBeLessThan(200); // 并行: ~100ms, 串行: ~400ms
    });
  });

  describe('内存管理', () => {
    it('应该在提取后释放内存', async () => {
      const zipBuffer = await createTestZip({
        'test.txt': 'Test content'
      });

      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue([
          {
            file: {
              name: 'test.txt',
              size: 12,
              extract: vi.fn().mockReturnValue(new TextEncoder().encode('Test content'))
            }
          }
        ]),
        close: vi.fn()
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      await archiveExtractor.extract(zipBuffer, 'zip');
      archiveExtractor.cleanup();

      expect(mockArchive.close).toHaveBeenCalled();
    });

    it('应该限制同时处理的文件数量', async () => {
      const maxConcurrent = 5;
      archiveExtractor.setMaxConcurrentExtractions(maxConcurrent);

      const manyFilesZip = await createTestZip(
        Object.fromEntries(
          Array.from({ length: 20 }, (_, i) => [`file${i}.txt`, `Content ${i}`])
        )
      );

      let currentExtractions = 0;
      let maxReached = 0;

      const mockFiles = Array.from({ length: 20 }, (_, i) => ({
        file: {
          name: `file${i}.txt`,
          size: `Content ${i}`.length,
          extract: vi.fn().mockImplementation(() => {
            currentExtractions++;
            maxReached = Math.max(maxReached, currentExtractions);
            
            return new Promise(resolve => {
              setTimeout(() => {
                currentExtractions--;
                resolve(new TextEncoder().encode(`Content ${i}`));
              }, 50);
            });
          })
        }
      }));

      const mockArchive = {
        getFilesArray: vi.fn().mockReturnValue(mockFiles)
      };

      mockLibArchive.Archive.mockReturnValue(mockArchive);

      const result = await archiveExtractor.extract(manyFilesZip, 'zip');
      await Promise.all(result.files.map(file => archiveExtractor.extractFile(file)));

      expect(maxReached).toBeLessThanOrEqual(maxConcurrent);
    });
  });
});