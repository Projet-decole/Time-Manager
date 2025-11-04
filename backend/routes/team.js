import express from 'express'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { getAllTeams, createTeam, updateTeam, deleteTeam } from '../controllers/teamController.js'

const router = express.Router()

router.get('/', authorizeRole(['manager', 'seller']), getAllTeams)
router.post('/', authorizeRole(['manager']), createTeam)
router.put('/', authorizeRole(['manager']), updateTeam)
router.delete('/', authorizeRole(['manager']), deleteTeam)

export default router
