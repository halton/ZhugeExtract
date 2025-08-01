import { performance } from 'perf_hooks';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * 基准测试运行器
 * 用于执行性能基准测试并生成报告
 */
export class BenchmarkRunner {
  private results: BenchmarkResult[] = [];
  private startTime: number = 0;

  // 基准测试结果接口
  interface BenchmarkResult {
    name: string;
    iterations: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    medianTime: number;
    operationsPerSecond: number;
    memoryUsage: {
      initial: number;
      peak: number;
      final: number;
      delta: number;
    };
    metadata?: Record<string, any>;
  }

  // 运行基准测试
  async runBenchmark(
    name: string,
    testFunction: () => Promise<void> | void,
    options: {
      iterations?: number;
      warmupIterations?: number;
      measureMemory?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<BenchmarkResult> {
    const {
      iterations = 1000,
      warmupIterations = 10,
      measureMemory = true,
      metadata = {}
    } = options;

    console.log(`🏃‍♂️ 运行基准测试: ${name}`);
    console.log(`   迭代次数: ${iterations}`);
    console.log(`   预热次数: ${warmupIterations}`);

    // 预热阶段
    console.log('🔥 预热中...');
    for (let i = 0; i < warmupIterations; i++) {
      await testFunction();
    }

    // 等待垃圾回收
    if (global.gc) {
      global.gc();
    }
    await this.sleep(100);

    // 记录初始内存
    const initialMemory = measureMemory ? this.getMemoryUsage() : 0;
    let peakMemory = initialMemory;

    // 正式测试
    console.log('⚡ 开始基准测试...');
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await testFunction();
      const endTime = performance.now();
      
      times.push(endTime - startTime);
      
      // 更新内存峰值
      if (measureMemory) {
        const currentMemory = this.getMemoryUsage();
        if (currentMemory > peakMemory) {
          peakMemory = currentMemory;
        }
      }

      // 进度报告
      if ((i + 1) % Math.max(1, Math.floor(iterations / 10)) === 0) {
        const progress = ((i + 1) / iterations * 100).toFixed(1);
        console.log(`   进度: ${progress}%`);
      }
    }

    // 记录最终内存
    const finalMemory = measureMemory ? this.getMemoryUsage() : 0;

    // 计算统计数据
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const sortedTimes = times.sort((a, b) => a - b);
    const medianTime = sortedTimes[Math.floor(sortedTimes.length / 2)];
    const operationsPerSecond = 1000 / averageTime;

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      medianTime,
      operationsPerSecond,
      memoryUsage: {
        initial: initialMemory,
        peak: peakMemory,
        final: finalMemory,
        delta: finalMemory - initialMemory
      },
      metadata
    };

    this.results.push(result);
    this.printResult(result);
    
    return result;
  }

  // 运行压缩解压基准测试
  async runCompressionBenchmark(
    archiveData: ArrayBuffer,
    archiveFormat: string
  ) {
    const testCases = [
      {
        name: `${archiveFormat.toUpperCase()} - 格式检测`,
        test: async () => {
          // 模拟格式检测
          const view = new Uint8Array(archiveData.slice(0, 16));
          return this.detectFormat(view);
        }
      },
      {
        name: `${archiveFormat.toUpperCase()} - 文件列表获取`,
        test: async () => {
          // 模拟获取文件列表
          await this.sleep(Math.random() * 10);
          return Array.from({ length: 10 }, (_, i) => `file-${i}.txt`);
        }
      },
      {
        name: `${archiveFormat.toUpperCase()} - 单文件解压`,
        test: async () => {
          // 模拟单文件解压
          await this.sleep(Math.random() * 20);
          return new Uint8Array(1024);
        }
      },
      {
        name: `${archiveFormat.toUpperCase()} - 全部解压`,
        test: async () => {
          // 模拟全部文件解压
          await this.sleep(Math.random() * 50);
          return Array.from({ length: 10 }, () => new Uint8Array(1024));
        }
      }
    ];

    const results = [];
    for (const testCase of testCases) {
      const result = await this.runBenchmark(
        testCase.name, 
        testCase.test,
        {
          iterations: 100,
          metadata: {
            archiveSize: archiveData.byteLength,
            format: archiveFormat
          }
        }
      );
      results.push(result);
    }

    return results;
  }

  // 运行内存压力测试
  async runMemoryStressTest(maxMemoryMB: number = 100) {
    const chunkSize = 1024 * 1024; // 1MB
    const chunks: ArrayBuffer[] = [];

    return await this.runBenchmark(
      `内存压力测试 (${maxMemoryMB}MB)`,
      async () => {
        // 分配内存
        if (chunks.length < maxMemoryMB) {
          const chunk = new ArrayBuffer(chunkSize);
          const view = new Uint8Array(chunk);
          // 写入数据确保内存被占用
          for (let i = 0; i < chunkSize; i += 1024) {
            view[i] = Math.floor(Math.random() * 256);
          }
          chunks.push(chunk);
        }

        // 随机访问已分配的内存
        if (chunks.length > 0) {
          const randomChunk = chunks[Math.floor(Math.random() * chunks.length)];
          const view = new Uint8Array(randomChunk);
          const sum = Array.from(view.slice(0, 1024)).reduce((a, b) => a + b, 0);
        }

        // 定期清理一些内存
        if (chunks.length > maxMemoryMB * 0.8 && Math.random() < 0.1) {
          chunks.splice(0, Math.floor(chunks.length * 0.1));
        }
      },
      {
        iterations: 1000,
        measureMemory: true,
        metadata: {
          maxMemoryMB,
          testType: 'memory-stress'
        }
      }
    );
  }

  // 生成性能报告
  generateReport(): string {
    const report: string[] = [];
    
    report.push('# ZhugeExtract 性能基准测试报告');
    report.push('');
    report.push(`生成时间: ${new Date().toISOString()}`);
    report.push(`总测试数: ${this.results.length}`);
    report.push('');

    // 汇总统计
    report.push('## 测试汇总');
    report.push('');
    report.push('| 测试名称 | 迭代次数 | 平均耗时(ms) | 最小耗时(ms) | 最大耗时(ms) | OPS | 内存变化(MB) |');
    report.push('|---------|---------|-------------|-------------|-------------|-----|-------------|');

    for (const result of this.results) {
      const memoryDeltaMB = (result.memoryUsage.delta / 1024 / 1024).toFixed(2);
      report.push(
        `| ${result.name} | ${result.iterations} | ${result.averageTime.toFixed(2)} | ${result.minTime.toFixed(2)} | ${result.maxTime.toFixed(2)} | ${result.operationsPerSecond.toFixed(0)} | ${memoryDeltaMB} |`
      );
    }

    report.push('');

    // 详细结果
    report.push('## 详细测试结果');
    report.push('');

    for (const result of this.results) {
      report.push(`### ${result.name}`);
      report.push('');
      report.push(`- **迭代次数**: ${result.iterations}`);
      report.push(`- **总耗时**: ${result.totalTime.toFixed(2)}ms`);
      report.push(`- **平均耗时**: ${result.averageTime.toFixed(2)}ms`);
      report.push(`- **最小耗时**: ${result.minTime.toFixed(2)}ms`);
      report.push(`- **最大耗时**: ${result.maxTime.toFixed(2)}ms`);
      report.push(`- **中位数耗时**: ${result.medianTime.toFixed(2)}ms`);
      report.push(`- **每秒操作数**: ${result.operationsPerSecond.toFixed(0)} ops/sec`);
      report.push('');
      report.push('**内存使用情况**:');
      report.push(`- 初始内存: ${(result.memoryUsage.initial / 1024 / 1024).toFixed(2)}MB`);
      report.push(`- 峰值内存: ${(result.memoryUsage.peak / 1024 / 1024).toFixed(2)}MB`);
      report.push(`- 最终内存: ${(result.memoryUsage.final / 1024 / 1024).toFixed(2)}MB`);
      report.push(`- 内存变化: ${(result.memoryUsage.delta / 1024 / 1024).toFixed(2)}MB`);
      report.push('');

      if (result.metadata && Object.keys(result.metadata).length > 0) {
        report.push('**元数据**:');
        for (const [key, value] of Object.entries(result.metadata)) {
          report.push(`- ${key}: ${value}`);
        }
        report.push('');
      }
    }

    return report.join('\n');
  }

  // 保存报告到文件
  saveReport(filePath?: string): string {
    const report = this.generateReport();
    const outputPath = filePath || join(process.cwd(), 'benchmark-results', `benchmark-${Date.now()}.md`);
    
    writeFileSync(outputPath, report, 'utf8');
    console.log(`📊 基准测试报告已保存到: ${outputPath}`);
    
    return outputPath;
  }

  // 清空结果
  clearResults(): void {
    this.results = [];
  }

  // 获取所有结果
  getResults(): BenchmarkResult[] {
    return [...this.results];
  }

  // 私有辅助方法
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    
    // Node.js环境
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    
    return 0;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printResult(result: BenchmarkResult): void {
    console.log(`✅ ${result.name} 完成:`);
    console.log(`   平均: ${result.averageTime.toFixed(2)}ms`);
    console.log(`   范围: ${result.minTime.toFixed(2)}ms - ${result.maxTime.toFixed(2)}ms`);
    console.log(`   OPS: ${result.operationsPerSecond.toFixed(0)}`);
    console.log(`   内存变化: ${(result.memoryUsage.delta / 1024 / 1024).toFixed(2)}MB`);
    console.log('');
  }

  private detectFormat(signature: Uint8Array): string {
    // ZIP
    if (signature[0] === 0x50 && signature[1] === 0x4b) return 'zip';
    // RAR
    if (signature[0] === 0x52 && signature[1] === 0x61) return 'rar';
    // 7Z
    if (signature[0] === 0x37 && signature[1] === 0x7a) return '7z';
    // TAR
    if (signature[257] === 0x75 && signature[258] === 0x73) return 'tar';
    // GZIP
    if (signature[0] === 0x1f && signature[1] === 0x8b) return 'gz';
    
    return 'unknown';
  }
}

// 导出单例实例
export const benchmarkRunner = new BenchmarkRunner();