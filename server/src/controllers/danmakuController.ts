import { Request, Response } from 'express'
import { Danmaku, User } from '../models/index.js'
import { Op } from 'sequelize'

export const danmakuController = {
  async getDanmaku(req: Request, res: Response) {
    const { videoId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 100

    const { count, rows } = await Danmaku.findAndCountAll({
      where: { videoId },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname'] }],
      order: [['time', 'ASC']],
      limit,
      offset: (page - 1) * limit
    })

    res.json({
      code: 0,
      message: 'success',
      data: { items: rows, total: count, page, limit }
    })
  },

  async getDanmakuByTime(req: Request, res: Response) {
    const { videoId } = req.params
    const startTime = parseFloat(req.query.startTime as string) || 0
    const endTime = parseFloat(req.query.endTime as string) || 1800

    const danmaku = await Danmaku.findAll({
      where: { 
        videoId,
        time: {
          [Op.between]: [startTime, endTime]
        }
      },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname'] }],
      order: [['time', 'ASC']]
    })

    res.json({
      code: 0,
      message: 'success',
      data: danmaku
    })
  },

  async sendDanmaku(req: Request, res: Response) {
    const authReq = req as any
    const { videoId } = req.params
    const { content, time, color = '#ffffff', type = 1 } = req.body

    const danmaku = await Danmaku.create({
      videoId,
      userId: authReq.userId,
      content,
      time,
      color,
      type
    })

    const danmakuWithUser = await Danmaku.findByPk(danmaku.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname'] }]
    })

    res.json({
      code: 0,
      message: '发送成功',
      data: danmakuWithUser
    })
  },

  async deleteDanmaku(req: Request, res: Response) {
    const authReq = req as any
    const { id } = req.params

    const danmaku = await Danmaku.findByPk(id)
    if (!danmaku) {
      return res.status(404).json({ code: 404, message: '弹幕不存在' })
    }

    if (danmaku.userId.toString() !== authReq.userId) {
      return res.status(403).json({ code: 403, message: '无权限' })
    }

    await danmaku.destroy()
    res.json({ code: 0, message: '删除成功', data: null })
  }
}