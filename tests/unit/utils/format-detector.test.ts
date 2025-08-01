import { describe, it, expect } from 'vitest';
import { FormatDetector } from '@/utils/format-detector';

describe('FormatDetector', () => {
  describe('压缩格式检测', () => {
    const testCases = [
      {
        name: 'ZIP格式',
        signatures: [
          new Uint8Array([0x50, 0x4B, 0x03, 0x04]), // 标准ZIP
          new Uint8Array([0x50, 0x4B, 0x05, 0x06]), // 空ZIP
          new Uint8Array([0x50, 0x4B, 0x07, 0x08]), // ZIP with data descriptor
        ],
        expected: 'zip'
      },
      {
        name: 'RAR格式',
        signatures: [
          new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]), // RAR 1.5-4.x
          new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00]), // RAR 5.x
        ],
        expected: 'rar'
      },
      {
        name: '7Z格式',
        signatures: [
          new Uint8Array([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C]), // 7-Zip
        ],
        expected: '7z'
      },
      {
        name: 'TAR格式',
        signatures: [
          new Uint8Array([0x75, 0x73, 0x74, 0x61, 0x72, 0x00, 0x30, 0x30]), // POSIX tar
          new Uint8Array([0x75, 0x73, 0x74, 0x61, 0x72, 0x20, 0x20, 0x00]), // GNU tar
        ],
        expected: 'tar'
      },
      {
        name: 'GZIP格式',
        signatures: [
          new Uint8Array([0x1F, 0x8B, 0x08]), // GZIP
        ],
        expected: 'gz'
      },
      {
        name: 'BZIP2格式',
        signatures: [
          new Uint8Array([0x42, 0x5A, 0x68]), // BZIP2
        ],
        expected: 'bz2'
      }
    ];

    testCases.forEach(({ name, signatures, expected }) => {
      signatures.forEach((signature, index) => {
        it(`应该正确检测${name} - 变体${index + 1}`, () => {
          const result = FormatDetector.detect(signature);
          expect(result).toBe(expected);
        });
      });
    });
  });

  describe('边界情况处理', () => {
    it('应该处理未知格式', () => {
      const unknownSignature = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
      const result = FormatDetector.detect(unknownSignature);
      expect(result).toBe('unknown');
    });

    it('应该处理空文件', () => {
      const emptySignature = new Uint8Array([]);
      const result = FormatDetector.detect(emptySignature);
      expect(result).toBe('unknown');
    });

    it('应该处理过短的签名', () => {
      const shortSignature = new Uint8Array([0x50]);
      const result = FormatDetector.detect(shortSignature);
      expect(result).toBe('unknown');
    });

    it('应该处理null输入', () => {
      const result = FormatDetector.detect(null as any);
      expect(result).toBe('unknown');
    });

    it('应该处理undefined输入', () => {
      const result = FormatDetector.detect(undefined as any);
      expect(result).toBe('unknown');
    });
  });

  describe('版本检测', () => {
    it('应该检测RAR版本', () => {
      const rar4Signature = new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]);
      const rar5Signature = new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00]);
      
      expect(FormatDetector.detectRarVersion(rar4Signature)).toBe('4.x');
      expect(FormatDetector.detectRarVersion(rar5Signature)).toBe('5.x');
    });

    it('应该检测ZIP版本特征', () => {
      const zipLocalFile = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
      const zipCentralDir = new Uint8Array([0x50, 0x4B, 0x01, 0x02]);
      
      expect(FormatDetector.getZipType(zipLocalFile)).toBe('local_file');
      expect(FormatDetector.getZipType(zipCentralDir)).toBe('central_directory');
    });
  });

  describe('MIME类型推断', () => {
    it('应该从文件扩展名推断MIME类型', () => {
      const testCases = [
        { filename: 'test.zip', expected: 'application/zip' },
        { filename: 'test.rar', expected: 'application/x-rar-compressed' },
        { filename: 'test.7z', expected: 'application/x-7z-compressed' },
        { filename: 'test.tar.gz', expected: 'application/gzip' },
        { filename: 'test.tar.bz2', expected: 'application/x-bzip2' },
      ];

      testCases.forEach(({ filename, expected }) => {
        const result = FormatDetector.getMimeType(filename);
        expect(result).toBe(expected);
      });
    });

    it('应该处理无扩展名文件', () => {
      const result = FormatDetector.getMimeType('filename');
      expect(result).toBe('application/octet-stream');
    });

    it('应该处理多重扩展名', () => {
      const result = FormatDetector.getMimeType('archive.tar.gz');
      expect(result).toBe('application/gzip');
    });
  });

  describe('性能测试', () => {
    it('应该快速检测格式（<1毫秒）', () => {
      const signature = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
      const startTime = performance.now();
      
      // 执行1000次检测
      for (let i = 0; i < 1000; i++) {
        FormatDetector.detect(signature);
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 1000;
      
      expect(avgTime).toBeLessThan(1); // 平均每次检测应少于1毫秒
    });
  });
});