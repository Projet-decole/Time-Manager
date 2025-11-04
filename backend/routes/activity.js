import express from 'express'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { addActivity, getUserActivities, getTeamAverage, getEmployeeAverage } from '../controllers/activityController.js'

const router = express.Router()

router.post('/', authorizeRole(['manager', 'seller']), addActivity)
router.get('/', authorizeRole(['manager']), getUserActivities)
router.get('/team-average', authorizeRole(['manager']), getTeamAverage)
router.get('/employee-average', authorizeRole(['manager']), getEmployeeAverage)

export default router
