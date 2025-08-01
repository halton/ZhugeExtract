import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// 扩展全局对象
declare global {
  interface Window {
    __TEST__: boolean;
  }
  
  namespace NodeJS {
    interface Global {
      TextEncoder: typeof TextEncoder;
      TextDecoder: typeof TextDecoder;
    }
  }
}

// 设置测试环境标识
window.__TEST__ = true;

// 模拟浏览器API
beforeAll(() => {
  // 模拟 TextEncoder/TextDecoder
  if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }

  // 模拟 File API
  if (typeof window.File === 'undefined') {
    (global as any).File = class File {
      name: string;
      size: number;
      type: string;
      lastModified: number;
      
      constructor(bits: any[], name: string, options: any = {}) {
        this.name = name;
        this.type = options.type || '';
        this.lastModified = options.lastModified || Date.now();
        this.size = bits.reduce((size, bit) => {
          if (typeof bit === 'string') return size + bit.length;
          if (bit instanceof ArrayBuffer) return size + bit.byteLength;
          if (ArrayBuffer.isView(bit)) return size + bit.byteLength;
          return size;
        }, 0);
      }
      
      slice(start?: number, end?: number, contentType?: string) {
        return new Blob([], { type: contentType });
      }
      
      stream() {
        return new ReadableStream();
      }
      
      text() {
        return Promise.resolve('');
      }
      
      arrayBuffer() {
        return Promise.resolve(new ArrayBuffer(0));
      }
    };
  }

  // 模拟 Blob API
  if (typeof window.Blob === 'undefined') {
    (global as any).Blob = class Blob {
      size: number;
      type: string;
      
      constructor(parts: any[] = [], options: any = {}) {
        this.type = options.type || '';
        this.size = parts.reduce((size, part) => {
          if (typeof part === 'string') return size + part.length;
          if (part instanceof ArrayBuffer) return size + part.byteLength;
          if (ArrayBuffer.isView(part)) return size + part.byteLength;
          return size;
        }, 0);
      }
      
      slice(start?: number, end?: number, contentType?: string) {
        return new Blob([], { type: contentType });
      }
      
      stream() {
        return new ReadableStream();
      }
      
      text() {
        return Promise.resolve('');
      }
      
      arrayBuffer() {
        return Promise.resolve(new ArrayBuffer(0));
      }
    };
  }

  // 模拟 FileReader API
  if (typeof window.FileReader === 'undefined') {
    (global as any).FileReader = class FileReader {
      readyState: number = 0;
      result: any = null;
      error: any = null;
      
      onload: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      onloadstart: ((event: any) => void) | null = null;
      onloadend: ((event: any) => void) | null = null;
      onprogress: ((event: any) => void) | null = null;
      onabort: ((event: any) => void) | null = null;
      
      readAsText(file: any) {
        setTimeout(() => {
          this.result = 'mock file content';
          this.readyState = 2;
          this.onload?.({ target: this });
        }, 0);
      }
      
      readAsArrayBuffer(file: any) {
        setTimeout(() => {
          this.result = new ArrayBuffer(0);
          this.readyState = 2;
          this.onload?.({ target: this });
        }, 0);
      }
      
      readAsDataURL(file: any) {
        setTimeout(() => {
          this.result = 'data:text/plain;base64,';
          this.readyState = 2;
          this.onload?.({ target: this });
        }, 0);
      }
      
      abort() {
        this.readyState = 2;
        this.onabort?.({ target: this });
      }
    };
  }

  // 模拟 URL API
  if (typeof window.URL === 'undefined' || typeof window.URL.createObjectURL === 'undefined') {
    (global as any).URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn()
    };
  }

  // 模拟 Web Workers
  if (typeof window.Worker === 'undefined') {
    (global as any).Worker = class Worker {
      onmessage: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      
      constructor(scriptURL: string) {
        setTimeout(() => {
          this.onmessage?.({ data: { type: 'ready' } });
        }, 0);
      }
      
      postMessage(data: any) {
        setTimeout(() => {
          this.onmessage?.({ data: { type: 'response', result: 'mock result' } });
        }, 10);
      }
      
      terminate() {
        // Mock implementation
      }
    };
  }

  // 模拟 SharedArrayBuffer (用于WebAssembly测试)
  if (typeof window.SharedArrayBuffer === 'undefined') {
    (global as any).SharedArrayBuffer = ArrayBuffer;
  }

  // 模拟 crypto API
  if (typeof window.crypto === 'undefined') {
    (global as any).crypto = {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)
    };
  }

  // 模拟 performance API
  if (typeof window.performance === 'undefined') {
    (global as any).performance = {
      now: () => Date.now(),
      memory: {
        usedJSHeapSize: 10 * 1024 * 1024,
        totalJSHeapSize: 50 * 1024 * 1024,
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
      },
      getEntriesByType: () => [],
      getEntriesByName: () => []
    };
  }

  // 模拟 ResizeObserver
  if (typeof window.ResizeObserver === 'undefined') {
    (global as any).ResizeObserver = class ResizeObserver {
      constructor(callback: any) {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // 模拟 IntersectionObserver
  if (typeof window.IntersectionObserver === 'undefined') {
    (global as any).IntersectionObserver = class IntersectionObserver {
      constructor(callback: any, options?: any) {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // 模拟 MutationObserver
  if (typeof window.MutationObserver === 'undefined') {
    (global as any).MutationObserver = class MutationObserver {
      constructor(callback: any) {}
      observe() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  }

  // 模拟 navigator API
  if (typeof window.navigator === 'undefined') {
    (global as any).navigator = {
      userAgent: 'Mozilla/5.0 (Test Environment)',
      language: 'zh-CN',
      languages: ['zh-CN', 'en'],
      onLine: true,
      hardwareConcurrency: 4,
      deviceMemory: 8,
      storage: {
        estimate: () => Promise.resolve({ quota: 1024 * 1024 * 1024, usage: 0 })
      }
    };
  }

  // 模拟 matchMedia
  if (typeof window.matchMedia === 'undefined') {
    (global as any).matchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));
  }

  // 模拟 localStorage
  if (typeof window.localStorage === 'undefined') {
    const localStorageMock = {
      store: {} as Record<string, string>,
      getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock.store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock.store[key];
      }),
      clear: vi.fn(() => {
        localStorageMock.store = {};
      }),
      get length() {
        return Object.keys(localStorageMock.store).length;
      },
      key: vi.fn((index: number) => {
        return Object.keys(localStorageMock.store)[index] || null;
      })
    };
    
    (global as any).localStorage = localStorageMock;
  }

  // 模拟 sessionStorage
  if (typeof window.sessionStorage === 'undefined') {
    (global as any).sessionStorage = global.localStorage;
  }

  // 模拟 IndexedDB
  if (typeof window.indexedDB === 'undefined') {
    (global as any).indexedDB = {
      open: vi.fn(() => ({
        onsuccess: null,
        onerror: null,
        result: {
          createObjectStore: vi.fn(),
          transaction: vi.fn(() => ({
            objectStore: vi.fn(() => ({
              add: vi.fn(),
              get: vi.fn(),
              put: vi.fn(),
              delete: vi.fn(),
              clear: vi.fn()
            }))
          }))
        }
      }))
    };
  }
});

// 每个测试前的设置
beforeEach(() => {
  // 清理所有模拟
  vi.clearAllMocks();
  
  // 重置localStorage
  if (global.localStorage) {
    (global.localStorage as any).store = {};
  }
  
  // 重置performance.memory
  if (global.performance && global.performance.memory) {
    global.performance.memory.usedJSHeapSize = 10 * 1024 * 1024;
  }
  
  // 清理控制台输出 (在测试中)
  if (process.env.NODE_ENV === 'test') {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  }
});

// 每个测试后的清理
afterEach(() => {
  // 恢复所有模拟
  vi.restoreAllMocks();
  
  // 清理DOM
  document.body.innerHTML = '';
  
  // 清理全局状态
  if (window.__TEST__) {
    // 清理可能的事件监听器
    window.removeEventListener = window.removeEventListener || (() => {});
  }
});

// 全局清理
afterAll(() => {
  // 清理全局模拟
  vi.clearAllMocks();
  
  // 重置全局对象
  delete (global as any).File;
  delete (global as any).Blob;
  delete (global as any).FileReader;
  delete (global as any).Worker;
});

// 错误处理
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// WebAssembly 模拟 (用于测试)
if (typeof WebAssembly === 'undefined') {
  (global as any).WebAssembly = {
    compile: vi.fn(() => Promise.resolve({})),
    instantiate: vi.fn(() => Promise.resolve({ 
      instance: { exports: {} },
      module: {}
    })),
    validate: vi.fn(() => true),
    Module: vi.fn(),
    Instance: vi.fn(),
    Memory: vi.fn(),
    Table: vi.fn(),
    CompileError: Error,
    RuntimeError: Error,
    LinkError: Error
  };
}

// 自定义匹配器
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toBeValidArchive(received: any) {
    const pass = received && 
                 typeof received.id === 'string' &&
                 typeof received.name === 'string' &&
                 typeof received.format === 'string' &&
                 Array.isArray(received.structure);
    
    return {
      message: () => pass 
        ? `expected ${received} not to be a valid archive object`
        : `expected ${received} to be a valid archive object with id, name, format, and structure`,
      pass,
    };
  }
});

// 类型声明扩展
declare module 'vitest' {
  interface Assertion<T = any>
    extends jest.Matchers<void, T> {
    toBeWithinRange(floor: number, ceiling: number): T;
    toBeValidArchive(): T;
  }
}

export {};