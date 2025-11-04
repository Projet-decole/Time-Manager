import { supabase } from '../supabaseClient.js'

/* ================================================================
    KPIs
   ================================================================= */

export const getKPI = async (req, res) => {
  const { start_date, end_date } = req.body
  const uid = req.user.id

  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      error: 'Les champs start_date et end_date sont obligatoires dans le body JSON.'
    })
  }

  try {
    // =========================================================
    // 1️ Récupération des plannings (planning théorique)
    // =========================================================
    const { data: plannings, error: planningError } = await req.supabase
      .from('planning')
      .select('start_at, end_at, pid')
      .eq('uid', uid)
      .gte('start_at', start_date)
      .lte('end_at', end_date)

    if (planningError) throw planningError

    // =========================================================
    // 2️ Récupération des activités (heures de badgeage)
    // =========================================================
    const { data: activities, error: activityError } = await req.supabase
      .from('activity')
      .select('arrival_time, departure_time')
      .eq('uid', uid)
      .gte('arrival_time', start_date)
      .lte('departure_time', end_date)

    if (activityError) throw activityError

    // =========================================================
    // 3️ Calcul du nombre de retards
    // =========================================================
    const delayThreshold = 10 * 60 * 1000 // 10 minutes en millisecondes
    let lateCount = 0

    for (const plan of plannings) {
      const plannedStart = new Date(plan.start_at)
      const arrival = activities.find(a => {
        const arrivalTime = new Date(a.arrival_time)
        return (
          arrivalTime.toDateString() === plannedStart.toDateString() &&
          arrivalTime >= plannedStart
        )
      })
      if (!arrival) continue
      if (new Date(arrival.arrival_time) - plannedStart > delayThreshold) {
        lateCount++
      }
    }

    // =========================================================
    // 4️ Calcul des heures passées par projet (groupé par name)
    // =========================================================
    const { data: projects, error: projectError } = await req.supabase
      .from('project')
      .select('name, start_at, end_at')
      .eq('uid', uid)
      .gte('start_at', start_date)
      .lte('end_at', end_date)

    if (projectError) throw projectError

    const projectHoursMap = {}

    projects.forEach(p => {
      const start = new Date(p.start_at)
      const end = new Date(p.end_at)
      const hours = (end - start) / (1000 * 60 * 60) // conversion ms → heures

      if (!projectHoursMap[p.name]) projectHoursMap[p.name] = 0
      projectHoursMap[p.name] += hours
    })

    const projectHours = Object.entries(projectHoursMap).map(([name, hours]) => ({
      name,
      hours: parseFloat(hours.toFixed(2))
    }))

    // =========================================================
    //  Réponse finale
    // =========================================================
    res.json({
      success: true,
      uid,
      period: { start_date, end_date },
      kpis: {
        late_count: lateCount,
        hours_per_project: projectHours
      }
    })
  } catch (err) {
    console.error('Erreur GET /kpi:', err)
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' })
  }
}