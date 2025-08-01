# ZhugeExtract 🧠

> 诸葛解压 - 基于诸葛亮智慧的在线解压缩软件

## 项目简介

ZhugeExtract 是一个现代化的在线解压缩工具，支持多种主流压缩格式的解压和预览功能。项目采用无云存储架构，确保文件完全在本地处理，保护用户隐私。

### ✨ 核心特性

- 🗜️ **多格式支持**: ZIP, RAR, 7Z, TAR.GZ, BZ2 等20+种压缩格式
- 📁 **智能预览**: 文件和目录结构树形展示
- 👀 **文件预览**: 支持文本、图片、PDF等文件在线预览
- 🔒 **隐私安全**: 完全本地处理，文件不上传云端
- 📱 **跨平台**: 支持PC、移动端浏览器和微信小程序
- ⚡ **高性能**: WebAssembly驱动，接近原生性能
- 🌐 **离线可用**: Service Worker支持离线使用

## 技术架构

### 系统设计
```
前端层: React + TypeScript + Tailwind CSS
    ↓
处理层: libarchive.js (WebAssembly) + Web Workers
    ↓
存储层: IndexedDB + FileSystem Access API + Service Worker
    ↓
部署: 静态托管 (零服务器成本)
```

### 核心技术
- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **解压引擎**: libarchive.js (WebAssembly)
- **样式方案**: Tailwind CSS
- **状态管理**: Zustand
- **本地存储**: IndexedDB + FileSystem Access API
- **缓存策略**: Service Worker + Cache API

## 项目结构

```
ZhugeExtract/
├── docs/                    # 项目文档
│   ├── architecture/        # 架构设计文档
│   ├── technical-analysis/  # 技术分析文档
│   └── planning/           # 项目规划文档
├── src/                    # 源代码
│   ├── components/         # React组件
│   ├── services/          # 业务服务层
│   ├── utils/             # 工具函数
│   └── workers/           # Web Worker脚本
├── public/                # 静态资源
└── scripts/               # 构建脚本
```

## 快速开始

### 环境要求
- Node.js >= 18
- 现代浏览器 (支持WebAssembly)

### 安装依赖
```bash
cd ZhugeExtract
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 开发指南

### 项目规划
详细的项目规划和架构设计请参考：
- [项目总体规划](docs/planning/project-overview.md)
- [系统架构设计](docs/architecture/system-design.md)
- [RAR解压技术分析](docs/technical-analysis/rar-compression-analysis.md)
- [无云存储架构](docs/technical-analysis/no-cloud-storage-architecture.md)

### 开发路线图

#### 第一阶段 - MVP版本 (2-4周)
- [ ] 基础Web界面搭建
- [ ] ZIP格式解压支持
- [ ] 文件树展示功能
- [ ] 基础文件预览 (文本、图片)

#### 第二阶段 - 功能完善 (4-6周)
- [ ] 完整压缩格式支持 (RAR, 7Z, TAR等)
- [ ] 高级预览功能 (PDF, 办公文档)
- [ ] 响应式设计优化
- [ ] 性能优化和错误处理

#### 第三阶段 - 跨平台支持 (6-8周)
- [ ] 微信小程序开发
- [ ] PWA功能集成
- [ ] 系统文件处理程序集成
- [ ] 安全性和稳定性加固

### 贡献指南

1. Fork 本项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

### 编码规范
- 使用 TypeScript 进行类型检查
- 遵循 ESLint 和 Prettier 配置
- 组件使用 React Hooks
- 样式使用 Tailwind CSS utility classes

## 技术选择说明

### 为什么选择 libarchive.js?
1. **格式支持最全**: 支持20+种压缩格式，包括完整的RAR支持
2. **技术可靠**: 基于久经考验的libarchive C库
3. **性能优秀**: WebAssembly实现，接近原生性能
4. **持续维护**: 底层C库活跃维护，可自行更新JS封装

### 无云存储的优势
1. **隐私保护**: 文件完全在本地处理，不上传服务器
2. **零成本运行**: 无服务器维护费用，仅需CDN静态托管
3. **快速响应**: 无网络传输延迟，即开即用
4. **离线支持**: Service Worker提供离线功能

## 浏览器兼容性

| 浏览器 | 版本要求 | WebAssembly | FileSystem API | 备注 |
|--------|----------|-------------|----------------|------|
| Chrome | 57+ | ✅ | ✅ | 完整支持 |
| Firefox | 52+ | ✅ | ⚠️ | FileSystem API有限 |
| Safari | 11+ | ✅ | ❌ | 使用降级方案 |
| Edge | 16+ | ✅ | ✅ | 完整支持 |

## 性能指标

- **应用加载时间**: < 3秒
- **文件解析速度**: 媲美桌面软件
- **支持文件大小**: 最大1-2GB (取决于设备内存)
- **内存使用**: 智能管理，自动垃圾回收

## 部署

### 推荐部署平台
- **Vercel**: 零配置部署，自动HTTPS
- **Netlify**: 静态站点托管，CDN加速
- **GitHub Pages**: 免费托管，适合开源项目

### 部署步骤
1. 构建项目: `npm run build`
2. 上传 `dist` 目录到静态托管平台
3. 配置域名和HTTPS (可选)

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 致谢

- [libarchive](https://libarchive.org/) - 强大的压缩格式支持
- [React](https://reactjs.org/) - 用户界面框架
- [Vite](https://vitejs.dev/) - 现代化构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架

---

**ZhugeExtract** - 让解压缩变得智能而安全 🧠✨