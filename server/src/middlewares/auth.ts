import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { config } from '../config/index.js'
import { User } from '../models/index.js'

export interface AuthRequest extends Request {
  userId?: string
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwtSecret as string) as { userId: string; role?: string }
    req.userId = decoded.userId
    ;(req as any).isAdmin = decoded.role === 'admin'
    next()
  } catch {
    return res.status(401).json({ code: 401, message: 'token无效' })
  }
}

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, config.jwtSecret as string) as { userId: string }
      req.userId = decoded.userId
    } catch {
      // ignore
    }
  }

  next()
}

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, config.jwtSecret as string) as { userId: string }
    
    // 从数据库查询用户角色，确保权限验证准确
    const user = await User.findByPk(decoded.userId)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '无权限' })
    }
    
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ code: 401, message: 'token无效' })
  }
}
