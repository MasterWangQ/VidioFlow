import multer, { type FileFilterCallback } from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import { config } from './index.js'

const createStorage = (subDir: string) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', subDir)
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = `${randomUUID()}${ext}`
    cb(null, filename)
  }
})

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true)
  } else if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型'))
  }
}

export const uploadVideo = multer({
  storage: createStorage('videos'),
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }
})

export const uploadCover = multer({
  storage: createStorage('covers'),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
})

export const getFileUrl = (filename: string, type: 'video' | 'cover') => {
  const baseUrl = `http://${config.server.host}:${config.server.port}`
  return `${baseUrl}/uploads/${type}s/${filename}`
}
