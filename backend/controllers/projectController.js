import { supabase } from '../supabaseClient.js'

/* ================================================================
    Project
   ================================================================= */

// GET /project — Liste les projets d’un utilisateur (avec filtre date optionnel)
export const getProjects = async (req, res) => {
  const { uid, start_date, end_date } = req.body

  if (!uid) {
    return res.status(400).json({
      success: false,
      error: 'Le champ uid est obligatoire dans le body JSON.'
    })
  }

  try {
    // Base de la requête : projets de l’utilisateur
    let query = req.supabase
      .from('project')
      .select('*')
      .eq('uid', uid)

    // Filtrage optionnel
    if (start_date && end_date) {
      query = query.gte('start_at', start_date).lte('end_at', end_date)
    } else if (start_date) {
      query = query.gte('start_at', start_date)
    } else if (end_date) {
      query = query.lte('end_at', end_date)
    }

    const { data: projects, error } = await query

    if (error) throw error

    res.json({
      success: true,
      count: projects?.length || 0,
      projects: projects || []
    })
  } catch (err) {
    console.error('Erreur GET /project:', err)
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' })
  }
}

// POST /project - Permet à l'utilisateur connecté d'ajouter un projet sur lequel il a travaillé
export const createProject = async (req, res) => {
  const { name, start_at, end_at } = req.body
  const uid = req.user.id

  if (!name || !start_at || !end_at) {
    return res.status(400).json({
      success: false,
      error: 'Les champs name, start_at et end_at sont obligatoires.'
    })
  }

  try {
    const { data, error } = await req.supabase
      .from('project')
      .insert([{ name, start_at, end_at, uid }])
      .select()
      .single()

    if (error) throw error

    res.status(201).json({
      success: true,
      message: 'Projet ajouté avec succès.',
      project: data
    })
  } catch (err) {
    console.error('Erreur POST /project:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'Erreur interne du serveur'
    })
  }
}

// PUT /project Permet à l'utilisateur connecté de modifier un projet existant
export const updateProject = async (req, res) => {
  const { projectid, name, start_at, end_at } = req.body
  const uid = req.user.id

  if (!projectid) {
    return res.status(400).json({ success: false, error: 'Le champ projectid est obligatoire.' })
  }

  // Vérifie qu’au moins un champ est fourni
  if (!name && !start_at && !end_at) {
    return res.status(400).json({
      success: false,
      error: 'Aucun champ à mettre à jour.'
    })
  }

  try {
    // Vérifie que le projet appartient à l’utilisateur connecté
    const { data: existing, error: checkError } = await req.supabase
      .from('project')
      .select('uid')
      .eq('projectid', projectid)
      .single()

    if (checkError || !existing) {
      return res.status(404).json({ success: false, error: 'Projet introuvable.' })
    }

    if (existing.uid !== uid) {
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à modifier ce projet."
      })
    }

    // Mise à jour
    const fieldsToUpdate = {}
    if (name) fieldsToUpdate.name = name
    if (start_at) fieldsToUpdate.start_at = start_at
    if (end_at) fieldsToUpdate.end_at = end_at

    const { data, error } = await req.supabase
      .from('project')
      .update(fieldsToUpdate)
      .eq('projectid', projectid)
      .eq('uid', uid)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      message: 'Projet mis à jour avec succès.',
      project: data
    })
  } catch (err) {
    console.error('Erreur PUT /project:', err)
    res.status(500).json({
      success: false,
      error: err.message || 'Erreur interne du serveur'
    })
  }
}

// DELETE /project — Supprime un projet selon son projectid
export const deleteProject = async (req, res) => {
  const { projectid } = req.body

  if (!projectid) {
    return res.status(400).json({
      success: false,
      error: 'Le champ projectid est obligatoire dans le body JSON.'
    })
  }

  try {
    const { error } = await req.supabase
      .from('project')
      .delete()
      .eq('projectid', projectid)

    if (error) throw error

    res.json({
      success: true,
      message: `Projet ${projectid} supprimé avec succès.`
    })
  } catch (err) {
    console.error('Erreur DELETE /project:', err)
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' })
  }
}