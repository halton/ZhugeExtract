import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 开始全局测试设置...');

  // 创建测试结果目录
  const testDirs = [
    'test-results',
    'test-results/e2e-artifacts',
    'test-results/screenshots',
    'test-results/videos',
    'playwright-report',
    'coverage'
  ];

  for (const dir of testDirs) {
    const fullPath = path.resolve(dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }

  // 启动浏览器进行预热
  const browser = await chromium.launch({
    args: [
      '--enable-features=SharedArrayBuffer',
      '--cross-origin-embedder-policy=require-corp',
      '--cross-origin-opener-policy=same-origin'
    ]
  });

  // 创建测试页面并预加载
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // 预热应用
    await page.goto('http://localhost:4173');
    await page.waitForLoadState('networkidle');
  } catch (error) {
    console.warn('⚠️ 无法预热应用，可能服务器未启动');
  }

  await browser.close();

  // 生成测试数据文件
  await generateTestFixtures();

  console.log('✅ 全局测试设置完成');
}

async function generateTestFixtures() {
  const fixturesDir = path.resolve('tests/fixtures');
  
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // 生成ZIP测试文件
  const zipBuffer = Buffer.from([
    0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00,
    // ... ZIP文件头和数据
    0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00,
    0x01, 0x00, 0x2e, 0x00, 0x00, 0x00, 0x18, 0x00, 0x00, 0x00,
    0x00, 0x00
  ]);
  
  fs.writeFileSync(path.join(fixturesDir, 'test.zip'), zipBuffer);

  // 生成RAR测试文件签名
  const rarBuffer = Buffer.from([
    0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00,
    // RAR文件签名
  ]);
  
  fs.writeFileSync(path.join(fixturesDir, 'test.rar'), rarBuffer);

  // 生成7Z测试文件签名
  const sevenZBuffer = Buffer.from([
    0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c, 0x00, 0x04
  ]);
  
  fs.writeFileSync(path.join(fixturesDir, 'test.7z'), sevenZBuffer);

  console.log('📦 测试数据文件生成完成');
}

export default globalSetup;