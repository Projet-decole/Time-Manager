---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-Time-Manager-2026-01-09.md'
  - '_bmad-output/analysis/brainstorming-session-2026-01-09.md'
  - 'docs/index.md'
  - 'docs/project-overview.md'
  - 'docs/source-tree-analysis.md'
  - 'docs/architecture-backend.md'
  - 'docs/architecture-frontend.md'
  - 'docs/integration-architecture.md'
workflowType: 'prd'
lastStep: 10
projectType: 'brownfield'
---

# Product Requirements Document - Time-Manager

**Author:** Lunos
**Date:** 2026-01-09
**Version:** 1.0.0
**Status:** Final

---

## Executive Summary

**Time Manager** est une application web de gestion du temps qui transforme le pointage horaire d'une corvée administrative en expérience agréable et valorisante. Conçue pour les employés et leurs managers dans un contexte brownfield (infrastructure existante Node.js + React), l'application élimine la friction du pointage traditionnel grâce à une philosophie **"Zéro Friction"** où l'UI/UX est le différenciateur stratégique principal.

### Vision Produit

Contrairement aux solutions existantes construites backend-first avec des interfaces médiocres, Time Manager place l'expérience utilisateur au cœur du produit:

- **Pointage ultra-rapide** en 3 modes flexibles (<10 secondes vs 2-3 minutes actuellement)
- **UI contextuelle par rôle** (mobile-first pour employés, desktop-optimized pour managers)
- **Dashboards décisionnels** qui transforment les données de temps en insights actionnables
- **Transformation psychologique**: de "corvée obligatoire" à "outil de valorisation"

### Problème Résolu

Les employés perdent entre 5 et 20 minutes par semaine à naviguer dans des systèmes mal conçus (formulaires longs, pop-ups inutiles, navigation profonde >2 clics). Au-delà du temps perdu, c'est l'impact émotionnel qui constitue le vrai problème: commencer sa journée avec une corvée administrative affecte l'engagement.

Les managers font face à une validation fastidieuse (2-3h par semaine), un manque de visibilité temps réel, et une détection tardive des problèmes (heures supplémentaires, dépassements budget).

### Ce Qui Rend Time Manager Unique

**7 Différenciateurs Clés:**

1. **UX-First, Pas Backend-First** - Architecture technique au service de l'expérience, pas l'inverse
2. **UI Contextuelle par Rôle** - Mobile pour employés, Desktop pour managers (pas de compromis responsive)
3. **Flexibilité 3 Modes** - S'adapte aux patterns réels: Simple (1 clic), Journée (découpage après), Template (récurrent)
4. **Valeur Utilisateur Avant Contrôle** - Focus "montrer accomplissements" vs "surveiller heures"
5. **Dashboards Décisionnels** - Niveau 3 data visualization (7 types graphiques, projections, alertes)
6. **Sécurité Multi-Couche** - RBAC simple, JWT, audit invisible, >80% test coverage
7. **Architecture Moderne** - React 19, Vite 7, Express 5, Supabase, CI/CD complet

### Contexte Technique

**Projet Brownfield** - Infrastructure complète déjà en place:
- Backend: Node.js 20 + Express 5.1.0 + Supabase (PostgreSQL)
- Frontend: React 19.1.1 + Vite 7.1.7
- DevOps: Docker (4 images), Docker Compose, GitHub Actions CI/CD
- Tests: Jest (backend >80%), Vitest (frontend >60%)
- Documentation: Architecture complète, guides dev/deployment

**Phase Actuelle:** Infrastructure phase complete, business logic implementation en cours.

## Project Classification

**Technical Type:** Web Application (SPA + REST API)
**Domain:** HR & Workforce Management - Time & Attendance Tracking
**Complexity:** Medium
**Project Context:** Brownfield - extending existing codebase with complete infrastructure

**Architecture Pattern:**
- Backend: Layered (3-tier) RESTful API
- Frontend: Component-based SPA
- Integration: REST over HTTP/JSON
- Deployment: Containerized with CI/CD automation

**Tech Stack Summary:**
- Language: JavaScript/JSX (Node.js 20)
- Backend: Express 5 + Supabase SDK
- Frontend: React 19 + Vite 7
- Database: Supabase (PostgreSQL BaaS)
- Testing: Jest 30 + Vitest 3
- Infrastructure: Docker + GitHub Actions

---

## Success Criteria

### User Success

#### Pour Employés (Persona: Sophie - Développeuse Mobile)

**Réduction de Friction (Métrique Primaire):**
- Temps de pointage ≤ 10 secondes pour 95% des pointages
  - Mode Simple: 5 secondes
  - Mode Journée: 8-10 secondes
  - Mode Template: 3-5 secondes
- **Success Moment:** "Je pointe en 5 secondes sans quitter Slack"

**Adoption & Utilisation:**
- Taux utilisation quotidienne: 100% sans rappels
- Consultation dashboard personnel: 1x par semaine minimum
- Création templates personnels: 70% des employés dans les 2 premières semaines

**Valeur Perçue:**
- Employés consultent volontairement leur dashboard (>30 sec = consultation réelle)
- Feuilles rejetées pour erreur: <5%
- **Transformation:** De "corvée" à "outil qui montre ma valeur"

#### Pour Managers (Persona: Marc - Engineering Manager)

**Gain de Temps (Métrique Primaire):**
- Temps validation hebdomadaire: ≤ 10 minutes pour 8 feuilles
  - Mode Masse: 6 feuilles normales en 2 minutes
  - Mode Détaillé: 2 feuilles anomalies en 8 minutes
- **Réduction:** 90% (de 2-3h à 10 min)

**Management Proactif:**
- Détection précoce surcharge: ≤ 24h après dépassement seuil
- Alertes visuelles (⚠️ >45h, 🔴 >50h): 100% détectées avant fin de semaine
- **Success Moment:** "Je vois Sarah à 45h → je lui parle avant le burn-out"

**Anticipation Budget:**
- Projections projet: Dépassement détecté avec 2 semaines d'avance minimum
- Dashboard Projet consulté hebdomadairement pour chaque projet actif
- **Objectif:** 0 dépassement budget surprise

### Business Success

**Gains Mesurables:**
- Temps gagné employés: 5-20 min/semaine → 4-17h par an par personne
- Temps gagné managers validation: Réduction 90% (2h → 10 min hebdo)
- Détection problèmes: Proactive (<24h) vs Réactive (fin de mois)

**Impact Culturel:**
- Perception pointage: De surveillance à valorisation
- Engagement employés: Amélioration via outils de qualité
- Décisions data-driven: Projections remplacent "doigt mouillé"

### Technical Success

**Code Quality:**
- Backend test coverage: >80% (requirement académique)
- Frontend test coverage: >60% composants critiques
- Linting strict: 0 warning en production
- Code review: 100% des merges via PR

**Performance:**
- API endpoints CRUD: <200ms response time (p95)
- Dashboards data: <500ms pour calculs complexes
- Frontend FCP: <1.5 secondes
- Time to Interactive: <3 secondes

**Security:**
- 100% endpoints protégés, 0 faille permissions
- Tests sécurité: Auth, RBAC, injection, edge cases
- Audit trail complet invisible pour users

**Infrastructure:**
- CI/CD pipeline: 100% merges automatisés, <10 min
- Docker: 4 images optimisées (dev + prod)
- Documentation: Setup <10 minutes pour nouveau dev

### Measurable Outcomes

**Seuils de Réussite:**

**Minimum (Validation Académique):** ✅
- Toutes core features implémentées
- >80% test coverage backend atteint
- 0 bug critique, CI/CD green
- UI/UX responsive mobile + desktop
- **Verdict:** Projet validé

**Target (Excellence):** ⭐
- Toutes métriques utilisateur atteintes
- Performance excellente (<200ms API, <1.5s FCP)
- Design "Zéro Friction" validé
- 7 types graphiques Level 3 implémentés
- **Verdict:** Projet d'excellence

**Exceptional (Portfolio-Worthy):** 🏆
- Target + feedback utilisateurs réels positif
- Code quality exemplaire (architecture référence)
- Présentation impressionnante
- **Verdict:** Maîtrise complète démontrée

---

## Product Scope

### MVP - Minimum Viable Product

**Phase 1: Core Features (Must-Have)**

Toutes les fonctionnalités listées ci-dessous sont **non-négociables** pour validation académique.

#### In Scope:
1. Authentification JWT + RBAC 2 rôles (Employee | Manager)
2. Système pointage 3 modes (Simple, Journée, Template)
3. Workflow validation complet (Brouillon → Soumis → Validé)
4. Gestion Équipes, Projets, Catégories (CRUD par Managers)
5. 3 Dashboards avec 7 types graphiques Level 3
6. Templates pointage (création, application, gestion)
7. Audit trail complet invisible
8. Infrastructure CI/CD + >80% test coverage backend

#### Success Criteria MVP:
- Workflow end-to-end fonctionnel (employé pointe → manager valide)
- 0 bug critique (crash, faille sécurité, perte données)
- Performance acceptable (<500ms API, <3s FCP)
- Mobile-first validé (utilisable smartphone)
- Documentation complète

### Growth Features (Post-MVP)

**Phase 2: Enhancements (Nice-to-Have)**

Fonctionnalités **intentionnellement exclues** du MVP pour maintenir scope réaliste.

#### Out of Scope MVP:
1. **Notifications** - Email/WebSocket alerts (infrastructure additionnelle)
2. **Auto-détection patterns templates** - ML/analyse patterns (complexité algorithmique)
3. **Exports avancés** - PDF/Excel formatés (dashboards visuels suffisent MVP)
4. **Mode offline mobile** - Sync hors ligne (use case limité, complexité élevée)
5. **Intégrations tierces** - Slack, Google Calendar, Jira (chaque intégration = projet)
6. **3ème rôle Admin RH** - Lecture seule multi-équipes (2 rôles suffisent RBAC démonstration)
7. **Permissions granulaires par projet** - Matrice complexe (Manager voit tout MVP)

#### Rationale Exclusion:
- Pas critiques pour workflow core
- Complexité vs valeur ajoutée déséquilibrée pour contexte académique
- Architecture extensible permet ajouts futurs sans refactoring majeur

### Vision (Future)

**Extensibilité Architecturale Prévue:**

Bien que projet académique avec scope défini, architecture conçue pour évolutions futures:

- **RBAC extensible:** Ajout rôles sans toucher existant
- **API REST modulaire:** Versioning /api/v1/, intégrations tierces possibles
- **Architecture layered backend:** Routes → Controllers → Services → Data Access
- **Component-based frontend:** Composants React réutilisables, état centralisé
- **Database schema flexible:** Migrations Supabase, nouveaux champs sans impact

**Note:** Évolutions non planifiées dans scope académique mais architecture ne les bloque pas.

---

## User Journeys

### Journey 1: Sophie Moreau - L'Employée qui Récupère 20 Minutes par Semaine

**Persona:** Développeuse Full-Stack, 28 ans, travail hybride, 3 projets clients simultanés.

**Situation Initiale:**
Sophie commence chaque journée avec une corvée: ouvrir un site web lourd sur mobile pour pointer. 2-3 minutes de friction qui la coupe dans sa concentration. Quand elle est "dans le flow", elle oublie de pointer → 10-15 minutes de reconstitution mentale en fin de semaine. "C'est la première chose désagréable de ma journée."

**Découverte (Jour 1 - Matin):**
Sophie reçoit un email "Nouveau système - Time Manager". Pensée: *"Encore un truc lourd..."*. Elle ouvre le lien sur son smartphone. Surprise: interface épurée, 3 gros boutons clairs: "Démarrer Journée" | "Pointer Tâche" | "Utiliser Template". Elle tape "Démarrer Journée" → confirmation visuelle immédiate, aucune popup. Réaction: *"Attends... c'est tout? C'est fait?"* → **Premier moment positif** ✅

**Adoption (Première Semaine):**

*Jour 1 soir:* Sophie termine, tape "Arrêter Journée". Découvre l'écran "Découper ta journée" avec timeline visuelle. Glisse des blocs pour attribuer temps à différents projets. **Aha moment:** *"Je pointe vite le matin, je découpe après. Fini d'interrompre mon flow 10 fois!"*

*Vendredi:* Ouvre Dashboard Personnel. Voit donut chart coloré: 60% Dev Client A, 20% Dev Client B, 15% Meetings, 5% Formation. **Success Moment:** *"Wow, 28h cette semaine sur du vrai dev!"* → Sentiment d'accomplissement 🎯

**Long-Terme (Semaine 2+):**
Sophie crée template "Mardi Client A" depuis journée existante. Mardi suivant: 1 tap → journée pré-remplie. Pointage devenu geste automatique <10 sec. Dashboard consulté chaque vendredi → **outil de motivation** plutôt que corvée. **Changement psychologique:** De "corvée administrative" à "outil qui me montre ma valeur".

**Requirements Révélés:**
- Pointage mobile ultra-rapide (<10 sec)
- 3 modes flexibles (Simple, Journée, Template)
- Timeline visuelle découpage
- Dashboard personnel valorisant accomplissements
- Création templates en 1 clic

---

### Journey 2: Marc Dubois - Le Manager qui Anticipe au Lieu de Réagir

**Persona:** Engineering Manager, 38 ans, équipe de 8 développeurs, 5 projets clients.

**Situation Initiale:**
Marc passe 2-3h par semaine à valider feuilles manuellement. Découvre les heures sup en fin de mois → trop tard pour réagir. Client mécontent car projet dépassé de 20% → "Pourquoi je ne l'ai pas vu venir?" Rapports Excel statiques qui ne montrent ni tendances ni alertes.

**Découverte (Jour 1):**
Marc se connecte sur desktop. Interface clean, sidebar: Dashboard Équipe | Validation | Projets | Équipes. Ouvre Dashboard Équipe: KPIs (312h total, 39h/personne moyenne, 3 feuilles attente, 2 ⚠️ heures sup). Bar chart horizontal: vue comparative 8 membres. Alertes: Sarah 45h ⚠️, Tom 48h ⚠️. **Aha moment:** *"En 10 secondes je sais où regarder!"* ✅

**Core Usage (Semaine 1):**

*Lundi (Planification):* Dashboard Équipe montre répartition projets: 65% sur Client X mais budget à 80% consommé. Switch Dashboard Projet Client X: Line chart avec projection → *"Dépassement dans 10 jours"*. **Action:** Réaffecte 1 personne. **Décision data-driven en 5 min** 🎯

*Vendredi (Validation):* Ouvre "Validation" → 8 feuilles attente. **Mode Masse:** Scan rapide, valide 6 feuilles normales (30 sec). **Anomalie:** Sarah 52h. **Switch Mode Détaillé:** Zoome feuille Sarah, voit détail jour/jour. **Action:** Rejette avec message "Sarah, 52h c'est trop. On en parle lundi." **Validation complète 5 min vs 45 min avant.**

**Long-Terme (Management Proactif):**
Coup d'œil matinal Dashboard Équipe (2 min). Détecte tendances: qui en surcharge, qui sous-utilisé. Dashboards Projet → anticipe problèmes avant le client. Projections budgétaires 2 semaines d'avance. **Changement paradigme:** De "validation chronophage" à "outil de pilotage", de "réagir" à "anticiper".

**Requirements Révélés:**
- Dashboard Équipe décisionnel (KPIs, comparaison, alertes visuelles)
- Dashboard Projet avec projections budget
- Validation configurable (Masse vs Détaillée)
- Détection proactive surcharges
- Drill-down employé → détail

---

### Journey 3: Manager Auto-Validation - Le Garde-Fou qui Prévient le Conflit d'Intérêts

**Persona:** Isabelle, Team Lead, doit aussi pointer comme ses employés.

**Situation:**
Isabelle est Manager mais doit également pointer ses heures. Dans l'ancien système, elle pouvait valider sa propre feuille → conflit d'intérêts potentiel.

**Time Manager Workflow:**
Isabelle pointe comme employée toute la semaine (3 modes disponibles). Vendredi: soumet sa feuille comme tout le monde → État "Soumis". Elle NE PEUT PAS valider sa propre feuille (bouton "Valider" désactivé avec tooltip "Un autre manager doit valider votre feuille").

Marc (autre manager) reçoit notification "1 feuille manager en attente". Il valide la feuille d'Isabelle. **Règle métier respectée:** Séparation validation pour éviter auto-approbation.

**Requirements Révélés:**
- Manager hérite permissions Employee (pointe lui-même)
- Interdiction valider sa propre feuille (logique backend + UI)
- Auto-validation nécessite un autre manager
- Workflow transparent avec messages explicatifs

---

### Journey 4: Admin Support - Le Cas d'Audit Légal (Future User Type)

**Persona:** Marie, RH/Contrôle de Gestion, besoin accès données agrégées.

**Situation Future (Out of Scope MVP):**
Marie doit produire rapport conformité URSSAF avec historique modifications. Besoin accès lecture seule multi-équipes + exports.

**Note:** Non implémenté MVP (2 rôles suffisent). Architecture RBAC extensible permet ajout 3ème rôle "Admin" ultérieurement sans refactoring. Audit trail déjà implémenté MVP (logs complets), seul manque interface exposition.

**Requirements Futurs (Post-MVP):**
- Rôle Admin lecture seule multi-équipes
- Exports consolidés (CSV/Excel)
- Interface audit trail (logs actuellement backend only)
- Dashboards consolidés organisation entière

---

### Journey Requirements Summary

**Capabilities Révélées par Journeys:**

**Employés:**
- Pointage mobile ultra-rapide multi-modes
- Timeline découpage visuel
- Dashboard personnel valorisant
- Templates personnalisables
- Historique calendrier

**Managers:**
- Dashboards décisionnels multi-niveaux (Équipe, Projet)
- Validation configurable (Masse, Détaillée)
- Alertes visuelles proactives
- Projections budgétaires
- Drill-down détail employé

**Système:**
- Workflow validation avec garde-fous
- Auto-validation managers (peer review)
- RBAC 2 rôles extensible
- Audit trail complet
- Permissions backend strictes

---

## Functional Requirements

### Authentication & User Management

**FR1:** Un utilisateur peut se connecter avec email + password et recevoir un JWT token
**FR2:** Un utilisateur peut se déconnecter et invalider son token
**FR3:** Le système rafraîchit automatiquement les tokens expirés (refresh token flow)
**FR4:** Un utilisateur peut réinitialiser son mot de passe via email
**FR5:** Un utilisateur peut consulter et modifier son profil (nom, email, préférences)

### Authorization & Permissions

**FR6:** Le système attribue un rôle à chaque utilisateur (Employee ou Manager)
**FR7:** Un Manager hérite automatiquement de toutes les permissions d'un Employee
**FR8:** Un Employee peut créer, modifier, supprimer ses propres pointages en état Brouillon
**FR9:** Un Employee peut consulter son historique personnel et son dashboard
**FR10:** Un Manager peut consulter les données de tous les employés et équipes
**FR11:** Un Manager peut valider ou rejeter les feuilles de temps (sauf la sienne)
**FR12:** Un Manager peut créer, modifier, supprimer des projets, catégories et équipes
**FR13:** Le système refuse les actions non autorisées par le rôle de l'utilisateur

### Time Tracking - Mode Simple

**FR14:** Un Employee peut démarrer un pointage avec un clic (bouton Start)
**FR15:** Un Employee peut arrêter un pointage en cours avec un clic (bouton Stop)
**FR16:** Un Employee peut sélectionner un projet et/ou une catégorie lors du pointage
**FR17:** Le système affiche le temps écoulé en temps réel pendant un pointage actif
**FR18:** Un Employee peut modifier ou supprimer un pointage en état Brouillon

### Time Tracking - Mode Journée

**FR19:** Un Employee peut démarrer une journée de travail (enregistre heure début)
**FR20:** Un Employee peut arrêter une journée de travail (enregistre heure fin)
**FR21:** Un Employee peut découper sa journée en blocs de temps attribués à différents projets/catégories
**FR22:** Le système affiche une timeline visuelle pour faciliter le découpage
**FR23:** Un Employee peut glisser-déposer des blocs de temps sur la timeline

### Time Tracking - Mode Template

**FR24:** Un Employee peut créer un template depuis une journée existante
**FR25:** Un Employee peut créer un template vierge avec configuration personnalisée
**FR26:** Un Employee peut nommer et décrire ses templates
**FR27:** Un Employee peut appliquer un template en 1 clic pour créer une journée pré-remplie
**FR28:** Un Employee peut modifier une journée créée depuis template (reste en Brouillon)
**FR29:** Un Employee peut éditer, dupliquer ou supprimer ses templates
**FR30:** Un Employee peut consulter la liste de ses templates personnels

### Timesheet Workflow

**FR31:** Le système maintient les états de feuille de temps (Brouillon, Soumis, Validé, Rejeté)
**FR32:** Un Employee peut soumettre sa feuille de temps (passage Brouillon → Soumis)
**FR33:** Une feuille soumise devient non-modifiable par l'Employee
**FR34:** Un Manager peut valider une feuille soumise (passage Soumis → Validé)
**FR35:** Un Manager peut rejeter une feuille avec un message explicatif (passage Soumis → Brouillon)
**FR36:** Un Manager peut repasser une feuille validée en Brouillon si <1 mois (garde-fou temporel)
**FR37:** Le système verrouille définitivement les feuilles validées depuis >1 mois
**FR38:** Un Manager ne peut pas valider sa propre feuille (nécessite validation par un autre Manager)
**FR39:** Le système notifie l'Employee lors d'une validation ou d'un rejet (futur: email/push)

### Team Management

**FR40:** Un Manager peut créer une équipe avec nom et description
**FR41:** Un Manager peut assigner des membres (employés et managers) à une équipe
**FR42:** Un Manager peut assigner des projets à une équipe
**FR43:** Un utilisateur peut appartenir à plusieurs équipes simultanément
**FR44:** Un Manager peut modifier ou supprimer une équipe
**FR45:** Un Manager peut consulter la liste de toutes les équipes

### Project & Category Management

**FR46:** Un Manager peut créer un projet avec nom, description et budget optionnel
**FR47:** Le système génère automatiquement un code unique pour chaque projet
**FR48:** Un Manager peut archiver ou réactiver un projet
**FR49:** Un Manager peut créer une catégorie avec nom, description et couleur
**FR50:** Un Manager peut modifier ou supprimer des projets et catégories
**FR51:** Un utilisateur peut sélectionner un projet et une catégorie lors du pointage
**FR52:** Un projet peut être associé à plusieurs catégories

### Dashboard - Employee Personal

**FR53:** Un Employee peut consulter son dashboard personnel avec KPIs
**FR54:** Le système affiche les heures semaine/mois en cours vs objectif
**FR55:** Le système affiche un donut chart de répartition temps par projet
**FR56:** Le système affiche un line chart de tendance sur 30 jours
**FR57:** Le système affiche le statut des feuilles de temps (Brouillon, Soumise, Validée)
**FR58:** Le dashboard se met à jour automatiquement avec les nouveaux pointages

### Dashboard - Manager Team

**FR59:** Un Manager peut consulter le dashboard équipe avec KPIs consolidés
**FR60:** Le système affiche total heures équipe, moyenne par employé, feuilles en attente
**FR61:** Le système affiche des alertes visuelles pour employés en surcharge (>45h ⚠️, >50h 🔴)
**FR62:** Le système affiche un bar chart horizontal comparant les employés
**FR63:** Le système affiche des donut charts de répartition par projet et par catégorie
**FR64:** Le système affiche un stacked area chart de tendance 4 semaines
**FR65:** Un Manager peut drill-down sur un employé pour voir son détail
**FR66:** Le dashboard Manager se rafraîchit automatiquement

### Dashboard - Project Budget

**FR67:** Un Manager peut consulter le dashboard d'un projet spécifique
**FR68:** Le système affiche budget consommé (% et heures), restant, et projection
**FR69:** Le système affiche un line chart avec projection de dépassement
**FR70:** Le système affiche des bar charts de répartition par équipe et catégorie
**FR71:** Le système affiche un leaderboard des top contributeurs
**FR72:** Le système affiche une gauge/progress bar du budget consommé
**FR73:** Le système affiche une alerte visuelle si risque de dépassement <2 semaines
**FR74:** Le dashboard Projet supporte les projections basées sur les tendances

### Audit Trail & History

**FR75:** Le système enregistre toutes les modifications de pointages (qui, quand, quoi)
**FR76:** Le système enregistre toutes les validations et rejets de feuilles avec justification
**FR77:** Le système enregistre les modifications post-validation (retour Brouillon)
**FR78:** Le système enregistre les créations/modifications de projets, catégories, équipes
**FR79:** L'historique est permanent (pas de suppression)
**FR80:** L'historique est invisible pour les utilisateurs standard (backend only)
**FR81:** L'historique est accessible pour audit/conformité (requêtes backend dédiées)

### Data Visualization (Level 3)

**FR82:** Le système affiche des bar charts (horizontal et vertical) pour comparaisons
**FR83:** Le système affiche des line charts pour tendances temporelles
**FR84:** Le système affiche des donut/pie charts pour répartitions proportionnelles
**FR85:** Le système affiche des stacked bar charts pour composition par catégorie
**FR86:** Le système affiche des stacked area charts pour évolution composition temps
**FR87:** Le système affiche des gauges/progress bars pour progression budget/objectif
**FR88:** Le système affiche des KPI cards pour métriques clés mise en avant
**FR89:** Les graphiques sont interactifs (hover tooltips, drill-down click)

### Mobile & Responsive Design

**FR90:** L'interface de pointage est optimisée pour smartphone (mobile-first)
**FR91:** Les boutons principaux sont touch-friendly (>44px)
**FR92:** La navigation principale nécessite ≤2 clics pour actions courantes
**FR93:** Le système évite les pop-ups de confirmation inutiles
**FR94:** L'interface Manager est optimisée pour desktop (dashboards multi-colonnes)
**FR95:** Le système adapte l'UI selon le rôle de l'utilisateur (contextuelle)

---

## Non-Functional Requirements

### Performance

**NFR1:** Les endpoints API CRUD répondent en <200ms (p95) pour requêtes simples
**NFR2:** Les dashboards chargent les données en <500ms pour calculs complexes
**NFR3:** Le First Contentful Paint (FCP) frontend est <1.5 secondes
**NFR4:** Le Time to Interactive (TTI) est <3 secondes
**NFR5:** L'application supporte 100 utilisateurs simultanés sans dégradation
**NFR6:** Le système applique du lazy loading pour les dashboards et graphiques lourds
**NFR7:** Le bundle JavaScript frontend est optimisé avec code splitting

### Security

**NFR8:** Toutes les données sensibles sont transmises via HTTPS en production
**NFR9:** Les tokens JWT expirent après une durée configurable (défaut: 1h)
**NFR10:** Les refresh tokens sont stockés de manière sécurisée (httpOnly cookies)
**NFR11:** Le système valide toutes les entrées utilisateur pour prévenir injections SQL/XSS
**NFR12:** Le système applique rate limiting sur les endpoints API (100 req/min par IP)
**NFR13:** Le système hash les mots de passe avec bcrypt (cost factor ≥12)
**NFR14:** Le système vérifie les permissions backend sur TOUTES les routes sensibles
**NFR15:** Les secrets (API keys, DB credentials) sont stockés en variables d'environnement
**NFR16:** Le système implémente CORS configuré pour origines autorisées uniquement
**NFR17:** Le système applique des headers de sécurité (CSP, X-Frame-Options, etc.)

### Scalability

**NFR18:** L'architecture supporte une croissance de 10x utilisateurs avec <10% dégradation performance
**NFR19:** La base de données Supabase est configurée avec indexes appropriés pour requêtes fréquentes
**NFR20:** Le système utilise du caching pour données peu changeantes (projets, catégories)
**NFR21:** L'architecture permet l'ajout de nouveaux rôles RBAC sans refactoring majeur
**NFR22:** Les images Docker sont optimisées (<200MB backend, <25MB frontend nginx)

### Accessibility

**NFR23:** L'interface suit les guidelines de contraste WCAG 2.1 niveau AA
**NFR24:** Les boutons principaux sont utilisables au clavier (tab navigation)
**NFR25:** Les graphiques incluent des alternatives textuelles pour lecteurs d'écran
**NFR26:** Les couleurs intentionnelles suivent un code cohérent (bleu/vert/orange/rouge)

### Integration & Interoperability

**NFR27:** L'API backend suit les conventions RESTful standard
**NFR28:** Les endpoints API sont versionnés (/api/v1/)
**NFR29:** Le système expose une API documentée (minimum README, idéalement OpenAPI/Swagger)
**NFR30:** Le backend et frontend communiquent via JSON
**NFR31:** L'architecture permet l'ajout d'intégrations tierces futures sans casser l'existant

### Testing & Quality

**NFR32:** Le backend atteint >80% de test coverage (Jest + Supertest)
**NFR33:** Les routes API sont testées à 100%
**NFR34:** Le frontend atteint >60% de test coverage sur composants critiques (Vitest)
**NFR35:** Le système passe 100% des tests security (auth, RBAC, injection, edge cases)
**NFR36:** Le code respecte ESLint strict avec 0 warning en production
**NFR37:** Le CI/CD pipeline exécute tous les tests automatiquement à chaque push
**NFR38:** Le pipeline CI/CD complète en <10 minutes de bout en bout

### Deployment & Operations

**NFR39:** L'application est containerisée avec Docker (4 images: backend dev/prod, frontend dev/prod)
**NFR40:** L'environnement de développement démarre avec docker-compose up
**NFR41:** Le système supporte les variables d'environnement pour configuration
**NFR42:** Les logs applicatifs sont structurés et exportables
**NFR43:** Le système inclut des health check endpoints (/health, /ready)
**NFR44:** Le déploiement s'effectue via CI/CD GitHub Actions automatisé
**NFR45:** Les images Docker sont poussées vers Docker Hub avec tags appropriés

### Maintainability & Documentation

**NFR46:** Le code backend suit une architecture layered (Routes → Controllers → Services → Data)
**NFR47:** Le code frontend utilise des composants React réutilisables
**NFR48:** La documentation architecture (backend, frontend, integration) est complète et à jour
**NFR49:** Le development guide permet un setup en <10 minutes
**NFR50:** Le deployment guide inclut instructions Docker et CI/CD
**NFR51:** Le code complexe inclut des commentaires explicatifs
**NFR52:** Le système utilise une convention de nommage cohérente

### Reliability

**NFR53:** Le système gère gracieusement les erreurs avec messages utilisateur clairs
**NFR54:** Les transactions critiques (validation feuille) sont atomiques (ACID)
**NFR55:** Le système prévient les race conditions sur modifications concurrentes
**NFR56:** Les erreurs backend sont loggées avec stack trace pour debug
**NFR57:** Le système inclut des fallbacks pour API failures (retry logic, cache)

---

## Success Validation

**Ce PRD est considéré validé et prêt pour implémentation lorsque:**

✅ Toutes les Functional Requirements (FR1-FR95) sont claires et testables
✅ Toutes les Non-Functional Requirements (NFR1-NFR57) sont mesurables
✅ Les User Journeys couvrent tous les cas d'usage critiques
✅ Le scope MVP est réaliste et délimité (vs Out of Scope)
✅ Les Success Criteria sont spécifiques et actionnables
✅ L'architecture brownfield existante est prise en compte
✅ La vision "Zéro Friction" est explicite dans tous les requirements

**Équipes Downstream:**
- UX Designers → Conçoivent interactions pour FR1-FR95
- Architects → Supportent NFR + infrastructure brownfield existante
- Developers → Implémentent FR + NFR selon PRD
- QA → Testent contre FR + NFR (<80% coverage backend minimum)

**Date de Validation:** 2026-01-09
**Prochaine Étape:** Transition vers Architecture Technique & Épics/Stories

---

**Document Status:** ✅ Complete et prêt pour implémentation

