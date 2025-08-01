import { useState, useEffect } from 'react'
import { 
  Download, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  File, 
  AlertCircle,
  Loader2
} from 'lucide-react'
import { ArchiveFile, PreviewData } from '@/types'
import { useArchiveActions, useArchiveState } from '@/contexts/ArchiveContext'

interface PreviewPanelProps {
  file?: ArchiveFile
  previewData?: PreviewData
  onDownload?: (file: ArchiveFile) => void
  className?: string
}

export function PreviewPanel({ file, className = '' }: PreviewPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { generatePreview, downloadFile } = useArchiveActions()
  const { previewData } = useArchiveState()
  
  // 获取当前文件的预览数据
  const currentPreviewData = file ? previewData.get(file.id) : undefined

  useEffect(() => {
    setError(null)
    if (file && !currentPreviewData) {
      setIsLoading(true)
      generatePreview(file).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [file, currentPreviewData, generatePreview])

  if (!file) {
    return (
      <div className={`preview-panel ${className}`}>
        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">选择文件进行预览</h3>
            <p className="text-sm">支持文本、图片、PDF等多种格式</p>
          </div>
        </div>
      </div>
    )
  }

  const getFileTypeInfo = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase() || ''
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return { type: 'image', category: '图片文件', icon: ImageIcon }
    }
    if (['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(extension)) {
      return { type: 'text', category: '文本文件', icon: FileText }
    }
    if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'cpp'].includes(extension)) {
      return { type: 'code', category: '代码文件', icon: FileText }
    }
    if (['pdf'].includes(extension)) {
      return { type: 'pdf', category: 'PDF文档', icon: File }
    }
    
    return { type: 'unknown', category: '未知格式', icon: File }
  }

  const fileInfo = getFileTypeInfo(file.name)
  const IconComponent = fileInfo.icon

  return (
    <div className={`preview-panel ${className}`}>
      <div className="h-full flex flex-col">
        {/* 文件信息头部 */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {file.name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>{fileInfo.category}</span>
                  <span>•</span>
                  <span>{formatFileSize(file.size)}</span>
                  {file.lastModified && (
                    <>
                      <span>•</span>
                      <span>{formatDate(file.lastModified)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => downloadFile(file)}
              className="btn btn-secondary btn-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              下载
            </button>
          </div>
        </div>

        {/* 预览内容区域 */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">正在加载预览...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  预览失败
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <PreviewContent file={file} fileInfo={fileInfo} previewData={currentPreviewData} />
          )}
        </div>
      </div>
    </div>
  )
}

interface PreviewContentProps {
  file: ArchiveFile
  fileInfo: ReturnType<typeof getFileTypeInfo>
  previewData?: PreviewData
}

function PreviewContent({ file, fileInfo, previewData }: PreviewContentProps) {
  if (previewData?.content) {
    switch (fileInfo.type) {
      case 'image':
        return (
          <div className="p-4 flex items-center justify-center min-h-full">
            <img
              src={typeof previewData.content === 'string' ? previewData.content : ''}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-md"
            />
          </div>
        )
      
      case 'text':
      case 'code':
        return (
          <div className="p-4">
            <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm overflow-auto whitespace-pre-wrap font-mono">
              {typeof previewData.content === 'string' ? previewData.content : ''}
            </pre>
          </div>
        )
      
      default:
        return <UnsupportedPreview file={file} fileInfo={fileInfo} />
    }
  }

  return <UnsupportedPreview file={file} fileInfo={fileInfo} />
}

interface UnsupportedPreviewProps {
  file: ArchiveFile
  fileInfo: ReturnType<typeof getFileTypeInfo>
}

function UnsupportedPreview({ file, fileInfo }: UnsupportedPreviewProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-sm">
        <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          无法预览此文件
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {fileInfo.category}暂时不支持在线预览，但您可以下载到本地查看。
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>文件名：{file.name}</p>
          <p>大小：{formatFileSize(file.size)}</p>
        </div>
      </div>
    </div>
  )
}

// 辅助函数
function getFileTypeInfo(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return { type: 'image', category: '图片文件', icon: ImageIcon }
  }
  if (['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(extension)) {
    return { type: 'text', category: '文本文件', icon: FileText }
  }
  if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'py', 'java', 'cpp'].includes(extension)) {
    return { type: 'code', category: '代码文件', icon: FileText }
  }
  if (['pdf'].includes(extension)) {
    return { type: 'pdf', category: 'PDF文档', icon: File }
  }
  
  return { type: 'unknown', category: '未知格式', icon: File }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}