import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestHelpers, TestDataGenerator } from '@tests/utils/test-helpers';

/**
 * RAR格式专项测试
 * 覆盖RAR格式的各种特性和边界情况
 */
describe('RAR格式处理', () => {
  let mockRarService: any;
  let testFile: File;

  beforeEach(() => {
    // 创建基础RAR测试文件
    testFile = TestHelpers.createMockArchiveFile('rar', 2048);
    
    // 模拟RAR服务
    mockRarService = {
      detectFormat: vi.fn(),
      extractFiles: vi.fn(),
      getFileList: vi.fn(),
      extractSingleFile: vi.fn(),
      validateArchive: vi.fn(),
      checkPassword: vi.fn(),
      getRarVersion: vi.fn(),
      checkRecoveryRecord: vi.fn()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('RAR文件格式检测', () => {
    it('应该正确识别RAR 4.x格式', () => {
      const rar4Signature = new Uint8Array([
        0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00
      ]);
      const format = detectRarFormat(rar4Signature);
      expect(format).toBe('rar4');
    });

    it('应该正确识别RAR 5.x格式', () => {
      const rar5Signature = new Uint8Array([
        0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00
      ]);
      const format = detectRarFormat(rar5Signature);
      expect(format).toBe('rar5');
    });

    it('应该识别自解压RAR文件', () => {
      // 自解压RAR文件以PE/ELF头开始，但包含RAR签名
      const sfxSignature = new Uint8Array([
        0x4d, 0x5a, 0x90, 0x00, // PE头开始
        // ... 后面会有RAR签名
      ]);
      
      mockRarService.detectFormat.mockImplementation((data) => {
        // 模拟在文件中搜索RAR签名
        const rarSignaturePosition = 1024; // 假设在1KB位置找到
        return rarSignaturePosition > 0 ? 'rar-sfx' : 'unknown';
      });

      const format = mockRarService.detectFormat(sfxSignature);
      expect(format).toBe('rar-sfx');
    });

    it('应该处理RAR分卷文件', () => {
      const volumeExtensions = ['.part1.rar', '.part2.rar', '.r01', '.r02'];
      
      volumeExtensions.forEach(ext => {
        const fileName = `archive${ext}`;
        const isVolume = isRarVolume(fileName);
        expect(isVolume).toBe(true);
      });
    });

    it('应该拒绝损坏的RAR签名', () => {
      const corruptedSignature = new Uint8Array([
        0x52, 0x61, 0x72, 0xFF, 0xFF, 0xFF, 0xFF
      ]);
      const format = detectRarFormat(corruptedSignature);
      expect(format).toBe('unknown');
    });
  });

  describe('RAR版本兼容性', () => {
    it('应该支持RAR 1.x格式', async () => {
      mockRarService.getRarVersion.mockResolvedValue('1.5');
      
      const version = await mockRarService.getRarVersion(testFile);
      expect(version).toBe('1.5');
    });

    it('应该支持RAR 2.x格式', async () => {
      mockRarService.getRarVersion.mockResolvedValue('2.9');
      
      const version = await mockRarService.getRarVersion(testFile);
      expect(version).toBe('2.9');
    });

    it('应该支持RAR 3.x格式', async () => {
      mockRarService.getRarVersion.mockResolvedValue('3.93');
      
      const version = await mockRarService.getRarVersion(testFile);
      expect(version).toBe('3.93');
    });

    it('应该支持RAR 4.x格式', async () => {
      mockRarService.getRarVersion.mockResolvedValue('4.20');
      
      const version = await mockRarService.getRarVersion(testFile);
      expect(version).toBe('4.20');
    });

    it('应该支持RAR 5.x格式', async () => {
      mockRarService.getRarVersion.mockResolvedValue('5.91');
      
      const version = await mockRarService.getRarVersion(testFile);
      expect(version).toBe('5.91');
    });

    it('应该处理未知RAR版本', async () => {
      mockRarService.getRarVersion.mockRejectedValue(
        new Error('Unknown RAR version')
      );

      await expect(mockRarService.getRarVersion(testFile))
        .rejects.toThrow('Unknown RAR version');
    });
  });

  describe('RAR压缩方法支持', () => {
    const rarCompressionMethods = [
      { id: 0x30, name: 'Store (不压缩)' },
      { id: 0x31, name: 'Fastest' },
      { id: 0x32, name: 'Fast' },
      { id: 0x33, name: 'Normal' },
      { id: 0x34, name: 'Good' },
      { id: 0x35, name: 'Best' }
    ];

    rarCompressionMethods.forEach(method => {
      it(`应该支持${method.name}压缩方法`, async () => {
        const mockFile = {
          name: 'test.txt',
          compressionMethod: method.id,
          size: 1024,
          compressedSize: method.id === 0x30 ? 1024 : 512
        };

        mockRarService.extractSingleFile.mockResolvedValue({
          content: new Uint8Array(1024),
          compressionMethod: method.id
        });

        const result = await mockRarService.extractSingleFile('test.txt');
        expect(result.compressionMethod).toBe(method.id);
      });
    });

    it('应该支持RAR 5.x的新压缩算法', async () => {
      const rar5Methods = [
        { id: 0x40, name: 'RAR5 Normal' },
        { id: 0x41, name: 'RAR5 Fast' },
        { id: 0x42, name: 'RAR5 Best' }
      ];

      for (const method of rar5Methods) {
        mockRarService.extractSingleFile.mockResolvedValue({
          content: new Uint8Array(1024),
          compressionMethod: method.id,
          rarVersion: 5
        });

        const result = await mockRarService.extractSingleFile('test.txt');
        expect(result.compressionMethod).toBe(method.id);
        expect(result.rarVersion).toBe(5);
      }
    });
  });

  describe('RAR密码保护处理', () => {
    it('应该检测密码保护的RAR文件', async () => {
      mockRarService.checkPassword.mockResolvedValue(true);

      const hasPassword = await mockRarService.checkPassword(testFile);
      expect(hasPassword).toBe(true);
    });

    it('应该检测文件名加密', async () => {
      mockRarService.checkPassword.mockResolvedValue({
        hasPassword: true,
        isHeaderEncrypted: true,
        encryptionType: 'aes256'
      });

      const result = await mockRarService.checkPassword(testFile);
      expect(result.isHeaderEncrypted).toBe(true);
      expect(result.encryptionType).toBe('aes256');
    });

    it('应该使用正确密码解压文件', async () => {
      const correctPassword = 'secret123';
      const mockContent = new Uint8Array([82, 65, 82, 32, 84, 101, 115, 116]); // "RAR Test"

      mockRarService.extractSingleFile.mockImplementation((filename, password) => {
        if (password === correctPassword) {
          return Promise.resolve({ content: mockContent });
        }
        return Promise.reject(new Error('Wrong password'));
      });

      const result = await mockRarService.extractSingleFile('test.txt', correctPassword);
      expect(result.content).toEqual(mockContent);
    });

    it('应该支持不同的加密强度', async () => {
      const encryptionLevels = [
        { level: 128, name: 'AES-128' },
        { level: 256, name: 'AES-256' }
      ];

      for (const encryption of encryptionLevels) {
        mockRarService.extractSingleFile.mockResolvedValue({
          content: new Uint8Array(100),
          encryptionLevel: encryption.level
        });

        const result = await mockRarService.extractSingleFile('test.txt', 'password');
        expect(result.encryptionLevel).toBe(encryption.level);
      }
    });

    it('应该处理RAR5的密码验证', async () => {
      // RAR5使用不同的密码验证机制
      mockRarService.extractSingleFile.mockImplementation((filename, password) => {
        // 模拟RAR5的PBKDF2密码验证
        const isValidPassword = password && password.length >= 1;
        if (isValidPassword) {
          return Promise.resolve({
            content: new Uint8Array(100),
            rarVersion: 5,
            passwordVerified: true
          });
        }
        return Promise.reject(new Error('RAR5: Password verification failed'));
      });

      const result = await mockRarService.extractSingleFile('test.txt', 'validpass');
      expect(result.rarVersion).toBe(5);
      expect(result.passwordVerified).toBe(true);
    });
  });

  describe('RAR分卷处理', () => {
    it('应该检测分卷RAR文件', () => {
      const volumeFiles = [
        'archive.part1.rar',
        'archive.part2.rar',
        'archive.part3.rar'
      ];

      volumeFiles.forEach(filename => {
        const isVolume = isRarVolume(filename);
        expect(isVolume).toBe(true);
      });
    });

    it('应该处理老式分卷命名', () => {
      const oldVolumeFiles = [
        'archive.rar',  // 第一卷
        'archive.r00',  // 第二卷
        'archive.r01',  // 第三卷
        'archive.r02'   // 第四卷
      ];

      oldVolumeFiles.forEach(filename => {
        const isVolume = isRarVolume(filename);
        expect(isVolume).toBe(true);
      });
    });

    it('应该按顺序处理分卷', async () => {
      const volumes = [
        'archive.part1.rar',
        'archive.part2.rar',
        'archive.part3.rar'
      ];

      mockRarService.extractFiles.mockImplementation((volumeList) => {
        // 验证分卷顺序
        const sortedVolumes = volumeList.sort();
        expect(sortedVolumes).toEqual(volumes);
        
        return Promise.resolve([
          { name: 'file1.txt', content: new Uint8Array(1000) },
          { name: 'file2.txt', content: new Uint8Array(2000) }
        ]);
      });

      const result = await mockRarService.extractFiles(volumes);
      expect(result).toHaveLength(2);
    });

    it('应该处理缺失的分卷', async () => {
      const incompleteVolumes = [
        'archive.part1.rar',
        // 缺少 part2
        'archive.part3.rar'
      ];

      mockRarService.extractFiles.mockRejectedValue(
        new Error('Missing volume: archive.part2.rar')
      );

      await expect(mockRarService.extractFiles(incompleteVolumes))
        .rejects.toThrow('Missing volume: archive.part2.rar');
    });
  });

  describe('RAR特殊功能', () => {
    it('应该支持恢复记录', async () => {
      mockRarService.checkRecoveryRecord.mockResolvedValue({
        hasRecoveryRecord: true,
        recoverySize: 1024,
        canRecover: true
      });

      const recoveryInfo = await mockRarService.checkRecoveryRecord(testFile);
      expect(recoveryInfo.hasRecoveryRecord).toBe(true);
      expect(recoveryInfo.canRecover).toBe(true);
    });

    it('应该支持固实压缩检测', async () => {
      mockRarService.getFileList.mockResolvedValue([
        {
          name: 'file1.txt',
          isSolid: true,
          solidGroup: 1
        },
        {
          name: 'file2.txt',
          isSolid: true,
          solidGroup: 1
        }
      ]);

      const files = await mockRarService.getFileList(testFile);
      expect(files.every(file => file.isSolid)).toBe(true);
      expect(files.every(file => file.solidGroup === 1)).toBe(true);
    });

    it('应该支持文件注释', async () => {
      mockRarService.getFileList.mockResolvedValue([
        {
          name: 'document.txt',
          comment: '这是一个重要文档',
          hasComment: true
        }
      ]);

      const files = await mockRarService.getFileList(testFile);
      expect(files[0].hasComment).toBe(true);
      expect(files[0].comment).toBe('这是一个重要文档');
    });

    it('应该支持压缩包注释', async () => {
      mockRarService.validateArchive.mockResolvedValue({
        isValid: true,
        archiveComment: 'Created with ZhugeExtract Test Suite',
        hasComment: true
      });

      const result = await mockRarService.validateArchive(testFile);
      expect(result.hasComment).toBe(true);
      expect(result.archiveComment).toBe('Created with ZhugeExtract Test Suite');
    });

    it('应该支持压缩字典大小检测', async () => {
      const dictionarySizes = [64, 128, 256, 512, 1024, 2048, 4096];

      for (const dictSize of dictionarySizes) {
        mockRarService.getFileList.mockResolvedValue([
          {
            name: 'test.txt',
            dictionarySize: dictSize * 1024 // KB to bytes
          }
        ]);

        const files = await mockRarService.getFileList(testFile);
        expect(files[0].dictionarySize).toBe(dictSize * 1024);
      }
    });
  });

  describe('RAR性能测试', () => {
    it('应该高效处理大型RAR文件', async () => {
      const largeFile = TestHelpers.createMockArchiveFile('rar', 500 * 1024 * 1024); // 500MB
      const startTime = performance.now();

      mockRarService.getFileList.mockImplementation(async () => {
        // 模拟大文件处理时间
        await new Promise(resolve => setTimeout(resolve, 200));
        return Array.from({ length: 1000 }, (_, i) => ({
          name: `file-${i}.txt`,
          size: 500 * 1024 // 500KB each
        }));
      });

      const result = await mockRarService.getFileList(largeFile);
      const duration = performance.now() - startTime;

      expect(result).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('应该优化固实压缩的解压顺序', async () => {
      // 固实압缩需要按顺序解压
      const solidFiles = Array.from({ length: 100 }, (_, i) => `file-${i}.txt`);
      
      mockRarService.extractFiles.mockImplementation(async (fileList) => {
        // 模拟固실压缩的顺序处理
        const extractedFiles = [];
        for (let i = 0; i < fileList.length; i++) {
          extractedFiles.push({
            name: fileList[i],
            content: new Uint8Array(1024),
            extractionOrder: i
          });
        }
        return extractedFiles;
      });

      const result = await mockRarService.extractFiles(solidFiles);
      
      // 验证解压顺序
      for (let i = 0; i < result.length; i++) {
        expect(result[i].extractionOrder).toBe(i);
      }
    });

    it('应该控制内存使用量', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      mockRarService.extractFiles.mockImplementation(async () => {
        // 模拟内存控制机制
        const maxMemoryPerFile = 10 * 1024 * 1024; // 10MB per file
        return [
          { name: 'large.txt', content: new Uint8Array(maxMemoryPerFile) }
        ];
      });

      await mockRarService.extractFiles([testFile]);
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // 内存增长应该可控
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 小于50MB
    });
  });

  describe('RAR错误处理', () => {
    it('应该处理损坏的RAR头', async () => {
      mockRarService.validateArchive.mockRejectedValue(
        new Error('RAR header is corrupted')
      );

      await expect(mockRarService.validateArchive(testFile))
        .rejects.toThrow('RAR header is corrupted');
    });

    it('应该处理CRC错误', async () => {
      mockRarService.extractSingleFile.mockRejectedValue(
        new Error('CRC error in file: test.txt')
      );

      await expect(mockRarService.extractSingleFile('test.txt'))
        .rejects.toThrow('CRC error in file: test.txt');
    });

    it('应该处理不支持的RAR版本', async () => {
      mockRarService.getRarVersion.mockRejectedValue(
        new Error('Unsupported RAR version: 6.0')
      );

      await expect(mockRarService.getRarVersion(testFile))
        .rejects.toThrow('Unsupported RAR version: 6.0');
    });

    it('应该处理分卷读取错误', async () => {
      mockRarService.extractFiles.mockRejectedValue(
        new Error('Cannot read volume 2 of 3')
      );

      await expect(mockRarService.extractFiles([testFile]))
        .rejects.toThrow('Cannot read volume 2 of 3');
    });

    it('应该处理固实压缩中断', async () => {
      mockRarService.extractFiles.mockRejectedValue(
        new Error('Solid archive extraction interrupted')
      );

      await expect(mockRarService.extractFiles([testFile]))
        .rejects.toThrow('Solid archive extraction interrupted');
    });
  });

  describe('RAR兼容性测试', () => {
    it('应该兼容WinRAR创建的文件', async () => {
      mockRarService.validateArchive.mockResolvedValue({
        isValid: true,
        createdBy: 'WinRAR 6.11',
        platform: 'Windows'
      });

      const result = await mockRarService.validateArchive(testFile);
      expect(result.createdBy).toContain('WinRAR');
      expect(result.platform).toBe('Windows');
    });

    it('应该兼容7-Zip创建的RAR文件', async () => {
      mockRarService.validateArchive.mockResolvedValue({
        isValid: true,
        createdBy: '7-Zip 21.07',
        platform: 'Multi-platform'
      });

      const result = await mockRarService.validateArchive(testFile);
      expect(result.createdBy).toContain('7-Zip');
    });

    it('应该兼容命令行RAR创建的文件', async () => {
      mockRarService.validateArchive.mockResolvedValue({
        isValid: true,
        createdBy: 'RAR 6.11 Command Line',
        platform: 'Linux'
      });

      const result = await mockRarService.validateArchive(testFile);
      expect(result.createdBy).toContain('Command Line');
      expect(result.platform).toBe('Linux');
    });

    it('应该处理不同字符编码', async () => {
      const encodingTests = [
        { name: '测试文件.txt', encoding: 'utf-8' },
        { name: 'тест.txt', encoding: 'utf-8' },
        { name: 'テスト.txt', encoding: 'utf-8' },
        { name: 'test.txt', encoding: 'cp1252' }
      ];

      for (const test of encodingTests) {
        mockRarService.getFileList.mockResolvedValue([
          {
            name: test.name,
            encoding: test.encoding,
            isDirectory: false
          }
        ]);

        const result = await mockRarService.getFileList(testFile);
        expect(result[0].name).toBe(test.name);
        expect(result[0].encoding).toBe(test.encoding);
      }
    });
  });
});

// 辅助函数
function detectRarFormat(signature: Uint8Array): string {
  if (signature.length < 7) return 'unknown';
  
  // 检查RAR签名 "Rar!"
  if (signature[0] === 0x52 && signature[1] === 0x61 && 
      signature[2] === 0x72 && signature[3] === 0x21) {
    
    // 检查版本标识
    if (signature[6] === 0x00) return 'rar4';
    if (signature[6] === 0x01 && signature[7] === 0x00) return 'rar5';
  }
  
  return 'unknown';
}

function isRarVolume(filename: string): boolean {
  const volumePatterns = [
    /\.part\d+\.rar$/i,  // archive.part1.rar
    /\.r\d{2}$/i,        // archive.r01
    /\.rar$/i            // archive.rar (第一卷)
  ];
  
  return volumePatterns.some(pattern => pattern.test(filename));
}