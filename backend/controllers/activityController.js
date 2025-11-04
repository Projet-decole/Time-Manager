import { supabase } from '../supabaseClient.js'

/* ================================================================
    Activity
   ================================================================= */
   
// POST /activity
export const addActivity = async (req, res) => {
  const { arrival_time, departure_time } = req.body
  const uid = req.user.id
  if (!arrival_time || !departure_time) return res.status(400).json({ success: false, error: 'arrival_time et departure_time obligatoires.' })
  try {
    const { data, error } = await req.supabase
      .from('activity')
      .insert([{ uid, arrival_time, departure_time }])
      .select('*')
      .single()
    if (error) throw error
    res.status(201).json({ success: true, activity: data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// GET /activity
export const getUserActivities = async (req, res) => {
  const { uid } = req.body
  if (!uid) return res.status(400).json({ success: false, error: 'uid obligatoire.' })
  try {
    const { data, error } = await req.supabase
      .from('activity')
      .select('*')
      .eq('uid', uid)
      .order('arrival_time', { ascending: true })
    if (error) throw error
    res.json({ success: true, count: data.length, activities: data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// GET /activity/team-average
export const getTeamAverage = async (req, res) => {
  const { start_date, end_date } = req.body
  const { id: manager_uid } = req.user

  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: 'Les champs start_date et end_date sont obligatoires dans le body JSON.'
    })
  }

  try {
    // 1️ Récupère le nom complet du manager
    const { data: managerData, error: managerError } = await req.supabase
      .from('employees_role')
      .select('firstname, lastname')
      .eq('uid', manager_uid)
      .maybeSingle()

    if (managerError || !managerData) {
      return res.status(404).json({ success: false, error: 'Manager introuvable.' })
    }

    const fullName = `${managerData.lastname} ${managerData.firstname}`

    // 2️ Trouve l’équipe du manager
    const { data: teamData, error: teamError } = await req.supabase
      .from('team')
      .select('tid, name')
      .eq('manager', fullName)
      .maybeSingle()

    if (teamError || !teamData) {
      return res.status(404).json({ success: false, error: 'Aucune équipe trouvée pour ce manager.' })
    }

    const teamId = teamData.tid

    // 3️ Récupère les employés de cette équipe
    const { data: employees, error: employeeError } = await req.supabase
      .from('employees_role')
      .select('uid, firstname, lastname')
      .eq('tid', teamId)

    if (employeeError || !employees || employees.length === 0) {
      return res.status(404).json({ success: false, error: 'Aucun employé trouvé pour cette équipe.' })
    }

    const employeeIds = employees.map(e => e.uid)

    // 4️ Récupère toutes les activités sur la période
    const { data: activities, error: activityError } = await req.supabase
      .from('activity')
      .select('uid, arrival_time, departure_time')
      .in('uid', employeeIds)
      .gte('arrival_time', start_date)
      .lte('departure_time', end_date)

    if (activityError) {
      console.error('Erreur récupération activités:', activityError)
      return res.status(500).json({ success: false, error: activityError.message })
    }

    if (!activities || activities.length === 0) {
      return res.json({ success: true, message: 'Aucune activité sur cette période.' })
    }

    // 5️ Calcul des heures travaillées par employé
    const hoursByEmployee = {}

    for (const act of activities) {
      if (!act.arrival_time || !act.departure_time) continue

      const arrival = new Date(act.arrival_time)
      const departure = new Date(act.departure_time)
      const diffHours = (departure - arrival) / (1000 * 60 * 60) // ms → heures

      if (!hoursByEmployee[act.uid]) hoursByEmployee[act.uid] = []
      hoursByEmployee[act.uid].push(diffHours)
    }

    // Moyenne par employé
    const employeeAverages = Object.entries(hoursByEmployee).map(([uid, hours]) => {
      const employee = employees.find(e => e.uid === uid)
      const fullname = `${employee?.firstname || ''} ${employee?.lastname || ''}`.trim()
      const avg_per_day = (hours.reduce((a, b) => a + b, 0) / hours.length).toFixed(2)

      return { uid, fullname, avg_per_day }
    })

    // Moyenne quotidienne globale
    const teamDailyAvg =
      employeeAverages.reduce((sum, e) => sum + parseFloat(e.avg_per_day), 0) /
      employeeAverages.length

    // Calcul durée de la période
    const start = new Date(start_date)
    const end = new Date(end_date)
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    const teamWeeklyAvg = diffDays > 7 ? (teamDailyAvg * 7).toFixed(2) : null

    // 6️ Réponse finale
    res.json({
      success: true,
      team: teamData.name,
      period: { start_date, end_date, days: diffDays },
      averages: {
        per_day: teamDailyAvg.toFixed(2),
        per_week: teamWeeklyAvg,
      },
      details: employeeAverages,
    })
  } catch (err) {
    console.error('Erreur GET /activity/team-average:', err)
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' })
  }
}

// GET /activity/employee-average
export const getEmployeeAverage = async (req, res) => {
  try {
    const { uid, start_date, end_date } = req.body

    if (!uid || !start_date || !end_date) {
      return res.status(400).json({ success: false, error: 'uid, start_date et end_date sont requis' })
    }

    const start = new Date(start_date)
    const end = new Date(end_date)
    const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))

    // Récupère les activités de cet employé sur la période
    const { data: activities, error } = await req.supabase
      .from('activity')
      .select('arrival_time, departure_time')
      .eq('uid', uid)
      .gte('arrival_time', start.toISOString())
      .lte('departure_time', end.toISOString())

    if (error) {
      console.error('Erreur Supabase:', error)
      return res.status(500).json({ success: false, error: 'Erreur lors de la récupération des activités' })
    }

    if (!activities || activities.length === 0) {
      return res.status(404).json({ success: false, message: 'Aucune activité trouvée sur cette période' })
    }

    // Calcul du nombre d’heures totales
    let totalHours = 0
    for (const act of activities) {
      if (!act.arrival_time || !act.departure_time) continue
      const hours =
        (new Date(act.departure_time) - new Date(act.arrival_time)) / (1000 * 60 * 60)
      totalHours += hours
    }

    const avgPerDay = totalHours / diffDays
    const avgPerWeek = diffDays > 7 ? avgPerDay * 7 : avgPerDay

    res.json({
      success: true,
      uid,
      period: {
        start_date,
        end_date,
        days: diffDays
      },
      averages: {
        per_day: avgPerDay.toFixed(2),
        per_week: avgPerWeek.toFixed(2)
      },
      total_hours: totalHours.toFixed(2)
    })
  } catch (err) {
    console.error('Erreur GET /activity/employee-average:', err)
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' })
  }
}
