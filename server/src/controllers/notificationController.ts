import { Request, Response } from 'express'
import { Notification } from '../models/index.js'

export const notificationController = {
  async getNotifications(req: Request, res: Response) {
    const authReq = req as any
    const userId = parseInt(authReq.userId) || 0
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const { count, rows } = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit
    })

    res.json({
      code: 0,
      message: 'success',
      data: { items: rows, total: count, page, limit }
    })
  },

  async getUnreadCount(req: Request, res: Response) {
    const authReq = req as any
    const userId = parseInt(authReq.userId) || 0

    const count = await Notification.count({
      where: { userId, read: false }
    })

    res.json({
      code: 0,
      message: 'success',
      data: { count }
    })
  },

  async markAsRead(req: Request, res: Response) {
    const authReq = req as any
    const userId = parseInt(authReq.userId) || 0
    const { id } = req.params

    if (id) {
      await Notification.update({ read: true }, { where: { id, userId } })
    } else {
      await Notification.update({ read: true }, { where: { userId } })
    }

    res.json({ code: 0, message: 'success', data: null })
  },

  async deleteNotification(req: Request, res: Response) {
    const authReq = req as any
    const userId = parseInt(authReq.userId) || 0
    const { id } = req.params

    await Notification.destroy({ where: { id, userId } })
    res.json({ code: 0, message: '删除成功', data: null })
  },

  async createNotification(userId: number, type: string, content: string, link: string = '') {
    try {
      const notification = await Notification.create({ userId, type, content, link })
      console.log(`通知创建成功: userId=${userId}, type=${type}, content=${content}`)
      return notification
    } catch (error) {
      console.error(`通知创建失败: userId=${userId}, type=${type}, error=${error}`)
      throw error
    }
  }
}