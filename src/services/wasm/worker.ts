/**
 * WebAssembly Worker
 * 
 * 这个Worker在后台线程中处理压缩文件解析和提取，避免阻塞主线程
 */

import { 
  initializeLibArchive, 
  parseArchiveStructure, 
  extractSingleFile, 
  extractMultipleFiles,
  detectArchiveFormat 
} from './libarchive-wrapper'
import { ExtractionProgress } from '@/types'

// Worker消息类型定义
export interface WorkerMessage {
  id: string
  type: 'init' | 'parse' | 'extract-single' | 'extract-multiple' | 'detect-format'
  payload?: any
}

export interface WorkerResponse {
  id: string
  type: 'success' | 'error' | 'progress'
  payload?: any
  error?: string
}

// 初始化状态
let isInitialized = false

// 处理来自主线程的消息
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data

  try {
    switch (type) {
      case 'init':
        await handleInit(id)
        break
      
      case 'parse':
        await handleParseArchive(id, payload)
        break
      
      case 'extract-single':
        await handleExtractSingle(id, payload)
        break
      
      case 'extract-multiple':
        await handleExtractMultiple(id, payload)
        break
      
      case 'detect-format':
        await handleDetectFormat(id, payload)
        break
      
      default:
        sendError(id, `Unknown message type: ${type}`)
    }
  } catch (error) {
    sendError(id, `Worker error: ${error}`)
  }
})

/**
 * 初始化WebAssembly模块
 */
async function handleInit(id: string): Promise<void> {
  if (isInitialized) {
    sendSuccess(id, { initialized: true })
    return
  }

  try {
    await initializeLibArchive()
    isInitialized = true
    sendSuccess(id, { initialized: true })
  } catch (error) {
    sendError(id, `Initialization failed: ${error}`)
  }
}

/**
 * 解析压缩文件结构
 */
async function handleParseArchive(id: string, payload: {
  fileBuffer: ArrayBuffer
  fileName: string
  password?: string
}): Promise<void> {
  if (!isInitialized) {
    sendError(id, 'Worker not initialized')
    return
  }

  const { fileBuffer, fileName, password } = payload

  try {
    const archive = await parseArchiveStructure(
      fileBuffer,
      fileName,
      password,
      (progress) => sendProgress(id, progress)
    )
    
    sendSuccess(id, { archive })
  } catch (error) {
    sendError(id, `Parse failed: ${error}`)
  }
}

/**
 * 提取单个文件
 */
async function handleExtractSingle(id: string, payload: {
  fileBuffer: ArrayBuffer
  filePath: string
  password?: string
}): Promise<void> {
  if (!isInitialized) {
    sendError(id, 'Worker not initialized')
    return
  }

  const { fileBuffer, filePath, password } = payload

  try {
    const extractedData = await extractSingleFile(
      fileBuffer,
      filePath,
      password,
      (progress) => sendProgress(id, progress)
    )
    
    sendSuccess(id, { 
      filePath, 
      data: extractedData,
      size: extractedData.byteLength 
    })
  } catch (error) {
    sendError(id, `Extract single file failed: ${error}`)
  }
}

/**
 * 批量提取文件
 */
async function handleExtractMultiple(id: string, payload: {
  fileBuffer: ArrayBuffer
  filePaths: string[]
  password?: string
}): Promise<void> {
  if (!isInitialized) {
    sendError(id, 'Worker not initialized')
    return
  }

  const { fileBuffer, filePaths, password } = payload

  try {
    const extractedFiles = await extractMultipleFiles(
      fileBuffer,
      filePaths,
      password,
      (progress) => sendProgress(id, progress)
    )
    
    // 将Map转换为普通对象以便序列化
    const filesObject: Record<string, ArrayBuffer> = {}
    extractedFiles.forEach((data, path) => {
      filesObject[path] = data
    })
    
    sendSuccess(id, { 
      files: filesObject,
      count: filePaths.length 
    })
  } catch (error) {
    sendError(id, `Extract multiple files failed: ${error}`)
  }
}

/**
 * 检测文件格式
 */
async function handleDetectFormat(id: string, payload: {
  fileBuffer: ArrayBuffer
}): Promise<void> {
  try {
    const format = detectArchiveFormat(payload.fileBuffer)
    sendSuccess(id, { format })
  } catch (error) {
    sendError(id, `Format detection failed: ${error}`)
  }
}

/**
 * 发送成功响应
 */
function sendSuccess(id: string, payload: any): void {
  const response: WorkerResponse = {
    id,
    type: 'success',
    payload
  }
  self.postMessage(response)
}

/**
 * 发送错误响应
 */
function sendError(id: string, error: string): void {
  const response: WorkerResponse = {
    id,
    type: 'error',
    error
  }
  self.postMessage(response)
}

/**
 * 发送进度更新
 */
function sendProgress(id: string, progress: ExtractionProgress): void {
  const response: WorkerResponse = {
    id,
    type: 'progress',
    payload: progress
  }
  self.postMessage(response)
}

// 处理未捕获的错误
self.addEventListener('error', (event) => {
  console.error('Worker error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('Worker unhandled rejection:', event.reason)
})

// Types are already exported above