import { Request, Response } from 'express'
import { User } from '../models/index.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { generateToken } from '../utils/jwt.js'
import { Op } from 'sequelize'

export const authController = {
  async register(req: Request, res: Response) {
    const { username, email, password } = req.body

    const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } })
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '用户或邮箱已存在' })
    }

    const hashedPassword = await hashPassword(password)
    const user = await User.create({ username, email, password: hashedPassword })

    const token = generateToken(user.id.toString(), user.role)
    const userData = user.toJSON()
    delete userData.password

    res.json({ code: 0, message: '注册成功', data: { token, user: userData } })
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ code: 401, message: '邮箱或密码错误' })
    }

    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return res.status(401).json({ code: 401, message: '邮箱或密码错误' })
    }

    const token = generateToken(user.id.toString(), user.role)
    const userData = user.toJSON()
    delete userData.password

    res.json({ code: 0, message: '登录成功', data: { token, user: userData } })
  },

  async getMe(req: Request, res: Response) {
    const authReq = req as any
    const user = await User.findByPk(authReq.userId, { attributes: { exclude: ['password'] } })
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    res.json({ code: 0, message: 'success', data: user })
  }
}
