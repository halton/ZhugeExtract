import React, { useCallback, useState } from 'react'
import { Upload, FileArchive, AlertCircle } from 'lucide-react'
import { useArchiveActions } from '@/contexts/ArchiveContext'

interface FileUploadProps {
  onFileSelect?: (file: File) => void
  accept?: string
  maxSize?: number
  className?: string
}

export function FileUpload({ 
  onFileSelect, 
  accept = '.zip,.rar,.7z,.tar,.gz,.bz2,.xz',
  maxSize = 2 * 1024 * 1024 * 1024, // 2GB
  className = ''
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { loadArchive } = useArchiveActions()

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `文件大小超过限制 (${Math.round(maxSize / 1024 / 1024)}MB)`
    }

    const allowedExtensions = accept.split(',').map(ext => ext.trim().toLowerCase())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedExtensions.includes(fileExtension)) {
      return '不支持的文件格式'
    }

    return null
  }, [accept, maxSize])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const validationError = validateFile(file)

    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    onFileSelect?.(file)
    
    // 使用 loadArchive 处理文件
    loadArchive(file).catch((error) => {
      setError(error.message || '文件处理失败')
    })
  }, [validateFile, onFileSelect, loadArchive])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }, [handleFileSelect])

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div
        className={`dropzone ${isDragOver ? 'dropzone-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-xl mb-6 flex items-center justify-center transition-all duration-200 ${
            isDragOver 
              ? 'bg-primary-200 dark:bg-primary-800/50 text-primary-700 dark:text-primary-300' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          }`}>
            {isDragOver ? (
              <FileArchive className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {isDragOver ? '释放文件开始上传' : '拖拽文件到这里，或点击选择'}
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
            支持 ZIP、RAR、7Z 等常见压缩格式<br />
            最大支持 {Math.round(maxSize / 1024 / 1024)}MB
          </p>

          <input
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            id="file-upload-input"
          />
          
          <label
            htmlFor="file-upload-input"
            className="btn btn-primary cursor-pointer"
          >
            选择文件
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                上传失败
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
        <p>💡 提示：所有文件都在本地处理，不会上传到服务器</p>
      </div>
    </div>
  )
}