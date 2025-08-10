import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { nanoid } from 'nanoid'
import { eq, and } from 'drizzle-orm'

import { getDatabase } from '../database/index.js'
import { users, sessions } from '../database/schema.js'
import { config } from '../config/index.js'
import type { User, NewUser, Session, NewSession } from '../database/schema.js'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  displayName?: string
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>
  token: string
  refreshToken: string
  expiresAt: Date
}

export interface TokenPayload {
  userId: string
  email: string
  username: string
  sessionId: string
}

export class AuthService {
  private db = getDatabase()

  // 用户注册
  async register(data: RegisterData): Promise<AuthResult> {
    const { email, username, password, displayName } = data

    // 检查用户是否已存在
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser.length > 0) {
      throw new Error('用户已存在')
    }

    // 检查用户名是否已存在
    const existingUsername = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    if (existingUsername.length > 0) {
      throw new Error('用户名已被使用')
    }

    // 密码哈希
    const passwordHash = await this.hashPassword(password)

    // 创建用户
    const newUser: NewUser = {
      email,
      username,
      passwordHash,
      displayName: displayName || username,
      emailVerified: false,
    }

    const [user] = await this.db
      .insert(users)
      .values(newUser)
      .returning()

    // 创建会话
    const authResult = await this.createSession(user)

    return authResult
  }

  // 用户登录
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { email, password } = credentials

    // 查找用户
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(
        eq(users.email, email),
        eq(users.isActive, true)
      ))
      .limit(1)

    if (!user) {
      throw new Error('用户不存在或已被禁用')
    }

    // 验证密码
    const isValidPassword = await this.verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      throw new Error('密码错误')
    }

    // 更新最后登录时间
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id))

    // 删除旧的会话（可选：单点登录）
    await this.revokeUserSessions(user.id)

    // 创建新会话
    const authResult = await this.createSession(user)

    return authResult
  }

  // 刷新令牌
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // 验证刷新令牌
      const payload = jwt.verify(refreshToken, config.JWT_SECRET) as TokenPayload & { type: 'refresh' }

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type')
      }

      // 查找会话
      const [session] = await this.db
        .select()
        .from(sessions)
        .where(and(
          eq(sessions.id, payload.sessionId),
          eq(sessions.refreshToken, refreshToken),
          eq(sessions.isActive, true)
        ))
        .limit(1)

      if (!session) {
        throw new Error('会话不存在或已失效')
      }

      // 检查会话是否过期
      if (session.expiresAt < new Date()) {
        await this.revokeSession(session.id)
        throw new Error('会话已过期')
      }

      // 查找用户
      const [user] = await this.db
        .select()
        .from(users)
        .where(and(
          eq(users.id, session.userId),
          eq(users.isActive, true)
        ))
        .limit(1)

      if (!user) {
        throw new Error('用户不存在或已被禁用')
      }

      // 生成新的令牌
      const newTokens = this.generateTokens(user, session.id)

      // 更新会话
      await this.db
        .update(sessions)
        .set({
          token: newTokens.token,
          refreshToken: newTokens.refreshToken,
          lastUsedAt: new Date()
        })
        .where(eq(sessions.id, session.id))

      return {
        user: this.sanitizeUser(user),
        ...newTokens,
        expiresAt: new Date(Date.now() + this.parseTimeString(config.JWT_EXPIRES_IN))
      }

    } catch (error) {
      throw new Error(`令牌刷新失败: ${  error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 登出
  async logout(sessionId: string): Promise<void> {
    await this.revokeSession(sessionId)
  }

  // 验证令牌
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as TokenPayload

      // 验证会话是否存在且活跃
      const [session] = await this.db
        .select()
        .from(sessions)
        .where(and(
          eq(sessions.id, payload.sessionId),
          eq(sessions.token, token),
          eq(sessions.isActive, true)
        ))
        .limit(1)

      if (!session) {
        throw new Error('会话不存在或已失效')
      }

      if (session.expiresAt < new Date()) {
        await this.revokeSession(session.id)
        throw new Error('会话已过期')
      }

      // 更新最后使用时间
      await this.db
        .update(sessions)
        .set({ lastUsedAt: new Date() })
        .where(eq(sessions.id, session.id))

      return payload

    } catch (error) {
      throw new Error(`令牌验证失败: ${  error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 获取用户信息
  async getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(
        eq(users.id, userId),
        eq(users.isActive, true)
      ))
      .limit(1)

    return user ? this.sanitizeUser(user) : null
  }

  // 更新用户资料
  async updateProfile(userId: string, updates: Partial<Pick<User, 'displayName' | 'avatarUrl' | 'settings'>>): Promise<Omit<User, 'passwordHash'>> {
    const [updatedUser] = await this.db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning()

    return this.sanitizeUser(updatedUser)
  }

  // 修改密码
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // 获取用户信息
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      throw new Error('用户不存在')
    }

    // 验证当前密码
    const isValidPassword = await this.verifyPassword(currentPassword, user.passwordHash)
    if (!isValidPassword) {
      throw new Error('当前密码错误')
    }

    // 更新密码
    const newPasswordHash = await this.hashPassword(newPassword)
    await this.db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))

    // 撤销所有会话，强制重新登录
    await this.revokeUserSessions(userId)
  }

  // 私有方法
  private async createSession(user: User): Promise<AuthResult> {
    const sessionId = nanoid()
    const tokens = this.generateTokens(user, sessionId)
    const expiresAt = new Date(Date.now() + this.parseTimeString(config.JWT_REFRESH_EXPIRES_IN))

    const newSession: NewSession = {
      id: sessionId,
      userId: user.id,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresAt,
      isActive: true
    }

    await this.db.insert(sessions).values(newSession)

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      expiresAt: new Date(Date.now() + this.parseTimeString(config.JWT_EXPIRES_IN))
    }
  }

  private generateTokens(user: User, sessionId: string) {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      sessionId
    }

    const token = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    })

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN }
    )

    return { token, refreshToken }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.BCRYPT_ROUNDS)
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  private sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitizedUser } = user
    return sanitizedUser
  }

  private async revokeSession(sessionId: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.id, sessionId))
  }

  private async revokeUserSessions(userId: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.userId, userId))
  }

  private parseTimeString(timeString: string): number {
    const units = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    }

    const match = timeString.match(/^(\d+)([smhd])$/)
    if (!match) {
      throw new Error(`Invalid time string: ${timeString}`)
    }

    const [, amount, unit] = match
    return parseInt(amount) * units[unit as keyof typeof units]
  }
}