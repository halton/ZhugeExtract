# ZhugeExtract 开发指南

## 开发环境设置

### 必需工具
- **Node.js**: v18+ (推荐使用最新LTS版本)
- **包管理器**: npm 或 yarn
- **编辑器**: VS Code (推荐)
- **浏览器**: Chrome 或 Firefox (用于调试)

### VS Code 扩展推荐
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### 项目初始化
```bash
# 克隆项目
git clone <repository-url>
cd ZhugeExtract

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 项目架构详解

### 目录结构
```
src/
├── components/          # React组件
│   ├── common/         # 通用组件
│   ├── layout/         # 布局组件
│   ├── archive/        # 压缩包相关组件
│   └── preview/        # 预览相关组件
├── services/           # 业务服务
│   ├── ArchiveService.ts
│   ├── PreviewService.ts
│   └── StorageService.ts
├── utils/              # 工具函数
│   ├── format-detector.ts
│   ├── memory-manager.ts
│   └── file-utils.ts
├── workers/            # Web Worker
│   └── archive-worker.ts
├── types/              # TypeScript类型定义
├── hooks/              # 自定义React Hooks
└── stores/             # 状态管理
```

### 核心服务设计

#### ArchiveService
```typescript
class ArchiveService {
  private extractor: ArchiveExtractor;
  private memoryManager: MemoryManager;

  async loadArchive(file: File): Promise<ArchiveInfo> {
    // 文件验证
    await this.validateFile(file);
    
    // 格式检测
    const format = await this.detectFormat(file);
    
    // 创建解压器实例
    this.extractor = await this.createExtractor(format);
    
    // 解析文件结构
    const structure = await this.extractor.getStructure(file);
    
    return {
      id: generateId(),
      name: file.name,
      format,
      structure,
      metadata: await this.extractMetadata(file)
    };
  }

  async extractFile(path: string): Promise<Uint8Array> {
    return this.extractor.extractFile(path);
  }
}
```

#### PreviewService
```typescript
class PreviewService {
  private processors = new Map<string, PreviewProcessor>();
  private cache = new LRUCache<string, PreviewResult>(100);

  async preview(file: FileNode): Promise<PreviewResult> {
    const cacheKey = this.generateCacheKey(file);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const processor = await this.getProcessor(file.mimeType);
    const result = await processor.process(file.data);
    
    this.cache.set(cacheKey, result);
    return result;
  }

  private async getProcessor(mimeType: string): Promise<PreviewProcessor> {
    const category = this.categorizeType(mimeType);
    
    if (!this.processors.has(category)) {
      const processor = await this.loadProcessor(category);
      this.processors.set(category, processor);
    }
    
    return this.processors.get(category)!;
  }
}
```

## 组件开发规范

### 组件文件结构
```typescript
// components/archive/ArchiveViewer.tsx
import React, { useState, useEffect } from 'react';
import { useArchiveStore } from '@/stores/archive-store';
import { FileTree } from './FileTree';
import { PreviewPanel } from './PreviewPanel';

interface ArchiveViewerProps {
  archiveId: string;
  className?: string;
}

export const ArchiveViewer: React.FC<ArchiveViewerProps> = ({
  archiveId,
  className = ''
}) => {
  const { archive, isLoading, error } = useArchiveStore();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    // 组件初始化逻辑
  }, [archiveId]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <div className={`flex h-full ${className}`}>
      <div className="w-1/3 border-r">
        <FileTree 
          files={archive?.structure} 
          onSelect={setSelectedFile}
        />
      </div>
      <div className="flex-1">
        <PreviewPanel 
          archiveId={archiveId}
          filePath={selectedFile}
        />
      </div>
    </div>
  );
};
```

### 自定义Hook模式
```typescript
// hooks/useArchiveExtraction.ts
import { useState, useCallback } from 'react';
import { ArchiveService } from '@/services/ArchiveService';

export const useArchiveExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const extractArchive = useCallback(async (file: File) => {
    setIsExtracting(true);
    setProgress(0);
    setError(null);

    try {
      const archiveService = new ArchiveService();
      
      // 监听进度事件
      archiveService.onProgress((percent) => {
        setProgress(percent);
      });

      const result = await archiveService.loadArchive(file);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  return {
    extractArchive,
    isExtracting,
    progress,
    error
  };
};
```

## 状态管理

### Zustand Store 设计
```typescript
// stores/archive-store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface ArchiveState {
  archives: Map<string, ArchiveInfo>;
  currentArchive: string | null;
  selectedFile: string | null;
  isLoading: boolean;
  error: Error | null;
}

interface ArchiveActions {
  addArchive: (archive: ArchiveInfo) => void;
  setCurrentArchive: (id: string) => void;
  selectFile: (path: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
}

export const useArchiveStore = create<ArchiveState & ArchiveActions>()(
  devtools(
    (set, get) => ({
      // State
      archives: new Map(),
      currentArchive: null,
      selectedFile: null,
      isLoading: false,
      error: null,

      // Actions
      addArchive: (archive) => set((state) => ({
        archives: new Map(state.archives).set(archive.id, archive)
      })),

      setCurrentArchive: (id) => set({ currentArchive: id }),
      
      selectFile: (path) => set({ selectedFile: path }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error })
    }),
    {
      name: 'archive-store'
    }
  )
);
```

## Web Worker 集成

### Worker 消息接口
```typescript
// types/worker-types.ts
export interface WorkerRequest {
  id: string;
  type: 'extract' | 'getStructure' | 'preview';
  payload: any;
}

export interface WorkerResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}
```

### Worker 封装类
```typescript
// utils/worker-manager.ts
class WorkerManager {
  private worker: Worker;
  private pendingTasks = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  constructor() {
    this.worker = new Worker('/workers/archive-worker.js');
    this.worker.onmessage = this.handleMessage.bind(this);
  }

  async execute<T>(type: string, payload: any): Promise<T> {
    const id = generateId();
    
    return new Promise((resolve, reject) => {
      this.pendingTasks.set(id, { resolve, reject });
      
      this.worker.postMessage({
        id,
        type,
        payload
      });
    });
  }

  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const { id, success, result, error } = event.data;
    const task = this.pendingTasks.get(id);
    
    if (task) {
      this.pendingTasks.delete(id);
      
      if (success) {
        task.resolve(result);
      } else {
        task.reject(new Error(error));
      }
    }
  }
}
```

## 测试策略

### 单元测试
```typescript
// __tests__/services/ArchiveService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ArchiveService } from '@/services/ArchiveService';

describe('ArchiveService', () => {
  let service: ArchiveService;

  beforeEach(() => {
    service = new ArchiveService();
  });

  it('should detect ZIP format correctly', async () => {
    const mockFile = new File([new Uint8Array([0x50, 0x4B])], 'test.zip');
    const format = await service.detectFormat(mockFile);
    expect(format).toBe('zip');
  });

  it('should validate file size limits', async () => {
    const largeFile = new File([new ArrayBuffer(3 * 1024 * 1024 * 1024)], 'large.zip');
    await expect(service.validateFile(largeFile)).rejects.toThrow('File too large');
  });
});
```

### 集成测试
```typescript
// __tests__/integration/archive-extraction.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArchiveViewer } from '@/components/archive/ArchiveViewer';

describe('Archive Extraction Integration', () => {
  it('should extract and display ZIP file contents', async () => {
    const mockZipFile = createMockZipFile();
    
    render(<ArchiveViewer />);
    
    const dropZone = screen.getByTestId('drop-zone');
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockZipFile]
      }
    });

    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('folder1/')).toBeInTheDocument();
    });
  });
});
```

## 性能优化

### 代码分割
```typescript
// 路由级别的代码分割
import { lazy, Suspense } from 'react';

const ArchiveViewer = lazy(() => import('@/components/archive/ArchiveViewer'));
const SettingsPanel = lazy(() => import('@/components/settings/SettingsPanel'));

const App = () => (
  <Router>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<ArchiveViewer />} />
        <Route path="/settings" element={<SettingsPanel />} />
      </Routes>
    </Suspense>
  </Router>
);
```

### 内存优化
```typescript
// 内存使用监控
class MemoryMonitor {
  private observers: Array<(info: MemoryInfo) => void> = [];

  startMonitoring() {
    setInterval(() => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        this.notifyObservers({
          used: memInfo.usedJSHeapSize,
          total: memInfo.totalJSHeapSize,
          limit: memInfo.jsHeapSizeLimit
        });
      }
    }, 1000);
  }

  onMemoryChange(callback: (info: MemoryInfo) => void) {
    this.observers.push(callback);
  }

  private notifyObservers(info: MemoryInfo) {
    this.observers.forEach(callback => callback(info));
  }
}
```

## 调试技巧

### 开发工具配置
```typescript
// 开发环境调试辅助
if (process.env.NODE_ENV === 'development') {
  // 全局调试对象
  (window as any).__ZHUGE_DEBUG__ = {
    archiveService: new ArchiveService(),
    memoryManager: new MemoryManager(),
    
    // 调试方法
    async testExtraction(file: File) {
      return this.archiveService.loadArchive(file);
    },
    
    getMemoryUsage() {
      return this.memoryManager.getUsageStats();
    }
  };
}
```

### 错误边界
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Archive processing error:', error, errorInfo);
    
    // 发送错误报告到监控服务
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // 错误上报逻辑
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>解压过程中出现错误</h2>
          <details>
            <summary>错误详情</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 部署流程

### 构建优化
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          wasm: ['libarchive.js'],
          utils: ['./src/utils']
        }
      }
    },
    
    // 启用源码映射
    sourcemap: true,
    
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // 开发服务器配置
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  }
});
```

### CI/CD 配置
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

这个开发指南提供了完整的项目开发流程，从环境设置到部署上线的各个环节都有详细说明，确保开发团队能够快速上手并保持代码质量。