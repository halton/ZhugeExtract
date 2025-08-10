import { useState, useMemo } from 'react'
import { 
  Folder, 
  FolderOpen, 
  File, 
  Image, 
  FileText, 
  FileCode, 
  Archive, 
  Video,
  Music,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { ArchiveFile } from '@/types'

interface FileTreeProps {
  files: ArchiveFile[]
  onFileSelect?: (file: ArchiveFile) => void
  selectedFile?: ArchiveFile
  className?: string
}

interface TreeNode {
  name: string
  type: 'file' | 'directory'
  path: string
  file?: ArchiveFile
  children: { [key: string]: TreeNode }
  isExpanded?: boolean
}

export function FileTree({ files, onFileSelect, selectedFile, className = '' }: FileTreeProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']))

  // 构建文件树结构
  const tree = useMemo(() => {
    const root: TreeNode = {
      name: '',
      type: 'directory',
      path: '/',
      children: {}
    }

    files.forEach(file => {
      const parts = file.path.split('/').filter(Boolean)
      let current = root

      // 创建目录结构
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i]
        const currentPath = `/${  parts.slice(0, i + 1).join('/')}`

        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            type: 'directory',
            path: currentPath,
            children: {}
          }
        }
        current = current.children[part]
      }

      // 添加文件
      const fileName = parts[parts.length - 1] || file.name
      current.children[fileName] = {
        name: fileName,
        type: 'file',
        path: file.path,
        file,
        children: {}
      }
    })

    return root
  }, [files])

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedPaths(newExpanded)
  }

  const getFileIcon = (file: ArchiveFile) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return <Image className="w-4 h-4 text-blue-500" />
    }
    if (['txt', 'md', 'readme'].includes(extension)) {
      return <FileText className="w-4 h-4 text-gray-500" />
    }
    if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json', 'xml'].includes(extension)) {
      return <FileCode className="w-4 h-4 text-green-500" />
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <Archive className="w-4 h-4 text-orange-500" />
    }
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv'].includes(extension)) {
      return <Video className="w-4 h-4 text-purple-500" />
    }
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
      return <Music className="w-4 h-4 text-pink-500" />
    }
    
    return <File className="w-4 h-4 text-gray-400" />
  }

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedPaths.has(node.path)
    const isSelected = selectedFile && node.file && selectedFile.path === node.file.path
    const hasChildren = Object.keys(node.children).length > 0

    return (
      <div key={node.path}>
        <div
          className={`flex items-center space-x-2 px-2 py-1.5 text-sm cursor-pointer rounded-md transition-colors duration-150 ${
            isSelected 
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleExpanded(node.path)
            } else if (node.file) {
              onFileSelect?.(node.file)
            }
          }}
        >
          {/* 展开/收起图标 */}
          {node.type === 'directory' && hasChildren && (
            <div className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
            </div>
          )}
          {node.type === 'directory' && !hasChildren && (
            <div className="w-4 h-4" />
          )}

          {/* 文件/文件夹图标 */}
          <div className="flex-shrink-0">
            {node.type === 'directory' ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500" />
              )
            ) : (
              node.file && getFileIcon(node.file)
            )}
          </div>

          {/* 文件/文件夹名称 */}
          <span className="flex-1 truncate">
            {node.name}
          </span>

          {/* 文件大小 */}
          {node.file && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {formatFileSize(node.file.size)}
            </span>
          )}
        </div>

        {/* 子节点 */}
        {node.type === 'directory' && isExpanded && hasChildren && (
          <div>
            {Object.values(node.children)
              .sort((a, b) => {
                // 文件夹排在前面
                if (a.type !== b.type) {
                  return a.type === 'directory' ? -1 : 1
                }
                // 按名称排序
                return a.name.localeCompare(b.name)
              })
              .map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const rootChildren = Object.values(tree.children)
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

  return (
    <div className={`file-tree ${className}`}>
      <div className="space-y-1">
        {rootChildren.map(child => renderNode(child, 0))}
      </div>
    </div>
  )
}

// 工具函数：格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 B'}
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))  } ${  sizes[i]}`
}