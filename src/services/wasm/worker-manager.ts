/**
 * WebAssembly Worker Manager
 * 
 * 管理WebAssembly Worker的生命周期，提供队列处理和错误恢复
 */

import { Archive, ExtractionProgress, SupportedFormat } from '@/types'
import type { WorkerMessage, WorkerResponse } from './worker'

interface PendingTask {
  id: string
  resolve: (value: any) => void
  reject: (error: Error) => void
  onProgress?: (progress: ExtractionProgress) => void
}

export class WorkerManager {
  private worker: Worker | null = null
  private isInitialized = false
  private pendingTasks = new Map<string, PendingTask>()
  private taskIdCounter = 0
  private maxRetries = 3
  private retryCount = 0

  constructor() {
    this.initializeWorker()
  }

  /**
   * 初始化Worker
   */
  private async initializeWorker(): Promise<void> {
    try {
      // 创建Worker
      this.worker = new Worker(
        new URL('./worker.ts', import.meta.url),
        { type: 'module' }
      )

      // 监听Worker消息
      this.worker.addEventListener('message', this.handleWorkerMessage.bind(this))
      this.worker.addEventListener('error', this.handleWorkerError.bind(this))

      // 初始化WebAssembly模块
      await this.sendMessage('init', {})
      this.isInitialized = true
      this.retryCount = 0

      console.log('WebAssembly Worker initialized successfully')
    } catch (error) {
      console.error('Failed to initialize WebAssembly Worker:', error)
      throw new Error(`Worker initialization failed: ${error}`)
    }
  }

  /**
   * 检测压缩文件格式
   */
  async detectFormat(fileBuffer: ArrayBuffer): Promise<SupportedFormat> {
    this.ensureInitialized()
    
    const result = await this.sendMessage('detect-format', { fileBuffer })
    return result.format
  }

  /**
   * 解析压缩文件结构
   */
  async parseArchive(
    fileBuffer: ArrayBuffer,
    fileName: string,
    password?: string,
    onProgress?: (progress: ExtractionProgress) => void
  ): Promise<Archive> {
    this.ensureInitialized()
    
    const result = await this.sendMessage('parse', {
      fileBuffer,
      fileName,
      password
    }, onProgress)
    
    return result.archive
  }

  /**
   * 提取单个文件
   */
  async extractSingleFile(
    fileBuffer: ArrayBuffer,
    filePath: string,
    password?: string,
    onProgress?: (progress: ExtractionProgress) => void
  ): Promise<ArrayBuffer> {
    this.ensureInitialized()
    
    const result = await this.sendMessage('extract-single', {
      fileBuffer,
      filePath,
      password
    }, onProgress)
    
    return result.data
  }

  /**
   * 批量提取文件
   */
  async extractMultipleFiles(
    fileBuffer: ArrayBuffer,
    filePaths: string[],
    password?: string,
    onProgress?: (progress: ExtractionProgress) => void
  ): Promise<Map<string, ArrayBuffer>> {
    this.ensureInitialized()
    
    const result = await this.sendMessage('extract-multiple', {
      fileBuffer,
      filePaths,
      password
    }, onProgress)
    
    // 将对象转换回Map
    const filesMap = new Map<string, ArrayBuffer>()
    Object.entries(result.files).forEach(([path, data]) => {
      filesMap.set(path, data as ArrayBuffer)
    })
    
    return filesMap
  }

  /**
   * 发送消息到Worker
   */
  private async sendMessage(
    type: 'init' | 'parse' | 'extract-single' | 'extract-multiple' | 'detect-format', 
    payload: any, 
    onProgress?: (progress: ExtractionProgress) => void
  ): Promise<any> {
    if (!this.worker) {
      throw new Error('Worker not available')
    }

    const id = this.generateTaskId()
    
    return new Promise((resolve, reject) => {
      // 存储待处理任务
      this.pendingTasks.set(id, {
        id,
        resolve,
        reject,
        onProgress
      })

      // 发送消息
      const message: WorkerMessage = { id, type, payload }
      this.worker!.postMessage(message)

      // 设置超时
      setTimeout(() => {
        if (this.pendingTasks.has(id)) {
          this.pendingTasks.delete(id)
          reject(new Error(`Task ${id} timed out`))
        }
      }, 60000) // 60秒超时
    })
  }

  /**
   * 处理Worker消息
   */
  private handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const { id, type, payload, error } = event.data
    const task = this.pendingTasks.get(id)
    
    if (!task) {
      console.warn(`Received message for unknown task: ${id}`)
      return
    }

    switch (type) {
      case 'success':
        this.pendingTasks.delete(id)
        task.resolve(payload)
        break
      
      case 'error':
        this.pendingTasks.delete(id)
        task.reject(new Error(error || 'Unknown worker error'))
        break
      
      case 'progress':
        if (task.onProgress && payload) {
          task.onProgress(payload as ExtractionProgress)
        }
        break
      
      default:
        console.warn(`Unknown response type: ${type}`)
    }
  }

  /**
   * 处理Worker错误
   */
  private async handleWorkerError(event: ErrorEvent): Promise<void> {
    console.error('Worker error:', event.error)
    
    // 拒绝所有待处理的任务
    this.pendingTasks.forEach(task => {
      task.reject(new Error('Worker crashed'))
    })
    this.pendingTasks.clear()
    
    // 尝试重新初始化Worker
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      console.log(`Attempting to restart worker (${this.retryCount}/${this.maxRetries})`)
      
      try {
        await this.restartWorker()
      } catch (error) {
        console.error('Failed to restart worker:', error)
      }
    } else {
      console.error('Max retry attempts reached. Worker will not be restarted.')
      this.isInitialized = false
    }
  }

  /**
   * 重启Worker
   */
  private async restartWorker(): Promise<void> {
    // 终止现有Worker
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    
    this.isInitialized = false
    
    // 重新初始化
    await this.initializeWorker()
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${++this.taskIdCounter}_${Date.now()}`
  }

  /**
   * 确保Worker已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Worker not initialized. Please wait for initialization to complete.')
    }
  }

  /**
   * 获取Worker状态
   */
  getStatus(): {
    isInitialized: boolean
    pendingTasks: number
    retryCount: number
  } {
    return {
      isInitialized: this.isInitialized,
      pendingTasks: this.pendingTasks.size,
      retryCount: this.retryCount
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    // 拒绝所有待处理的任务
    this.pendingTasks.forEach(task => {
      task.reject(new Error('Worker manager destroyed'))
    })
    this.pendingTasks.clear()

    // 终止Worker
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }

    this.isInitialized = false
    console.log('WebAssembly Worker Manager destroyed')
  }
}

// 单例实例
let workerManagerInstance: WorkerManager | null = null

/**
 * 获取Worker Manager单例
 */
export function getWorkerManager(): WorkerManager {
  if (!workerManagerInstance) {
    workerManagerInstance = new WorkerManager()
  }
  return workerManagerInstance
}

/**
 * 销毁Worker Manager单例
 */
export function destroyWorkerManager(): void {
  if (workerManagerInstance) {
    workerManagerInstance.destroy()
    workerManagerInstance = null
  }
}