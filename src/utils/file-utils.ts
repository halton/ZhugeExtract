/**
 * 文件处理工具
 * 提供文件操作、验证和处理的通用功能
 */

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  path?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SecurityScanResult {
  isSafe: boolean;
  threats: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export class FileUtils {
  // 危险文件扩展名列表
  private static readonly DANGEROUS_EXTENSIONS = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
    'msi', 'dll', 'sys', 'app', 'deb', 'pkg', 'dmg', 'sh'
  ];

  // 最大文件名长度
  private static readonly MAX_FILENAME_LENGTH = 255;

  // 非法文件名字符
  private static readonly ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/;

  /**
   * 获取文件扩展名
   * @param filename 文件名
   * @returns 扩展名（小写，不含点）
   */
  static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === filename.length - 1) {
      return '';
    }
    return filename.substring(lastDot + 1).toLowerCase();
  }

  /**
   * 获取不含扩展名的文件名
   * @param filename 文件名
   * @returns 基础文件名
   */
  static getBaseName(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    const lastSlash = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
    
    const start = lastSlash + 1;
    const end = lastDot === -1 ? filename.length : lastDot;
    
    return filename.substring(start, end);
  }

  /**
   * 读取文件为Base64
   * @param file 文件对象
   * @returns Promise<string>
   */
  static readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as Base64'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * 读取文件头部字节
   * @param file 文件对象
   * @param length 读取长度，默认16字节
   * @returns Promise<Uint8Array>
   */
  static async readFileHeader(file: File, length: number = 16): Promise<Uint8Array> {
    const slice = file.slice(0, length);
    const buffer = await this.readFileAsArrayBuffer(slice as File);
    return new Uint8Array(buffer);
  }

  /**
   * 验证文件大小
   * @param file 文件对象
   * @param maxSize 最大大小（字节）
   * @param minSize 最小大小（字节）
   * @returns boolean
   */
  static validateFileSize(file: File, maxSize?: number, minSize?: number): boolean {
    if (minSize !== undefined && file.size < minSize) {
      return false;
    }
    if (maxSize !== undefined && file.size > maxSize) {
      return false;
    }
    return true;
  }

  /**
   * 验证文件类型
   * @param file 文件对象
   * @param allowedTypes 允许的MIME类型数组
   * @returns boolean
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * 验证文件扩展名
   * @param filename 文件名
   * @param allowedExtensions 允许的扩展名数组
   * @returns boolean
   */
  static validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
    const ext = this.getFileExtension(filename);
    return allowedExtensions.includes(ext);
  }

  /**
   * 创建对象URL
   * @param file 文件或Blob对象
   * @returns string
   */
  static createObjectURL(file: File | Blob): string {
    return URL.createObjectURL(file);
  }

  /**
   * 从Base64创建Blob
   * @param base64 Base64字符串
   * @param mimeType MIME类型
   * @returns Blob
   */
  static base64ToBlob(base64: string, mimeType: string = 'application/octet-stream'): Blob {
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * 下载Blob为文件
   * @param blob Blob对象
   * @param filename 文件名
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = this.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 清理文件名，移除非法字符
   * @param filename 原始文件名
   * @returns 清理后的文件名
   */
  static sanitizeFileName(filename: string): string {
    return this.sanitizeFilename(filename);
  }

  /**
   * 清理文件名，移除非法字符
   * @param filename 原始文件名
   * @returns 清理后的文件名
   */
  static sanitizeFilename(filename: string): string {
    // 移除非法字符
    let clean = filename.replace(this.ILLEGAL_FILENAME_CHARS, '_');
    
    // 移除首尾空格和点
    clean = clean.trim().replace(/^\.+|\.+$/g, '');
    
    // 如果只包含非法字符，返回默认名称
    if (!clean || clean.replace(/_/g, '').length === 0) {
      return 'untitled';
    }
    
    // 限制长度
    if (clean.length > this.MAX_FILENAME_LENGTH) {
      const ext = this.getFileExtension(filename);
      const maxBaseName = this.MAX_FILENAME_LENGTH - ext.length - 1;
      const baseName = this.getBaseName(clean).substring(0, maxBaseName);
      clean = ext ? `${baseName}.${ext}` : baseName;
    }
    
    return clean;
  }

  /**
   * 验证文件名是否合法
   * @param filename 文件名
   * @returns 验证结果
   */
  static validateFilename(filename: string): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!filename || filename.trim().length === 0) {
      errors.push('文件名不能为空');
      return { isValid: false, errors, warnings };
    }

    // 检查长度
    if (filename.length > this.MAX_FILENAME_LENGTH) {
      errors.push(`文件名过长 (最大${this.MAX_FILENAME_LENGTH}字符)`);
    }

    // 检查非法字符
    if (this.ILLEGAL_FILENAME_CHARS.test(filename)) {
      errors.push('文件名包含非法字符');
    }

    // 检查是否以点开头或结尾
    if (filename.startsWith('.') || filename.endsWith('.')) {
      warnings.push('文件名不应以点开头或结尾');
    }

    // 检查危险扩展名
    const ext = this.getFileExtension(filename);
    if (this.DANGEROUS_EXTENSIONS.includes(ext)) {
      warnings.push(`文件扩展名 "${ext}" 可能存在安全风险`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 检查文件是否为压缩文件
   * @param filename 文件名或file对象
   * @returns 是否为压缩文件
   */
  static isArchiveFile(filename: string | File): boolean {
    const name = typeof filename === 'string' ? filename : filename.name;
    const ext = this.getFileExtension(name);
    
    const archiveExtensions = [
      'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'lzma',
      'tgz', 'tbz2', 'txz', 'jar', 'war', 'ear'
    ];
    
    return archiveExtensions.includes(ext);
  }

  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @param precision 精度，默认2位小数
   * @returns 格式化的大小字符串
   */
  static formatFileSize(bytes: number, precision: number = 2): string {
    if (bytes === 0) {return '0 B';}
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(precision)} ${units[i]}`;
  }

  /**
   * 读取文件为ArrayBuffer
   * @param file 文件对象
   * @returns Promise<ArrayBuffer>
   */
  static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result;
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 读取文件为文本
   * @param file 文件对象
   * @param encoding 编码格式，默认UTF-8
   * @returns Promise<string>
   */
  static readFileAsText(file: File, encoding: string = 'UTF-8'): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };
      
      reader.readAsText(file, encoding);
    });
  }

  /**
   * 检查文件MIME类型
   * @param file 文件对象
   * @returns 实际MIME类型
   */
  static async detectMimeType(file: File): Promise<string> {
    // 简单的MIME类型检测基于文件头
    const buffer = await this.readFileAsArrayBuffer(file.slice(0, 16) as File);
    const bytes = new Uint8Array(buffer);
    
    // ZIP文件
    if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
      return 'application/zip';
    }
    
    // RAR文件
    if (bytes[0] === 0x52 && bytes[1] === 0x61 && bytes[2] === 0x72) {
      return 'application/x-rar-compressed';
    }
    
    // 7Z文件
    if (bytes[0] === 0x37 && bytes[1] === 0x7A && bytes[2] === 0xBC && bytes[3] === 0xAF) {
      return 'application/x-7z-compressed';
    }
    
    // GZIP文件
    if (bytes[0] === 0x1F && bytes[1] === 0x8B) {
      return 'application/gzip';
    }
    
    // 回退到文件声明的类型
    return file.type || 'application/octet-stream';
  }

  /**
   * 安全扫描文件
   * @param file 文件对象
   * @returns Promise<SecurityScanResult>
   */
  static async securityScan(file: File): Promise<SecurityScanResult> {
    const threats: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // 检查文件扩展名
    const ext = this.getFileExtension(file.name);
    if (this.DANGEROUS_EXTENSIONS.includes(ext)) {
      threats.push(`Dangerous file extension: ${ext}`);
      riskLevel = 'high';
    }

    // 检查文件大小异常
    if (file.size === 0) {
      threats.push('Empty file');
      riskLevel = 'medium';
    } else if (file.size > 5 * 1024 * 1024 * 1024) { // 5GB
      threats.push('Unusually large file size');
      riskLevel = 'medium';
    }

    // 检查文件名异常
    const filenameValidation = this.validateFilename(file.name);
    if (!filenameValidation.isValid) {
      threats.push('Invalid filename characters');
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    }

    // 检查MIME类型不匹配
    try {
      const detectedMime = await this.detectMimeType(file);
      if (file.type && file.type !== detectedMime && file.type !== 'application/octet-stream') {
        threats.push('MIME type mismatch');
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      }
    } catch (error) {
      threats.push('Failed to verify file type');
      riskLevel = 'medium';
    }

    // 检查文件名长度攻击
    if (file.name.length > 200) {
      threats.push('Filename too long (potential overflow attack)');
      riskLevel = 'medium';
    }

    // 检查路径遍历攻击模式
    if (file.name.includes('../') || file.name.includes('..\\')) {
      threats.push('Path traversal attack pattern detected');
      riskLevel = 'high';
    }

    return {
      isSafe: threats.length === 0,
      threats,
      riskLevel
    };
  }

  /**
   * 计算文件哈希值（简单版本）
   * @param file 文件对象
   * @returns Promise<string> 哈希值
   */
  static async calculateSimpleHash(file: File): Promise<string> {
    const buffer = await this.readFileAsArrayBuffer(file);
    const bytes = new Uint8Array(buffer);
    
    let hash = 0;
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) - hash + bytes[i]) & 0xffffffff;
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * 验证文件完整性
   * @param file 文件对象
   * @param expectedSize 期望大小（可选）
   * @param expectedHash 期望哈希值（可选）
   * @returns Promise<boolean>
   */
  static async validateFileIntegrity(
    file: File, 
    expectedSize?: number, 
    expectedHash?: string
  ): Promise<boolean> {
    try {
      if (expectedSize !== undefined && file.size !== expectedSize) {
        return false;
      }
      
      if (expectedHash !== undefined) {
        const actualHash = await this.calculateSimpleHash(file);
        if (actualHash !== expectedHash) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 创建文件信息对象
   * @param file 文件对象
   * @returns FileInfo
   */
  static createFileInfo(file: File): FileInfo {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  }

  /**
   * 比较两个文件是否相同
   * @param file1 文件1
   * @param file2 文件2
   * @returns Promise<boolean>
   */
  static async compareFiles(file1: File, file2: File): Promise<boolean> {
    if (file1.size !== file2.size) {
      return false;
    }
    
    if (file1.name === file2.name && file1.lastModified === file2.lastModified) {
      return true;
    }
    
    try {
      const [hash1, hash2] = await Promise.all([
        this.calculateSimpleHash(file1),
        this.calculateSimpleHash(file2)
      ]);
      
      return hash1 === hash2;
    } catch (error) {
      return false;
    }
  }

  // === 路径操作函数 ===

  /**
   * 拼接路径
   * @param paths 路径片段
   * @returns 拼接后的路径
   */
  static joinPath(...paths: string[]): string {
    const filteredPaths = paths.filter(path => path && path.length > 0);
    if (filteredPaths.length === 0) {
      return '';
    }
    
    const joined = filteredPaths
      .map(path => path.replace(/[\/\\]+/g, '/'))
      .join('/')
      .replace(/\/+/g, '/');
    
    // 保留末尾斜杠如果最后一个路径以斜杠结尾
    const lastPath = paths[paths.length - 1];
    if (lastPath && lastPath.endsWith('/') && !joined.endsWith('/')) {
      return `${joined  }/`;
    }
    
    return joined;
  }

  /**
   * 解析路径
   * @param path 路径字符串
   * @returns 解析后的路径信息
   */
  static parsePath(path: string): { dir: string; name: string; ext: string; base?: string } {
    const normalizedPath = path.replace(/[\\]/g, '/');
    const lastSlash = normalizedPath.lastIndexOf('/');
    
    const dir = lastSlash > 0 ? normalizedPath.substring(0, lastSlash) : '';
    const fullName = lastSlash >= 0 ? normalizedPath.substring(lastSlash + 1) : normalizedPath;
    
    const lastDot = fullName.lastIndexOf('.');
    
    // 如果文件没有扩展名，name就是整个文件名
    if (lastDot <= 0) {
      return {
        dir,
        name: fullName,
        ext: '',
        base: fullName
      };
    }
    
    const name = fullName.substring(0, lastDot);
    const ext = fullName.substring(lastDot + 1);
    
    return {
      dir,
      name,
      ext,
      base: fullName
    };
  }

  // === 文件类型检测函数 ===

  /**
   * 检测是否为文本文件
   * @param filename 文件名
   * @returns boolean
   */
  static isTextFile(filename: string): boolean {
    const textExtensions = [
      'txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx',
      'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'sh',
      'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf', 'log', 'sql', 'csv'
    ];
    const ext = this.getFileExtension(filename);
    return textExtensions.includes(ext);
  }

  /**
   * 检测是否为图片文件
   * @param filename 文件名
   * @returns boolean
   */
  static isImageFile(filename: string): boolean {
    const imageExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico',
      'tiff', 'tif', 'psd', 'raw', 'heic', 'heif'
    ];
    const ext = this.getFileExtension(filename);
    return imageExtensions.includes(ext);
  }

  /**
   * 检测是否为视频文件
   * @param filename 文件名
   * @returns boolean
   */
  static isVideoFile(filename: string): boolean {
    const videoExtensions = [
      'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v',
      '3gp', 'ogv', 'ts', 'm2ts', 'mts', 'vob', 'rm', 'rmvb'
    ];
    const ext = this.getFileExtension(filename);
    return videoExtensions.includes(ext);
  }

  /**
   * 检测是否为音频文件
   * @param filename 文件名
   * @returns boolean
   */
  static isAudioFile(filename: string): boolean {
    const audioExtensions = [
      'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus',
      'ape', 'ac3', 'dts', 'amr', 'au', 'ra', 'aiff'
    ];
    const ext = this.getFileExtension(filename);
    return audioExtensions.includes(ext);
  }
}