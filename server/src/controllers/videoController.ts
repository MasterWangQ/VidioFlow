import { Request, Response } from 'express'
import { Video, User } from '../models/index.js'
import { Op, Sequelize } from 'sequelize'

export const videoController = {
  async getTopVideos(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit
    const type = req.query.type as string || 'view'

    const orderBy: any[] = []
    switch (type) {
      case 'view':
        orderBy.push(['viewCount', 'DESC'])
        break
      case 'like':
        orderBy.push(['likeCount', 'DESC'])
        break
      case 'new':
      default:
        orderBy.push(['createdAt', 'DESC'])
        break
    }

    const { count, rows } = await Video.findAndCountAll({
      where: { status: 1 },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }],
      order: orderBy,
      limit,
      offset
    })

    res.json({
      code: 0,
      message: 'success',
      data: { items: rows, total: count, page, limit }
    })
  },

  async getVideos(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit
    const category = req.query.category as string
    const search = req.query.search as string
    const tag = req.query.tag as string

    const where: any = { status: 1 }
    if (category) {
      where.category = category
    }
    if (search && search.trim()) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { tags: { [Op.like]: `%${search}%` } }
      ]
    }
    if (tag && tag.trim()) {
      where[Op.and] = where[Op.and] || []
      where[Op.and].push(Sequelize.literal(`JSON_CONTAINS(tags, '${JSON.stringify(tag.trim())}')`))
    }

    const { count, rows } = await Video.findAndCountAll({
      where,
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

  async getVideo(req: Request, res: Response) {
    const { id } = req.params
    const video = await Video.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar', 'description'] }]
    })

    if (!video) {
      return res.status(404).json({ code: 404, message: '视频不存在' })
    }

    await video.increment('viewCount')

    res.json({ code: 0, message: 'success', data: video })
  },

  async createVideo(req: Request, res: Response) {
    const authReq = req as any
    const { title, description, url, cover, duration, category, tags } = req.body

    const video = await Video.create({
      title,
      description,
      url,
      cover,
      duration,
      category,
      tags,
      userId: authReq.userId
    })

    await video.save()

    const videoWithUser = await Video.findByPk(video.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }]
    })

    res.json({ code: 0, message: '上传成功，等待审核', data: videoWithUser })
  },

  async updateVideo(req: Request, res: Response) {
    const { id } = req.params
    const authReq = req as any
    const { title, description, category, tags } = req.body

    const video = await Video.findByPk(id)
    if (!video) {
      return res.status(404).json({ code: 404, message: '视频不存在' })
    }

    if (video.userId.toString() !== authReq.userId) {
      return res.status(403).json({ code: 403, message: '无权限' })
    }

    await video.update({
      title: title !== undefined ? title : video.title,
      description: description !== undefined ? description : video.description,
      category: category !== undefined ? category : video.category,
      tags: tags !== undefined ? tags : video.tags
    })

    const updatedVideo = await Video.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }]
    })

    res.json({ code: 0, message: '更新成功', data: updatedVideo })
  },

  async deleteVideo(req: Request, res: Response) {
    const { id } = req.params
    const authReq = req as any

    const video = await Video.findByPk(id)
    if (!video) {
      return res.status(404).json({ code: 404, message: '视频不存在' })
    }

    if (video.userId.toString() !== authReq.userId) {
      return res.status(403).json({ code: 403, message: '无权限' })
    }

    await video.destroy()
    res.json({ code: 0, message: '删除成功', data: null })
  },

  async getTags(req: Request, res: Response) {
    const videos = await Video.findAll({
      where: { status: 1 },
      attributes: ['tags']
    })

    const tagCount: { [key: string]: number } = {}

    videos.forEach(video => {
      const tags = video.tags as unknown as string[]
      if (tags && Array.isArray(tags)) {
        tags.forEach(tag => {
          const trimmedTag = tag.trim()
          if (trimmedTag) {
            tagCount[trimmedTag] = (tagCount[trimmedTag] || 0) + 1
          }
        })
      }
    })

    const sortedTags = Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    res.json({ code: 0, message: 'success', data: sortedTags })
  },

  async getPendingVideos(req: Request, res: Response) {
    const authReq = req as any
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const offset = (page - 1) * limit

    const where: any = { status: 0 }
    
    // 如果用户不是管理员，只能查看自己的待审核视频
    if (!authReq.isAdmin) {
      where.userId = authReq.userId
    }

    const { count, rows } = await Video.findAndCountAll({
      where,
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

  async approveVideo(req: Request, res: Response) {
    const { id } = req.params

    const video = await Video.findByPk(id)
    if (!video) {
      return res.status(404).json({ code: 404, message: '视频不存在' })
    }

    await video.update({ status: 1 })

    const updatedVideo = await Video.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }]
    })

    res.json({ code: 0, message: '审核通过', data: updatedVideo })
  },

  async rejectVideo(req: Request, res: Response) {
    const { id } = req.params
    const { reason } = req.body

    const video = await Video.findByPk(id)
    if (!video) {
      return res.status(404).json({ code: 404, message: '视频不存在' })
    }

    await video.update({ status: -1, rejectReason: reason || '' })

    res.json({ code: 0, message: '已拒绝', data: null })
  },

  async resubmitVideo(req: Request, res: Response) {
    const { id } = req.params

    const video = await Video.findByPk(id)
    if (!video) {
      return res.status(404).json({ code: 404, message: '视频不存在' })
    }

    await video.update({ status: 0, rejectReason: '' })

    res.json({ code: 0, message: '已重新提交审核', data: null })
  }
}
