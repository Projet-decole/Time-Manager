---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
status: complete
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-Time-Manager-2026-01-09.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - 'docs/index.md'
  - 'docs/project-overview.md'
  - 'docs/architecture-backend.md'
  - 'docs/architecture-frontend.md'
  - 'docs/integration-architecture.md'
  - 'docs/development-guide.md'
  - 'docs/deployment-guide.md'
  - 'docs/source-tree-analysis.md'
date: 2026-01-09
author: Lunos
project_name: Time Manager
---

# UX Design Specification Time Manager

**Author:** Lunos
**Date:** 2026-01-09

---

## Executive Summary

### Project Vision

**Time Manager** transforme le pointage horaire d'une corvée administrative en expérience agréable et valorisante. La philosophie "Zéro Friction" guide chaque décision de design : pointage ultra-rapide (<10 secondes), UI contextuelle par rôle, et dashboards qui valorisent les accomplissements plutôt que de surveiller.

L'insight clé : les systèmes de gestion du temps échouent non pas par manque de fonctionnalités, mais par excès de friction. Time Manager inverse la priorité - l'expérience d'abord, les features ensuite.

### Target Users

**Sophie Moreau - L'Employée Mobile (Persona Principal)**
- Développeuse 28 ans, travail hybride, 3 projets clients
- Pointe depuis smartphone 80% du temps
- Frustration : 2-3 min de friction quotidienne, oublis fréquents quand "dans le flow"
- Besoin : Pointage <10 sec, visualisation accomplissements, templates pour jours récurrents
- Success moment : "Je pointe en 5 secondes sans quitter Slack"

**Marc Dubois - Le Manager Décisionnaire (Persona Secondaire)**
- Engineering Manager 38 ans, équipe de 8, 5 projets
- Travaille sur desktop avec 2 écrans
- Frustration : 2-3h/semaine validation, détection tardive problèmes
- Besoin : Validation masse/détail, alertes proactives, projections budgétaires
- Success moment : "En 10 secondes je sais où regarder"

### Key Design Challenges

1. **Dualité Mobile/Desktop** - UI contextuelle par rôle, pas de compromis responsive
2. **Simplicité vs Puissance** - 3 modes progressifs, 7 types de graphiques Level 3
3. **Transformation Psychologique** - De surveillance à valorisation des accomplissements
4. **Validation Masse vs Détail** - Switch de contexte fluide pour managers

### Design Opportunities

1. **"Aha Moment" Instantané** - Premier pointage sans friction = adoption garantie
2. **Dashboards Narratifs** - Insights qui racontent une histoire, pas juste des chiffres
3. **Templates Intelligents** - Réduction charge cognitive jours récurrents
4. **Alertes Proactives** - Badges colorés transforment managers en anticipateurs

---

## Core User Experience

### Defining Experience

**Time Manager repose sur deux expériences core distinctes par rôle :**

**Employé - Pointage Instantané**
L'action critique est le démarrage/arrêt d'un pointage. Cette interaction doit être réalisable en moins de 10 secondes, sans réflexion, depuis n'importe quel contexte mobile. Le succès se mesure par l'absence de friction : aucune popup, aucun formulaire, confirmation visuelle immédiate.

**Manager - Vision Instantanée**
L'action critique est la consultation du Dashboard Équipe. En moins de 10 secondes, le manager doit voir exactement où sont les problèmes (surcharges, feuilles en attente, anomalies). Le succès se mesure par la capacité à prendre des décisions data-driven sans navigation profonde.

### Platform Strategy

| Rôle | Plateforme | Approche | Justification |
|------|------------|----------|---------------|
| Employé | Mobile-first | PWA responsive | 80% des pointages smartphone, accès rapide, pas d'installation |
| Manager | Desktop-first | PWA responsive | Dashboards multi-colonnes, analyse détaillée, multi-écrans |

**Décisions clés :**
- **PWA responsive unique** : mobile-first pour employés, desktop-first pour managers, mais fonctionnel et agréable sur tous les devices
- **Pas de mode offline** : les utilisateurs ont toujours une connexion suffisante pour travailler
- **Pas d'app native** : PWA suffisante pour le use case, évite la complexité de déploiement stores

### Effortless Interactions

**Interactions "magiques" qui définissent l'expérience :**

1. **Pointage 1-Tap** - Bouton Start visible immédiatement, confirmation sans popup
2. **Template 1-Tap** - Application pattern récurrent sans configuration
3. **Validation Masse** - Sélection multiple + validation groupée en 30 secondes
4. **Timeline Drag & Drop** - Découpage journée par manipulation directe
5. **Alertes Passives** - Badges visuels sans action requise pour les voir

**Automatisations :**
- Suggestion template basée sur jour/historique
- Calcul temps réel pendant pointage actif
- Alertes visuelles auto-actualisées sur dashboards

### Critical Success Moments

| Moment | Utilisateur | Condition de Succès | Impact Échec |
|--------|-------------|---------------------|--------------|
| Premier pointage | Sophie | Zéro popup, <5 sec | Adoption compromise |
| Dashboard vendredi | Sophie | Sentiment accomplissement | App perçue comme corvée |
| Vue équipe lundi | Marc | Problèmes visibles immédiatement | Gestion réactive vs proactive |
| Validation hebdo | Marc | Total <10 min pour 8 feuilles | Retour aux 2-3h |

### Experience Principles

**4 principes directeurs pour toutes les décisions UX :**

1. **"10 Secondes Max"**
   Toute action fréquente (pointage, consultation dashboard, validation simple) doit être réalisable en moins de 10 secondes. Si ça prend plus, on repense le flow.

2. **"Voir pour Décider"**
   Les interfaces montrent immédiatement l'information actionnable. Pas de navigation pour trouver les problèmes - ils sont visibles dès l'ouverture.

3. **"Accomplissement, Pas Surveillance"**
   Le langage et la visualisation célèbrent ce qui a été réalisé ("28h de dev accomplies") plutôt que ce qui doit être justifié ("28h déclarées").

4. **"Contexte = Interface"**
   L'UI s'adapte au rôle (Employé vs Manager) et au device (Mobile vs Desktop), tout en restant fonctionnelle et agréable sur tous les devices.

---

## Desired Emotional Response

### Primary Emotional Goals

**Transformation Émotionnelle Centrale :**
Time Manager transforme l'expérience émotionnelle du pointage de "corvée administrative génératrice de frustration" vers "geste fluide source d'accomplissement".

**Par Rôle :**

| Rôle | Émotion Actuelle | Émotion Cible |
|------|------------------|---------------|
| Employé | Frustration, oubli, corvée | Fluidité, accomplissement, fierté |
| Manager | Surcharge, réactivité, paperasse | Efficacité, anticipation, contrôle |

### Emotional Journey Mapping

| Phase | Émotion Cible | Comment l'atteindre |
|-------|---------------|---------------------|
| Premier contact | Surprise positive + Soulagement | Pointage ultra-simple dès le premier essai |
| Usage quotidien | Fluidité + Invisibilité | Zéro friction, le geste devient automatique |
| Revue hebdomadaire | Fierté + Accomplissement | Dashboard qui célèbre les réalisations |
| Validation manager | Efficacité + Contrôle | Mode masse rapide + vision instantanée |
| Erreur/problème | Confiance + Récupération | Messages clairs, actions réversibles |

### Micro-Emotions

**À Cultiver :**
- **Confiance** - L'app fait ce qu'elle dit
- **Accomplissement** - Chaque interaction renforce le sentiment de réalisation
- **Contrôle** - L'utilisateur choisit son mode, son rythme
- **Fluidité** - Transitions naturelles, pas de rupture cognitive

**À Éviter :**
- **Anxiété** - Peur d'oublier ou de mal faire
- **Frustration** - Popups, formulaires longs, navigation confuse
- **Surveillance** - Sentiment d'être traqué ou jugé
- **Confusion** - Incertitude sur l'action à faire

### Design Implications

| Émotion | Approche UX |
|---------|-------------|
| Surprise positive | Premier pointage sans popup = moment "wow" |
| Fluidité | Feedback immédiat, animations subtiles non-bloquantes |
| Accomplissement | Langage positif ("accomplies" vs "travaillées"), visualisations progressives |
| Confiance | Actions réversibles, messages d'erreur humains, historique visible |
| Contrôle | 3 modes au choix, templates personnalisables |
| Efficacité | Validation masse, alertes passives, navigation minimale |

**Anti-patterns Bannis :**
- Confirmations "Êtes-vous sûr ?" sur actions courantes
- Notifications intrusives
- Langage de contrôle/surveillance
- Erreurs sans solution claire

### Emotional Design Principles

1. **"Le Silence Est d'Or"** - L'absence de friction EST l'émotion positive
2. **"Célébrer, Pas Contrôler"** - Montrer les accomplissements, pas les justifications
3. **"Erreur = Opportunité"** - Erreurs présentées comme récupérables facilement
4. **"Invisible Quand Ça Marche"** - Pointage fluide au point d'être oublié aussitôt fait

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**Things 3 (Cultured Code) - Référence Minimalisme**
- Création tâche en 1 tap sans formulaire
- Animations subtiles non-bloquantes
- Hiérarchie visuelle claire avec espaces généreux
- Vue "Logbook" qui célèbre les accomplissements
- **Pattern clé :** Micro-satisfaction du "check" → notre confirmation pointage

**Apple Design Language - Référence Mobile**
- Touch targets larges (≥44pt)
- Couleurs intentionnelles (bleu action, vert succès)
- Typographie claire avec hiérarchie nette
- États vides avec guidance claire
- **Pattern clé :** Clarté immédiate, aucune ambiguïté

**Stripe Dashboard - Référence B2B Data**
- KPIs visibles immédiatement
- Graphiques avec hover détaillé et drill-down
- Alertes contextuelles discrètes mais visibles
- Tables denses mais lisibles
- **Pattern clé :** "Overview first, details on demand"

### Transferable UX Patterns

**Navigation :**
- Bottom nav mobile → Activité, Dashboard, Plus
- Top nav sur page Activité → Tâche | Journée | Template (switch entre modes de saisie)
- Sidebar desktop → Équipes, Projets, Validation

**Interactions :**
- 1-tap action → Démarrer pointage
- Drag & drop → Timeline découpage
- Swipe actions → Validation rapide

**Visuels :**
- Donut charts → Répartition projets
- Progress bars → Heures vs objectif
- Color coding → États bleu/vert/orange/rouge

### Anti-Patterns to Avoid

| Anti-Pattern | Notre Approche Alternative |
|--------------|---------------------------|
| Popup "Êtes-vous sûr ?" | Undo plutôt que confirmation |
| Formulaires longs | Max 2-3 champs, reste optionnel |
| Loading spinners bloquants | Optimistic UI |
| Navigation >3 clics | Tout en ≤2 clics |
| Dashboards décoratifs | Chaque graphique = décision |
| Notifications push agressives | Alertes passives in-app |
| Langage technique froid | Ton humain et positif |

### Design Inspiration Strategy

**Adopter :**
- 1-tap actions (Things) → Mode Simple
- Bottom nav mobile (Apple) → Navigation employé
- KPIs first (Stripe) → Dashboards manager
- Couleurs intentionnelles → États visuels

**Adapter :**
- Animations Things → Subtiles pour PWA
- Tables Stripe → Simplifiées pour validation masse
- Drill-down → Contexte équipe/employé

**Éviter :**
- Confirmations préventives
- Formulaires complets obligatoires
- Dashboards eye candy non actionnables

---

## Design System Foundation

### Design System Choice

**Choix : shadcn/ui + Tailwind CSS**

Un design system moderne, minimaliste et entièrement personnalisable basé sur Radix UI pour l'accessibilité et Tailwind CSS pour le styling.

### Rationale for Selection

| Critère | Pourquoi shadcn/ui |
|---------|-------------------|
| Esthétique | Minimalisme aligné avec inspiration Apple/Things |
| Contrôle | Composants dans le projet, modifiables à 100% |
| Accessibilité | Radix UI en base (WCAG compliant) |
| Performance | Pas de bundle externe, tree-shakeable |
| Stack fit | Intégration parfaite avec React 19 + Vite + Tailwind |
| Évolutivité | Construction progressive du design system |

### Implementation Approach

**Phase 1 : Fondations**
- Installation shadcn/ui CLI + Tailwind CSS
- Configuration design tokens (couleurs, espaces, typographie)
- Palette : Bleu (#3B82F6) action, Vert (#22C55E) succès, Orange (#F59E0B) warning, Rouge (#EF4444) erreur

**Phase 2 : Composants Core**
- Button (primary, secondary, ghost, destructive)
- Card, Badge, Input, Dialog, Toast
- Navigation components (bottom nav mobile, sidebar desktop)

**Phase 3 : Composants Métier**
- TimelineBlock (pointage avec drag & drop)
- KPICard (métriques dashboard)
- DataTable (validation masse avec sélection)
- Charts (Recharts pour visualisations)

### Customization Strategy

**Design Tokens :**
```css
/* Couleurs principales */
--primary: 222.2 47.4% 11.2%;      /* Actions principales */
--success: 142.1 76.2% 36.3%;      /* Confirmations */
--warning: 38 92.1% 50.2%;         /* Alertes modérées */
--destructive: 0 84.2% 60.2%;      /* Erreurs/Alertes critiques */

/* Espacements */
--spacing-touch: 44px;             /* Touch targets minimum */
--spacing-card: 16px;              /* Padding cards */

/* Typographie */
--font-sans: 'Inter', system-ui;   /* Police principale */
```

**Composants Custom à Créer :**
- PointageButton (bouton XXL avec états visuels)
- TimeEntry (bloc timeline draggable)
- AlertBadge (orange warning, rouge erreur avec animation subtile)
- ValidationRow (ligne avec swipe actions)

---

## Core User Experience Details

### Defining Experience

**"1 tap pour démarrer, vendredi pour célébrer"**

L'expérience définissante de Time Manager se résume en une phrase que les utilisateurs partageront : "Tu tapes un bouton et c'est fait. Le vendredi tu vois tout ce que t'as accompli."

Deux moments clés :
1. **Le geste quotidien** - Capturer son temps sans friction
2. **La récompense hebdomadaire** - Visualiser ses accomplissements avec fierté

### User Mental Model

**Transformation visée :**

| Avant (État actuel) | Après (Avec Time Manager) |
|---------------------|---------------------------|
| "Pointage = corvée" | "Chrono = geste naturel" |
| "Je dois me souvenir" | "C'est fait avant d'y penser" |
| "Oubli = galère" | "Mode Journée me sauve" |
| "Stats pour le contrôle" | "Stats pour MES accomplissements" |

**Attentes utilisateur :**
- App prête immédiatement (pas de loading)
- Bouton évident et large
- Confirmation immédiate et satisfaisante
- Rien à remplir pour les cas simples

### Success Criteria

| Critère | Objectif | Mesure |
|---------|----------|--------|
| Temps pointage Mode Simple | <5 secondes | Ouverture → confirmation |
| Taps requis | 1 seul | Bouton visible → tap → done |
| Temps chargement | <1 seconde | First meaningful paint |
| Satisfaction utilisateur | Sourire ou neutralité | Pas de soupir/frustration |

**Indicateurs qualitatifs :**
- Consultation volontaire du dashboard vendredi
- Recommandation à un collègue
- Réduction du taux d'oubli de pointage

### Novel UX Patterns

**Patterns établis adoptés :**
- Bouton large centré (mobile universel)
- Confirmation visuelle toast
- Bottom navigation mobile
- Cards pour entrées de temps

**Innovation Time Manager :**
- **3 modes progressifs** (Simple → Journée → Template) : l'utilisateur choisit sa complexité
- **Dashboard "Accomplissements"** : langage positif, valorisation plutôt que contrôle

### Experience Mechanics

**Flow Pointage Mode Simple :**
1. **Initiation** (0s) : Ouverture app depuis icône home screen
2. **Affichage** (<1s) : Bouton XXL "Démarrer" visible immédiatement
3. **Interaction** (+1s) : 1 tap sur bouton (zone 80px min, feedback haptique)
4. **Feedback** (+0.3s) : Animation pulse, texte "En cours depuis...", toast "✓"
5. **État actif** : Compteur temps réel, bouton "Terminer", app fermable

**Temps total : <3 secondes**

**Flow Dashboard Vendredi :**
1. Navigation : Tap icône Dashboard (bottom nav)
2. KPI Principal : "Cette semaine : 38h accomplies" (langage positif)
3. Détails : Donut projets, sparkline tendance, liste jours
4. Drill-down : Tap jour → détail entrées
5. Émotion finale : Fierté, accomplissement (pas surveillance)

---

## Visual Design Foundation

### Color System

**Palette Principale :**

| Rôle | Couleur | Hex | Usage |
|------|---------|-----|-------|
| Primary | Bleu profond | #1E3A5F | Actions principales, focus |
| Primary Light | Bleu clair | #3B82F6 | Boutons interactifs |
| Success | Vert | #22C55E | Confirmations, pointage actif |
| Warning | Orange | #F59E0B | Alertes modérées (>45h) |
| Destructive | Rouge | #EF4444 | Erreurs, alertes critiques (>50h) |
| Neutral 900 | Gris foncé | #111827 | Texte principal |
| Neutral 500 | Gris moyen | #6B7280 | Texte secondaire |
| Neutral 100 | Gris clair | #F3F4F6 | Backgrounds, cards |
| Background | Blanc | #FFFFFF | Fond principal |

**Rationale :**
- Bleu : Professionnel, confiance, calme
- Vert : Succès, accomplissement
- Orange : Attention douce
- Rouge : Urgences uniquement

### Typography System

**Police : Inter (Variable)**

| Niveau | Taille | Poids | Usage |
|--------|--------|-------|-------|
| Display | 48px | 700 | KPIs principaux |
| H1 | 32px | 600 | Titres pages |
| H2 | 24px | 600 | Sections |
| H3 | 20px | 500 | Sous-sections |
| Body | 16px | 400 | Texte courant |
| Body Small | 14px | 400 | Labels |
| Caption | 12px | 400 | Timestamps |

**Line heights :** Titres 1.2, Body 1.5, UI 1.25

### Spacing & Layout Foundation

**Base unit : 4px**

| Token | Valeur | Usage |
|-------|--------|-------|
| space-1 | 4px | Micro-espacements |
| space-2 | 8px | Entre éléments liés |
| space-4 | 16px | Padding cards |
| space-6 | 24px | Séparation sections |
| space-8 | 32px | Marges principales |

**Touch targets :** 44px min, 80px pour bouton pointage

**Grille :**
- Mobile : 1 col, marges 16px
- Tablet : 2 col, gap 24px
- Desktop : 12 col, max 1280px

**Principes layout :**
1. "Respiration" - Espaces blancs généreux
2. "Hiérarchie évidente" - Élément principal visuellement dominant
3. "Consistance invisible" - Même espacement partout
4. "Mobile = Desktop simplifiée" - Même logique, tailles adaptées

### Accessibility Considerations

**Contrastes WCAG AA :**
- Texte : ratio ≥ 4.5:1
- Grands textes : ratio ≥ 3:1

**Focus states :**
- Ring bleu 2px offset visible

**Couleurs :**
- Jamais couleur seule (icône + couleur)
- États : ✓ vert, ⚠ orange, ✕ rouge

**Tailles :**
- Touch 44px min
- Texte ≥ 14px

---

## Design Direction Decision

### Design Directions Explored

**4 directions visuelles analysées :**

1. **Clean Minimal** (Style Apple) - Respiration maximale, bouton isolé, fond blanc pur
2. **Card-Based** (Style Notion) - Conteneurs visuels, information groupée, plus dense
3. **Bold Action** (Style Things) - Action dominante, contraste fort, direct
4. **Dashboard-First** (Style Stripe) - KPIs en premier, data visualization, maîtrise

### Chosen Direction

**Approche Hybride Contextuelle :**

| Contexte | Direction | Rationale |
|----------|-----------|-----------|
| Mobile Employé | Clean Minimal + Bold Action | Focus action, simplicité extrême, pointage <5s |
| Desktop Manager | Dashboard-First | Data visible immédiatement, vue d'ensemble, décisions rapides |

### Design Rationale

**Pourquoi cette approche hybride :**

1. **Respect du principe "Contexte = Interface"** - L'UI s'adapte au rôle et au device
2. **Optimisation par use case** - Pointage rapide mobile vs analyse desktop
3. **Cohérence malgré variation** - Mêmes composants, même palette, arrangement différent
4. **Alignement émotionnel** - Mobile = fluidité, Desktop = contrôle

### Implementation Approach

**Mobile (Clean Minimal) :**
- Bouton pointage XXL centré (80px)
- Fond blanc, ombres minimales
- Bottom nav 3 items max
- Information secondaire en bas

**Desktop (Dashboard-First) :**
- KPIs en header
- Sidebar navigation
- Grille 12 colonnes
- Cards avec mini-visualisations
- Tables pour validation masse

**Composants partagés :**
- Même palette couleurs
- Même typographie (Inter)
- Mêmes composants shadcn/ui
- Mêmes états visuels (success, warning, error)

---

## User Journey Flows

### Journey 1: Mode Tâche (Sophie)

**Contexte :** Capture du temps par tâche avec chronomètre

**Principes clés :**
- Projet, Catégorie, Nom = 3 champs distincts, tous optionnels
- Tout modifiable à tout moment (avant, pendant, après)
- Dernière tâche toujours visible et éditable
- Aucune confirmation, aucune étape supplémentaire

**Interface :**
- Zone "Nouvelle tâche" : Nom (texte) + Projet (dropdown) + Catégorie (dropdown) + Bouton DÉMARRER
- Zone "Dernière tâche" : Affichage dernière entrée, cliquable pour éditer
- Pendant pointage : compteur + champs restent modifiables
- Vue Journée : liste toutes les tâches du jour, chacune éditable

**Flow :**
1. Écran pointage avec champs optionnels visibles
2. Tap DÉMARRER (avec ou sans infos remplies)
3. Compteur tourne, champs modifiables en cours
4. Tap TERMINER → entrée enregistrée
5. Devient "dernière tâche" visible, éditable
6. Édition via vue Journée pour toutes les tâches passées

### Journey 2: Mode Journée (Sophie)

**Contexte :** Reconstitution journée a posteriori

**Flow :**
1. Depuis page Activité, tap "Journée" dans la nav du haut
2. Timeline avec bouton "+ Ajouter bloc"
3. Création bloc : heure début → heure fin
4. Champs Nom/Projet/Catégorie optionnels par bloc
5. Manipulation directe : drag pour déplacer, resize pour ajuster
6. "Valider journée" → Résumé heures → Confirmation

### Journey 3: Dashboard Personnel (Sophie)

**Contexte :** Visualisation accomplissements

**Flow :**
1. Tap "Dashboard" dans la bottom nav
2. KPI principal : "38h accomplies cette semaine"
3. Donut répartition projets + catégories
4. Sparkline tendance 4 semaines
5. Liste jours → tap pour détail → édition possible

### Journey 4: Validation Feuilles (Marc)

**Contexte :** Validation hebdomadaire équipe

**Flow Mode Masse :**
1. Dashboard Équipe → Badge "6 en attente"
2. Liste feuilles avec sélection multiple
3. "Valider sélection" → Confirmation groupée

**Flow Mode Détail :**
1. Tap feuille → Vue détail avec anomalies highlighted
2. Valider OU Rejeter (motif obligatoire si rejet)
3. Notification employé automatique

### Journey 5: Dashboard Équipe (Marc)

**Contexte :** Vue d'ensemble équipe

**Flow :**
1. KPIs header : membres, heures total, alertes
2. Liste membres avec badges alertes (>45h warning, >50h error)
3. Tap membre → Détail + historique + actions
4. Vue alternative par projet disponible

### Journey Patterns

**Champs optionnels :** Projet, Catégorie, Nom toujours optionnels et modifiables
**Navigation :** Bottom nav (Activité, Dashboard, Plus) + Top nav modes (Tâche, Journée, Template)
**Édition :** Toujours possible via vue Journée/Calendrier
**Feedback :** Toast confirmations, compteurs temps réel, badges alertes
**Zéro friction :** Aucune confirmation préventive, aucune étape bloquante

---

## Component Strategy

### Design System Components (shadcn/ui)

**Utilisés directement :**
Button, Input, Select, Card, Badge, Toast, Dialog, Table, Tabs, Avatar, Progress, Skeleton, Tooltip

### Custom Components

#### TimerButton
- Bouton XXL (80px) avec compteur intégré
- États : idle (vert), running (rouge + compteur), disabled
- Touch target optimisé mobile

#### TaskCard
- Affichage compact tâche : nom, projet, catégorie, durée
- États : default, hover, active, editable
- Cliquable pour édition

#### TimelineBlock
- Bloc temps draggable/resizable pour Mode Journée
- Affiche période + infos tâche
- Interactions : drag, resize, tap edit

#### KPICard
- Métrique avec label, valeur, tendance optionnelle
- Variantes : large (48px), medium (24px), compact (16px)

#### AlertBadge
- Badge avec couleurs sémantiques (success, warning, error)
- Animation pulse optionnelle pour alertes critiques

#### BottomNav
- Navigation mobile principale fixe en bas
- 3 items : Activité | Dashboard | Plus
- Icônes + labels, état actif visible

#### ModeSwitch
- Navigation secondaire en haut de page Activité
- 3 modes : Tâche | Journée | Template
- Style différent de BottomNav (tabs ou segmented control)
- Permet de basculer entre les modes de saisie

### Implementation Roadmap

| Phase | Composants | Priorité |
|-------|------------|----------|
| MVP | TimerButton, TaskCard, BottomNav, ModeSwitch, Toast | P0 |
| Mode Journée | TimelineBlock, Dialog | P1 |
| Dashboards | KPICard, AlertBadge, Charts | P2 |
| Manager | MemberRow, ValidationRow, Table | P3 |

---

## UX Patterns

### Navigation Patterns

**Mobile (Employé) :**
- Bottom navigation principale (3 items) : Activité | Dashboard | Plus
- Top navigation sur Activité (3 modes) : Tâche | Journée | Template
- Drill-down : tap pour détails, swipe back

**Contenu "Plus" :**
- Profil utilisateur
- Vue Calendrier (Mois/Semaine)
- Révision feuilles de temps
- Paramètres

**Desktop (Manager) :**
- Sidebar collapsible gauche
- Header avec user info + notifications
- Breadcrumbs pour navigation profonde

### Interaction Patterns

**Actions principales :**
- Boutons larges, couleurs pleines
- Feedback immédiat (animation + toast)
- Undo disponible plutôt que confirmation préventive

**Édition :**
- Inline editing quand possible
- Modal pour édition complexe
- Auto-save avec indicateur

**Sélection :**
- Tap simple pour sélection unique
- Long press ou checkbox pour sélection multiple
- Actions groupées en bas d'écran

### Feedback Patterns

| Type | Composant | Durée |
|------|-----------|-------|
| Confirmation | Toast | 3s auto-dismiss |
| Erreur | Toast destructive | Dismiss manuel |
| Loading | Skeleton / Spinner | Jusqu'à completion |
| Progression | Progress bar | Temps réel |

### Data Display Patterns

**Listes :**
- Cards sur mobile
- Tables sur desktop
- Pagination ou infinite scroll selon volume

**Dashboards :**
- KPIs en premier (haut de page)
- Graphiques en second
- Détails à la demande (drill-down)

---

## Responsive & Accessibility

### Breakpoints

| Breakpoint | Largeur | Layout |
|------------|---------|--------|
| Mobile | < 640px | 1 colonne, bottom nav |
| Tablet | 640-1024px | 2 colonnes, sidebar optionnelle |
| Desktop | > 1024px | Multi-colonnes, sidebar fixe |

### Touch Targets

- Minimum : 44px × 44px (WCAG)
- Boutons action principale : 80px
- Espacement entre targets : 8px min

### Accessibilité

**WCAG AA Compliance :**
- Contrastes texte ≥ 4.5:1
- Focus visible sur tous les éléments interactifs
- Navigation keyboard complète
- ARIA labels sur éléments dynamiques

**Support lecteur d'écran :**
- Hiérarchie heading logique (h1 > h2 > h3)
- Alt text sur images/icônes
- Live regions pour mises à jour dynamiques

**Réduction de mouvement :**
- Respect de `prefers-reduced-motion`
- Animations désactivables

---

## Summary & Next Steps

### Document Summary

Ce document UX Design Specification définit l'expérience utilisateur complète de **Time Manager** :

**Vision :** Transformer le pointage d'une corvée en geste fluide valorisant les accomplissements

**Utilisateurs :**
- Sophie (Employée) : Mobile-first, pointage <5s, visualisation accomplissements
- Marc (Manager) : Desktop-first, validation efficace, alertes proactives

**Expérience Core :** "1 tap pour démarrer, vendredi pour célébrer"

**Design System :** shadcn/ui + Tailwind CSS

**Direction Visuelle :** Clean Minimal (mobile) + Dashboard-First (desktop)

### Principes Clés

1. **Zéro Friction** - Aucune étape inutile, aucune confirmation bloquante
2. **Tout Optionnel, Tout Modifiable** - Projet, catégorie, nom modifiables avant/pendant/après
3. **10 Secondes Max** - Actions fréquentes réalisables en <10s
4. **Accomplissement > Surveillance** - Langage positif, valorisation des réalisations

### Livrables Suivants

1. **Wireframes détaillés** - Figma/Excalidraw des écrans principaux
2. **Prototype interactif** - Flow de pointage testable
3. **Composants React** - Implémentation Phase 1 (TimerButton, TaskCard, BottomNav)
4. **Tests utilisateurs** - Validation avec personas Sophie/Marc

---

