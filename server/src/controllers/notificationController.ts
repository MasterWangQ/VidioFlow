import { Request, Response } from 'express'
import { Notification } from '../models/index.js'

export const notificationController = {
  async getNotifications(req: Request, res: Response) {
    const authReq = req as any
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const { count, rows } = await Notification.findAndCountAll({
      where: { userId: authReq.userId },
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

    const count = await Notification.count({
      where: { userId: authReq.userId, read: false }
    })

    res.json({
      code: 0,
      message: 'success',
      data: { count }
    })
  },

  async markAsRead(req: Request, res: Response) {
    const authReq = req as any
    const { id } = req.params

    if (id) {
      await Notification.update({ read: true }, { where: { id, userId: authReq.userId } })
    } else {
      await Notification.update({ read: true }, { where: { userId: authReq.userId } })
    }

    res.json({ code: 0, message: 'success', data: null })
  },

  async deleteNotification(req: Request, res: Response) {
    const authReq = req as any
    const { id } = req.params

    await Notification.destroy({ where: { id, userId: authReq.userId } })
    res.json({ code: 0, message: '删除成功', data: null })
  },

  async createNotification(userId: number, type: string, content: string, link: string = '') {
    await Notification.create({ userId, type, content, link })
  }
}