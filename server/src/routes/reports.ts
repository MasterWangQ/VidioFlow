import express from 'express'
import { reportController } from '../controllers/reportController.js'
import { authMiddleware } from '../middlewares/auth.js'

const router = express.Router()

router.post('/reports', authMiddleware, reportController.createReport)
router.get('/reports', authMiddleware, reportController.getReports)
router.put('/reports/:id/handle', authMiddleware, reportController.handleReport)
router.get('/reports/my', authMiddleware, reportController.getMyReports)

export default router