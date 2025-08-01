import { pgTable, uuid, varchar, timestamp, bigint, boolean, jsonb, integer, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// 用户表
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(createId()),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  settings: jsonb('settings').default({}),
  subscriptionTier: varchar('subscription_tier', { length: 20 }).default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  emailVerified: boolean('email_verified').default(false),
})

// 文件表
export const files = pgTable('files', {
  id: uuid('id').primaryKey().default(createId()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(), // 存储的文件名
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  format: varchar('format', { length: 10 }).notNull(),
  storagePath: text('storage_path').notNull(),
  contentType: varchar('content_type', { length: 100 }),
  checksum: varchar('checksum', { length: 64 }), // SHA-256
  metadata: jsonb('metadata').default({}),
  isPublic: boolean('is_public').default(false),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

// 文件分享表
export const shares = pgTable('shares', {
  id: uuid('id').primaryKey().default(createId()),
  fileId: uuid('file_id').references(() => files.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  shareToken: varchar('share_token', { length: 64 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  maxDownloads: integer('max_downloads'),
  currentDownloads: integer('current_downloads').default(0),
  allowPreview: boolean('allow_preview').default(true),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  isActive: boolean('is_active').default(true),
})

// 分享访问记录表
export const shareAccess = pgTable('share_access', {
  id: uuid('id').primaryKey().default(createId()),
  shareId: uuid('share_id').references(() => shares.id, { onDelete: 'cascade' }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referer: text('referer'),
  accessedAt: timestamp('accessed_at', { withTimezone: true }).defaultNow(),
  downloadCount: integer('download_count').default(0),
})

// 用户会话表
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().default(createId()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  refreshToken: varchar('refresh_token', { length: 255 }).unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow(),
  isActive: boolean('is_active').default(true),
})

// 系统事件日志表
export const events = pgTable('events', {
  id: uuid('id').primaryKey().default(createId()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  eventData: jsonb('event_data').default({}),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// 用户统计表
export const userStats = pgTable('user_stats', {
  id: uuid('id').primaryKey().default(createId()),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  totalFiles: integer('total_files').default(0),
  totalSize: bigint('total_size', { mode: 'number' }).default(0),
  totalShares: integer('total_shares').default(0),
  totalDownloads: integer('total_downloads').default(0),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// 系统配置表
export const systemConfig = pgTable('system_config', {
  id: uuid('id').primaryKey().default(createId()),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: jsonb('value'),
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// 关系定义
export const usersRelations = relations(users, ({ many, one }) => ({
  files: many(files),
  shares: many(shares),
  sessions: many(sessions),
  events: many(events),
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId]
  })
}))

export const filesRelations = relations(files, ({ one, many }) => ({
  user: one(users, {
    fields: [files.userId],
    references: [users.id]
  }),
  shares: many(shares)
}))

export const sharesRelations = relations(shares, ({ one, many }) => ({
  file: one(files, {
    fields: [shares.fileId],
    references: [files.id]
  }),
  user: one(users, {
    fields: [shares.userId],
    references: [users.id]
  }),
  accesses: many(shareAccess)
}))

export const shareAccessRelations = relations(shareAccess, ({ one }) => ({
  share: one(shares, {
    fields: [shareAccess.shareId],
    references: [shares.id]
  })
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}))

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id]
  })
}))

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id]
  })
}))

// 导出类型
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type File = typeof files.$inferSelect
export type NewFile = typeof files.$inferInsert
export type Share = typeof shares.$inferSelect
export type NewShare = typeof shares.$inferInsert
export type ShareAccess = typeof shareAccess.$inferSelect
export type NewShareAccess = typeof shareAccess.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type UserStats = typeof userStats.$inferSelect
export type NewUserStats = typeof userStats.$inferInsert
export type SystemConfig = typeof systemConfig.$inferSelect
export type NewSystemConfig = typeof systemConfig.$inferInsert