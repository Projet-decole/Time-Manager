// /middleware/authorizeRole.js
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Cache des rôles (clé = user.id)
const roleCache = new Map()

// Expiration du cache (en ms)
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export const authorizeRole = (allowedRoles) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader)
      return res.status(401).json({ error: 'Token manquant' })

    const token = authHeader.replace('Bearer ', '').trim()

    // Crée un client Supabase spécifique à cette requête
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    )

    // Vérifie le token
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user)
      return res.status(401).json({ error: 'Token invalide ou expiré' })

    const userId = data.user.id

    // Vérifie si le rôle est déjà en cache et pas expiré
    const cachedRole = roleCache.get(userId)
    if (cachedRole && Date.now() - cachedRole.timestamp < CACHE_TTL) {
      if (!allowedRoles.includes(cachedRole.role))
        return res.status(403).json({ error: 'Accès refusé' })

      req.user = { id: userId, role: cachedRole.role }
      req.supabase = supabase // on passe le client au contrôleur
      return next()
    }

    // Sinon, récupère le rôle depuis la table
    const { data: roles, error: roleError } = await supabase
      .from('employees_role')
      .select('role')
      .eq('uid', userId)
      .maybeSingle()

    if (roleError || !roles)
      return res.status(403).json({ error: 'Rôle introuvable' })

    const role = roles.role

    // Stocke dans le cache
    roleCache.set(userId, { role, timestamp: Date.now() })

    // Vérifie les permissions
    if (!allowedRoles.includes(role))
      return res.status(403).json({ error: 'Accès refusé' })

    req.user = { id: userId, role }
    req.supabase = supabase // client spécifique à cet utilisateur
    next()
  }
}
