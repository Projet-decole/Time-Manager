// /routes/user.js
import express from 'express'
import { authorizeRole } from '../middleware/authorizeRole.js'
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js'

const router = express.Router()

router.get('/', authorizeRole(['manager', 'seller']), getAllUsers)
router.post('/', authorizeRole(['manager']), createUser)
router.put('/', authorizeRole(['manager']), updateUser)
router.delete('/', authorizeRole(['manager']), deleteUser)

export default router
