# 无云存储架构设计方案

## 设计原则

### 核心理念
- **隐私优先**: 文件完全在用户设备本地处理
- **零成本运行**: 无服务器维护成本
- **离线可用**: 支持离线使用
- **数据安全**: 文件不离开用户设备

## 架构对比

### 传统云存储方案 vs 无云存储方案

| 特性 | 云存储方案 | 无云存储方案 |
|------|------------|--------------|
| 数据隐私 | 文件上传到服务器 | 完全本地处理 |
| 运营成本 | 服务器+存储+带宽费用 | 仅CDN静态托管费用 |
| 处理速度 | 受网络速度限制 | 受设备性能限制 |
| 文件大小限制 | 服务器配置限制 | 浏览器内存限制 |
| 可用性 | 依赖网络连接 | 支持离线使用 |
| 扩展性 | 服务器扩容 | 设备性能 |

## 技术架构重新设计

### 纯前端架构
```
┌─────────────────────────────────────────────┐
│              静态资源 CDN                   │
├─────────────────────────────────────────────┤
│  HTML + CSS + JavaScript + WebAssembly     │
└─────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────┐
│               浏览器环境                    │
├─────────────┬─────────────┬─────────────────┤
│  主线程UI   │ Web Worker  │ Service Worker  │
│  用户交互   │ 解压处理    │ 缓存管理        │
└─────────────┴─────────────┴─────────────────┘
                        ↓
┌─────────────────────────────────────────────┐
│               本地存储                      │
├─────────────┬─────────────┬─────────────────┤
│ IndexedDB   │ File System │ Cache Storage   │
│ 结构索引    │ 临时文件    │ 应用缓存        │
└─────────────┴─────────────┴─────────────────┘
```

### 技术栈选择
```javascript
const techStack = {
  frontend: {
    framework: 'React + TypeScript',
    styling: 'Tailwind CSS',
    bundler: 'Vite',
    deployment: 'Static Hosting (Vercel/Netlify)'
  },
  
  processing: {
    decompression: 'libarchive.js (WebAssembly)',
    workers: 'Web Workers for background processing',
    streaming: 'Streams API for large files'
  },
  
  storage: {
    structure: 'IndexedDB',
    temporary: 'FileSystem Access API / OPFS',
    cache: 'Service Worker + Cache Storage'
  }
};
```

## 本地存储策略

### 分层存储设计
```javascript
class LocalStorageManager {
  constructor() {
    this.memoryCache = new Map();           // L1: 内存缓存 (100MB)
    this.indexedDB = new IndexedDBStore();  // L2: 结构存储 (持久)
    this.fileSystemAPI = new FSStore();     // L3: 文件存储 (临时)
    this.opfs = new OPFSStore();           // L4: 大文件存储
  }

  // 存储策略选择
  async store(data, metadata) {
    const { size, type, persistence } = metadata;
    
    if (size < 10 * 1024 * 1024 && type === 'structure') {
      // 小于10MB的结构数据存入IndexedDB
      return await this.indexedDB.store(data, metadata);
    } else if (size < 100 * 1024 * 1024 && persistence === 'temporary') {
      // 临时文件使用FileSystem API
      return await this.fileSystemAPI.store(data, metadata);
    } else {
      // 大文件使用OPFS
      return await this.opfs.store(data, metadata);
    }
  }
}
```

### IndexedDB 结构设计
```javascript
const dbSchema = {
  name: 'ZhugeExtractDB',
  version: 1,
  stores: {
    archives: {
      keyPath: 'id',
      indexes: {
        name: 'name',
        format: 'format',
        createdAt: 'createdAt'
      }
    },
    
    fileStructures: {
      keyPath: 'archiveId',
      data: {
        tree: 'FileNode[]',
        index: 'Map<string, FileNode>',
        metadata: 'ArchiveMetadata'
      }
    },
    
    previewCache: {
      keyPath: 'fileHash',
      indexes: {
        archiveId: 'archiveId',
        lastAccess: 'lastAccess'
      }
    }
  }
};
```

## 内存管理优化

### 智能内存管理器
```javascript
class AdvancedMemoryManager {
  constructor() {
    this.maxMemory = this.detectAvailableMemory();
    this.currentUsage = 0;
    this.allocations = new Map();
    this.gcThreshold = this.maxMemory * 0.8;
  }

  // 检测可用内存
  detectAvailableMemory() {
    if ('memory' in performance) {
      // Chrome: 获取设备内存信息
      const deviceMemory = navigator.deviceMemory || 4; // GB
      return Math.min(deviceMemory * 1024 * 1024 * 1024 * 0.1, 500 * 1024 * 1024);
    }
    
    // 默认限制: 200MB
    return 200 * 1024 * 1024;
  }

  // 智能分配策略
  async allocate(size, priority = 'normal', type = 'general') {
    if (this.currentUsage + size > this.gcThreshold) {
      await this.intelligentGC(size, priority);
    }

    const allocation = {
      size,
      priority,
      type,
      timestamp: Date.now(),
      accessCount: 0
    };

    const id = this.generateId();
    this.allocations.set(id, allocation);
    this.currentUsage += size;

    return id;
  }

  // 智能垃圾回收
  async intelligentGC(requiredSize, requiredPriority) {
    const candidates = [...this.allocations.entries()]
      .filter(([id, alloc]) => this.canEvict(alloc, requiredPriority))
      .sort((a, b) => this.calculateEvictionScore(a[1]) - this.calculateEvictionScore(b[1]));

    let freedSize = 0;
    for (const [id, allocation] of candidates) {
      await this.free(id);
      freedSize += allocation.size;
      
      if (freedSize >= requiredSize) break;
    }

    if (freedSize < requiredSize) {
      throw new Error('Insufficient memory available');
    }
  }

  // 驱逐评分算法
  calculateEvictionScore(allocation) {
    const age = Date.now() - allocation.timestamp;
    const accessFrequency = allocation.accessCount / Math.max(age / 1000, 1);
    const priorityWeight = { low: 0.1, normal: 0.5, high: 1.0 }[allocation.priority];
    
    return accessFrequency * priorityWeight;
  }
}
```

### 流式处理大文件
```javascript
class StreamProcessor {
  constructor() {
    this.chunkSize = 1024 * 1024; // 1MB chunks
    this.maxConcurrent = 4;
  }

  // 流式解压大型压缩包
  async processLargeArchive(file) {
    const stream = new ReadableStream({
      start: async (controller) => {
        const archive = await this.openArchive(file);
        const files = await archive.getFileList();
        
        for (const fileEntry of files) {
          if (fileEntry.size > this.chunkSize) {
            // 大文件分块处理
            await this.processFileInChunks(fileEntry, controller);
          } else {
            // 小文件直接处理
            const data = await fileEntry.extract();
            controller.enqueue({ file: fileEntry.name, data });
          }
        }
        
        controller.close();
      }
    });

    return stream;
  }

  // 分块文件处理
  async processFileInChunks(fileEntry, controller) {
    const totalChunks = Math.ceil(fileEntry.size / this.chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, fileEntry.size);
      
      const chunk = await fileEntry.extractRange(start, end);
      controller.enqueue({
        file: fileEntry.name,
        chunk: i,
        total: totalChunks,
        data: chunk
      });

      // 让出控制权，避免阻塞UI
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}
```

## 浏览器API集成

### File System Access API
```javascript
class ModernFileSystemAPI {
  constructor() {
    this.supported = 'showOpenFilePicker' in window;
    this.opfsSupported = 'createWritable' in FileSystemFileHandle.prototype;
  }

  // 现代文件选择
  async selectFile() {
    if (this.supported) {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'Archive files',
          accept: {
            'application/zip': ['.zip'],
            'application/x-rar-compressed': ['.rar'],
            'application/x-7z-compressed': ['.7z']
          }
        }]
      });
      
      return await fileHandle.getFile();
    }
    
    // 降级到传统input
    return this.fallbackFileSelect();
  }

  // 保存提取的文件
  async saveExtractedFile(data, filename) {
    if (this.supported) {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'All files',
          accept: { '*/*': ['.'] }
        }]
      });

      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
    } else {
      // 降级到下载
      this.downloadFile(data, filename);
    }
  }

  // OPFS大文件存储
  async storeInOPFS(data, name) {
    if (this.opfsSupported) {
      const opfsRoot = await navigator.storage.getDirectory();
      const fileHandle = await opfsRoot.getFileHandle(name, { create: true });
      
      const writable = await fileHandle.createWritable();
      await writable.write(data);
      await writable.close();
      
      return fileHandle;
    }
  }
}
```

### Service Worker 缓存策略
```javascript
// service-worker.js
class CacheStrategy {
  constructor() {
    this.CACHE_NAME = 'zhuge-extract-v1';
    this.CACHE_URLS = [
      '/',
      '/static/js/main.js',
      '/static/css/main.css',
      '/wasm/libarchive.wasm'
    ];
  }

  // 安装时预缓存
  async install() {
    const cache = await caches.open(this.CACHE_NAME);
    return cache.addAll(this.CACHE_URLS);
  }

  // 网络优先策略
  async fetch(event) {
    try {
      // 尝试网络请求
      const response = await fetch(event.request);
      
      // 缓存成功的响应
      if (response.ok) {
        const cache = await caches.open(this.CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      
      return response;
    } catch (error) {
      // 网络失败时使用缓存
      const cache = await caches.open(this.CACHE_NAME);
      return cache.match(event.request);
    }
  }

  // 清理过期缓存
  async cleanup() {
    const cacheNames = await caches.keys();
    return Promise.all(
      cacheNames
        .filter(name => name !== this.CACHE_NAME)
        .map(name => caches.delete(name))
    );
  }
}

// 注册事件监听器
self.addEventListener('install', event => {
  event.waitUntil(new CacheStrategy().install());
});

self.addEventListener('fetch', event => {
  event.respondWith(new CacheStrategy().fetch(event));
});
```

## 微信小程序适配

### 小程序存储限制处理
```javascript
class MiniProgramAdapter {
  constructor() {
    this.maxLocalStorage = 10 * 1024 * 1024; // 10MB
    this.maxMemory = 200 * 1024 * 1024;      // 200MB
    this.tempFileLimit = 50 * 1024 * 1024;   // 50MB
  }

  // 文件大小检查
  validateFileSize(file) {
    if (file.size > this.tempFileLimit) {
      throw new Error('文件过大，建议在电脑端处理');
    }
    return true;
  }

  // 分片上传大文件
  async uploadLargeFile(filePath) {
    const fileInfo = wx.getFileInfo({ filePath });
    const chunkSize = 1024 * 1024; // 1MB per chunk
    const totalChunks = Math.ceil(fileInfo.size / chunkSize);
    
    const chunks = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileInfo.size);
      
      const chunk = await this.readFileChunk(filePath, start, end);
      chunks.push(chunk);
    }
    
    return this.mergeChunks(chunks);
  }

  // 智能缓存管理
  async manageCache() {
    const storageInfo = wx.getStorageInfo();
    
    if (storageInfo.currentSize > this.maxLocalStorage * 0.8) {
      // 清理最旧的缓存
      const keys = storageInfo.keys
        .filter(key => key.startsWith('zhuge_'))
        .sort(); // 按时间排序
      
      for (let i = 0; i < keys.length / 2; i++) {
        wx.removeStorage({ key: keys[i] });
      }
    }
  }

  // 小程序文件预览适配
  async previewFile(fileData, fileName) {
    const tempFilePath = await this.saveToTemp(fileData, fileName);
    
    try {
      // 尝试使用小程序内置预览
      await wx.openDocument({ filePath: tempFilePath });
    } catch (error) {
      // 降级到自定义预览
      return this.customPreview(fileData, fileName);
    }
  }
}
```

## 性能优化策略

### Web Worker 多线程处理
```javascript
// main.js
class WorkerManager {
  constructor() {
    this.workers = [];
    this.taskQueue = [];
    this.maxWorkers = navigator.hardwareConcurrency || 4;
  }

  async initWorkers() {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new Worker('/workers/archive-worker.js');
      this.workers.push({
        worker,
        busy: false,
        id: i
      });
    }
  }

  async processArchive(file) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        type: 'extract',
        data: file,
        resolve,
        reject
      });
      
      this.processQueue();
    });
  }

  processQueue() {
    if (this.taskQueue.length === 0) return;
    
    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;
    
    const task = this.taskQueue.shift();
    availableWorker.busy = true;
    
    availableWorker.worker.postMessage({
      taskId: Date.now(),
      type: task.type,
      data: task.data
    });
    
    availableWorker.worker.onmessage = (event) => {
      availableWorker.busy = false;
      task.resolve(event.data);
      this.processQueue(); // 处理下一个任务
    };
  }
}

// archive-worker.js
importScripts('/js/libarchive.min.js');

self.onmessage = async function(event) {
  const { taskId, type, data } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'extract':
        result = await extractArchive(data);
        break;
      case 'getStructure':
        result = await getArchiveStructure(data);
        break;
    }
    
    self.postMessage({
      taskId,
      success: true,
      result
    });
  } catch (error) {
    self.postMessage({
      taskId,
      success: false,
      error: error.message
    });
  }
};
```

### 渐进式加载
```javascript
class ProgressiveLoader {
  constructor() {
    this.loadingStates = {
      core: false,
      wasm: false,
      ui: false
    };
  }

  // 分阶段加载
  async loadApplication() {
    // 1. 立即显示基础UI
    await this.loadCoreUI();
    this.loadingStates.ui = true;
    this.updateProgress(30);

    // 2. 后台加载核心功能
    const corePromise = this.loadCore();
    
    // 3. 延迟加载WebAssembly
    const wasmPromise = this.loadWasm();
    
    await corePromise;
    this.loadingStates.core = true;
    this.updateProgress(60);
    
    await wasmPromise;
    this.loadingStates.wasm = true;
    this.updateProgress(100);
  }

  async loadCore() {
    const { FileManager, ArchiveEngine } = await import('./core/index.js');
    return { FileManager, ArchiveEngine };
  }

  async loadWasm() {
    // 预热WebAssembly模块
    await import('./wasm/libarchive.js');
  }

  // 按需加载预览器
  async loadPreviewerFor(fileType) {
    switch (fileType) {
      case 'image':
        return await import('./previewers/ImagePreviewer.js');
      case 'text':
        return await import('./previewers/TextPreviewer.js');
      case 'pdf':
        return await import('./previewers/PDFPreviewer.js');
    }
  }
}
```

## 部署优化

### 静态资源优化
```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心库单独打包
          vendor: ['react', 'react-dom'],
          
          // WebAssembly相关
          wasm: ['libarchive.js'],
          
          // 预览器按需加载
          previewers: ['./src/previewers/index.js']
        }
      }
    },
    
    // 启用gzip压缩
    compression: 'gzip',
    
    // 资源内联限制
    assetsInlineLimit: 4096
  },
  
  // Service Worker 集成
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}']
      }
    })
  ]
};
```

这个无云存储架构确保了ZhugeExtract的隐私安全、零运营成本，同时通过先进的浏览器API和优化策略提供了良好的用户体验。