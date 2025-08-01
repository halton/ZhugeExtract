/**
 * 文件格式检测工具
 * 通过文件头字节序列识别压缩文件格式
 */

export interface FormatSignature {
  signature: Uint8Array;
  format: string;
  description: string;
  offset?: number;
}

// 压缩文件格式签名定义
const FORMAT_SIGNATURES: FormatSignature[] = [
  // ZIP格式
  {
    signature: new Uint8Array([0x50, 0x4B, 0x03, 0x04]),
    format: 'zip',
    description: 'ZIP Archive'
  },
  {
    signature: new Uint8Array([0x50, 0x4B, 0x05, 0x06]),
    format: 'zip',
    description: 'Empty ZIP Archive'
  },
  {
    signature: new Uint8Array([0x50, 0x4B, 0x07, 0x08]),
    format: 'zip',
    description: 'ZIP Archive (spanned)'
  },

  // RAR格式
  {
    signature: new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00]),
    format: 'rar',
    description: 'RAR Archive v1.5+'
  },
  {
    signature: new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00]),
    format: 'rar',
    description: 'RAR Archive v5.0+'
  },

  // 7Z格式
  {
    signature: new Uint8Array([0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C]),
    format: '7z',
    description: '7-Zip Archive'
  },

  // TAR格式
  {
    signature: new Uint8Array([0x75, 0x73, 0x74, 0x61, 0x72]),
    format: 'tar',
    description: 'TAR Archive',
    offset: 257
  },

  // GZIP格式
  {
    signature: new Uint8Array([0x1F, 0x8B]),
    format: 'gz',
    description: 'GZIP Archive'
  },

  // BZIP2格式
  {
    signature: new Uint8Array([0x42, 0x5A, 0x68]),
    format: 'bz2',
    description: 'BZIP2 Archive'
  },

  // XZ格式
  {
    signature: new Uint8Array([0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00]),
    format: 'xz',
    description: 'XZ Archive'
  }
];

export class FormatDetector {
  /**
   * 检测文件格式
   * @param data 文件数据（至少前512字节）
   * @returns 检测到的格式，未知格式返回'unknown'
   */
  static detect(data: Uint8Array): string {
    if (!data || data.length === 0) {
      return 'unknown';
    }

    for (const sig of FORMAT_SIGNATURES) {
      const offset = sig.offset || 0;
      
      if (data.length < offset + sig.signature.length) {
        continue;
      }

      let matches = true;
      for (let i = 0; i < sig.signature.length; i++) {
        if (data[offset + i] !== sig.signature[i]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        return sig.format;
      }
    }

    return 'unknown';
  }

  /**
   * 异步检测文件格式
   * @param file 文件对象
   * @returns Promise<string> 检测到的格式
   */
  static async detectFromFile(file: File): Promise<string> {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          resolve('unknown');
          return;
        }

        // 读取前512字节用于格式检测
        const data = new Uint8Array(arrayBuffer.slice(0, 512));
        const format = this.detect(data);
        resolve(format);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file for format detection'));
      };

      // 只读取前512字节
      const chunk = file.slice(0, 512);
      reader.readAsArrayBuffer(chunk);
    });
  }

  /**
   * 获取支持的格式列表
   * @returns 支持的格式数组
   */
  static getSupportedFormats(): string[] {
    const formats = new Set<string>();
    FORMAT_SIGNATURES.forEach(sig => formats.add(sig.format));
    return Array.from(formats);
  }

  /**
   * 检查格式是否受支持
   * @param format 格式名称
   * @returns 是否支持
   */
  static isFormatSupported(format: string): boolean {
    return this.getSupportedFormats().includes(format.toLowerCase());
  }

  /**
   * 获取格式的详细信息
   * @param format 格式名称
   * @returns 格式信息数组
   */
  static getFormatInfo(format: string): FormatSignature[] {
    return FORMAT_SIGNATURES.filter(sig => sig.format === format.toLowerCase());
  }

  /**
   * 验证文件扩展名与检测格式是否匹配
   * @param filename 文件名
   * @param detectedFormat 检测到的格式
   * @returns 是否匹配
   */
  static validateExtension(filename: string, detectedFormat: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (!ext) return false;

    const extensionMap: Record<string, string[]> = {
      'zip': ['zip', 'jar', 'war', 'ear'],
      'rar': ['rar'],
      '7z': ['7z'],
      'tar': ['tar'],
      'gz': ['gz', 'tgz'],
      'bz2': ['bz2', 'tbz2'],
      'xz': ['xz', 'txz']
    };

    const validExtensions = extensionMap[detectedFormat] || [];
    return validExtensions.includes(ext);
  }

  /**
   * 高级格式检测，包含更多检查
   * @param file 文件对象
   * @returns Promise<{format: string, confidence: number, info: string}>
   */
  static async advancedDetect(file: File): Promise<{
    format: string;
    confidence: number;
    info: string;
  }> {
    try {
      const format = await this.detectFromFile(file);
      
      if (format === 'unknown') {
        return {
          format: 'unknown',
          confidence: 0,
          info: 'Unable to detect file format'
        };
      }

      const extensionMatch = this.validateExtension(file.name, format);
      const confidence = extensionMatch ? 0.9 : 0.7;
      
      const formatInfo = this.getFormatInfo(format);
      const info = formatInfo.length > 0 ? formatInfo[0].description : format.toUpperCase();

      return {
        format,
        confidence,
        info: `${info}${extensionMatch ? '' : ' (extension mismatch)'}`
      };
    } catch (error) {
      return {
        format: 'unknown',
        confidence: 0,
        info: `Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}