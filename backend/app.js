import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'

import userRoutes from './routes/user.js'
import teamRoutes from './routes/team.js'
import activityRoutes from './routes/activity.js'
import projectRoutes from './routes/project.js'
import kpiRoutes from './routes/kpi.js'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

app.use('/', authRoutes)

app.use('/user', userRoutes)
app.use('/team', teamRoutes)
app.use('/activity', activityRoutes)
app.use('/project', projectRoutes)
app.use('/kpi', kpiRoutes)

app.get('/', (req, res) => res.send('API Express + Supabase + Roles fonctionne !'))

const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Serveur en ligne sur http://localhost:${port}`))
