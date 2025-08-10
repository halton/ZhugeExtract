import React, { useState } from 'react'
import { useArchiveState } from '@/contexts/ArchiveContext'
import { FileTree, PreviewPanel } from '@/components/ui'
import { ArchiveFile } from '@/types'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { currentArchive } = useArchiveState()
  const [selectedFile, setSelectedFile] = useState<ArchiveFile | undefined>()

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentArchive ? (
          // 有压缩包时的三栏布局
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
            {/* 左侧：文件树 */}
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="card h-full flex flex-col">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    文件结构
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {currentArchive.name}
                  </p>
                </div>
                <div className="card-body flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    <FileTree 
                      files={currentArchive.structure}
                      selectedFile={selectedFile}
                      onFileSelect={setSelectedFile}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：预览区域 */}
            <div className="lg:col-span-8 xl:col-span-9">
              <div className="card h-full flex flex-col">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    文件预览
                  </h2>
                </div>
                <div className="card-body flex-1 overflow-hidden p-0">
                  <PreviewPanel 
                    file={selectedFile}
                    className="h-full"
                    onDownload={(file) => {
                      // TODO: 实现文件下载功能
                      console.log('Download file:', file)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 无压缩包时的单栏布局
          <div className="h-[calc(100vh-12rem)]">
            {children}
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      {currentArchive && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
              <span>格式: {currentArchive.format.toUpperCase()}</span>
              <span>•</span>
              <span>文件数: {currentArchive.fileCount}</span>
              <span>•</span>
              <span>大小: {formatFileSize(currentArchive.size)}</span>
              {currentArchive.isPasswordProtected && (
                <>
                  <span>•</span>
                  <span className="text-warning-600 dark:text-warning-400">
                    🔒 密码保护
                  </span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {currentArchive.metadata?.compressionRatio && (
                <span className="text-gray-600 dark:text-gray-400">
                  压缩率: {Math.round(currentArchive.metadata.compressionRatio * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 工具函数：格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 B'}
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`
}