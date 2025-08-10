import { vi } from 'vitest';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// 测试工具函数
export class TestHelpers {
  // 创建模拟文件
  static createMockFile(
    name: string,
    content: string | ArrayBuffer,
    type: string = 'text/plain'
  ): File {
    const file = new File([content], name, { type });
    return file;
  }

  // 创建模拟压缩文件
  static createMockArchiveFile(format: string, size: number = 1024): File {
    const signatures = {
      'zip': [0x50, 0x4b, 0x03, 0x04],
      'rar': [0x52, 0x61, 0x72, 0x21],
      '7z': [0x37, 0x7a, 0xbc, 0xaf],
      'tar': [0x75, 0x73, 0x74, 0x61, 0x72],
      'gz': [0x1f, 0x8b, 0x08, 0x00]
    };

    const signature = signatures[format as keyof typeof signatures] || [0x00];
    const buffer = new ArrayBuffer(size);
    const view = new Uint8Array(buffer);
    
    // 设置文件签名
    signature.forEach((byte, index) => {
      view[index] = byte;
    });

    return new File([buffer], `test.${format}`, { 
      type: `application/${format}` 
    });
  }

  // 模拟压缩文件结构
  static createMockArchiveStructure(fileCount: number = 5) {
    const structure = [];
    
    for (let i = 0; i < fileCount; i++) {
      structure.push({
        name: `file-${i}.txt`,
        path: `folder-${Math.floor(i / 2)}/file-${i}.txt`,
        size: Math.random() * 10000,
        isDirectory: false,
        lastModified: new Date(Date.now() - Math.random() * 10000000)
      });
    }

    // 添加一些目录
    structure.push({
      name: 'folder-0',
      path: 'folder-0/',
      size: 0,
      isDirectory: true,
      lastModified: new Date()
    });

    return structure;
  }

  // 创建性能测试数据
  static createPerformanceTestData(sizeInMB: number) {
    const size = sizeInMB * 1024 * 1024;
    const buffer = new ArrayBuffer(size);
    const view = new Uint8Array(buffer);
    
    // 生成随机数据
    for (let i = 0; i < size; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }
    
    return buffer;
  }

  // 等待异步操作完成
  static async waitForAsync(ms: number = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 模拟网络延迟
  static mockNetworkDelay(delay: number = 100) {
    const originalFetch = global.fetch;
    
    global.fetch = vi.fn((...args) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(originalFetch.apply(global, args));
        }, delay);
      });
    });

    return () => {
      global.fetch = originalFetch;
    };
  }

  // 模拟内存使用情况
  static mockMemoryUsage(usedMB: number, totalMB: number = 1000) {
    const mockPerformance = {
      ...global.performance,
      memory: {
        usedJSHeapSize: usedMB * 1024 * 1024,
        totalJSHeapSize: totalMB * 1024 * 1024,
        jsHeapSizeLimit: totalMB * 2 * 1024 * 1024
      }
    };

    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true
    });
  }

  // 创建错误测试场景
  static createErrorScenarios() {
    return {
      corruptedFile: this.createMockFile('corrupted.zip', 'invalid content'),
      oversizedFile: this.createMockArchiveFile('zip', 100 * 1024 * 1024),
      passwordProtected: this.createMockArchiveFile('zip', 1024),
      networkError: new Error('Network request failed'),
      memoryError: new Error('Out of memory'),
      parseError: new Error('Failed to parse archive')
    };
  }

  // 断言工具
  static expectArchiveStructure(structure: any[]) {
    expect(Array.isArray(structure)).toBe(true);
    expect(structure.length).toBeGreaterThan(0);
    
    structure.forEach(item => {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('path');
      expect(item).toHaveProperty('size');
      expect(item).toHaveProperty('isDirectory');
      expect(typeof item.isDirectory).toBe('boolean');
    });
  }

  // 性能断言
  static expectPerformance(operation: () => Promise<any>, maxTimeMs: number) {
    return async () => {
      const startTime = performance.now();
      await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(maxTimeMs);
      return duration;
    };
  }

  // 内存断言
  static expectMemoryUsage(operation: () => Promise<any>, maxMemoryMB: number) {
    return async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      await operation();
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryUsed = (finalMemory - initialMemory) / (1024 * 1024);
      
      expect(memoryUsed).toBeLessThan(maxMemoryMB);
      return memoryUsed;
    };
  }
}

// React组件测试工具
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialProps?: any;
}

export function renderWithContext(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { initialProps, ...renderOptions } = options || {};

  // 可以在这里添加 Provider 包装器
  return render(ui, renderOptions);
}

// 测试数据生成器
export class TestDataGenerator {
  // 生成随机字符串
  static randomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 生成随机文件路径
  static randomFilePath(depth: number = 3): string {
    const parts = [];
    for (let i = 0; i < depth; i++) {
      parts.push(this.randomString(8));
    }
    return `${parts.join('/')  }.txt`;
  }

  // 生成测试用户数据
  static generateUserData() {
    return {
      id: this.randomString(8),
      name: this.randomString(12),
      preferences: {
        theme: Math.random() > 0.5 ? 'dark' : 'light',
        language: Math.random() > 0.5 ? 'zh-CN' : 'en-US',
        compressionLevel: Math.floor(Math.random() * 9) + 1
      }
    };
  }

  // 生成压缩历史记录
  static generateCompressionHistory(count: number = 10) {
    const history = [];
    
    for (let i = 0; i < count; i++) {
      history.push({
        id: this.randomString(16),
        fileName: `archive-${i}.zip`,
        originalSize: Math.floor(Math.random() * 1000000),
        compressedSize: Math.floor(Math.random() * 500000),
        timestamp: new Date(Date.now() - Math.random() * 10000000),
        status: Math.random() > 0.8 ? 'failed' : 'completed'
      });
    }
    
    return history;
  }
}

// 自定义匹配器
export const customMatchers = {
  toBeValidFile(received: File) {
    const pass = received instanceof File && 
                 received.name.length > 0 && 
                 received.size >= 0;
    
    return {
      message: () => pass 
        ? `expected ${received} not to be a valid File object`
        : `expected ${received} to be a valid File object`,
      pass,
    };
  },

  toHaveValidArchiveFormat(received: string) {
    const validFormats = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
    const pass = validFormats.includes(received.toLowerCase());
    
    return {
      message: () =>  pass 
        ? `expected ${received} not to be a valid archive format`
        : `expected ${received} to be one of: ${validFormats.join(', ')}`,
      pass,
    };
  },

  toBeWithinMemoryLimit(received: number, limitMB: number) {
    const receivedMB = received / (1024 * 1024);
    const pass = receivedMB <= limitMB;
    
    return {
      message: () => pass 
        ? `expected ${receivedMB.toFixed(2)}MB not to be within ${limitMB}MB limit`
        : `expected ${receivedMB.toFixed(2)}MB to be within ${limitMB}MB limit`,
      pass,
    };
  }
};

// 导出所有工具
export default TestHelpers;