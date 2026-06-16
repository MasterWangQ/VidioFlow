import { Request, Response } from 'express'
import { User, Video, Favorite, Subscription } from '../models/index.js'
import { Op } from 'sequelize'

export const userController = {
  async getUser(req: Request, res: Response) {
    const { id } = req.params
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } })
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }

    const videoCount = await Video.count({ where: { userId: id, status: 1 } })
    const subscriberCount = await Subscription.count({ where: { creatorId: id } })

    res.json({ code: 0, message: 'success', data: { ...user.toJSON(), videoCount, subscriberCount } })
  },

  async updateUser(req: Request, res: Response) {
    const { id } = req.params
    const authReq = req as any

    if (authReq.userId !== id) {
      return res.status(403).json({ code: 403, message: '无权限' })
    }

    const { nickname, description } = req.body
    const user = await User.update(
      { nickname, description },
      { where: { id }, returning: true }
    )

    const updatedUser = await User.findByPk(id, { attributes: { exclude: ['password'] } })
    res.json({ code: 0, message: '更新成功', data: updatedUser })
  },

  async updateAvatar(req: Request, res: Response) {
    const { id } = req.params
    const { avatar } = req.body
    const authReq = req as any

    if (authReq.userId !== id) {
      return res.status(403).json({ code: 403, message: '无权限' })
    }

    await User.update({ avatar }, { where: { id } })
    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } })

    res.json({ code: 0, message: '更新成功', data: user })
  },

  async getUserVideos(req: Request, res: Response) {
    const { id } = req.params
    const authReq = req as any
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit

    const isOwnProfile = authReq.userId === id

    const whereCondition: any = { userId: id }
    if (!isOwnProfile) {
      whereCondition.status = 1
    }

    const { count, rows } = await Video.findAndCountAll({
      where: whereCondition,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    res.json({
      code: 0,
      message: 'success',
      data: { items: rows, total: count, page, limit }
    })
  },

  async getUserFavorites(req: Request, res: Response) {
    const { id } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit

    const { count, rows } = await Favorite.findAndCountAll({
      where: { userId: id },
      include: [{
        model: Video,
        as: 'video',
        include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }]
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    const items = rows.map(f => f.toJSON())

    res.json({
      code: 0,
      message: 'success',
      data: { items, total: count, page, limit }
    })
  },

  async getUserSubscriptions(req: Request, res: Response) {
    const { id } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit

    const { count, rows } = await Subscription.findAndCountAll({
      where: { subscriberId: id },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'nickname', 'avatar', 'description']
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    const items = rows.map(s => s.toJSON())

    res.json({
      code: 0,
      message: 'success',
      data: { items, total: count, page, limit }
    })
  }
}
