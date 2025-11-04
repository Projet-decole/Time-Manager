import express from 'express'
import { authorizeRole } from '../middleware/authorizeRole.js'
import { createProject, updateProject, getProjects, deleteProject } from '../controllers/projectController.js'

const router = express.Router()

router.post('/', authorizeRole(['manager', 'seller']), createProject)
router.put('/', authorizeRole(['manager', 'seller']), updateProject)
router.get('/', authorizeRole(['manager', 'seller']), getProjects)
router.delete('/', authorizeRole(['manager', 'seller']), deleteProject)

export default router
