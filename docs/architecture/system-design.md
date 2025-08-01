# ZhugeExtract 系统架构设计

## 整体架构

### 架构图
```
┌─────────────────────────────────────────────────────┐
│                   用户界面层                        │
├─────────────────┬─────────────────┬─────────────────┤
│   Web浏览器     │   移动端浏览器   │   微信小程序    │
│   (React)       │   (PWA)         │   (原生)        │
└─────────────────┴─────────────────┴─────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                  业务逻辑层                         │
├─────────────────┬─────────────────┬─────────────────┤
│   文件管理器    │   解压缩引擎     │   预览处理器    │
│   FileManager   │   ArchiveEngine  │   PreviewEngine │
└─────────────────┴─────────────────┴─────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                 WebAssembly层                       │
├─────────────────┬─────────────────┬─────────────────┤
│  libarchive.js  │   Worker线程    │   内存管理      │
│  (解压核心)     │   (后台处理)    │   (缓存策略)    │
└─────────────────┴─────────────────┴─────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                  存储层                             │
├─────────────────┬─────────────────┬─────────────────┤
│   IndexedDB     │  FileSystem API │ Service Worker  │
│   (结构索引)    │  (临时文件)     │  (应用缓存)     │
└─────────────────┴─────────────────┴─────────────────┘
```

## 核心组件设计

### 1. 文件管理器 (FileManager)
```javascript
class FileManager {
  constructor() {
    this.archives = new Map();      // 已加载的压缩包
    this.fileIndex = new Map();     // 文件索引
    this.memoryManager = new MemoryManager();
  }

  // 文件上传处理
  async uploadFile(file) {
    const format = await this.detectFormat(file);
    const archiveId = this.generateId();
    
    return {
      id: archiveId,
      name: file.name,
      size: file.size,
      format: format,
      status: 'uploaded'
    };
  }

  // 格式检测
  async detectFormat(file) {
    const header = await this.readFileHeader(file, 16);
    return FormatDetector.detect(header);
  }
}
```

### 2. 解压缩引擎 (ArchiveEngine)
```javascript
class ArchiveEngine {
  constructor() {
    this.extractors = new Map();
    this.workerPool = new WorkerPool(4); // 4个Worker线程
  }

  // 统一解压接口
  async extract(archiveId, options = {}) {
    const archive = FileManager.getArchive(archiveId);
    const extractor = await this.getExtractor(archive.format);
    
    return await extractor.extract(archive.buffer, options);
  }

  // 获取解压器
  async getExtractor(format) {
    if (!this.extractors.has(format)) {
      const extractor = await this.loadExtractor(format);
      this.extractors.set(format, extractor);
    }
    return this.extractors.get(format);
  }

  // 动态加载解压器
  async loadExtractor(format) {
    switch (format) {
      case 'zip':
      case 'rar':
      case '7z':
        return await import('libarchive.js');
      case 'gz':
        return await import('pako');
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}
```

### 3. 预览处理器 (PreviewEngine)
```javascript
class PreviewEngine {
  constructor() {
    this.processors = new Map();
    this.cache = new LRUCache(100); // 缓存100个预览结果
  }

  // 文件预览
  async preview(fileData, fileName) {
    const mimeType = this.detectMimeType(fileName, fileData);
    const processor = this.getProcessor(mimeType);
    
    const cacheKey = this.generateCacheKey(fileData);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = await processor.process(fileData);
    this.cache.set(cacheKey, result);
    return result;
  }

  // 预览处理器
  getProcessor(mimeType) {
    const category = this.categorizeType(mimeType);
    
    switch (category) {
      case 'text':
        return new TextPreviewProcessor();
      case 'image':
        return new ImagePreviewProcessor();
      case 'pdf':
        return new PDFPreviewProcessor();
      default:
        return new BinaryPreviewProcessor();
    }
  }
}
```

## 内存管理策略

### 内存管理器设计
```javascript
class MemoryManager {
  constructor() {
    this.maxMemory = 200 * 1024 * 1024; // 200MB限制
    this.currentUsage = 0;
    this.chunks = new Map();
    this.accessHistory = [];
  }

  // 内存分配
  allocate(size, id) {
    if (this.currentUsage + size > this.maxMemory) {
      this.evictLRU(size);
    }
    
    this.chunks.set(id, { size, timestamp: Date.now() });
    this.currentUsage += size;
    this.updateAccessHistory(id);
  }

  // LRU淘汰策略
  evictLRU(requiredSize) {
    const sorted = [...this.chunks.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    let freedSize = 0;
    for (const [id, chunk] of sorted) {
      this.free(id);
      freedSize += chunk.size;
      if (freedSize >= requiredSize) break;
    }
  }

  // 释放内存
  free(id) {
    const chunk = this.chunks.get(id);
    if (chunk) {
      this.currentUsage -= chunk.size;
      this.chunks.delete(id);
    }
  }
}
```

## 数据流设计

### 文件处理流程
```javascript
const processingPipeline = {
  // 1. 文件输入
  input: async (file) => {
    const validation = await FileValidator.validate(file);
    if (!validation.valid) throw new Error(validation.error);
    return file;
  },

  // 2. 格式检测
  detect: async (file) => {
    const format = await FormatDetector.detect(file);
    return { file, format };
  },

  // 3. 解压缩处理
  extract: async ({ file, format }) => {
    const extractor = await ArchiveEngine.getExtractor(format);
    const structure = await extractor.getStructure(file);
    return { file, format, structure };
  },

  // 4. 索引构建
  index: async ({ structure }) => {
    const index = new FileIndex(structure);
    await index.build();
    return index;
  },

  // 5. 缓存存储
  cache: async (index) => {
    await IndexedDB.store(index);
    return index;
  }
};
```

### 响应式数据更新
```javascript
class StateManager {
  constructor() {
    this.state = {
      archives: [],
      currentArchive: null,
      selectedFile: null,
      previewData: null,
      loading: false
    };
    this.subscribers = [];
  }

  // 状态更新
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notifySubscribers();
  }

  // 订阅状态变化
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      this.subscribers.splice(index, 1);
    };
  }

  // 通知订阅者
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }
}
```

## 安全性设计

### 安全措施
```javascript
class SecurityManager {
  // 文件安全检查
  static async validateFile(file) {
    // 1. 文件大小限制
    if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB
      throw new Error('File too large');
    }

    // 2. 文件类型白名单
    const allowedTypes = [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // ... 其他允许的类型
    ];

    // 3. 恶意文件检测
    const signature = await this.readSignature(file);
    if (this.isMaliciousSignature(signature)) {
      throw new Error('Potentially malicious file');
    }

    return true;
  }

  // 路径遍历攻击防护
  static sanitizePath(path) {
    // 移除危险字符和路径遍历
    return path
      .replace(/\.\./g, '')
      .replace(/[<>:"|?*]/g, '')
      .substring(0, 255); // 路径长度限制
  }
}
```

## 性能优化策略

### 1. 懒加载和按需加载
```javascript
// 动态导入WebAssembly模块
const loadArchiveEngine = async () => {
  const { default: LibArchive } = await import(
    /* webpackChunkName: "libarchive" */ 'libarchive.js'
  );
  return LibArchive;
};

// 组件级别的懒加载
const PreviewComponent = React.lazy(() => 
  import('./components/FilePreview')
);
```

### 2. Worker线程池
```javascript
class WorkerPool {
  constructor(size = 4) {
    this.workers = [];
    this.queue = [];
    this.size = size;
    this.init();
  }

  async init() {
    for (let i = 0; i < this.size; i++) {
      const worker = new Worker('/workers/archive-worker.js');
      this.workers.push({ worker, busy: false });
    }
  }

  async execute(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }
}
```

### 3. 渐进式加载
```javascript
// 大文件分块处理
class ChunkProcessor {
  async processLargeArchive(file) {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks = [];
    
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = file.slice(offset, offset + chunkSize);
      chunks.push(this.processChunk(chunk));
      
      // 每处理10个chunk暂停一下，避免阻塞UI
      if (chunks.length % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return Promise.all(chunks);
  }
}
```

这个系统架构设计确保了ZhugeExtract的高性能、安全性和可扩展性，同时保持了代码的模块化和可维护性。