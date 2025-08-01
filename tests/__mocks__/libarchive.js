import { vi } from 'vitest';

// libarchive.js 模拟
const mockLibarchive = {
  Archive: {
    init: vi.fn(() => Promise.resolve()),
    
    open: vi.fn((data) => {
      return Promise.resolve({
        extractFiles: vi.fn(() => Promise.resolve([
          {
            name: 'test.txt',
            size: 100,
            lastModified: new Date(),
            isDirectory: false,
            extractToString: vi.fn(() => Promise.resolve('Test content'))
          }
        ])),
        
        getFilesArray: vi.fn(() => [
          {
            name: 'test.txt',
            size: 100,
            lastModified: new Date(),
            isDirectory: false
          }
        ]),
        
        hasPassword: vi.fn(() => false),
        
        extractSingleFile: vi.fn((filename, password) => {
          return Promise.resolve({
            name: filename,
            content: new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
          });
        }),
        
        close: vi.fn(() => Promise.resolve())
      });
    }),
    
    // 错误模拟
    openWithError: vi.fn(() => {
      return Promise.reject(new Error('Failed to open archive'));
    }),
    
    openPasswordProtected: vi.fn(() => {
      return Promise.resolve({
        hasPassword: vi.fn(() => true),
        extractFiles: vi.fn((password) => {
          if (password === 'correct') {
            return Promise.resolve([]);
          } else {
            return Promise.reject(new Error('Wrong password'));
          }
        })
      });
    })
  },
  
  // 压缩格式检测
  detectFormat: vi.fn((buffer) => {
    const view = new Uint8Array(buffer);
    
    // ZIP
    if (view[0] === 0x50 && view[1] === 0x4b) {
      return 'zip';
    }
    
    // RAR
    if (view[0] === 0x52 && view[1] === 0x61 && view[2] === 0x72) {
      return 'rar';
    }
    
    // 7Z
    if (view[0] === 0x37 && view[1] === 0x7a) {
      return '7z';
    }
    
    // TAR
    if (view[257] === 0x75 && view[258] === 0x73) {
      return 'tar';
    }
    
    // GZIP
    if (view[0] === 0x1f && view[1] === 0x8b) {
      return 'gz';
    }
    
    return 'unknown';
  }),
  
  // 内存使用监控
  getMemoryUsage: vi.fn(() => ({
    used: 10 * 1024 * 1024, // 10MB
    total: 100 * 1024 * 1024 // 100MB
  })),
  
  // 清理资源
  cleanup: vi.fn(() => Promise.resolve())
};

// 导出模拟对象
export default mockLibarchive;
export const Archive = mockLibarchive.Archive;