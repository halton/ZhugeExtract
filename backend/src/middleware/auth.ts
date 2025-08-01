import type { FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from '../services/auth.service.js'

const authService = new AuthService()

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string
      email: string
      username: string
      sessionId: string
    }
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization
    
    if (!authHeader) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: '缺少认证令牌'
        }
      })
    }

    const token = authHeader.replace(/^Bearer\s+/, '')
    
    if (!token) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: '令牌格式无效'
        }
      })
    }

    // 验证令牌
    const payload = await authService.verifyToken(token)
    
    // 将用户信息添加到请求对象
    request.user = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
      sessionId: payload.sessionId
    }

  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'TOKEN_VERIFICATION_FAILED',
        message: error instanceof Error ? error.message : '令牌验证失败'
      }
    })
  }
}

// 可选认证中间件（不强制要求认证）
export async function optionalAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization
    
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/, '')
      
      if (token) {
        const payload = await authService.verifyToken(token)
        request.user = {
          userId: payload.userId,
          email: payload.email,
          username: payload.username,
          sessionId: payload.sessionId
        }
      }
    }
    
    // 即使没有认证也继续执行
  } catch (error) {
    // 忽略认证错误，继续执行
    request.log.warn('Optional auth failed:', error)
  }
}

// 角色检查中间件
export function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: '需要认证'
        }
      })
    }

    // 获取用户详细信息以检查角色
    const user = await authService.getUserById(request.user.userId)
    
    if (!user) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      })
    }

    // 检查用户角色（这里简化处理，实际项目中可能需要更复杂的角色系统）
    const userRole = user.subscriptionTier || 'free'
    
    if (!roles.includes(userRole)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: '权限不足'
        }
      })
    }
  }
}

// 资源所有者检查中间件
export function requireOwnership(getResourceUserId: (request: FastifyRequest) => Promise<string>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: '需要认证'
        }
      })
    }

    try {
      const resourceUserId = await getResourceUserId(request)
      
      if (resourceUserId !== request.user.userId) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '无权访问此资源'
          }
        })
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: 'OWNERSHIP_CHECK_FAILED',
          message: '资源所有权检查失败'
        }
      })
    }
  }
}