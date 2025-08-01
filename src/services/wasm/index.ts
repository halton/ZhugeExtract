/**
 * WebAssembly Services Index
 * 
 * 导出所有WebAssembly相关的服务和工具
 */

export { WorkerManager, getWorkerManager, destroyWorkerManager } from './worker-manager'
export { 
  initializeLibArchive,
  parseArchiveStructure,
  extractSingleFile,
  extractMultipleFiles,
  detectArchiveFormat,
  checkWebAssemblySupport,
  getSupportedFormats,
  cleanup
} from './libarchive-wrapper'
export type { WorkerMessage, WorkerResponse } from './worker'

// 重新导出常用功能的便捷接口
import { getWorkerManager } from './worker-manager'
import { checkWebAssemblySupport, getSupportedFormats } from './libarchive-wrapper'

/**
 * 初始化WebAssembly环境
 */
export async function initializeWebAssembly(): Promise<{
  isSupported: boolean
  supportedFormats: string[]
  workerReady: boolean
}> {
  const isSupported = checkWebAssemblySupport()
  
  if (!isSupported) {
    throw new Error('WebAssembly is not supported in this environment')
  }

  try {
    // 获取Worker Manager实例（这会自动初始化）
    const workerManager = getWorkerManager()
    
    // 等待一小段时间确保初始化完成
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const status = workerManager.getStatus()
    
    return {
      isSupported: true,
      supportedFormats: getSupportedFormats(),
      workerReady: status.isInitialized
    }
  } catch (error) {
    console.error('WebAssembly initialization failed:', error)
    throw error
  }
}

/**
 * 检查WebAssembly环境状态
 */
export function getWebAssemblyStatus(): {
  isSupported: boolean
  workerStatus: {
    isInitialized: boolean
    pendingTasks: number
    retryCount: number
  } | null
} {
  const isSupported = checkWebAssemblySupport()
  let workerStatus = null
  
  try {
    const workerManager = getWorkerManager()
    workerStatus = workerManager.getStatus()
  } catch {
    // Worker Manager可能还未初始化
  }
  
  return {
    isSupported,
    workerStatus
  }
}