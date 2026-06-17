import { Request, Response } from 'express'
import { Like, Favorite, Subscription, Video, User } from '../models/index.js'
import { notificationController } from './notificationController.js'

export const interactionController = {
  async likeVideo(req: Request, res: Response) {
    try {
      const { id } = req.params
      const authReq = req as any

      const existing = await Like.findOne({ where: { userId: authReq.userId, videoId: id } })
      if (existing) {
        return res.status(400).json({ code: 400, message: '已点赞' })
      }

      await Like.create({ userId: authReq.userId, videoId: id })

      await Video.increment('likeCount', { where: { id } })

      const video = await Video.findByPk(id)
      if (video && video.userId.toString() !== authReq.userId) {
        notificationController.createNotification(
          video.userId,
          'like',
          `用户 ${authReq.user?.nickname || authReq.user?.username} 点赞了你的视频`,
          `/video/${id}`
        ).catch(console.error)
      }

      res.json({ code: 0, message: '点赞成功', data: null })
    } catch (error) {
      console.error('点赞失败:', error)
      res.status(500).json({ code: 500, message: '点赞失败' })
    }
  },

  async unlikeVideo(req: Request, res: Response) {
    try {
      const { id } = req.params
      const authReq = req as any

      const like = await Like.findOne({ where: { userId: authReq.userId, videoId: id } })
      if (!like) {
        return res.status(400).json({ code: 400, message: '未点赞' })
      }

      await like.destroy()

      await Video.decrement('likeCount', { where: { id } })

      res.json({ code: 0, message: '取消点赞成功', data: null })
    } catch (error) {
      console.error('取消点赞失败:', error)
      res.status(500).json({ code: 500, message: '取消点赞失败' })
    }
  },

  async favoriteVideo(req: Request, res: Response) {
    try {
      const { id } = req.params
      const authReq = req as any

      const existing = await Favorite.findOne({ where: { userId: authReq.userId, videoId: id } })
      if (existing) {
        return res.status(400).json({ code: 400, message: '已收藏' })
      }

      await Favorite.create({ userId: authReq.userId, videoId: id })

      res.json({ code: 0, message: '收藏成功', data: null })
    } catch (error) {
      console.error('收藏失败:', error)
      res.status(500).json({ code: 500, message: '收藏失败' })
    }
  },

  async unfavoriteVideo(req: Request, res: Response) {
    try {
      const { id } = req.params
      const authReq = req as any

      const favorite = await Favorite.findOne({ where: { userId: authReq.userId, videoId: id } })
      if (!favorite) {
        return res.status(400).json({ code: 400, message: '未收藏' })
      }

      await favorite.destroy()

      res.json({ code: 0, message: '取消收藏成功', data: null })
    } catch (error) {
      console.error('取消收藏失败:', error)
      res.status(500).json({ code: 500, message: '取消收藏失败' })
    }
  },

  async subscribe(req: Request, res: Response) {
    try {
      const { id } = req.params
      const authReq = req as any

      if (id === authReq.userId) {
        return res.status(400).json({ code: 400, message: '不能订阅自己' })
      }

      const existing = await Subscription.findOne({ where: { subscriberId: authReq.userId, creatorId: id } })
      if (existing) {
        return res.status(400).json({ code: 400, message: '已订阅' })
      }

      await Subscription.create({ subscriberId: authReq.userId, creatorId: id })

      notificationController.createNotification(
        parseInt(id),
        'subscribe',
        `用户 ${authReq.user?.nickname || authReq.user?.username} 关注了你`,
        `/user/${authReq.userId}`
      ).catch(console.error)

      res.json({ code: 0, message: '订阅成功', data: null })
    } catch (error) {
      console.error('订阅失败:', error)
      res.status(500).json({ code: 500, message: '订阅失败' })
    }
  },

  async unsubscribe(req: Request, res: Response) {
    try {
      const { id } = req.params
      const authReq = req as any

      const subscription = await Subscription.findOne({ where: { subscriberId: authReq.userId, creatorId: id } })
      if (!subscription) {
        return res.status(400).json({ code: 400, message: '未订阅' })
      }

      await subscription.destroy()

      res.json({ code: 0, message: '取消订阅成功', data: null })
    } catch (error) {
      console.error('取消订阅失败:', error)
      res.status(500).json({ code: 500, message: '取消订阅失败' })
    }
  }
}
