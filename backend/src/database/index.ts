import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from '../config/index.js'
import * as schema from './schema.js'

let connection: postgres.Sql | null = null
let db: ReturnType<typeof drizzle> | null = null

export async function setupDatabase() {
  if (db) {
    return db
  }

  try {
    // 创建PostgreSQL连接
    connection = postgres(config.DATABASE_URL, {
      max: config.DB_POOL_SIZE,
      idle_timeout: 20,
      connect_timeout: 10,
    })

    // 创建Drizzle实例
    db = drizzle(connection, { 
      schema,
      logger: config.NODE_ENV === 'development'
    })

    // 测试连接
    await connection`SELECT 1 as test`
    console.log('✅ Database connected successfully')

    return db

  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export async function closeDatabase() {
  if (connection) {
    await connection.end()
    connection = null
    db = null
    console.log('🔄 Database connection closed')
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call setupDatabase() first.')
  }
  return db
}

// 健康检查
export async function checkDatabaseHealth() {
  try {
    if (!connection) {
      throw new Error('No database connection')
    }

    const result = await connection`SELECT NOW() as current_time`
    return {
      status: 'healthy',
      timestamp: result[0].current_time,
      pool_size: config.DB_POOL_SIZE
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 数据库迁移和初始化
export async function initializeDatabase() {
  const db = getDatabase()
  
  try {
    // 这里可以添加初始化数据
    console.log('📊 Database initialized successfully')
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

export { schema }
export type Database = NonNullable<typeof db>