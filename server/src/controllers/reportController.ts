import { Request, Response } from 'express'
import { Report, Video, Comment, User } from '../models/index.js'
import { notificationController } from './notificationController.js'

export const reportController = {
  async createReport(req: Request, res: Response) {
    const authReq = req as any
    const reporterId = parseInt(authReq.userId) || 0
    const { targetId, targetType, reason } = req.body

    if (!targetId || !targetType || !reason) {
      return res.status(400).json({ code: 400, message: '缺少必要参数' })
    }

    if (!['video', 'comment'].includes(targetType)) {
      return res.status(400).json({ code: 400, message: '举报类型无效' })
    }

    let targetUserId: number

    try {
      if (targetType === 'video') {
        const video = await Video.findByPk(targetId)
        if (!video) {
          return res.status(404).json({ code: 404, message: '视频不存在' })
        }
        targetUserId = video.userId
      } else {
        const comment = await Comment.findByPk(targetId)
        if (!comment) {
          return res.status(404).json({ code: 404, message: '评论不存在' })
        }
        targetUserId = comment.userId
      }

      if (reporterId === targetUserId) {
        return res.status(400).json({ code: 400, message: '不能举报自己' })
      }

      const existingReport = await Report.findOne({
        where: { reporterId, targetId, targetType }
      })

      if (existingReport) {
        return res.status(400).json({ code: 400, message: '您已举报过该内容' })
      }

      const report = await Report.create({
        reporterId,
        targetId,
        targetType,
        targetUserId,
        reason
      })

      console.log(`举报创建成功: reporterId=${reporterId}, targetId=${targetId}, targetType=${targetType}`)

      res.json({ code: 0, message: '举报成功，管理员将尽快审核', data: report })
    } catch (error) {
      console.error('创建举报失败:', error)
      res.status(500).json({ code: 500, message: '举报失败' })
    }
  },

  async getReports(req: Request, res: Response) {
    const authReq = req as any
    const userId = parseInt(authReq.userId) || 0
    
    const user = await User.findByPk(userId)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '无权限访问' })
    }

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const status = req.query.status as string

    const where: any = {}
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      where.status = status
    }

    const { count, rows } = await Report.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username', 'nickname'] },
        { model: User, as: 'targetUser', attributes: ['id', 'username', 'nickname'] }
      ]
    })

    const reportsWithDetails = await Promise.all(rows.map(async (report) => {
      const data = report.toJSON() as any
      
      if (report.targetType === 'video') {
        const video = await Video.findByPk(report.targetId, {
          attributes: ['id', 'title', 'thumbnail']
        })
        data.targetInfo = video?.toJSON()
      } else {
        const comment = await Comment.findByPk(report.targetId, {
          attributes: ['id', 'content', 'videoId']
        })
        data.targetInfo = comment?.toJSON()
        if (comment) {
          const video = await Video.findByPk(comment.videoId, {
            attributes: ['id', 'title']
          })
          data.targetInfo.video = video?.toJSON()
        }
      }
      
      return data
    }))

    res.json({
      code: 0,
      message: 'success',
      data: { items: reportsWithDetails, total: count, page, limit }
    })
  },

  async handleReport(req: Request, res: Response) {
    const authReq = req as any
    const userId = parseInt(authReq.userId) || 0
    const { id } = req.params
    const { status } = req.body

    const user = await User.findByPk(userId)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '无权限操作' })
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ code: 400, message: '处理状态无效' })
    }

    const report = await Report.findByPk(id)
    if (!report) {
      return res.status(404).json({ code: 404, message: '举报不存在' })
    }

    if (report.status !== 'pending') {
      return res.status(400).json({ code: 400, message: '该举报已处理' })
    }

    try {
      await report.update({
        status,
        handledAt: new Date(),
        handledBy: userId
      })

      if (status === 'approved') {
        if (report.targetType === 'video') {
          await Video.update({ status: 'rejected' }, { where: { id: report.targetId } })
        } else {
          await Comment.destroy({ where: { id: report.targetId } })
        }
      }

      const reporterUser = await User.findByPk(report.reporterId)
      const targetUser = await User.findByPk(report.targetUserId)

      const targetTypeName = report.targetType === 'video' ? '视频' : '评论'
      const statusText = status === 'approved' ? '已通过' : '未通过'

      if (reporterUser) {
        await notificationController.createNotification(
          report.reporterId,
          'report',
          `您举报的${targetTypeName}审核${statusText}`,
          report.targetType === 'video' ? `/video/${report.targetId}` : `/video/${(report as any).targetInfo?.videoId}`
        )
      }

      if (targetUser && status === 'approved') {
        await notificationController.createNotification(
          report.targetUserId,
          'report',
          `您的${targetTypeName}因举报被处理`,
          report.targetType === 'video' ? `/video/${report.targetId}` : `/video/${(report as any).targetInfo?.videoId}`
        )
      }

      console.log(`举报处理成功: id=${id}, status=${status}, handledBy=${userId}`)

      res.json({ code: 0, message: '处理成功', data: report })
    } catch (error) {
      console.error('处理举报失败:', error)
      res.status(500).json({ code: 500, message: '处理失败' })
    }
  },

  async getMyReports(req: Request, res: Response) {
    const authReq = req as any
    const userId = parseInt(authReq.userId) || 0

    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const { count, rows } = await Report.findAndCountAll({
      where: { reporterId: userId },
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit
    })

    res.json({
      code: 0,
      message: 'success',
      data: { items: rows, total: count, page, limit }
    })
  }
}