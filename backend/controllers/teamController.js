import { supabase } from '../supabaseClient.js'

/* ================================================================
    Team
   ================================================================= */
   
// GET /team
export const getAllTeams = async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('team')
      .select('*')
    if (error) throw error
    res.json({ success: true, count: data.length, teams: data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// POST /team
export const createTeam = async (req, res) => {
  const { name, description, manager } = req.body
  if (!name || !manager) return res.status(400).json({ success: false, error: 'name et manager obligatoires.' })
  try {
    const { data, error } = await req.supabase
      .from('team')
      .insert([{ name, description: description || null, manager }])
      .select('*')
      .single()
    if (error) throw error
    res.status(201).json({ success: true, team: data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// PUT /team
export const updateTeam = async (req, res) => {
  const { tid, name, description, manager } = req.body
  if (!tid) return res.status(400).json({ success: false, error: 'tid obligatoire.' })
  if (!name && !description && !manager) return res.status(400).json({ success: false, error: 'Aucun champ à mettre à jour.' })
  try {
    const updateFields = {}
    if (name) updateFields.name = name
    if (description) updateFields.description = description
    if (manager) updateFields.manager = manager

    const { data, error } = await req.supabase
      .from('team')
      .update(updateFields)
      .eq('tid', tid)
      .select('*')
    if (error) throw error
    if (!data || data.length === 0) return res.status(404).json({ success: false, error: `Aucune équipe trouvée pour tid ${tid}.` })
    res.json({ success: true, team: data[0] })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// DELETE /team
export const deleteTeam = async (req, res) => {
  const { tid } = req.body
  if (!tid) return res.status(400).json({ success: false, error: 'tid obligatoire.' })
  try {
    const { data: existingTeam, error: fetchError } = await req.supabase
    .from('team')
    .select('tid')
    .eq('tid', tid).maybeSingle()
    if (fetchError) throw fetchError
    if (!existingTeam) return res.status(404).json({ success: false, error: `Aucune équipe trouvée pour tid ${tid}.` })

    const { error } = await req.supabase
    .from('team')
    .delete()
    .eq('tid', tid)
    if (error) throw error
    res.json({ success: true, message: `Équipe ${tid} supprimée.` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
