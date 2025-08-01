/**
 * LibArchive.js WebAssembly Wrapper
 * 
 * 这个模块封装了libarchive.js的WebAssembly功能，提供了统一的API来处理各种压缩格式
 */

import { Archive as LibArchiveJS } from 'libarchive.js/main.js'
import { ArchiveFile, Archive, SupportedFormat, ExtractionProgress } from '@/types'

// WebAssembly模块初始化状态
let isLibArchiveInitialized = false
let libArchiveModule: typeof LibArchiveJS | null = null

/**
 * 初始化LibArchive WebAssembly模块
 */
export async function initializeLibArchive(): Promise<void> {
  if (isLibArchiveInitialized && libArchiveModule) {
    return
  }

  try {
    // 设置WebAssembly文件路径
    const wasmPath = new URL('libarchive.js/dist/libarchive.wasm', import.meta.url).href
    
    // 初始化LibArchive模块
    libArchiveModule = await LibArchiveJS.init({
      locateFile: (path: string) => {
        if (path.endsWith('.wasm')) {
          return wasmPath
        }
        return path
      }
    })

    isLibArchiveInitialized = true
    console.log('LibArchive WebAssembly module initialized successfully')
  } catch (error) {
    console.error('Failed to initialize LibArchive:', error)
    throw new Error(`WebAssembly initialization failed: ${error}`)
  }
}

/**
 * 检测文件格式
 */
export function detectArchiveFormat(fileBuffer: ArrayBuffer): SupportedFormat {
  const signature = new Uint8Array(fileBuffer.slice(0, 16))
  
  // ZIP格式签名 (PK\x03\x04 或 PK\x05\x06 或 PK\x07\x08)
  if (signature[0] === 0x50 && signature[1] === 0x4B) {
    if ((signature[2] === 0x03 && signature[3] === 0x04) ||
        (signature[2] === 0x05 && signature[3] === 0x06) ||
        (signature[2] === 0x07 && signature[3] === 0x08)) {
      return 'zip'
    }
  }
  
  // RAR格式签名
  if (signature[0] === 0x52 && signature[1] === 0x61 && signature[2] === 0x72 && signature[3] === 0x21) {
    return 'rar'
  }
  
  // 7Z格式签名
  if (signature[0] === 0x37 && signature[1] === 0x7A && signature[2] === 0xBC && signature[3] === 0xAF) {
    return '7z'
  }
  
  // TAR格式 (检查文件头的特定位置)
  const tarCheck = new Uint8Array(fileBuffer.slice(257, 262))
  if (String.fromCharCode(...tarCheck) === 'ustar') {
    return 'tar'
  }
  
  // GZIP格式签名
  if (signature[0] === 0x1F && signature[1] === 0x8B) {
    return 'gz'
  }
  
  // BZIP2格式签名
  if (signature[0] === 0x42 && signature[1] === 0x5A && signature[2] === 0x68) {
    return 'bz2'
  }
  
  return 'unknown'
}

/**
 * 解析压缩文件结构
 */
export async function parseArchiveStructure(
  fileBuffer: ArrayBuffer,
  fileName: string,
  password?: string,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<Archive> {
  if (!isLibArchiveInitialized || !libArchiveModule) {
    throw new Error('LibArchive module not initialized. Call initializeLibArchive() first.')
  }

  try {
    onProgress?.({
      bytesProcessed: 0,
      totalBytes: fileBuffer.byteLength,
      percentage: 0,
      stage: 'parsing',
      message: '正在解析压缩文件结构...'
    })

    // 创建LibArchive实例
    const archive = await libArchiveModule.open(fileBuffer, password)
    
    // 获取文件列表
    const files = archive.getFilesArray()
    const format = detectArchiveFormat(fileBuffer)
    
    // 转换为我们的Archive格式
    const archiveData: Archive = {
      id: generateId(),
      name: fileName,
      format,
      size: fileBuffer.byteLength,
      fileCount: files.length,
      isPasswordProtected: archive.hasPassword(),
      structure: files.map(convertLibArchiveFile),
      metadata: {
        compressionRatio: calculateCompressionRatio(files, fileBuffer.byteLength)
      }
    }

    onProgress?.({
      bytesProcessed: fileBuffer.byteLength,
      totalBytes: fileBuffer.byteLength,
      percentage: 100,
      stage: 'completed',
      message: '解析完成'
    })

    return archiveData
  } catch (error) {
    onProgress?.({
      bytesProcessed: 0,
      totalBytes: fileBuffer.byteLength,
      percentage: 0,
      stage: 'error',
      message: `解析失败: ${error}`
    })
    
    throw new Error(`Failed to parse archive: ${error}`)
  }
}

/**
 * 提取单个文件
 */
export async function extractSingleFile(
  fileBuffer: ArrayBuffer,
  filePath: string,
  password?: string,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<ArrayBuffer> {
  if (!isLibArchiveInitialized || !libArchiveModule) {
    throw new Error('LibArchive module not initialized')
  }

  try {
    onProgress?.({
      bytesProcessed: 0,
      totalBytes: fileBuffer.byteLength,
      percentage: 0,
      stage: 'extracting',
      message: `正在提取文件: ${filePath}`,
      fileName: filePath
    })

    const archive = await libArchiveModule.open(fileBuffer, password)
    const extractedData = await archive.extractSingleFile(filePath, password)

    onProgress?.({
      bytesProcessed: extractedData.byteLength,
      totalBytes: extractedData.byteLength,
      percentage: 100,
      stage: 'completed',
      message: '提取完成',
      fileName: filePath
    })

    return extractedData
  } catch (error) {
    onProgress?.({
      bytesProcessed: 0,
      totalBytes: fileBuffer.byteLength,
      percentage: 0,
      stage: 'error',
      message: `提取失败: ${error}`,
      fileName: filePath
    })
    
    throw new Error(`Failed to extract file ${filePath}: ${error}`)
  }
}

/**
 * 批量提取文件
 */
export async function extractMultipleFiles(
  fileBuffer: ArrayBuffer,
  filePaths: string[],
  password?: string,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<Map<string, ArrayBuffer>> {
  if (!isLibArchiveInitialized || !libArchiveModule) {
    throw new Error('LibArchive module not initialized')
  }

  const results = new Map<string, ArrayBuffer>()
  let processedCount = 0

  try {
    const archive = await libArchiveModule.open(fileBuffer, password)

    for (const filePath of filePaths) {
      onProgress?.({
        bytesProcessed: processedCount,
        totalBytes: filePaths.length,
        percentage: (processedCount / filePaths.length) * 100,
        stage: 'extracting',
        message: `正在提取文件 ${processedCount + 1}/${filePaths.length}: ${filePath}`,
        fileName: filePath
      })

      const extractedData = await archive.extractSingleFile(filePath, password)
      results.set(filePath, extractedData)
      processedCount++
    }

    onProgress?.({
      bytesProcessed: filePaths.length,
      totalBytes: filePaths.length,
      percentage: 100,
      stage: 'completed',
      message: `成功提取 ${filePaths.length} 个文件`
    })

    return results
  } catch (error) {
    onProgress?.({
      bytesProcessed: processedCount,
      totalBytes: filePaths.length,
      percentage: (processedCount / filePaths.length) * 100,
      stage: 'error',
      message: `批量提取失败: ${error}`
    })
    
    throw new Error(`Failed to extract files: ${error}`)
  }
}

/**
 * 转换LibArchive文件对象到我们的格式
 */
function convertLibArchiveFile(file: any): ArchiveFile {
  return {
    id: generateId(),
    name: file.name || '',
    path: file.path || file.name || '',
    size: file.size || 0,
    compressedSize: file.compressedSize,
    lastModified: file.lastModified ? new Date(file.lastModified) : new Date(),
    isDirectory: file.type === 'directory',
    isEncrypted: file.encrypted || false,
    compressionMethod: file.method,
    crc32: file.crc32
  }
}

/**
 * 计算压缩比
 */
function calculateCompressionRatio(files: any[], archiveSize: number): number {
  const totalUncompressedSize = files.reduce((sum, file) => sum + (file.size || 0), 0)
  if (totalUncompressedSize === 0) return 0
  return (archiveSize / totalUncompressedSize)
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

/**
 * 检查WebAssembly支持
 */
export function checkWebAssemblySupport(): boolean {
  try {
    if (typeof WebAssembly === 'object' && 
        typeof WebAssembly.instantiate === 'function') {
      // 检查SharedArrayBuffer支持 (某些压缩算法需要)
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined'
      
      if (!hasSharedArrayBuffer) {
        console.warn('SharedArrayBuffer not available. Some features may be limited.')
      }
      
      return true
    }
    return false
  } catch {
    return false
  }
}

/**
 * 获取支持的格式列表
 */
export function getSupportedFormats(): SupportedFormat[] {
  return ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']
}

/**
 * 清理资源
 */
export function cleanup(): void {
  // 在这里可以添加清理逻辑，如释放WebAssembly内存等
  console.log('LibArchive wrapper cleanup completed')
}