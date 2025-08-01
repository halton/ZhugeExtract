import { z } from 'zod'

const configSchema = z.object({
  // 服务器配置
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // 数据库配置
  DATABASE_URL: z.string().url(),
  DB_POOL_SIZE: z.coerce.number().default(10),

  // Redis配置
  REDIS_URL: z.string().url(),
  REDIS_PREFIX: z.string().default('zhuge:'),

  // 存储配置
  MINIO_ENDPOINT: z.string().default('localhost:9000'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET: z.string().default('zhuge-extract'),
  MINIO_USE_SSL: z.coerce.boolean().default(false),

  // JWT配置
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // 文件上传限制
  MAX_FILE_SIZE: z.coerce.number().default(2 * 1024 * 1024 * 1024), // 2GB
  MAX_FILES_PER_USER: z.coerce.number().default(1000),
  MAX_STORAGE_PER_USER: z.coerce.number().default(10 * 1024 * 1024 * 1024), // 10GB

  // CORS配置
  CORS_ORIGINS: z.string().transform(str => str.split(',')).default('http://localhost:5173'),

  // 限流配置
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(15 * 60 * 1000), // 15分钟

  // 分享配置
  SHARE_BASE_URL: z.string().url().default('http://localhost:3000'),
  SHARE_MAX_DOWNLOADS: z.coerce.number().default(100),
  SHARE_MAX_EXPIRES_DAYS: z.coerce.number().default(30),

  // 邮件配置（可选）
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // 监控配置
  METRICS_ENABLED: z.coerce.boolean().default(true),
  METRICS_PATH: z.string().default('/metrics'),

  // 安全配置
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  SESSION_SECRET: z.string().min(32).optional(),
})

function loadConfig() {
  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HOST: process.env.HOST,
      LOG_LEVEL: process.env.LOG_LEVEL,

      DATABASE_URL: process.env.DATABASE_URL,
      DB_POOL_SIZE: process.env.DB_POOL_SIZE,

      REDIS_URL: process.env.REDIS_URL,
      REDIS_PREFIX: process.env.REDIS_PREFIX,

      MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
      MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
      MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
      MINIO_BUCKET: process.env.MINIO_BUCKET,
      MINIO_USE_SSL: process.env.MINIO_USE_SSL,

      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
      JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,

      MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
      MAX_FILES_PER_USER: process.env.MAX_FILES_PER_USER,
      MAX_STORAGE_PER_USER: process.env.MAX_STORAGE_PER_USER,

      CORS_ORIGINS: process.env.CORS_ORIGINS,

      RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,

      SHARE_BASE_URL: process.env.SHARE_BASE_URL,
      SHARE_MAX_DOWNLOADS: process.env.SHARE_MAX_DOWNLOADS,
      SHARE_MAX_EXPIRES_DAYS: process.env.SHARE_MAX_EXPIRES_DAYS,

      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      SMTP_FROM: process.env.SMTP_FROM,

      METRICS_ENABLED: process.env.METRICS_ENABLED,
      METRICS_PATH: process.env.METRICS_PATH,

      BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS,
      SESSION_SECRET: process.env.SESSION_SECRET,
    }

    return configSchema.parse(env)
  } catch (error) {
    console.error('❌ Configuration validation failed:')
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}

export const config = loadConfig()

export type Config = z.infer<typeof configSchema>