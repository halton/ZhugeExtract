module.exports = {
  ci: {
    collect: {
      // Lighthouse收集配置
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      url: ['http://localhost:4173'],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --enable-features=SharedArrayBuffer',
        preset: 'desktop',
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo'
        ],
        skipAudits: [
          'uses-http2', // 开发环境可能不支持HTTP/2
          'canonical' // 单页应用可能不需要canonical URL
        ]
      }
    },
    
    assert: {
      // 性能阈值断言
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        
        // 核心Web指标
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // 其他重要指标
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        
        // 资源优化
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'unused-javascript': ['warn', { maxNumericValue: 20000 }],
        'modern-image-formats': ['warn', {}],
        'offscreen-images': ['warn', {}],
        
        // 可访问性
        'color-contrast': ['error', {}],
        'image-alt': ['error', {}],
        'label': ['error', {}],
        'link-name': ['error', {}],
        
        // 最佳实践
        'is-on-https': ['off', {}], // 开发环境通常是HTTP
        'uses-responsive-images': ['warn', {}],
        'efficient-animated-content': ['warn', {}]
      }
    },
    
    upload: {
      // 如果需要上传到LHCI服务器
      target: 'temporary-public-storage'
    },
    
    server: {
      // 本地LHCI服务器配置 (可选)
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db'
      }
    }
  }
};