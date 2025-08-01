import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import websocket from '@fastify/websocket'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

import { config } from './config/index.js'
import { setupDatabase } from './database/index.js'
import { setupRedis } from './services/redis.js'
import { setupStorage } from './services/storage.js'

// Routes
import authRoutes from './routes/auth.js'
import fileRoutes from './routes/files.js'
import shareRoutes from './routes/shares.js'
import syncRoutes from './routes/sync.js'
import analyticsRoutes from './routes/analytics.js'
import healthRoutes from './routes/health.js'

// Middleware
import { authMiddleware } from './middleware/auth.js'
import { rateLimitMiddleware } from './middleware/rateLimit.js'
import { metricsMiddleware } from './middleware/metrics.js'
import { errorHandler } from './middleware/errorHandler.js'

const fastify = Fastify({
  logger: {
    level: config.LOG_LEVEL,
    transport: config.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
})

// 声明类型扩展
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    db: any
    redis: any
    storage: any
  }
}

async function buildServer() {
  try {
    // 基础插件
    await fastify.register(cors, {
      origin: config.CORS_ORIGINS,
      credentials: true
    })

    await fastify.register(jwt, {
      secret: config.JWT_SECRET,
      sign: {
        expiresIn: config.JWT_EXPIRES_IN
      }
    })

    await fastify.register(multipart, {
      limits: {
        fileSize: config.MAX_FILE_SIZE,
        files: 1
      }
    })

    await fastify.register(websocket)

    // API文档
    await fastify.register(swagger, {
      swagger: {
        info: {
          title: 'ZhugeExtract API',
          description: 'Archive extraction and sharing service API',
          version: '1.0.0'
        },
        host: `localhost:${config.PORT}`,
        schemes: ['http', 'https'],
        consumes: ['application/json', 'multipart/form-data'],
        produces: ['application/json'],
        securityDefinitions: {
          Bearer: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          }
        }
      }
    })

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false
      }
    })

    // 服务初始化
    const db = await setupDatabase()
    const redis = await setupRedis()
    const storage = await setupStorage()

    // 注册服务到fastify实例
    fastify.decorate('db', db)
    fastify.decorate('redis', redis)
    fastify.decorate('storage', storage)

    // 认证装饰器
    fastify.decorate('authenticate', authMiddleware)

    // 全局中间件
    await fastify.register(rateLimitMiddleware)
    await fastify.register(metricsMiddleware)

    // 错误处理
    fastify.setErrorHandler(errorHandler)

    // 健康检查
    await fastify.register(healthRoutes, { prefix: '/health' })

    // API路由
    await fastify.register(authRoutes, { prefix: '/api/v1/auth' })
    await fastify.register(fileRoutes, { prefix: '/api/v1/files' })
    await fastify.register(shareRoutes, { prefix: '/api/v1/shares' })
    await fastify.register(syncRoutes, { prefix: '/api/v1/sync' })
    await fastify.register(analyticsRoutes, { prefix: '/api/v1/analytics' })

    // WebSocket路由
    fastify.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection, req) => {
        connection.socket.on('message', (message) => {
          // WebSocket消息处理逻辑
          console.log('Received message:', message.toString())
          connection.socket.send('Hello from server!')
        })
      })
    })

    // 根路径
    fastify.get('/', async (request, reply) => {
      return {
        message: 'ZhugeExtract Backend API',
        version: '1.0.0',
        documentation: '/docs',
        health: '/health'
      }
    })

    return fastify

  } catch (error) {
    fastify.log.error(error)
    process.exit(1)
  }
}

async function start() {
  try {
    const server = await buildServer()
    
    await server.listen({
      port: config.PORT,
      host: config.HOST
    })

    console.log(`🚀 Server ready at http://${config.HOST}:${config.PORT}`)
    console.log(`📚 Documentation available at http://${config.HOST}:${config.PORT}/docs`)

  } catch (error) {
    console.error('❌ Server startup failed:', error)
    process.exit(1)
  }
}

// 优雅关闭处理
process.on('SIGINT', async () => {
  try {
    await fastify.close()
    console.log('🔄 Server closed gracefully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during shutdown:', error)
    process.exit(1)
  }
})

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  start()
}

export { buildServer }