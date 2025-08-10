import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

/**
 * 测试文件生成器
 * 用于生成各种格式的测试文件和压缩包
 */
export class TestFileGenerator {
  private static readonly OUTPUT_DIR = path.resolve('tests/fixtures');

  // 确保输出目录存在
  static ensureOutputDir() {
    if (!fs.existsSync(this.OUTPUT_DIR)) {
      fs.mkdirSync(this.OUTPUT_DIR, { recursive: true });
    }
  }

  // 生成文本文件
  static generateTextFile(fileName: string, content: string): string {
    this.ensureOutputDir();
    const filePath = path.join(this.OUTPUT_DIR, fileName);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }

  // 生成二进制文件 - 内存优化版本
  static generateBinaryFile(fileName: string, size: number): string {
    this.ensureOutputDir();
    const filePath = path.join(this.OUTPUT_DIR, fileName);
    
    // 使用流式写入，避免创建大Buffer
    const fd = fs.openSync(filePath, 'w');
    const chunkSize = Math.min(8192, size); // 8KB chunks
    const chunk = Buffer.alloc(chunkSize);
    
    try {
      let written = 0;
      while (written < size) {
        const currentChunkSize = Math.min(chunkSize, size - written);
        
        // 只填充实际需要的字节数
        for (let i = 0; i < currentChunkSize; i++) {
          chunk[i] = Math.floor(Math.random() * 256);
        }
        
        fs.writeSync(fd, chunk, 0, currentChunkSize);
        written += currentChunkSize;
      }
    } finally {
      fs.closeSync(fd);
    }
    
    return filePath;
  }

  // 生成ZIP文件签名
  static generateZipFile(fileName: string = 'test.zip'): string {
    this.ensureOutputDir();
    const filePath = path.join(this.OUTPUT_DIR, fileName);
    
    // 简单的ZIP文件结构
    const zipData = Buffer.from([
      // Local file header
      0x50, 0x4b, 0x03, 0x04, // 签名
      0x14, 0x00,             // 版本
      0x00, 0x00,             // 标志
      0x08, 0x00,             // 压缩方法
      0x00, 0x00, 0x00, 0x00, // 时间戳
      0x00, 0x00, 0x00, 0x00, // CRC32
      0x00, 0x00, 0x00, 0x00, // 压缩大小
      0x00, 0x00, 0x00, 0x00, // 未压缩大小
      0x08, 0x00,             // 文件名长度
      0x00, 0x00,             // 扩展字段长度
      // 文件名
      0x74, 0x65, 0x73, 0x74, 0x2e, 0x74, 0x78, 0x74, // "test.txt"
      
      // Central directory
      0x50, 0x4b, 0x01, 0x02, // 签名
      0x14, 0x00,             // 创建版本
      0x14, 0x00,             // 提取版本
      0x00, 0x00,             // 标志
      0x08, 0x00,             // 压缩方法
      0x00, 0x00, 0x00, 0x00, // 时间戳
      0x00, 0x00, 0x00, 0x00, // CRC32
      0x00, 0x00, 0x00, 0x00, // 压缩大小
      0x00, 0x00, 0x00, 0x00, // 未压缩大小
      0x08, 0x00,             // 文件名长度
      0x00, 0x00,             // 扩展字段长度
      0x00, 0x00,             // 注释长度
      0x00, 0x00,             // 磁盘号
      0x00, 0x00,             // 内部属性
      0x00, 0x00, 0x00, 0x00, // 外部属性
      0x00, 0x00, 0x00, 0x00, // 本地头偏移
      // 文件名
      0x74, 0x65, 0x73, 0x74, 0x2e, 0x74, 0x78, 0x74, // "test.txt"
      
      // End of central directory
      0x50, 0x4b, 0x05, 0x06, // 签名
      0x00, 0x00,             // 磁盘号
      0x00, 0x00,             // 中央目录磁盘号
      0x01, 0x00,             // 本磁盘条目数
      0x01, 0x00,             // 总条目数
      0x2e, 0x00, 0x00, 0x00, // 中央目录大小
      0x18, 0x00, 0x00, 0x00, // 中央目录偏移
      0x00, 0x00              // 注释长度
    ]);
    
    fs.writeFileSync(filePath, zipData);
    return filePath;
  }

  // 生成RAR文件签名
  static generateRarFile(fileName: string = 'test.rar'): string {
    this.ensureOutputDir();
    const filePath = path.join(this.OUTPUT_DIR, fileName);
    
    // RAR文件签名
    const rarData = Buffer.from([
      0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00, // RAR签名
      0x33, 0x92, 0xb5, 0xe6, 0xea, 0x1a, 0x01, 0x00, // 文件头
      0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 数据
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    fs.writeFileSync(filePath, rarData);
    return filePath;
  }

  // 生成7Z文件签名
  static generate7zFile(fileName: string = 'test.7z'): string {
    this.ensureOutputDir();
    const filePath = path.join(this.OUTPUT_DIR, fileName);
    
    // 7Z文件签名
    const sevenZData = Buffer.from([
      0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c, 0x00, 0x04, // 7Z签名
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // 空数据块
      0x00, 0x00, 0x00, 0x00, 0x17, 0x06, 0x01, 0x01,
      0x09, 0x80, 0x00, 0x07, 0x0b, 0x01, 0x00, 0x01
    ]);
    
    fs.writeFileSync(filePath, sevenZData);
    return filePath;
  }

  // 生成TAR文件
  static generateTarFile(fileName: string = 'test.tar'): string {
    this.ensureOutputDir();
    const filePath = path.join(this.OUTPUT_DIR, fileName);
    
    // TAR文件头 (512字节)
    const tarHeader = Buffer.alloc(512);
    
    // 文件名
    const testFileName = 'test.txt';
    tarHeader.write(testFileName, 0, 100);
    
    // 文件模式 (8进制)
    tarHeader.write('0000644', 100, 8);
    
    // 用户/组ID
    tarHeader.write('0000000', 108, 8);
    tarHeader.write('0000000', 116, 8);
    
    // 文件大小 (8进制)
    tarHeader.write('0000000', 124, 12);
    
    // 修改时间
    tarHeader.write('00000000000', 136, 12);
    
    // 校验和占位符
    tarHeader.write('        ', 148, 8);
    
    // 文件类型
    tarHeader.write('0', 156, 1);
    
    // ustar标识
    tarHeader.write('ustar', 257, 6);
    tarHeader.write('00', 263, 2);
    
    // 计算校验和
    let checksum = 0;
    for (let i = 0; i < 512; i++) {
      checksum += tarHeader[i];
    }
    
    // 写入校验和
    const checksumStr = `${checksum.toString(8).padStart(6, '0')  }\0 `;
    tarHeader.write(checksumStr, 148, 8);
    
    fs.writeFileSync(filePath, tarHeader);
    return filePath;
  }

  // 生成GZIP文件
  static generateGzipFile(fileName: string = 'test.gz'): string {
    this.ensureOutputDir();
    const filePath = path.join(this.OUTPUT_DIR, fileName);
    
    // GZIP文件头
    const gzipData = Buffer.from([
      0x1f, 0x8b,             // GZIP签名
      0x08,                   // 压缩方法 (deflate)
      0x00,                   // 标志
      0x00, 0x00, 0x00, 0x00, // 时间戳
      0x00,                   // 额外标志
      0xff,                   // 操作系统
      // 压缩数据 (空deflate块)
      0x03, 0x00,
      0x00, 0x00, 0x00, 0x00, // CRC32
      0x00, 0x00, 0x00, 0x00  // 原始大小
    ]);
    
    fs.writeFileSync(filePath, gzipData);
    return filePath;
  }

  // 生成密码保护的ZIP文件模拟
  static generatePasswordProtectedZip(fileName: string = 'password-protected.zip'): string {
    this.ensureOutputDir();
    const filePath = path.join(this.OUTPUT_DIR, fileName);
    
    // 带密码保护标志的ZIP文件
    const zipData = Buffer.from([
      // Local file header with encryption flag
      0x50, 0x4b, 0x03, 0x04, // 签名
      0x14, 0x00,             // 版本
      0x01, 0x00,             // 标志 (加密)
      0x08, 0x00,             // 压缩方法
      0x00, 0x00, 0x00, 0x00, // 时间戳
      0x00, 0x00, 0x00, 0x00, // CRC32
      0x0c, 0x00, 0x00, 0x00, // 压缩大小
      0x00, 0x00, 0x00, 0x00, // 未压缩大小
      0x08, 0x00,             // 文件名长度
      0x00, 0x00,             // 扩展字段长度
      // 文件名
      0x74, 0x65, 0x73, 0x74, 0x2e, 0x74, 0x78, 0x74, // "test.txt"
      // 加密数据
      0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
      0x11, 0x22, 0x33, 0x44,
      
      // Central directory entry
      0x50, 0x4b, 0x01, 0x02,
      0x14, 0x00, 0x14, 0x00,
      0x01, 0x00, 0x08, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x0c, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x08, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
      0x20, 0x00, 0x00, 0x00,
      0x74, 0x65, 0x73, 0x74, 0x2e, 0x74, 0x78, 0x74,
      
      // End of central directory
      0x50, 0x4b, 0x05, 0x06,
      0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00,
      0x36, 0x00, 0x00, 0x00,
      0x20, 0x00, 0x00, 0x00,
      0x00, 0x00
    ]);
    
    fs.writeFileSync(filePath, zipData);
    return filePath;
  }

  // 生成损坏的压缩文件
  static generateCorruptedFile(fileName: string = 'corrupted.zip'): string {
    this.ensureOutputDir();
    const filePath = path.join(this.OUTPUT_DIR, fileName);
    
    // 不完整的ZIP文件头
    const corruptedData = Buffer.from([
      0x50, 0x4b, 0x03, 0x04, // ZIP签名
      0x14, 0x00, 0x00, 0x00, // 部分头信息
      0x08, 0x00, 0xFF, 0xFF, // 损坏的数据
      // 缺少必要的结构...
    ]);
    
    fs.writeFileSync(filePath, corruptedData);
    return filePath;
  }

  // 生成大文件用于性能测试
  static generateLargeFile(fileName: string, sizeMB: number): string {
    this.ensureOutputDir();
    const filePath = path.join(this.OUTPUT_DIR, fileName);
    const chunkSize = 1024 * 1024; // 1MB chunks
    const fd = fs.openSync(filePath, 'w');
    
    try {
      for (let i = 0; i < sizeMB; i++) {
        const chunk = Buffer.alloc(chunkSize);
        // 填充重复模式以便压缩
        const pattern = Buffer.from(`CHUNK-${i.toString().padStart(6, '0')}-`);
        for (let j = 0; j < chunkSize; j += pattern.length) {
          pattern.copy(chunk, j, 0, Math.min(pattern.length, chunkSize - j));
        }
        fs.writeSync(fd, chunk);
      }
    } finally {
      fs.closeSync(fd);
    }
    
    return filePath;
  }

  // 生成测试文件清单
  static generateTestFileManifest() {
    const manifest = {
      generated: new Date().toISOString(),
      files: {
        basic: {
          'test.zip': this.generateZipFile(),
          'test.rar': this.generateRarFile(),
          'test.7z': this.generate7zFile(),
          'test.tar': this.generateTarFile(),
          'test.gz': this.generateGzipFile()
        },
        special: {
          'password-protected.zip': this.generatePasswordProtectedZip(),
          'corrupted.zip': this.generateCorruptedFile(),
          'empty.txt': this.generateTextFile('empty.txt', ''),
          'sample.txt': this.generateTextFile('sample.txt', 'Hello, ZhugeExtract!')
        },
        binary: {
          'small.bin': this.generateBinaryFile('small.bin', 1024),
          'medium.bin': this.generateBinaryFile('medium.bin', 1024 * 1024)
        }
      }
    };

    // 保存清单文件
    const manifestPath = path.join(this.OUTPUT_DIR, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('✅ 测试文件生成完成，清单保存至:', manifestPath);
    return manifest;
  }

  // 计算文件哈希
  static calculateFileHash(filePath: string): string {
    const content = fs.readFileSync(filePath);
    return createHash('sha256').update(content).digest('hex');
  }

  // 清理生成的文件
  static cleanup() {
    if (fs.existsSync(this.OUTPUT_DIR)) {
      fs.rmSync(this.OUTPUT_DIR, { recursive: true, force: true });
      console.log('🧹 测试文件已清理');
    }
  }
}

// 如果作为脚本直接运行
if (require.main === module) {
  console.log('🏗️ 开始生成测试文件...');
  TestFileGenerator.generateTestFileManifest();
}