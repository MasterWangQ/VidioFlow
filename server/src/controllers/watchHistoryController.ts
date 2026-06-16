import { Request, Response } from 'express'
import { WatchHistory, Video, User } from '../models/index.js'

export const watchHistoryController = {
  // 获取播放记录
  async getHistory(req: Request, res: Response) {
    const authReq = req as any
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit

    const { count, rows } = await WatchHistory.findAndCountAll({
      where: { userId: authReq.userId },
      include: [{
        model: Video,
        as: 'video',
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'avatar']
        }]
      }],
      order: [['watchedAt', 'DESC']],
      limit,
      offset
    })

    // 过滤掉已删除的视频
    const items = rows
      .filter(row => (row as any).video)
      .map(row => ({
        ...row.toJSON(),
        video: row.toJSON().video
      }))

    res.json({
      code: 0,
      message: 'success',
      data: { items, total: count, page, limit }
    })
  },

  // 添加/更新播放记录
  async addHistory(req: Request, res: Response) {
    const authReq = req as any
    const { videoId, progress } = req.body

    if (!videoId) {
      return res.status(400).json({ code: 400, message: '视频ID不能为空' })
    }

    // 检查视频是否存在
    const video = await Video.findByPk(videoId)
    if (!video) {
      return res.status(404).json({ code: 404, message: '视频不存在' })
    }

    // 使用 upsert 添加或更新记录
    const [record, created] = await WatchHistory.upsert({
      userId: authReq.userId,
      videoId,
      progress: progress || 0,
      watchedAt: new Date()
    })

    res.json({
      code: 0,
      message: created ? '添加成功' : '更新成功',
      data: record
    })
  },

  // 删除单条播放记录
  async deleteHistory(req: Request, res: Response) {
    const authReq = req as any
    const { id } = req.params

    const record = await WatchHistory.findOne({
      where: { id, userId: authReq.userId }
    })

    if (!record) {
      return res.status(404).json({ code: 404, message: '记录不存在' })
    }

    await record.destroy()
    res.json({ code: 0, message: '删除成功', data: null })
  },

  // 清空所有播放记录
  async clearHistory(req: Request, res: Response) {
    const authReq = req as any

    await WatchHistory.destroy({
      where: { userId: authReq.userId }
    })

    res.json({ code: 0, message: '清空成功', data: null })
  }
}
