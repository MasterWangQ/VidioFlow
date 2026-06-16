import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'

export const generateToken = (userId: string, role: string = 'user'): string => {
  return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions)
}
