// /controllers/userController.js
import { supabase } from '../supabaseClient.js'

/* ================================================================
    User Controller
   ================================================================= */

// GET /user — liste les employés
export const getAllUsers = async (req, res) => {
  try {
    // Utilise le client Supabase de la requête (lié au token)
    const { data, error } = await req.supabase
      .from('employees_role')
      .select('*')

    if (error) throw error

    res.json({ success: true, count: data.length, employees: data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}


// POST /user — crée un utilisateur (nécessite droits admin)
export const createUser = async (req, res) => {
  const { email, password, role, tid, firstname, lastname } = req.body

  if (!email || !password || !role || !tid || !firstname || !lastname) {
    return res.status(400).json({ success: false, error: 'Champs manquants.' })
  }

  try {
    // Création dans auth.users
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (signUpError) throw signUpError

    try {
      // Insertion dans employees_role
      const { data: insertedUser, error: insertError } = await req.supabase
        .from('employees_role')
        .insert([{ uid: authData.user.id, role, tid, firstname, lastname }])
        .select()
        .single()

      if (insertError) throw insertError

      res.status(201).json({
        success: true,
        user: {
          auth: { id: authData.user.id, email: authData.user.email },
          profile: insertedUser
        }
      })
    } catch (insertErr) {
      // Rollback : supprime l'utilisateur créé dans auth.users
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw insertErr
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}


// PUT /user — met à jour un utilisateur existant
export const updateUser = async (req, res) => {
  const { uid, email, password, role, tid, firstname, lastname } = req.body

  try {
    if (!uid) {
      return res.status(400).json({ success: false, error: 'Le champ uid est obligatoire.' })
    }

    // Vérifie qu'au moins un champ est fourni
    if (!email && !password && !role && !tid && !firstname && !lastname) {
      return res.status(400).json({ success: false, error: 'Aucun champ à mettre à jour.' })
    }

    let updatedAuthUser = null

    // 1. Mise à jour du compte Auth (via client admin global)
    if (email || password) {
      const { data, error: authError } = await supabase.auth.admin.updateUserById(uid, {
        ...(email && { email }),
        ...(password && { password })
      })

      if (authError) {
        console.error('Erreur update Auth:', authError)
        return res.status(500).json({ success: false, error: authError.message })
      }

      updatedAuthUser = data.user
    }

    // 2. Mise à jour du profil dans employees_role (client lié au token)
    const updateFields = {}
    if (role) updateFields.role = role
    if (tid) updateFields.tid = tid
    if (firstname) updateFields.firstname = firstname
    if (lastname) updateFields.lastname = lastname

    let updatedProfile = null
    if (Object.keys(updateFields).length > 0) {
      const { data, error: roleError } = await req.supabase
        .from('employees_role')
        .update(updateFields)
        .eq('uid', uid)
        .select()
        .single()

      if (roleError) {
        console.error('Erreur update employees_role:', roleError)
        return res.status(500).json({ success: false, error: roleError.message })
      }

      updatedProfile = data
    }

    // Réponse finale
    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: {
        auth: updatedAuthUser,
        profile: updatedProfile
      }
    })
  } catch (error) {
    console.error('Erreur PUT /user:', error)
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' })
  }
}


// DELETE /user — supprime un utilisateur
export const deleteUser = async (req, res) => {
  const { uid } = req.body

  if (!uid) {
    return res.status(400).json({ success: false, error: 'Le champ uid est obligatoire.' })
  }

  try {
    // 1. Supprime d’abord de employees_role (client lié au token)
    const { error: roleError } = await req.supabase
      .from('employees_role')
      .delete()
      .eq('uid', uid)

    if (roleError) {
      console.error('Erreur suppression employees_role:', roleError)
      return res.status(500).json({ success: false, error: roleError.message })
    }

    // 2. Supprime le compte Auth via client admin global
    const { error: authError } = await supabase.auth.admin.deleteUser(uid)

    if (authError) {
      console.error('Erreur suppression Auth:', authError)
      return res.status(500).json({ success: false, error: authError.message })
    }

    // 3. Réponse finale
    res.json({
      success: true,
      message: `Utilisateur ${uid} supprimé avec succès (employees_role + auth).`
    })
  } catch (error) {
    console.error('Erreur DELETE /user:', error)
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' })
  }
}
