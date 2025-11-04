import express from 'express'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { getKPI } from '../controllers/kpiController.js'

const router = express.Router()
router.get('/', authorizeRole(['manager', 'seller']), getKPI)

export default router
