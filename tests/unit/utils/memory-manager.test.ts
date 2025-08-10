import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryManager } from '@/utils/memory-manager';

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    memoryManager = new MemoryManager();
    // 模拟performance.memory API
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 10 * 1024 * 1024, // 10MB for test efficiency
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
      },
      configurable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('内存分配', () => {
    it('应该成功分配内存', async () => {
      const size = 10 * 1024 * 1024; // 10MB
      const id = await memoryManager.allocate(size, 'normal', 'archive');
      
      expect(id).toBeDefined();
      expect(memoryManager.getCurrentUsage()).toBe(size);
      expect(memoryManager.getAllocations().has(id)).toBe(true);
    });

    it('应该记录分配详情', async () => {
      const size = 5 * 1024 * 1024; // 5MB
      const priority = 'high';
      const type = 'preview';
      
      const id = await memoryManager.allocate(size, priority, type);
      const allocation = memoryManager.getAllocations().get(id);
      
      expect(allocation).toMatchObject({
        size,
        priority,
        type,
        accessCount: 0
      });
      expect(allocation.timestamp).toBeCloseTo(Date.now(), -2);
    });

    it('应该支持不同优先级', async () => {
      const priorities = ['low', 'normal', 'high'] as const;
      
      for (const priority of priorities) {
        const id = await memoryManager.allocate(1024 * 1024, priority, 'test');
        const allocation = memoryManager.getAllocations().get(id);
        expect(allocation.priority).toBe(priority);
      }
    });
  });

  describe('内存释放', () => {
    it('应该释放已分配的内存', async () => {
      const size = 10 * 1024 * 1024;
      const id = await memoryManager.allocate(size);
      
      expect(memoryManager.getCurrentUsage()).toBe(size);
      
      memoryManager.free(id);
      
      expect(memoryManager.getCurrentUsage()).toBe(0);
      expect(memoryManager.getAllocations().has(id)).toBe(false);
    });

    it('应该处理无效ID的释放', () => {
      const invalidId = 'invalid-id';
      
      expect(() => {
        memoryManager.free(invalidId);
      }).not.toThrow();
      
      expect(memoryManager.getCurrentUsage()).toBe(0);
    });

    it('应该支持批量释放', async () => {
      const ids = [];
      const size = 5 * 1024 * 1024;
      
      // 分配多个内存块
      for (let i = 0; i < 5; i++) {
        const id = await memoryManager.allocate(size);
        ids.push(id);
      }
      
      expect(memoryManager.getCurrentUsage()).toBe(size * 5);
      
      memoryManager.freeMultiple(ids);
      
      expect(memoryManager.getCurrentUsage()).toBe(0);
      expect(memoryManager.getAllocations().size).toBe(0);
    });
  });

  describe('垃圾回收', () => {
    it('应该在内存不足时触发GC', async () => {
      const maxMemory = memoryManager.getMaxMemory();
      const largeSize = maxMemory + 1024 * 1024; // 超出限制1MB
      
      // 先分配一些内存
      await memoryManager.allocate(maxMemory * 0.5, 'low', 'temp');
      await memoryManager.allocate(maxMemory * 0.4, 'low', 'temp');
      
      // 尝试分配超出限制的内存，应该触发GC
      const id = await memoryManager.allocate(largeSize, 'high', 'important');
      
      expect(id).toBeDefined();
      expect(memoryManager.getCurrentUsage()).toBeLessThan(maxMemory);
    });

    it('应该使用LRU策略驱逐内存', async () => {
      const size = 20 * 1024 * 1024; // 20MB
      
      // 分配三个内存块
      const id1 = await memoryManager.allocate(size, 'normal', 'old');
      await new Promise(resolve => setTimeout(resolve, 10)); // 确保时间戳不同
      
      const id2 = await memoryManager.allocate(size, 'normal', 'medium');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const id3 = await memoryManager.allocate(size, 'normal', 'new');
      
      // 访问第一个块，更新其访问时间
      memoryManager.updateAccess(id1);
      
      // 强制触发GC
      memoryManager.forceGC(size);
      
      // id2应该被驱逐（最旧且未被访问）
      expect(memoryManager.getAllocations().has(id1)).toBe(true);
      expect(memoryManager.getAllocations().has(id2)).toBe(false);
      expect(memoryManager.getAllocations().has(id3)).toBe(true);
    });

    it('应该考虑优先级进行驱逐', async () => {
      const size = 30 * 1024 * 1024;
      
      // 分配不同优先级的内存
      const lowId = await memoryManager.allocate(size, 'low', 'temp');
      const highId = await memoryManager.allocate(size, 'high', 'important');
      const normalId = await memoryManager.allocate(size, 'normal', 'regular');
      
      // 强制GC，应该优先驱逐低优先级
      memoryManager.forceGC(size);
      
      expect(memoryManager.getAllocations().has(lowId)).toBe(false);
      expect(memoryManager.getAllocations().has(highId)).toBe(true);
      expect(memoryManager.getAllocations().has(normalId)).toBe(true);
    });
  });

  describe('内存监控', () => {
    it('应该监控内存使用情况', () => {
      const stats = memoryManager.getUsageStats();
      
      expect(stats).toMatchObject({
        currentUsage: 0,
        maxMemory: expect.any(Number),
        allocationsCount: 0,
        gcCount: 0
      });
    });

    it('应该计算内存使用率', async () => {
      const maxMemory = memoryManager.getMaxMemory();
      const size = maxMemory * 0.5;
      
      await memoryManager.allocate(size);
      
      const usageRate = memoryManager.getUsageRate();
      expect(usageRate).toBeCloseTo(0.5, 1);
    });

    it('应该检测内存压力', async () => {
      const maxMemory = memoryManager.getMaxMemory();
      
      // 低内存使用
      await memoryManager.allocate(maxMemory * 0.3);
      expect(memoryManager.getMemoryPressure()).toBe('low');
      
      // 中等内存使用
      await memoryManager.allocate(maxMemory * 0.3);
      expect(memoryManager.getMemoryPressure()).toBe('medium');
      
      // 高内存使用
      await memoryManager.allocate(maxMemory * 0.3);
      expect(memoryManager.getMemoryPressure()).toBe('high');
    });
  });

  describe('事件监听', () => {
    it('应该触发内存分配事件', async () => {
      const mockListener = vi.fn();
      memoryManager.on('allocate', mockListener);
      
      const size = 10 * 1024 * 1024;
      const id = await memoryManager.allocate(size);
      
      expect(mockListener).toHaveBeenCalledWith({
        type: 'allocate',
        id,
        size,
        currentUsage: size
      });
    });

    it('应该触发内存释放事件', async () => {
      const mockListener = vi.fn();
      memoryManager.on('free', mockListener);
      
      const size = 10 * 1024 * 1024;
      const id = await memoryManager.allocate(size);
      memoryManager.free(id);
      
      expect(mockListener).toHaveBeenCalledWith({
        type: 'free',
        id,
        size,
        currentUsage: 0
      });
    });

    it('应该触发GC事件', async () => {
      const mockListener = vi.fn();
      memoryManager.on('gc', mockListener);
      
      // 触发GC
      const maxMemory = memoryManager.getMaxMemory();
      await memoryManager.allocate(maxMemory * 0.9, 'low');
      await memoryManager.allocate(maxMemory * 0.2, 'high'); // 应该触发GC
      
      expect(mockListener).toHaveBeenCalledWith({
        type: 'gc',
        freedSize: expect.any(Number),
        allocationsEvicted: expect.any(Number)
      });
    });
  });

  describe('异常处理', () => {
    it('应该处理内存分配失败', async () => {
      const maxMemory = memoryManager.getMaxMemory();
      const oversizeAllocation = maxMemory * 2;
      
      await expect(async () => {
        await memoryManager.allocate(oversizeAllocation, 'high', 'huge');
      }).rejects.toThrow('Insufficient memory available');
    });

    it('应该处理负数内存分配', async () => {
      await expect(async () => {
        await memoryManager.allocate(-1024);
      }).rejects.toThrow('Invalid allocation size');
    });

    it('应该处理零字节分配', async () => {
      await expect(async () => {
        await memoryManager.allocate(0);
      }).rejects.toThrow('Invalid allocation size');
    });
  });

  describe('性能测试', () => {
    it('应该快速处理小内存分配', async () => {
      const startTime = performance.now();
      
      // 分配100个小内存块
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(memoryManager.allocate(1024 * 1024)); // 1MB each
      }
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      expect(totalTime).toBeLessThan(100); // 应该在100ms内完成
    });

    it('应该高效执行GC操作', async () => {
      // 分配大量小内存块
      const ids = [];
      for (let i = 0; i < 1000; i++) {
        const id = await memoryManager.allocate(100 * 1024); // 100KB each
        ids.push(id);
      }
      
      const startTime = performance.now();
      
      // 执行GC
      memoryManager.forceGC(50 * 1024 * 1024); // 释放50MB
      
      const endTime = performance.now();
      const gcTime = endTime - startTime;
      
      expect(gcTime).toBeLessThan(50); // GC应该在50ms内完成
    });
  });
});