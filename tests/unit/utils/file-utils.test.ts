import { describe, it, expect, vi } from 'vitest';
import { FileUtils } from '@/utils/file-utils';

describe('FileUtils', () => {
  describe('文件大小格式化', () => {
    const testCases = [
      { bytes: 0, expected: '0 B' },
      { bytes: 1023, expected: '1023 B' },
      { bytes: 1024, expected: '1.0 KB' },
      { bytes: 1536, expected: '1.5 KB' },
      { bytes: 1024 * 1024, expected: '1.0 MB' },
      { bytes: 1.5 * 1024 * 1024, expected: '1.5 MB' },
      { bytes: 1024 * 1024 * 1024, expected: '1.0 GB' },
      { bytes: 2.5 * 1024 * 1024 * 1024, expected: '2.5 GB' },
      { bytes: 1024 * 1024 * 1024 * 1024, expected: '1.0 TB' },
    ];

    testCases.forEach(({ bytes, expected }) => {
      it(`应该格式化 ${bytes} 字节为 ${expected}`, () => {
        expect(FileUtils.formatFileSize(bytes)).toBe(expected);
      });
    });

    it('应该处理负数', () => {
      expect(FileUtils.formatFileSize(-1024)).toBe('0 B');
    });

    it('应该处理NaN', () => {
      expect(FileUtils.formatFileSize(NaN)).toBe('0 B');
    });

    it('应该处理Infinity', () => {
      expect(FileUtils.formatFileSize(Infinity)).toBe('∞');
    });
  });

  describe('文件扩展名提取', () => {
    const testCases = [
      { filename: 'test.txt', expected: 'txt' },
      { filename: 'archive.tar.gz', expected: 'gz' },
      { filename: 'document.pdf', expected: 'pdf' },
      { filename: 'image.jpeg', expected: 'jpeg' },
      { filename: 'noextension', expected: '' },
      { filename: '.hidden', expected: '' },
      { filename: '.hidden.txt', expected: 'txt' },
      { filename: 'file.with.dots.zip', expected: 'zip' },
      { filename: '', expected: '' },
    ];

    testCases.forEach(({ filename, expected }) => {
      it(`应该从 "${filename}" 提取扩展名 "${expected}"`, () => {
        expect(FileUtils.getFileExtension(filename)).toBe(expected);
      });
    });
  });

  describe('文件名清理', () => {
    const testCases = [
      { input: 'normal-file.txt', expected: 'normal-file.txt' },
      { input: 'file with spaces.txt', expected: 'file with spaces.txt' },
      { input: 'file<with>invalid:chars.txt', expected: 'file_with_invalid_chars.txt' },
      { input: 'file|with"quotes.txt', expected: 'file_with_quotes.txt' },
      { input: 'file*with?wildcards.txt', expected: 'file_with_wildcards.txt' },
      { input: '../../../dangerous.txt', expected: '______dangerous.txt' },
      { input: 'file\nwith\nnewlines.txt', expected: 'file_with_newlines.txt' },
      { input: 'very-long-filename-that-exceeds-normal-limits-and-should-be-truncated-to-reasonable-length.txt', expected: 'very-long-filename-that-exceeds-normal-limits-and-should-be-truncated-to-reason.txt' },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`应该清理文件名 "${input}" 为 "${expected}"`, () => {
        expect(FileUtils.sanitizeFileName(input)).toBe(expected);
      });
    });

    it('应该处理空文件名', () => {
      expect(FileUtils.sanitizeFileName('')).toBe('untitled');
    });

    it('应该处理只有非法字符的文件名', () => {
      expect(FileUtils.sanitizeFileName('<>:"/?*')).toBe('untitled');
    });
  });

  describe('路径操作', () => {
    describe('路径拼接', () => {
      const testCases = [
        { parts: ['folder', 'file.txt'], expected: 'folder/file.txt' },
        { parts: ['folder/', 'file.txt'], expected: 'folder/file.txt' },
        { parts: ['folder', '/file.txt'], expected: 'folder/file.txt' },
        { parts: ['folder/', '/file.txt'], expected: 'folder/file.txt' },
        { parts: ['', 'file.txt'], expected: 'file.txt' },
        { parts: ['folder', ''], expected: 'folder/' },
        { parts: ['a', 'b', 'c', 'd.txt'], expected: 'a/b/c/d.txt' },
      ];

      testCases.forEach(({ parts, expected }) => {
        it(`应该拼接路径 [${parts.join(', ')}] 为 "${expected}"`, () => {
          expect(FileUtils.joinPath(...parts)).toBe(expected);
        });
      });
    });

    describe('路径解析', () => {
      const testCases = [
        { 
          path: 'folder/subfolder/file.txt', 
          expected: { dir: 'folder/subfolder', name: 'file.txt', ext: 'txt' }
        },
        { 
          path: 'file.txt', 
          expected: { dir: '', name: 'file.txt', ext: 'txt' }
        },
        { 
          path: 'folder/file', 
          expected: { dir: 'folder', name: 'file', ext: '' }
        },
        { 
          path: 'folder/', 
          expected: { dir: 'folder', name: '', ext: '' }
        },
      ];

      testCases.forEach(({ path, expected }) => {
        it(`应该解析路径 "${path}"`, () => {
          expect(FileUtils.parsePath(path)).toEqual(expected);
        });
      });
    });
  });

  describe('文件类型检测', () => {
    it('应该检测文本文件', () => {
      const textExtensions = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts'];
      textExtensions.forEach(ext => {
        expect(FileUtils.isTextFile(`file.${ext}`)).toBe(true);
      });
    });

    it('应该检测图片文件', () => {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
      imageExtensions.forEach(ext => {
        expect(FileUtils.isImageFile(`image.${ext}`)).toBe(true);
      });
    });

    it('应该检测视频文件', () => {
      const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'];
      videoExtensions.forEach(ext => {
        expect(FileUtils.isVideoFile(`video.${ext}`)).toBe(true);
      });
    });

    it('应该检测音频文件', () => {
      const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
      audioExtensions.forEach(ext => {
        expect(FileUtils.isAudioFile(`audio.${ext}`)).toBe(true);
      });
    });

    it('应该检测压缩文件', () => {
      const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
      archiveExtensions.forEach(ext => {
        expect(FileUtils.isArchiveFile(`archive.${ext}`)).toBe(true);
      });
    });
  });

  describe('文件读取', () => {
    it('应该读取文件为ArrayBuffer', async () => {
      const mockFile = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
      const buffer = await FileUtils.readFileAsArrayBuffer(mockFile);
      
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBe(11);
    });

    it('应该读取文件为文本', async () => {
      const mockFile = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
      const text = await FileUtils.readFileAsText(mockFile);
      
      expect(text).toBe('Hello World');
    });

    it('应该读取文件为Base64', async () => {
      const mockFile = new File(['Hello'], 'test.txt', { type: 'text/plain' });
      const base64 = await FileUtils.readFileAsBase64(mockFile);
      
      expect(base64).toMatch(/^data:text\/plain;base64,/);
    });

    it('应该读取文件头部', async () => {
      const content = new Uint8Array([0x50, 0x4B, 0x03, 0x04, 0x00, 0x01, 0x02, 0x03]);
      const mockFile = new File([content], 'test.zip');
      
      const header = await FileUtils.readFileHeader(mockFile, 4);
      
      expect(header).toEqual(new Uint8Array([0x50, 0x4B, 0x03, 0x04]));
    });

    it('应该处理文件读取错误', async () => {
      const invalidFile = null as any;
      
      await expect(FileUtils.readFileAsText(invalidFile)).rejects.toThrow();
    });
  });

  describe('文件验证', () => {
    it('应该验证文件大小', () => {
      const smallFile = new File(['content'], 'small.txt');
      const maxSize = 1024 * 1024; // 1MB
      
      expect(FileUtils.validateFileSize(smallFile, maxSize)).toBe(true);
    });

    it('应该拒绝过大文件', () => {
      const largeContent = new Array(1024 * 1024 + 1).fill('a').join('');
      const largeFile = new File([largeContent], 'large.txt');
      const maxSize = 1024 * 1024; // 1MB
      
      expect(FileUtils.validateFileSize(largeFile, maxSize)).toBe(false);
    });

    it('应该验证文件类型', () => {
      const allowedTypes = ['text/plain', 'application/json'];
      const validFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/octet-stream' });
      
      expect(FileUtils.validateFileType(validFile, allowedTypes)).toBe(true);
      expect(FileUtils.validateFileType(invalidFile, allowedTypes)).toBe(false);
    });

    it('应该验证文件扩展名', () => {
      const allowedExtensions = ['txt', 'json', 'md'];
      
      expect(FileUtils.validateFileExtension('test.txt', allowedExtensions)).toBe(true);
      expect(FileUtils.validateFileExtension('test.exe', allowedExtensions)).toBe(false);
    });
  });

  describe('URL和Blob操作', () => {
    it('应该创建和撤销对象URL', () => {
      const mockFile = new File(['content'], 'test.txt');
      const url = FileUtils.createObjectURL(mockFile);
      
      expect(url).toMatch(/^blob:/);
      
      // 撤销URL（不会抛出错误）
      expect(() => FileUtils.revokeObjectURL(url)).not.toThrow();
    });

    it('应该从Base64创建Blob', () => {
      const base64 = 'SGVsbG8gV29ybGQ='; // "Hello World"
      const blob = FileUtils.base64ToBlob(base64, 'text/plain');
      
      expect(blob.size).toBe(11);
      expect(blob.type).toBe('text/plain');
    });

    it('应该下载Blob为文件', () => {
      const mockBlob = new Blob(['content'], { type: 'text/plain' });
      const filename = 'test.txt';
      
      // 模拟DOM元素
      const mockA = {
        href: '',
        download: '',
        click: vi.fn(),
        style: { display: '' }
      };
      
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockA as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockA as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockA as any);
      
      FileUtils.downloadBlob(mockBlob, filename);
      
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockA.download).toBe(filename);
      expect(mockA.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockA);
      expect(removeChildSpy).toHaveBeenCalledWith(mockA);
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('性能测试', () => {
    it('应该快速处理文件大小格式化', () => {
      const startTime = performance.now();
      
      // 执行1000次格式化
      for (let i = 0; i < 1000; i++) {
        FileUtils.formatFileSize(Math.random() * 1024 * 1024 * 1024);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(50); // 应该在50ms内完成
    });

    it('应该快速处理文件名清理', () => {
      const dirtyFilenames = [
        'file<with>invalid:chars.txt',
        'file|with"quotes.txt',
        '../../../dangerous.txt',
        'file*with?wildcards.txt'
      ];
      
      const startTime = performance.now();
      
      // 执行1000次清理
      for (let i = 0; i < 1000; i++) {
        const filename = dirtyFilenames[i % dirtyFilenames.length];
        FileUtils.sanitizeFileName(filename);
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(100); // 应该在100ms内完成
    });
  });
});