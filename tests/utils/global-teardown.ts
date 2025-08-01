import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 开始全局测试清理...');

  // 清理临时测试文件
  const tempDirs = [
    'tests/fixtures/temp',
    'test-results/temp'
  ];

  for (const dir of tempDirs) {
    const fullPath = path.resolve(dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }

  // 生成测试报告摘要
  generateTestSummary();

  console.log('✅ 全局测试清理完成');
}

function generateTestSummary() {
  const summaryPath = path.resolve('test-results/summary.json');
  const summary = {
    timestamp: new Date().toISOString(),
    testRun: 'completed',
    environment: process.env.NODE_ENV || 'test',
    artifacts: {
      screenshots: fs.existsSync('test-results/screenshots'),
      videos: fs.existsSync('test-results/videos'),
      coverage: fs.existsSync('coverage'),
      htmlReport: fs.existsSync('playwright-report')
    }
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log('📊 测试摘要已生成');
}

export default globalTeardown;