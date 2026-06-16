import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { config } from './config/index.js'
import { connectDatabase } from './config/database.js'
import routes from './routes/index.js'
import { errorHandler } from './middlewares/index.js'

const app = express()

const uploadsDir = path.join(process.cwd(), 'uploads')
const videosDir = path.join(uploadsDir, 'videos')
const coversDir = path.join(uploadsDir, 'covers')

;['uploads', videosDir, coversDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

app.use(cors())
app.use(express.json())

app.use('/uploads', express.static(uploadsDir))
app.use('/api', routes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use(errorHandler)

connectDatabase()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`)
    })
  })
  .catch((err) => {
    console.error('Database connection error:', err)
    process.exit(1)
  })
