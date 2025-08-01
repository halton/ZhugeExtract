// 基础类型定义

export type SupportedFormat = 'zip' | 'rar' | '7z' | 'tar' | 'gz' | 'bz2' | 'unknown'

export interface ArchiveFile {
  id: string
  name: string
  path: string
  size: number
  compressedSize?: number
  lastModified: Date
  isDirectory: boolean
  isEncrypted?: boolean
  compressionMethod?: number
  crc32?: number
  children?: ArchiveFile[]
}

export interface Archive {
  id: string
  name: string
  format: SupportedFormat
  size: number
  fileCount: number
  isPasswordProtected: boolean
  structure: ArchiveFile[]
  metadata?: {
    version?: string
    createdBy?: string
    comment?: string
    compressionRatio?: number
    isSolid?: boolean
    hasRecoveryRecord?: boolean
  }
}

export interface ExtractionProgress {
  fileId?: string
  fileName?: string
  bytesProcessed: number
  totalBytes: number
  percentage: number
  stage: 'parsing' | 'extracting' | 'completed' | 'error'
  message?: string
}

export interface PreviewData {
  fileId: string
  type: 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'binary' | 'unsupported'
  content?: string | ArrayBuffer | Blob
  thumbnail?: string
  metadata?: {
    encoding?: string
    mimeType?: string
    dimensions?: { width: number; height: number }
    duration?: number
    fileSize?: number
  }
}

export type Theme = 'light' | 'dark' | 'system'

export interface AppSettings {
  theme: Theme
  language: 'zh-CN' | 'en-US'
  maxFileSize: number // MB
  enableNotifications: boolean
  autoCleanup: boolean
  previewSettings: {
    textEncoding: string
    imageQuality: 'low' | 'medium' | 'high'
    maxPreviewSize: number // MB
  }
}

export interface ErrorInfo {
  id: string
  type: 'parsing' | 'extraction' | 'preview' | 'system' | 'network'
  message: string
  details?: string
  timestamp: Date
  context?: Record<string, unknown>
}

export interface PerformanceMetrics {
  loadTime: number
  parseTime: number
  extractionTime: number
  memoryUsage: number
  fileCount: number
  archiveSize: number
}

// WebAssembly相关类型
export interface LibArchiveModule {
  Archive: {
    init(): Promise<void>
    open(data: ArrayBuffer, password?: string): Promise<LibArchiveReader>
  }
  detectFormat(signature: ArrayBuffer): SupportedFormat
}

export interface LibArchiveReader {
  getFilesArray(): ArchiveFile[]
  extractFiles(password?: string): Promise<Map<string, ArrayBuffer>>
  extractSingleFile(path: string, password?: string): Promise<ArrayBuffer>
  hasPassword(): boolean
  close(): void
}

// 工具类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// 事件类型
export interface ArchiveEvent {
  type: 'upload' | 'parse' | 'extract' | 'preview' | 'download' | 'error'
  archiveId?: string
  fileId?: string
  data?: unknown
  timestamp: Date
}

// React组件Props类型
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  'data-testid'?: string
}

export interface FileUploadProps extends BaseComponentProps {
  onFileSelect: (files: FileList) => void
  accept?: string
  multiple?: boolean
  maxSize?: number
  disabled?: boolean
}

export interface FileTreeProps extends BaseComponentProps {
  files: ArchiveFile[]
  selectedFileId?: string
  onFileSelect: (file: ArchiveFile) => void
  onFileExpand?: (file: ArchiveFile) => void
  loading?: boolean
}

export interface PreviewPanelProps extends BaseComponentProps {
  file?: ArchiveFile
  previewData?: PreviewData
  onDownload?: (file: ArchiveFile) => void
  loading?: boolean
}

// API响应类型 (如果有服务端API的话)
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
}

// 本地存储类型
export interface StorageData {
  settings: AppSettings
  recentFiles: Array<{
    name: string
    size: number
    lastAccessed: string
  }>
  favorites: string[]
}

// 导出便捷类型别名
export type FileList = ArchiveFile[]
export type FileMap = Map<string, ArchiveFile>
export type PreviewMap = Map<string, PreviewData>