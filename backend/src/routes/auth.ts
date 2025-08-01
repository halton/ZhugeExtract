import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { AuthService } from '../services/auth.service.js'

const authService = new AuthService()

// 验证模式
const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符').regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符'),
  password: z.string().min(8, '密码至少8个字符').max(128, '密码最多128个字符'),
  displayName: z.string().max(100, '显示名称最多100个字符').optional()
})

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码')
})

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '刷新令牌不能为空')
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(8, '新密码至少8个字符').max(128, '新密码最多128个字符')
})

const updateProfileSchema = z.object({
  displayName: z.string().max(100, '显示名称最多100个字符').optional(),
  avatarUrl: z.string().url('请输入有效的头像URL').optional(),
  settings: z.record(z.any()).optional()
})

export default async function authRoutes(fastify: FastifyInstance) {
  
  // 用户注册
  fastify.post('/register', {
    schema: {
      tags: ['Authentication'],
      summary: '用户注册',
      body: {
        type: 'object',
        required: ['email', 'username', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: '邮箱地址' },
          username: { type: 'string', minLength: 3, maxLength: 50, description: '用户名' },
          password: { type: 'string', minLength: 8, maxLength: 128, description: '密码' },
          displayName: { type: 'string', maxLength: 100, description: '显示名称' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    username: { type: 'string' },
                    displayName: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' }
                  }
                },
                token: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresAt: { type: 'string', format: 'date-time' }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = registerSchema.parse(request.body)
      
      const result = await authService.register(data)
      
      return reply.status(201).send({
        success: true,
        data: result,
        message: '注册成功'
      })
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error instanceof Error ? error.message : '注册失败'
        }
      })
    }
  })

  // 用户登录
  fastify.post('/login', {
    schema: {
      tags: ['Authentication'],
      summary: '用户登录',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: '邮箱地址' },
          password: { type: 'string', description: '密码' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    username: { type: 'string' },
                    displayName: { type: 'string' }
                  }
                },
                token: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresAt: { type: 'string', format: 'date-time' }
              }
            },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const credentials = loginSchema.parse(request.body)
      
      const result = await authService.login(credentials)
      
      return reply.send({
        success: true,
        data: result,
        message: '登录成功'
      })
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: error instanceof Error ? error.message : '登录失败'
        }
      })
    }
  })

  // 刷新令牌
  fastify.post('/refresh', {
    schema: {
      tags: ['Authentication'],
      summary: '刷新访问令牌',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', description: '刷新令牌' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(request.body)
      
      const result = await authService.refreshToken(refreshToken)
      
      return reply.send({
        success: true,
        data: result,
        message: '令牌刷新成功'
      })
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: error instanceof Error ? error.message : '令牌刷新失败'
        }
      })
    }
  })

  // 登出
  fastify.post('/logout', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Authentication'],
      summary: '用户登出',
      security: [{ Bearer: [] }]
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore - user属性在authenticate中间件中添加
      const { sessionId } = request.user
      
      await authService.logout(sessionId)
      
      return reply.send({
        success: true,
        message: '登出成功'
      })
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: error instanceof Error ? error.message : '登出失败'
        }
      })
    }
  })

  // 获取当前用户信息
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Authentication'],
      summary: '获取当前用户信息',
      security: [{ Bearer: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                displayName: { type: 'string' },
                avatarUrl: { type: 'string' },
                settings: { type: 'object' },
                subscriptionTier: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                lastLoginAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const { userId } = request.user
      
      const user = await authService.getUserById(userId)
      
      if (!user) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在'
          }
        })
      }
      
      return reply.send({
        success: true,
        data: user
      })
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: 'FETCH_USER_FAILED',
          message: error instanceof Error ? error.message : '获取用户信息失败'
        }
      })
    }
  })

  // 更新用户资料
  fastify.put('/profile', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Authentication'],
      summary: '更新用户资料',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        properties: {
          displayName: { type: 'string', maxLength: 100, description: '显示名称' },
          avatarUrl: { type: 'string', format: 'uri', description: '头像URL' },
          settings: { type: 'object', description: '用户设置' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const { userId } = request.user
      const updates = updateProfileSchema.parse(request.body)
      
      const updatedUser = await authService.updateProfile(userId, updates)
      
      return reply.send({
        success: true,
        data: updatedUser,
        message: '资料更新成功'
      })
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'PROFILE_UPDATE_FAILED',
          message: error instanceof Error ? error.message : '资料更新失败'
        }
      })
    }
  })

  // 修改密码
  fastify.post('/change-password', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Authentication'],
      summary: '修改密码',
      security: [{ Bearer: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', description: '当前密码' },
          newPassword: { type: 'string', minLength: 8, maxLength: 128, description: '新密码' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // @ts-ignore
      const { userId } = request.user
      const { currentPassword, newPassword } = changePasswordSchema.parse(request.body)
      
      await authService.changePassword(userId, currentPassword, newPassword)
      
      return reply.send({
        success: true,
        message: '密码修改成功，请重新登录'
      })
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'PASSWORD_CHANGE_FAILED',
          message: error instanceof Error ? error.message : '密码修改失败'
        }
      })
    }
  })
}