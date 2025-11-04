import express from 'express'
import { supabase } from '../supabaseClient.js'
const router = express.Router()

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email et mot de passe obligatoires.' })
  }

  try {
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !authData.user) {
      return res.status(401).json({ success: false, error: 'Email ou mot de passe invalide' })
    }

    const user = authData.user

    // Récupère le rôle dans employees_role
    const { data: roles, error: roleError } = await supabase
      .from('employees_role')
      .select('role')
      .eq('uid', user.id)
      .maybeSingle()

    if (roleError) throw roleError

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: roles?.role || 'role inconnu',
      },
      access_token: authData.session.access_token,
    })
  } catch (error) {
    console.error('Erreur login:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
