import { TestFileGenerator } from './file-generator';

/**
 * ZIP和RAR格式专用测试数据生成器
 * 提供更真实和复杂的测试场景
 */
export class ZipRarTestData {
  
  // 生成标准ZIP文件数据
  static generateStandardZip(): ArrayBuffer {
    const zipData = new ArrayBuffer(1024);
    const view = new Uint8Array(zipData);
    
    // ZIP文件头
    const header = [
      // Local file header signature
      0x50, 0x4b, 0x03, 0x04,
      // Version needed to extract
      0x14, 0x00,
      // General purpose bit flag
      0x00, 0x00,
      // Compression method (deflate)
      0x08, 0x00,
      // File last modification time
      0x00, 0x00,
      // File last modification date
      0x00, 0x21,
      // CRC-32
      0x12, 0x34, 0x56, 0x78,
      // Compressed size
      0x16, 0x00, 0x00, 0x00,
      // Uncompressed size
      0x16, 0x00, 0x00, 0x00,
      // File name length
      0x08, 0x00,
      // Extra field length
      0x00, 0x00
    ];
    
    header.forEach((byte, index) => {
      view[index] = byte;
    });
    
    // 文件名 "test.txt"
    const fileName = new TextEncoder().encode('test.txt');
    fileName.forEach((byte, index) => {
      view[header.length + index] = byte;
    });
    
    // 压缩数据 (简化)
    const compressedData = [
      0x2b, 0x49, 0x2d, 0x2e, 0x51, 0x48, 0x49, 0x2c,
      0x49, 0x04, 0x00, 0x2d, 0x49, 0x2d, 0x2e, 0x51,
      0x48, 0x49, 0x2c, 0x49, 0x04, 0x00
    ];
    
    compressedData.forEach((byte, index) => {
      view[header.length + fileName.length + index] = byte;
    });
    
    return zipData;
  }

  // 生成密码保护的ZIP文件数据
  static generatePasswordProtectedZip(): ArrayBuffer {
    const zipData = new ArrayBuffer(2048);
    const view = new Uint8Array(zipData);
    
    // 带加密标志的ZIP头
    const encryptedHeader = [
      0x50, 0x4b, 0x03, 0x04, // 签名
      0x14, 0x00,             // 版本
      0x01, 0x00,             // 加密标志 (bit 0 set)
      0x08, 0x00,             // 压缩方法
      0x00, 0x00, 0x00, 0x21, // 时间戳
      0x00, 0x00, 0x00, 0x00, // CRC32 (0 for encrypted)
      0x20, 0x00, 0x00, 0x00, // 压缩大小
      0x16, 0x00, 0x00, 0x00, // 原始大小
      0x0c, 0x00,             // 文件名长度
      0x00, 0x00              // 额外字段长度
    ];
    
    encryptedHeader.forEach((byte, index) => {
      view[index] = byte;
    });
    
    // 文件名 (加密文件)
    const fileName = new TextEncoder().encode('secret.txt');
    fileName.forEach((byte, index) => {
      view[encryptedHeader.length + index] = byte;
    });
    
    // 加密的数据 (模拟)
    const encryptedData = new Uint8Array(32);
    for (let i = 0; i < encryptedData.length; i++) {
      encryptedData[i] = Math.floor(Math.random() * 256);
    }
    
    encryptedData.forEach((byte, index) => {
      view[encryptedHeader.length + fileName.length + index] = byte;
    });
    
    return zipData.slice(0, encryptedHeader.length + fileName.length + encryptedData.length);
  }

  // 生成多文件ZIP测试数据
  static generateMultiFileZip(): ArrayBuffer {
    const files = [
      { name: 'readme.txt', content: 'Welcome to ZhugeExtract!' },
      { name: 'image.jpg', content: 'JPEG_MOCK_DATA' },
      { name: 'document.pdf', content: 'PDF_MOCK_DATA' },
      { name: 'folder/', content: '', isDirectory: true }
    ];
    
    const zipData = new ArrayBuffer(8192);
    const view = new Uint8Array(zipData);
    let offset = 0;
    
    files.forEach(file => {
      // Local file header
      const header = [
        0x50, 0x4b, 0x03, 0x04, // 签名
        0x14, 0x00,             // 版本
        0x00, 0x00,             // 标志
        file.isDirectory ? 0x00 : 0x08, 0x00, // 压缩方法
        0x00, 0x00, 0x00, 0x21, // 时间戳
        0x12, 0x34, 0x56, 0x78, // CRC32
        file.content.length, 0x00, 0x00, 0x00, // 压缩大小
        file.content.length, 0x00, 0x00, 0x00, // 原始大小
        file.name.length, 0x00, // 文件名长度
        0x00, 0x00              // 额外字段长度
      ];
      
      // 写入头部
      header.forEach((byte, i) => {
        view[offset + i] = byte;
      });
      offset += header.length;
      
      // 写入文件名
      const nameBytes = new TextEncoder().encode(file.name);
      nameBytes.forEach((byte, i) => {
        view[offset + i] = byte;
      });
      offset += nameBytes.length;
      
      // 写入文件内容
      if (!file.isDirectory) {
        const contentBytes = new TextEncoder().encode(file.content);
        contentBytes.forEach((byte, i) => {
          view[offset + i] = byte;
        });
        offset += contentBytes.length;
      }
    });
    
    return zipData.slice(0, offset);
  }

  // 生成标准RAR文件数据
  static generateStandardRar(): ArrayBuffer {
    const rarData = new ArrayBuffer(2048);
    const view = new Uint8Array(rarData);
    
    // RAR 5.x 签名和头部
    const rar5Header = [
      // RAR signature
      0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00,
      // Archive header
      0x01, 0x00, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      // File header starts here
      0x02, 0x00, 0x0d, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x08, 0x00, 0x00, 0x00, 0x74, 0x65, 0x73, 0x74,
      0x2e, 0x74, 0x78, 0x74
    ];
    
    rar5Header.forEach((byte, index) => {
      view[index] = byte;
    });
    
    // 文件数据
    const fileData = new TextEncoder().encode('RAR test content');
    fileData.forEach((byte, index) => {
      view[rar5Header.length + index] = byte;
    });
    
    return rarData.slice(0, rar5Header.length + fileData.length);
  }

  // 生成密码保护的RAR文件数据
  static generatePasswordProtectedRar(): ArrayBuffer {
    const rarData = new ArrayBuffer(3072);
    const view = new Uint8Array(rarData);
    
    // RAR 5.x 加密头
    const encryptedRarHeader = [
      // RAR signature
      0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00,
      // Archive header with encryption
      0x01, 0x00, 0x09, 0x00, 0x80, 0x00, 0x00, 0x00, // 0x80 = encrypted
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      // Encryption info
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
      // Encrypted file header
      0x02, 0x00, 0x15, 0x00, 0x80, 0x00, 0x00, 0x00
    ];
    
    encryptedRarHeader.forEach((byte, index) => {
      view[index] = byte;
    });
    
    // 加密的文件数据
    const encryptedData = new Uint8Array(256);
    for (let i = 0; i < encryptedData.length; i++) {
      encryptedData[i] = Math.floor(Math.random() * 256);
    }
    
    encryptedData.forEach((byte, index) => {
      view[encryptedRarHeader.length + index] = byte;
    });
    
    return rarData.slice(0, encryptedRarHeader.length + encryptedData.length);
  }

  // 生成RAR分卷文件数据
  static generateRarVolumes(): ArrayBuffer[] {
    const volumes = [];
    
    // 第一卷 (part1.rar)
    const volume1 = new ArrayBuffer(1024);
    const view1 = new Uint8Array(volume1);
    
    const vol1Header = [
      0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00, // RAR signature
      0x01, 0x00, 0x09, 0x00, 0x01, 0x00, 0x00, 0x00, // Archive header (volume flag)
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ];
    
    vol1Header.forEach((byte, index) => {
      view1[index] = byte;
    });
    volumes.push(volume1);
    
    // 第二卷 (part2.rar)
    const volume2 = new ArrayBuffer(1024);
    const view2 = new Uint8Array(volume2);
    
    const vol2Header = [
      0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00, // RAR signature
      0x01, 0x00, 0x09, 0x00, 0x02, 0x00, 0x00, 0x00, // Archive header (volume 2)
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ];
    
    vol2Header.forEach((byte, index) => {
      view2[index] = byte;
    });
    volumes.push(volume2);
    
    // 最后一卷 (part3.rar)
    const volume3 = new ArrayBuffer(1024);
    const view3 = new Uint8Array(volume3);
    
    const vol3Header = [
      0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00, // RAR signature
      0x01, 0x00, 0x09, 0x00, 0x04, 0x00, 0x00, 0x00, // Archive header (last volume flag)
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ];
    
    vol3Header.forEach((byte, index) => {
      view3[index] = byte;
    });
    volumes.push(volume3);
    
    return volumes;
  }

  // 生成损坏的ZIP文件
  static generateCorruptedZip(): ArrayBuffer {
    const corruptedZip = new ArrayBuffer(512);
    const view = new Uint8Array(corruptedZip);
    
    // 部分ZIP签名
    view[0] = 0x50;
    view[1] = 0x4b;
    view[2] = 0x03;
    view[3] = 0x04;
    
    // 损坏的头部数据
    for (let i = 4; i < 50; i++) {
      view[i] = 0xFF; // 无效数据
    }
    
    // 随机数据填充
    for (let i = 50; i < 512; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
    
    return corruptedZip;
  }

  // 生成损坏的RAR文件
  static generateCorruptedRar(): ArrayBuffer {
    const corruptedRar = new ArrayBuffer(1024);
    const view = new Uint8Array(corruptedRar);
    
    // RAR签名 (正确)
    const signature = [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00];
    signature.forEach((byte, index) => {
      view[index] = byte;
    });
    
    // 损坏的头部
    for (let i = 8; i < 64; i++) {
      view[i] = 0x00; // 无效的头部数据
    }
    
    // 随机损坏数据
    for (let i = 64; i < 1024; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
    
    return corruptedRar;
  }

  // 生成带恢复记录的RAR文件
  static generateRarWithRecovery(): ArrayBuffer {
    const rarData = new ArrayBuffer(4096);
    const view = new Uint8Array(rarData);
    
    // 标准RAR头
    const rarHeader = [
      0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00,
      0x01, 0x00, 0x0d, 0x00, 0x20, 0x00, 0x00, 0x00, // 0x20 = recovery record flag
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ];
    
    rarHeader.forEach((byte, index) => {
      view[index] = byte;
    });
    
    // 恢复记录头
    const recoveryHeader = [
      0x78, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, // Recovery record header
      0x01, 0x00, 0x00, 0x00 // Recovery sectors
    ];
    
    recoveryHeader.forEach((byte, index) => {
      view[rarHeader.length + index] = byte;
    });
    
    // 恢复数据 (1KB)
    const recoveryData = new Uint8Array(1024);
    for (let i = 0; i < recoveryData.length; i++) {
      recoveryData[i] = i % 256; // 模式数据
    }
    
    recoveryData.forEach((byte, index) => {
      view[rarHeader.length + recoveryHeader.length + index] = byte;
    });
    
    return rarData.slice(0, rarHeader.length + recoveryHeader.length + recoveryData.length);
  }

  // 生成固实压缩RAR文件
  static generateSolidRar(): ArrayBuffer {
    const solidRar = new ArrayBuffer(3072);
    const view = new Uint8Array(solidRar);
    
    // RAR签名
    const signature = [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00];
    signature.forEach((byte, index) => {
      view[index] = byte;
    });
    
    // 档案头 (固实标志)
    const archiveHeader = [
      0x01, 0x00, 0x09, 0x00, 0x08, 0x00, 0x00, 0x00, // 0x08 = solid flag
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ];
    
    archiveHeader.forEach((byte, index) => {
      view[signature.length + index] = byte;
    });
    
    // 文件头1 (固实文件)
    const file1Header = [
      0x02, 0x00, 0x15, 0x00, 0x88, 0x00, 0x00, 0x00, // 0x88 = solid + compressed
      0x0a, 0x00, 0x00, 0x00, // 文件大小
      0x66, 0x69, 0x6c, 0x65, 0x31, 0x2e, 0x74, 0x78, 0x74, 0x00 // "file1.txt"
    ];
    
    file1Header.forEach((byte, index) => {
      view[signature.length + archiveHeader.length + index] = byte;
    });
    
    return solidRar.slice(0, signature.length + archiveHeader.length + file1Header.length);
  }

  // 生成测试文件集合
  static generateTestFileSet(): {
    zipFiles: { name: string; data: ArrayBuffer }[];
    rarFiles: { name: string; data: ArrayBuffer }[];
  } {
    return {
      zipFiles: [
        { name: 'standard.zip', data: this.generateStandardZip() },
        { name: 'password-protected.zip', data: this.generatePasswordProtectedZip() },
        { name: 'multi-file.zip', data: this.generateMultiFileZip() },
        { name: 'corrupted.zip', data: this.generateCorruptedZip() }
      ],
      rarFiles: [
        { name: 'standard.rar', data: this.generateStandardRar() },
        { name: 'password-protected.rar', data: this.generatePasswordProtectedRar() },
        { name: 'with-recovery.rar', data: this.generateRarWithRecovery() },
        { name: 'solid.rar', data: this.generateSolidRar() },
        { name: 'corrupted.rar', data: this.generateCorruptedRar() }
      ]
    };
  }

  // 创建压缩测试场景
  static createCompressionScenarios(): Array<{
    name: string;
    format: 'zip' | 'rar';
    data: ArrayBuffer;
    expectedBehavior: string;
    testParams: Record<string, any>;
  }> {
    return [
      {
        name: 'ZIP最佳压缩比测试',
        format: 'zip',
        data: this.generateStandardZip(),
        expectedBehavior: 'high_compression_ratio',
        testParams: { expectedRatio: 0.7, maxTime: 1000 }
      },
      {
        name: 'RAR固实压缩性能测试',
        format: 'rar',
        data: this.generateSolidRar(),
        expectedBehavior: 'solid_compression_efficiency',
        testParams: { sequential: true, maxMemory: 50 * 1024 * 1024 }
      },
      {
        name: 'ZIP密码破解防护测试',
        format: 'zip',
        data: this.generatePasswordProtectedZip(),
        expectedBehavior: 'password_protection',
        testParams: { attempts: 3, lockoutTime: 1000 }
      },
      {
        name: 'RAR恢复记录功能测试',
        format: 'rar',
        data: this.generateRarWithRecovery(),
        expectedBehavior: 'error_recovery',
        testParams: { recoverySuccess: true, maxRecoveryTime: 5000 }
      }
    ];
  }
}

// 导出便捷的测试数据访问器
export const zipTestData = {
  standard: () => ZipRarTestData.generateStandardZip(),
  passwordProtected: () => ZipRarTestData.generatePasswordProtectedZip(),
  multiFile: () => ZipRarTestData.generateMultiFileZip(),
  corrupted: () => ZipRarTestData.generateCorruptedZip()
};

export const rarTestData = {
  standard: () => ZipRarTestData.generateStandardRar(),
  passwordProtected: () => ZipRarTestData.generatePasswordProtectedRar(),
  volumes: () => ZipRarTestData.generateRarVolumes(),
  withRecovery: () => ZipRarTestData.generateRarWithRecovery(),
  solid: () => ZipRarTestData.generateSolidRar(),
  corrupted: () => ZipRarTestData.generateCorruptedRar()
};