/**
 * 内存管理工具
 * 监控和管理应用程序的内存使用情况
 */

export interface MemoryInfo {
  used: number;
  total: number;
  limit: number;
  available: number;
}

export interface MemoryAllocation {
  id: string;
  size: number;
  timestamp: number;
  description?: string;
}

export class MemoryManager {
  private allocations = new Map<string, MemoryAllocation>();
  private memoryLimit: number;
  private gcThreshold: number;
  private checkInterval: number = 5000; // 5秒检查一次
  private intervalId?: NodeJS.Timeout;
  private onMemoryWarning?: (info: MemoryInfo) => void;
  private onMemoryError?: (error: Error) => void;

  constructor(
    memoryLimit: number = 2 * 1024 * 1024 * 1024, // 2GB默认限制
    gcThreshold: number = 0.8 // 80%时触发GC
  ) {
    this.memoryLimit = memoryLimit;
    this.gcThreshold = gcThreshold;
    this.startMonitoring();
  }

  /**
   * 分配内存块
   * @param size 内存大小（字节）
   * @param description 内存用途描述
   * @returns 分配ID
   */
  async allocate(size: number, description?: string): Promise<string> {
    const id = this.generateId();
    
    // 检查内存限制
    const currentUsage = this.getCurrentUsage();
    if (currentUsage + size > this.memoryLimit) {
      // 尝试强制垃圾回收
      await this.forceGC();
      
      const newUsage = this.getCurrentUsage();
      if (newUsage + size > this.memoryLimit) {
        throw new Error(`Memory allocation failed: would exceed limit (${this.formatBytes(size)} requested, ${this.formatBytes(this.memoryLimit - newUsage)} available)`);
      }
    }

    const allocation: MemoryAllocation = {
      id,
      size,
      timestamp: Date.now(),
      description
    };

    this.allocations.set(id, allocation);
    return id;
  }

  /**
   * 释放内存块
   * @param id 分配ID
   */
  free(id: string): void {
    this.allocations.delete(id);
  }

  /**
   * 释放所有内存块
   */
  freeAll(): void {
    this.allocations.clear();
  }

  /**
   * 获取当前内存使用情况
   * @returns 内存使用字节数
   */
  getCurrentUsage(): number {
    let total = 0;
    for (const allocation of this.allocations.values()) {
      total += allocation.size;
    }
    return total;
  }

  /**
   * 获取详细内存信息
   * @returns 内存信息对象
   */
  getMemoryInfo(): MemoryInfo {
    const used = this.getCurrentUsage();
    const limit = this.memoryLimit;
    const available = limit - used;
    
    // 尝试获取实际系统内存信息
    let total = limit;
    if (typeof (performance as any)?.memory?.totalJSHeapSize === 'number') {
      total = (performance as any).memory.totalJSHeapSize;
    }

    return {
      used,
      total,
      limit,
      available
    };
  }

  /**
   * 获取内存使用百分比
   * @returns 使用百分比 (0-1)
   */
  getUsagePercentage(): number {
    const used = this.getCurrentUsage();
    return used / this.memoryLimit;
  }

  /**
   * 强制垃圾回收
   */
  async forceGC(): Promise<void> {
    // 清理过期的分配记录
    this.cleanupExpiredAllocations();

    // 如果环境支持，触发垃圾回收
    if (typeof (global as any)?.gc === 'function') {
      (global as any).gc();
    }

    // 等待一小段时间让GC完成
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 清理过期的内存分配记录
   * @param maxAge 最大存活时间（毫秒），默认1小时
   */
  cleanupExpiredAllocations(maxAge: number = 3600000): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, allocation] of this.allocations.entries()) {
      if (now - allocation.timestamp > maxAge) {
        expired.push(id);
      }
    }

    expired.forEach(id => this.free(id));
  }

  /**
   * 获取所有内存分配记录
   * @returns 分配记录数组
   */
  getAllocations(): MemoryAllocation[] {
    return Array.from(this.allocations.values());
  }

  /**
   * 获取按大小排序的分配记录
   * @param descending 是否降序排列
   * @returns 排序后的分配记录
   */
  getAllocationsBySize(descending: boolean = true): MemoryAllocation[] {
    const allocations = this.getAllocations();
    return allocations.sort((a, b) => 
      descending ? b.size - a.size : a.size - b.size
    );
  }

  /**
   * 设置内存警告回调
   * @param callback 警告回调函数
   */
  onWarning(callback: (info: MemoryInfo) => void): void {
    this.onMemoryWarning = callback;
  }

  /**
   * 设置内存错误回调
   * @param callback 错误回调函数
   */
  onError(callback: (error: Error) => void): void {
    this.onMemoryError = callback;
  }

  /**
   * 开始内存监控
   */
  private startMonitoring(): void {
    if (this.intervalId) {return;}

    this.intervalId = setInterval(() => {
      this.checkMemoryUsage();
    }, this.checkInterval);
  }

  /**
   * 停止内存监控
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * 检查内存使用情况
   */
  private checkMemoryUsage(): void {
    try {
      const usage = this.getUsagePercentage();
      const info = this.getMemoryInfo();

      // 超过阈值时发出警告
      if (usage > this.gcThreshold && this.onMemoryWarning) {
        this.onMemoryWarning(info);
      }

      // 接近限制时自动清理
      if (usage > 0.9) {
        this.cleanupExpiredAllocations();
      }
    } catch (error) {
      if (this.onMemoryError) {
        this.onMemoryError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * 生成唯一ID
   * @returns 唯一标识符
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 格式化字节数为可读字符串
   * @param bytes 字节数
   * @returns 格式化字符串
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * 销毁内存管理器
   */
  destroy(): void {
    this.stopMonitoring();
    this.freeAll();
    this.onMemoryWarning = undefined;
    this.onMemoryError = undefined;
  }

  /**
   * 获取内存统计信息
   * @returns 统计信息对象
   */
  getStats(): {
    totalAllocations: number;
    currentUsage: string;
    memoryLimit: string;
    usagePercentage: string;
    largestAllocation: string;
    oldestAllocation: number | null;
  } {
    const allocations = this.getAllocations();
    const usage = this.getCurrentUsage();
    const largest = allocations.length > 0 
      ? Math.max(...allocations.map(a => a.size))
      : 0;
    const oldest = allocations.length > 0
      ? Math.min(...allocations.map(a => a.timestamp))
      : null;

    return {
      totalAllocations: allocations.length,
      currentUsage: this.formatBytes(usage),
      memoryLimit: this.formatBytes(this.memoryLimit),
      usagePercentage: `${(this.getUsagePercentage() * 100).toFixed(2)}%`,
      largestAllocation: this.formatBytes(largest),
      oldestAllocation: oldest
    };
  }
}