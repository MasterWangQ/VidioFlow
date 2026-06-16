import { Router } from 'express'
import { authMiddleware } from '../middlewares/index.js'
import { uploadVideo, uploadCover } from '../config/upload.js'
import { config } from '../config/index.js'

const router = Router()

router.post('/video', authMiddleware, (req, res) => {
  uploadVideo.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ code: 400, message: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择视频文件' })
    }

    const fileUrl = `http://${config.server.host}:${config.server.port}/uploads/videos/${req.file.filename}`

    res.json({
      code: 0,
      message: '上传成功',
      data: { url: fileUrl, filename: req.file.filename }
    })
  })
})

router.post('/cover', authMiddleware, (req, res) => {
  uploadCover.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ code: 400, message: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择封面图片' })
    }

    const fileUrl = `http://${config.server.host}:${config.server.port}/uploads/covers/${req.file.filename}`

    res.json({
      code: 0,
      message: '上传成功',
      data: { url: fileUrl, filename: req.file.filename }
    })
  })
})

export default router
