import { Request, Response } from 'express'
import { Comment, User, Video } from '../models/index.js'
import { notificationController } from './notificationController.js'

export const commentController = {
  async getComments(req: Request, res: Response) {
    const { videoId } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit

    const { count, rows } = await Comment.findAndCountAll({
      where: { videoId, parentId: null },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    })

    const items = await Promise.all(
      rows.map(async comment => {
        const replies = await Comment.findAll({
          where: { parentId: comment.id },
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }],
          order: [['createdAt', 'ASC']]
        })
        return {
          ...comment.toJSON(),
          replies
        }
      })
    )

    res.json({
      code: 0,
      message: 'success',
      data: { items, total: count, page, limit }
    })
  },

  async createComment(req: Request, res: Response) {
    const { videoId } = req.params
    const { content, parentId } = req.body
    const authReq = req as any

    const comment = await Comment.create({
      content,
      videoId,
      parentId: parentId || null,
      userId: authReq.userId
    })

    await comment.save()

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname', 'avatar'] }]
    })

    const video = await Video.findByPk(videoId)
    if (video && video.userId.toString() !== authReq.userId) {
      notificationController.createNotification(
        video.userId,
        'comment',
        `用户 ${authReq.user?.nickname || authReq.user?.username} 评论了你的视频`,
        `/video/${videoId}`
      ).catch(console.error)
    }

    res.json({ code: 0, message: '评论成功', data: commentWithUser })
  },

  async deleteComment(req: Request, res: Response) {
    const { id } = req.params
    const authReq = req as any

    const comment = await Comment.findByPk(id)
    if (!comment) {
      return res.status(404).json({ code: 404, message: '评论不存在' })
    }

    if (comment.userId.toString() !== authReq.userId) {
      return res.status(403).json({ code: 403, message: '无权限' })
    }

    await Comment.destroy({ where: { parentId: id } })
    await comment.destroy()

    res.json({ code: 0, message: '删除成功', data: null })
  }
}
