// import { vi } from 'vitest';

/**
 * 性能测试辅助工具
 */
export class PerformanceHelpers {
  private static measurements: Map<string, number> = new Map();

  // 开始性能测量
  static startMeasurement(label: string): void {
    this.measurements.set(label, performance.now());
  }

  // 结束性能测量并返回耗时
  static endMeasurement(label: string): number {
    const startTime = this.measurements.get(label);
    if (!startTime) {
      throw new Error(`No measurement started for label: ${label}`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    this.measurements.delete(label);
    
    return duration;
  }

  // 测量异步函数执行时间
  static async measureAsync<T>(
    fn: () => Promise<T>,
    label: string = 'async-operation'
  ): Promise<{ result: T; duration: number }> {
    this.startMeasurement(label);
    const result = await fn();
    const duration = this.endMeasurement(label);
    
    return { result, duration };
  }

  // 测量同步函数执行时间
  static measureSync<T>(
    fn: () => T,
    label: string = 'sync-operation'
  ): { result: T; duration: number } {
    this.startMeasurement(label);
    const result = fn();
    const duration = this.endMeasurement(label);
    
    return { result, duration };
  }

  // 模拟内存压力测试
  static simulateMemoryPressure(sizeMB: number): ArrayBuffer[] {
    const buffers: ArrayBuffer[] = [];
    const chunkSize = 1024 * 1024; // 1MB chunks
    
    for (let i = 0; i < sizeMB; i++) {
      const buffer = new ArrayBuffer(chunkSize);
      const view = new Uint8Array(buffer);
      
      // 填充数据以确保内存被实际占用
      for (let j = 0; j < chunkSize; j += 1024) {
        view[j] = Math.floor(Math.random() * 256);
      }
      
      buffers.push(buffer);
    }
    
    return buffers;
  }

  // 清理内存压力测试的缓冲区
  static cleanupMemoryPressure(buffers: ArrayBuffer[]): void {
    buffers.length = 0;
    
    // 强制垃圾回收 (在测试环境中)
    if (global.gc) {
      global.gc();
    }
  }

  // 监控内存使用情况
  static getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } {
    const memory = performance.memory || {
      usedJSHeapSize: 50 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
    };
    
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    };
  }

  // 等待内存稳定
  static async waitForMemoryStable(
    maxWaitMs: number = 5000
  ): Promise<void> {
    const startTime = performance.now();
    let lastMemoryUsage = this.getMemoryUsage().used;
    
    while (performance.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const currentMemoryUsage = this.getMemoryUsage().used;
      const memoryDiff = Math.abs(currentMemoryUsage - lastMemoryUsage);
      
      // 如果内存使用变化小于1MB，认为已稳定
      if (memoryDiff < 1024 * 1024) {
        return;
      }
      
      lastMemoryUsage = currentMemoryUsage;
    }
  }

  // 创建性能基准测试
  static createBenchmark(
    name: string,
    fn: () => Promise<void> | void,
    iterations: number = 100
  ) {
    return async () => {
      const durations: number[] = [];
      const memoryUsages: number[] = [];
      
      // 预热
      for (let i = 0; i < 5; i++) {
        await fn();
      }
      
      // 等待内存稳定
      await this.waitForMemoryStable();
      
      // 正式测试
      for (let i = 0; i < iterations; i++) {
        const initialMemory = this.getMemoryUsage().used;
        const startTime = performance.now();
        
        await fn();
        
        const endTime = performance.now();
        const finalMemory = this.getMemoryUsage().used;
        
        durations.push(endTime - startTime);
        memoryUsages.push(finalMemory - initialMemory);
      }
      
      // 计算统计信息
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
      
      return {
        name,
        iterations,
        duration: {
          average: avgDuration,
          min: minDuration,
          max: maxDuration,
          median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)]
        },
        memory: {
          average: avgMemory,
          peak: Math.max(...memoryUsages)
        }
      };
    };
  }

  // 性能断言辅助函数
  static expectPerformance(
    operation: () => Promise<any> | any,
    constraints: {
      maxDuration?: number;
      maxMemory?: number;    // bytes
      minThroughput?: number; // operations per second
    }
  ) {
    return async () => {
      const startTime = performance.now();
      const initialMemory = this.getMemoryUsage().used;
      
      await operation();
      
      const endTime = performance.now();
      const finalMemory = this.getMemoryUsage().used;
      
      const duration = endTime - startTime;
      const memoryUsed = finalMemory - initialMemory;
      
      if (constraints.maxDuration && duration > constraints.maxDuration) {
        throw new Error(
          `Operation took ${duration.toFixed(2)}ms, exceeding limit of ${constraints.maxDuration}ms`
        );
      }
      
      if (constraints.maxMemory && memoryUsed > constraints.maxMemory) {
        throw new Error(
          `Operation used ${(memoryUsed / 1024 / 1024).toFixed(2)}MB, exceeding limit of ${(constraints.maxMemory / 1024 / 1024).toFixed(2)}MB`
        );
      }
      
      if (constraints.minThroughput) {
        const throughput = 1000 / duration; // operations per second
        if (throughput < constraints.minThroughput) {
          throw new Error(
            `Operation throughput ${throughput.toFixed(2)} ops/sec is below minimum ${constraints.minThroughput} ops/sec`
          );
        }
      }
      
      return {
        duration,
        memoryUsed,
        throughput: 1000 / duration
      };
    };
  }

  // 生成性能报告
  static generatePerformanceReport(results: any[]): string {
    let report = '# Performance Test Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    results.forEach(result => {
      report += `## ${result.name}\n`;
      report += `- Iterations: ${result.iterations}\n`;
      report += `- Average Duration: ${result.duration.average.toFixed(2)}ms\n`;
      report += `- Min Duration: ${result.duration.min.toFixed(2)}ms\n`;
      report += `- Max Duration: ${result.duration.max.toFixed(2)}ms\n`;
      report += `- Median Duration: ${result.duration.median.toFixed(2)}ms\n`;
      report += `- Average Memory: ${(result.memory.average / 1024 / 1024).toFixed(2)}MB\n`;
      report += `- Peak Memory: ${(result.memory.peak / 1024 / 1024).toFixed(2)}MB\n\n`;
    });
    
    return report;
  }

  // 清理所有测量数据
  static cleanup(): void {
    this.measurements.clear();
  }
}

// 性能测试装饰器
export function benchmark(
  name: string,
  iterations: number = 100,
  constraints?: {
    maxDuration?: number;
    maxMemory?: number;
  }
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const benchmark = PerformanceHelpers.createBenchmark(
        name,
        () => originalMethod.apply(this, args),
        iterations
      );
      
      const result = await benchmark();
      
      // 检查约束条件
      if (constraints) {
        if (constraints.maxDuration && result.duration.average > constraints.maxDuration) {
          throw new Error(
            `Benchmark ${name} exceeded max duration: ${result.duration.average.toFixed(2)}ms > ${constraints.maxDuration}ms`
          );
        }
        
        if (constraints.maxMemory && result.memory.average > constraints.maxMemory) {
          throw new Error(
            `Benchmark ${name} exceeded max memory: ${(result.memory.average / 1024 / 1024).toFixed(2)}MB > ${(constraints.maxMemory / 1024 / 1024).toFixed(2)}MB`
          );
        }
      }
      
      return result;
    };
    
    return descriptor;
  };
}

export default PerformanceHelpers;