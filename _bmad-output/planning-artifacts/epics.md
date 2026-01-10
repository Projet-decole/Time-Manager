---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
workflowType: 'epics'
lastStep: 4
totalEpics: 8
totalStories: 67
frCoverage: '95/95 (100%)'
status: 'validated'
validatedAt: '2026-01-10'
---

# Time-Manager - Epic Breakdown

## Overview

Ce document fournit la décomposition complète en épics et stories pour Time-Manager, décomposant les requirements du PRD et de l'Architecture en stories implémentables.

## Requirements Inventory

### Functional Requirements

**FR1:** Un utilisateur peut se connecter avec email + password et recevoir un JWT token
**FR2:** Un utilisateur peut se déconnecter et invalider son token
**FR3:** Le système rafraîchit automatiquement les tokens expirés (refresh token flow)
**FR4:** Un utilisateur peut réinitialiser son mot de passe via email
**FR5:** Un utilisateur peut consulter et modifier son profil (nom, email, préférences)

**FR6:** Le système attribue un rôle à chaque utilisateur (Employee ou Manager)
**FR7:** Un Manager hérite automatiquement de toutes les permissions d'un Employee
**FR8:** Un Employee peut créer, modifier, supprimer ses propres pointages en état Brouillon
**FR9:** Un Employee peut consulter son historique personnel et son dashboard
**FR10:** Un Manager peut consulter les données de tous les employés et équipes
**FR11:** Un Manager peut valider ou rejeter les feuilles de temps (sauf la sienne)
**FR12:** Un Manager peut créer, modifier, supprimer des projets, catégories et équipes
**FR13:** Le système refuse les actions non autorisées par le rôle de l'utilisateur

**FR14:** Un Employee peut démarrer un pointage avec un clic (bouton Start)
**FR15:** Un Employee peut arrêter un pointage en cours avec un clic (bouton Stop)
**FR16:** Un Employee peut sélectionner un projet et/ou une catégorie lors du pointage
**FR17:** Le système affiche le temps écoulé en temps réel pendant un pointage actif
**FR18:** Un Employee peut modifier ou supprimer un pointage en état Brouillon

**FR19:** Un Employee peut démarrer une journée de travail (enregistre heure début)
**FR20:** Un Employee peut arrêter une journée de travail (enregistre heure fin)
**FR21:** Un Employee peut découper sa journée en blocs de temps attribués à différents projets/catégories
**FR22:** Le système affiche une timeline visuelle pour faciliter le découpage
**FR23:** Un Employee peut glisser-déposer des blocs de temps sur la timeline

**FR24:** Un Employee peut créer un template depuis une journée existante
**FR25:** Un Employee peut créer un template vierge avec configuration personnalisée
**FR26:** Un Employee peut nommer et décrire ses templates
**FR27:** Un Employee peut appliquer un template en 1 clic pour créer une journée pré-remplie
**FR28:** Un Employee peut modifier une journée créée depuis template (reste en Brouillon)
**FR29:** Un Employee peut éditer, dupliquer ou supprimer ses templates
**FR30:** Un Employee peut consulter la liste de ses templates personnels

**FR31:** Le système maintient les états de feuille de temps (Brouillon, Soumis, Validé, Rejeté)
**FR32:** Un Employee peut soumettre sa feuille de temps (passage Brouillon → Soumis)
**FR33:** Une feuille soumise devient non-modifiable par l'Employee
**FR34:** Un Manager peut valider une feuille soumise (passage Soumis → Validé)
**FR35:** Un Manager peut rejeter une feuille avec un message explicatif (passage Soumis → Brouillon)
**FR36:** Un Manager peut repasser une feuille validée en Brouillon si <1 mois (garde-fou temporel)
**FR37:** Le système verrouille définitivement les feuilles validées depuis >1 mois
**FR38:** Un Manager ne peut pas valider sa propre feuille (nécessite validation par un autre Manager)
**FR39:** Le système notifie l'Employee lors d'une validation ou d'un rejet (futur: email/push)

**FR40:** Un Manager peut créer une équipe avec nom et description
**FR41:** Un Manager peut assigner des membres (employés et managers) à une équipe
**FR42:** Un Manager peut assigner des projets à une équipe
**FR43:** Un utilisateur peut appartenir à plusieurs équipes simultanément
**FR44:** Un Manager peut modifier ou supprimer une équipe
**FR45:** Un Manager peut consulter la liste de toutes les équipes

**FR46:** Un Manager peut créer un projet avec nom, description et budget optionnel
**FR47:** Le système génère automatiquement un code unique pour chaque projet
**FR48:** Un Manager peut archiver ou réactiver un projet
**FR49:** Un Manager peut créer une catégorie avec nom, description et couleur
**FR50:** Un Manager peut modifier ou supprimer des projets et catégories
**FR51:** Un utilisateur peut sélectionner un projet et une catégorie lors du pointage
**FR52:** Un projet peut être associé à plusieurs catégories

**FR53:** Un Employee peut consulter son dashboard personnel avec KPIs
**FR54:** Le système affiche les heures semaine/mois en cours vs objectif
**FR55:** Le système affiche un donut chart de répartition temps par projet
**FR56:** Le système affiche un line chart de tendance sur 30 jours
**FR57:** Le système affiche le statut des feuilles de temps (Brouillon, Soumise, Validée)
**FR58:** Le dashboard se met à jour automatiquement avec les nouveaux pointages

**FR59:** Un Manager peut consulter le dashboard équipe avec KPIs consolidés
**FR60:** Le système affiche total heures équipe, moyenne par employé, feuilles en attente
**FR61:** Le système affiche des alertes visuelles pour employés en surcharge (>45h ⚠️, >50h 🔴)
**FR62:** Le système affiche un bar chart horizontal comparant les employés
**FR63:** Le système affiche des donut charts de répartition par projet et par catégorie
**FR64:** Le système affiche un stacked area chart de tendance 4 semaines
**FR65:** Un Manager peut drill-down sur un employé pour voir son détail
**FR66:** Le dashboard Manager se rafraîchit automatiquement

**FR67:** Un Manager peut consulter le dashboard d'un projet spécifique
**FR68:** Le système affiche budget consommé (% et heures), restant, et projection
**FR69:** Le système affiche un line chart avec projection de dépassement
**FR70:** Le système affiche des bar charts de répartition par équipe et catégorie
**FR71:** Le système affiche un leaderboard des top contributeurs
**FR72:** Le système affiche une gauge/progress bar du budget consommé
**FR73:** Le système affiche une alerte visuelle si risque de dépassement <2 semaines
**FR74:** Le dashboard Projet supporte les projections basées sur les tendances

**FR75:** Le système enregistre toutes les modifications de pointages (qui, quand, quoi)
**FR76:** Le système enregistre toutes les validations et rejets de feuilles avec justification
**FR77:** Le système enregistre les modifications post-validation (retour Brouillon)
**FR78:** Le système enregistre les créations/modifications de projets, catégories, équipes
**FR79:** L'historique est permanent (pas de suppression)
**FR80:** L'historique est invisible pour les utilisateurs standard (backend only)
**FR81:** L'historique est accessible pour audit/conformité (requêtes backend dédiées)

**FR82:** Le système affiche des bar charts (horizontal et vertical) pour comparaisons
**FR83:** Le système affiche des line charts pour tendances temporelles
**FR84:** Le système affiche des donut/pie charts pour répartitions proportionnelles
**FR85:** Le système affiche des stacked bar charts pour composition par catégorie
**FR86:** Le système affiche des stacked area charts pour évolution composition temps
**FR87:** Le système affiche des gauges/progress bars pour progression budget/objectif
**FR88:** Le système affiche des KPI cards pour métriques clés mise en avant
**FR89:** Les graphiques sont interactifs (hover tooltips, drill-down click)

**FR90:** L'interface de pointage est optimisée pour smartphone (mobile-first)
**FR91:** Les boutons principaux sont touch-friendly (>44px)
**FR92:** La navigation principale nécessite ≤2 clics pour actions courantes
**FR93:** Le système évite les pop-ups de confirmation inutiles
**FR94:** L'interface Manager est optimisée pour desktop (dashboards multi-colonnes)
**FR95:** Le système adapte l'UI selon le rôle de l'utilisateur (contextuelle)

### Non-Functional Requirements

**NFR1:** Les endpoints API CRUD répondent en <200ms (p95) pour requêtes simples
**NFR2:** Les dashboards chargent les données en <500ms pour calculs complexes
**NFR3:** Le First Contentful Paint (FCP) frontend est <1.5 secondes
**NFR4:** Le Time to Interactive (TTI) est <3 secondes
**NFR5:** L'application supporte 100 utilisateurs simultanés sans dégradation
**NFR6:** Le système applique du lazy loading pour les dashboards et graphiques lourds
**NFR7:** Le bundle JavaScript frontend est optimisé avec code splitting

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

**NFR18:** L'architecture supporte une croissance de 10x utilisateurs avec <10% dégradation performance
**NFR19:** La base de données Supabase est configurée avec indexes appropriés pour requêtes fréquentes
**NFR20:** Le système utilise du caching pour données peu changeantes (projets, catégories)
**NFR21:** L'architecture permet l'ajout de nouveaux rôles RBAC sans refactoring majeur
**NFR22:** Les images Docker sont optimisées (<200MB backend, <25MB frontend nginx)

**NFR23:** L'interface suit les guidelines de contraste WCAG 2.1 niveau AA
**NFR24:** Les boutons principaux sont utilisables au clavier (tab navigation)
**NFR25:** Les graphiques incluent des alternatives textuelles pour lecteurs d'écran
**NFR26:** Les couleurs intentionnelles suivent un code cohérent (bleu/vert/orange/rouge)

**NFR27:** L'API backend suit les conventions RESTful standard
**NFR28:** Les endpoints API sont versionnés (/api/v1/)
**NFR29:** Le système expose une API documentée (minimum README, idéalement OpenAPI/Swagger)
**NFR30:** Le backend et frontend communiquent via JSON
**NFR31:** L'architecture permet l'ajout d'intégrations tierces futures sans casser l'existant

**NFR32:** Le backend atteint >80% de test coverage (Jest + Supertest)
**NFR33:** Les routes API sont testées à 100%
**NFR34:** Le frontend atteint >60% de test coverage sur composants critiques (Vitest)
**NFR35:** Le système passe 100% des tests security (auth, RBAC, injection, edge cases)
**NFR36:** Le code respecte ESLint strict avec 0 warning en production
**NFR37:** Le CI/CD pipeline exécute tous les tests automatiquement à chaque push
**NFR38:** Le pipeline CI/CD complète en <10 minutes de bout en bout

**NFR39:** L'application est containerisée avec Docker (4 images: backend dev/prod, frontend dev/prod)
**NFR40:** L'environnement de développement démarre avec docker-compose up
**NFR41:** Le système supporte les variables d'environnement pour configuration
**NFR42:** Les logs applicatifs sont structurés et exportables
**NFR43:** Le système inclut des health check endpoints (/health, /ready)
**NFR44:** Le déploiement s'effectue via CI/CD GitHub Actions automatisé
**NFR45:** Les images Docker sont poussées vers Docker Hub avec tags appropriés

**NFR46:** Le code backend suit une architecture layered (Routes → Controllers → Services → Data)
**NFR47:** Le code frontend utilise des composants React réutilisables
**NFR48:** La documentation architecture (backend, frontend, integration) est complète et à jour
**NFR49:** Le development guide permet un setup en <10 minutes
**NFR50:** Le deployment guide inclut instructions Docker et CI/CD
**NFR51:** Le code complexe inclut des commentaires explicatifs
**NFR52:** Le système utilise une convention de nommage cohérente

**NFR53:** Le système gère gracieusement les erreurs avec messages utilisateur clairs
**NFR54:** Les transactions critiques (validation feuille) sont atomiques (ACID)
**NFR55:** Le système prévient les race conditions sur modifications concurrentes
**NFR56:** Les erreurs backend sont loggées avec stack trace pour debug
**NFR57:** Le système inclut des fallbacks pour API failures (retry logic, cache)

### Additional Requirements (from Architecture)

**Backend Architecture Requirements:**
- Utiliser Express 5.1.0 comme framework HTTP
- Implémenter une architecture layered (Routes → Controllers → Services → Data Access)
- Utiliser Supabase SDK (2.58.0) pour PostgreSQL/BaaS
- Configurer middleware CORS pour origines autorisées
- Implémenter JWT authentication middleware
- Utiliser bcrypt pour hashing passwords (cost factor ≥12)
- Créer endpoints health check (/health, /ready)
- Suivre conventions RESTful pour API design
- Versionner l'API (/api/v1/)
- Implémenter centralized error handling middleware
- Utiliser environnement variables (.env) pour configuration
- Logger structured logs (développement: console, production: Winston/Pino)

**Frontend Architecture Requirements:**
- Utiliser React 19.1.1 avec Vite 7.1.7 comme build tool
- Implémenter architecture component-based
- Organiser composants: common/, layout/, features/
- Créer services layer pour API calls (api.js, authService.js, etc.)
- Implémenter custom React hooks (useAuth, useUsers, etc.)
- Choisir state management (Context API recommandé pour démarrer)
- Implémenter React Router v6 pour navigation
- Créer ProtectedRoute component pour routes authentifiées
- Utiliser fetch ou axios pour HTTP requests
- Stocker JWT token dans localStorage avec expiration
- Implémenter error boundaries pour graceful error handling
- Suivre principes: Single Responsibility, Composability, Reusability
- Utiliser CSS Modules ou Tailwind CSS pour styling
- Optimiser avec code splitting (React.lazy, Suspense)
- Implémenter lazy loading pour dashboards/graphiques lourds

**Database Requirements (Supabase/PostgreSQL):**
- Créer tables: users, teams, team_members, clocks, projects, categories, timesheets, audit_logs
- Implémenter foreign keys et constraints appropriés
- Créer indexes sur colonnes fréquemment requêtées (user_id, clock_in, team_id, etc.)
- Configurer connection pooling
- Utiliser parameterized queries pour prévenir SQL injection
- Implémenter ACID transactions pour opérations critiques
- Stocker timestamps avec timezone (TIMESTAMPTZ)
- Utiliser UUID pour primary keys
- Implémenter soft deletes où approprié (archived vs deleted)

**Integration Requirements:**
- Backend et frontend communiquent via REST API over HTTP/JSON
- Implémenter CORS avec origins configurables
- Utiliser JWT Bearer tokens pour authentification
- Format standard request/response: { success, data/error, message }
- Implémenter error codes standards (400, 401, 403, 404, 500, etc.)
- Frontend doit gérer token expiration et refresh
- Implémenter retry logic avec exponential backoff
- Gérer network failures gracefully
- Utiliser HTTPS en production uniquement

**Testing Requirements:**
- Backend: Jest 30 pour unit tests, Supertest 7 pour API tests
- Frontend: Vitest 3 pour unit tests, Testing Library 16 pour component tests
- Atteindre >80% coverage backend, >60% coverage frontend
- Tests types: unit, integration, component, security, e2e
- Mock Supabase client dans tests
- Utiliser test fixtures et factories
- Implémenter CI/CD automated testing (GitHub Actions)
- Tests doivent passer avant merge

**Deployment Requirements:**
- Containeriser avec Docker (4 images: backend dev/prod, frontend dev/prod)
- Backend prod: Node Alpine, optimized, non-root user
- Frontend prod: Multi-stage build (build + Nginx Alpine pour serving)
- Utiliser docker-compose pour orchestration (dev + prod configs)
- Configurer Nginx pour SPA routing (fallback index.html)
- Implémenter health checks dans containers
- CI/CD via GitHub Actions: tests → build → push Docker Hub
- Images taggées: latest, branch-name, pr-number, sha-commit
- Variables environnement via .env (dev) et secrets (prod)

**Security Requirements:**
- HTTPS obligatoire en production
- JWT tokens avec expiration (1h default) + refresh tokens
- Passwords hashés avec bcrypt (cost ≥12)
- Input validation sur tous endpoints (prévenir injection SQL/XSS)
- Rate limiting API (100 req/min par IP)
- CORS configuré pour origins autorisées uniquement
- Security headers (Helmet.js: CSP, X-Frame-Options, etc.)
- Audit trail pour actions sensibles (invisible users, accessible conformité)
- Tokens stockés secure (httpOnly cookies ou localStorage avec précautions)
- Backend vérifie permissions RBAC sur TOUTES routes sensibles
- Secrets en variables environnement, jamais versionnés

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1-FR5 | Epic 2 | Authentication & User Management |
| FR6-FR7 | Epic 2 | Roles & Permission Inheritance |
| FR8-FR13 | Epic 2 | Authorization & Access Control |
| FR14-FR18 | Epic 4 | Time Tracking - Mode Simple |
| FR19-FR23 | Epic 4 | Time Tracking - Mode Journée |
| FR24-FR30 | Epic 4 | Time Tracking - Mode Template |
| FR31-FR39 | Epic 5 | Timesheet Workflow & Validation |
| FR40-FR45 | Epic 3 | Team Management |
| FR46-FR52 | Epic 3 | Project & Category Management |
| FR53-FR58 | Epic 6 | Employee Dashboard |
| FR59-FR66 | Epic 7 | Manager Team Dashboard |
| FR67-FR74 | Epic 7 | Manager Project Dashboard |
| FR75-FR81 | Epic 8 | Audit Trail & History |
| FR82-FR89 | Epic 6,7 | Data Visualization Components |
| FR90-FR95 | Epic 8 | Mobile & Responsive Design |

## Epic List

### Epic 1: Foundation & Database Setup
**Goal:** Mettre en place les fondations techniques (schéma DB, structure backend, middleware) pour toutes les fonctionnalités futures.

**User Outcome:** Infrastructure prête, schéma DB créé, backend structuré selon architecture layered.

**FRs covered:** Architecture requirements
- Créer les 10 tables Supabase avec indexes
- Configurer RLS policies de base
- Setup structure backend (routes/controllers/services/middleware)
- Implémenter AppError, response helpers, transformers

---

### Epic 2: Authentication & Authorization
**Goal:** Les utilisateurs peuvent se connecter, gérer leur profil, et le système contrôle les accès par rôle RBAC.

**User Outcome:** Login/logout fonctionnel avec Supabase Auth, profils gérés, permissions Employee/Manager actives.

**FRs covered:** FR1-FR13
- FR1: Login email/password via Supabase Auth
- FR2: Logout avec invalidation session
- FR3: Refresh token automatique (Supabase SDK)
- FR4: Reset password via magic link
- FR5: Consultation/modification profil
- FR6-FR7: Rôles Employee/Manager avec héritage
- FR8-FR13: Permissions CRUD et contrôle accès backend

---

### Epic 3: Admin Data Management
**Goal:** Les Managers peuvent créer et gérer équipes, projets et catégories de temps.

**User Outcome:** Données de référence (équipes, projets, catégories) configurables par managers.

**FRs covered:** FR40-FR52
- FR40-FR45: CRUD équipes + assignation membres/projets
- FR46-FR48: CRUD projets avec code auto-généré et budget
- FR49-FR52: CRUD catégories avec couleur

---

### Epic 4: Time Tracking - 3 Modes
**Goal:** Les employés peuvent pointer leur temps avec le mode qui leur convient (Simple, Journée, Template).

**User Outcome:** Pointage ultra-rapide (<10 sec) adapté aux différents patterns de travail.

**FRs covered:** FR14-FR30
- FR14-FR18: Mode Simple (Start/Stop timer, sélection projet/catégorie)
- FR19-FR23: Mode Journée (démarrer/arrêter journée, timeline découpage)
- FR24-FR30: Mode Template (création, application 1-clic, gestion templates)

---

### Epic 5: Timesheet Workflow
**Goal:** Les feuilles de temps suivent un workflow de validation complet avec garde-fous.

**User Outcome:** Employés soumettent leurs feuilles, Managers valident/rejettent, historique tracé.

**FRs covered:** FR31-FR39
- FR31-FR33: Machine à états (Brouillon → Soumis, verrouillage)
- FR34-FR36: Validation/Rejet par Manager avec message
- FR37: Verrouillage définitif >1 mois
- FR38: Interdiction auto-validation manager
- FR39: Notifications (UI feedback MVP)

---

### Epic 6: Employee Dashboard
**Goal:** Les employés visualisent leur performance et accomplissements personnels.

**User Outcome:** Dashboard personnel avec KPIs, graphiques temps, statut feuilles.

**FRs covered:** FR53-FR58, FR82-FR89 (composants)
- FR53-FR54: Dashboard avec KPIs (heures semaine/mois vs objectif)
- FR55: Donut chart répartition par projet
- FR56: Line chart tendance 30 jours
- FR57-FR58: Statut feuilles, mise à jour auto
- FR82-FR89: Composants graphiques partagés

---

### Epic 7: Manager Dashboards
**Goal:** Les Managers pilotent équipes et projets avec des données actionnables et alertes.

**User Outcome:** Dashboard équipe (KPIs, alertes surcharge) + Dashboard projet (budget, projections).

**FRs covered:** FR59-FR74, FR82-FR89 (composants)
- FR59-FR62: Dashboard équipe (total heures, alertes ⚠️🔴, bar chart comparaison)
- FR63-FR66: Donut charts, stacked area, drill-down employé
- FR67-FR72: Dashboard projet (budget, gauge, leaderboard)
- FR73-FR74: Alertes dépassement, projections tendances

---

### Epic 8: Audit Trail & Polish
**Goal:** Traçabilité complète pour conformité et finitions UX "Zéro Friction".

**User Outcome:** Audit invisible mais complet, UI mobile-first optimisée, performance validée.

**FRs covered:** FR75-FR81, FR90-FR95, NFRs
- FR75-FR81: Audit trail complet (logging invisible, permanent)
- FR90-FR93: Mobile optimization (touch-friendly, ≤2 clics)
- FR94-FR95: UI contextuelle par rôle
- NFRs: Performance <200ms, accessibilité WCAG AA, tests >80%

---

## Epic 1: Foundation & Database Setup

**Goal:** Mettre en place les fondations techniques (schéma DB, structure backend, middleware) pour toutes les fonctionnalités futures.

### Story 1.1: Create Core Database Schema

As a **developer**,
I want the core database tables created in Supabase,
So that I have the data foundation for all features.

**Acceptance Criteria:**

**Given** a fresh Supabase project
**When** the migration script is executed
**Then** the following tables are created with correct schema:
- `profiles` (id UUID FK auth.users, email, first_name, last_name, role, weekly_hours_target, timestamps)
- `teams` (id UUID, name, description, timestamps)
- `team_members` (id, team_id FK, user_id FK, timestamps)
- `projects` (id UUID, code UNIQUE, name, description, budget_hours, is_archived, timestamps)
- `categories` (id UUID, name, description, color, is_active, timestamps)
- `team_projects` (id, team_id FK, project_id FK, timestamps)
**And** all foreign key constraints are properly defined
**And** appropriate indexes are created on frequently queried columns (user_id, team_id, project_id)

---

### Story 1.2: Create Time Tracking Database Tables

As a **developer**,
I want time tracking related tables created,
So that time entries and timesheets can be stored.

**Acceptance Criteria:**

**Given** the core tables exist from Story 1.1
**When** the time tracking migration is executed
**Then** the following tables are created:
- `time_entries` (id UUID, user_id FK, project_id FK nullable, category_id FK nullable, start_time TIMESTAMPTZ, end_time TIMESTAMPTZ nullable, duration_minutes INT, description TEXT, entry_mode ENUM, timestamps)
- `timesheets` (id UUID, user_id FK, week_start DATE, status ENUM draft/submitted/validated/rejected, submitted_at, validated_at, validated_by FK nullable, rejection_reason TEXT, timestamps)
- `templates` (id UUID, user_id FK, name, description, config JSONB, timestamps)
- `audit_logs` (id UUID, user_id FK, action TEXT, entity_type TEXT, entity_id UUID, old_values JSONB, new_values JSONB, timestamp)
**And** indexes exist on time_entries(user_id, start_time) and timesheets(user_id, week_start, status)
**And** check constraints enforce valid status and entry_mode values

---

### Story 1.3: Configure Row Level Security Policies

As a **developer**,
I want RLS policies configured on all tables,
So that data access is secured at the database level.

**Acceptance Criteria:**

**Given** all database tables exist
**When** RLS policies are applied
**Then** `profiles` table allows:
- Users to read their own profile
- Managers to read all profiles
- Users to update only their own profile
**And** `time_entries` table allows:
- Users to CRUD their own entries only
- Managers to read all entries
**And** `timesheets` table allows:
- Users to CRUD their own timesheets (except validated by others)
- Managers to read and update status of all timesheets (except their own for validation)
**And** `teams`, `projects`, `categories` allow:
- All authenticated users to read
- Only managers to create/update/delete
**And** `audit_logs` allows:
- Insert by system (service role only)
- No user-level read access (backend only)

---

### Story 1.4: Setup Backend Project Structure

As a **developer**,
I want the Express backend structured with layered architecture,
So that code organization follows best practices.

**Acceptance Criteria:**

**Given** the existing backend codebase
**When** the structure is reorganized
**Then** the following directory structure exists:
```
backend/
├── src/
│   ├── routes/           # Express route definitions
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Auth, RBAC, error handling
│   ├── utils/            # Helpers (supabase client, AppError, transformers)
│   └── validators/       # Input validation schemas
├── tests/
│   ├── routes/           # Route integration tests
│   └── services/         # Service unit tests
└── app.js
```
**And** a sample route/controller/service chain exists demonstrating the pattern
**And** CommonJS module syntax is used throughout (require/module.exports)

---

### Story 1.5: Implement Core Backend Utilities

As a **developer**,
I want reusable utilities for error handling and response formatting,
So that all endpoints follow consistent patterns.

**Acceptance Criteria:**

**Given** the backend structure from Story 1.4
**When** the utilities are implemented
**Then** `AppError` class exists in `utils/AppError.js`:
- Constructor accepts (message, statusCode, code)
- Extends Error class
- Includes isOperational flag
**And** `responseHelpers.js` provides:
- `successResponse(res, data, meta)` → `{ success: true, data, meta }`
- `errorResponse(res, error)` → `{ success: false, error: { code, message, details } }`
**And** `transformers.js` provides:
- `snakeToCamel(obj)` for DB → API transformation
- `camelToSnake(obj)` for API → DB transformation
**And** all helpers are tested with unit tests

---

### Story 1.6: Implement Global Error Handling Middleware

As a **developer**,
I want centralized error handling middleware,
So that all errors are caught and formatted consistently.

**Acceptance Criteria:**

**Given** the AppError class exists
**When** an error occurs in any route
**Then** the error middleware catches it
**And** operational errors (AppError) return appropriate status code and formatted response
**And** unexpected errors return 500 with generic message in production
**And** errors are logged with stack trace in development
**And** async errors are properly caught (async/await with try-catch or express-async-handler)

---

### Story 1.7: Implement Health Check Endpoints

As a **developer**,
I want health check endpoints for container orchestration,
So that deployment systems can verify backend status.

**Acceptance Criteria:**

**Given** the backend is running
**When** GET `/health` is called
**Then** response is `{ status: "healthy", timestamp: "..." }` with 200 status
**When** GET `/ready` is called
**Then** the endpoint checks:
- Database connection is active
- Returns `{ status: "ready", checks: { database: "ok" } }` if all pass
- Returns 503 with failed checks if any fail
**And** both endpoints bypass authentication middleware

---

## Epic 2: Authentication & Authorization

**Goal:** Les utilisateurs peuvent se connecter, gérer leur profil, et le système contrôle les accès par rôle RBAC.

### Story 2.1: Implement Supabase Auth Integration

As an **employee or manager**,
I want to log in with my email and password,
So that I can access the application securely.

**Acceptance Criteria:**

**Given** a user with valid credentials exists in Supabase Auth
**When** POST `/api/v1/auth/login` is called with `{ email, password }`
**Then** Supabase Auth validates credentials
**And** response includes `{ success: true, data: { user, session } }`
**And** session contains access_token and refresh_token
**And** profile data is fetched and included in response

**Given** invalid credentials are provided
**When** login is attempted
**Then** response is `{ success: false, error: { code: "INVALID_CREDENTIALS", message: "..." } }` with 401 status

---

### Story 2.2: Implement Logout Endpoint

As an **authenticated user**,
I want to log out from the application,
So that my session is invalidated and secure.

**Acceptance Criteria:**

**Given** a user is logged in with valid session
**When** POST `/api/v1/auth/logout` is called
**Then** Supabase Auth session is invalidated
**And** response is `{ success: true, data: { message: "Logged out successfully" } }`

**Given** the user tries to use the old token after logout
**When** any protected endpoint is called
**Then** response is 401 Unauthorized

---

### Story 2.3: Implement Authentication Middleware

As a **developer**,
I want authentication middleware that validates JWT tokens,
So that protected routes are secured.

**Acceptance Criteria:**

**Given** a request with valid Bearer token in Authorization header
**When** the auth middleware processes the request
**Then** `req.user` is populated with user data from Supabase
**And** `req.user` includes id, email, and role
**And** the request proceeds to the next handler

**Given** a request without Authorization header
**When** the auth middleware processes the request
**Then** response is `{ success: false, error: { code: "UNAUTHORIZED", message: "..." } }` with 401 status

**Given** a request with expired or invalid token
**When** the auth middleware processes the request
**Then** response is 401 with appropriate error message

---

### Story 2.4: Implement Password Reset Flow

As a **user who forgot their password**,
I want to reset my password via email,
So that I can regain access to my account.

**Acceptance Criteria:**

**Given** a registered user email
**When** POST `/api/v1/auth/forgot-password` is called with `{ email }`
**Then** Supabase sends a password reset email
**And** response is `{ success: true, data: { message: "Reset email sent" } }`

**Given** an unregistered email
**When** forgot-password is called
**Then** response is still success (no email enumeration)

**Given** the user clicks the reset link and provides new password
**When** the password is updated via Supabase
**Then** the user can log in with the new password

---

### Story 2.5: Implement User Profile Endpoints

As an **authenticated user**,
I want to view and update my profile,
So that my personal information is accurate.

**Acceptance Criteria:**

**Given** an authenticated user
**When** GET `/api/v1/users/me` is called
**Then** response includes `{ success: true, data: { id, email, firstName, lastName, role, weeklyHoursTarget } }`

**Given** an authenticated user
**When** PATCH `/api/v1/users/me` is called with `{ firstName, lastName, weeklyHoursTarget }`
**Then** the profile is updated in database
**And** response includes updated profile data
**And** email and role cannot be changed via this endpoint

**Given** invalid data (empty firstName)
**When** PATCH is called
**Then** response is 400 with validation error details

---

### Story 2.6: Implement RBAC Middleware

As a **developer**,
I want role-based access control middleware,
So that routes can restrict access by user role.

**Acceptance Criteria:**

**Given** a middleware factory `rbac(...allowedRoles)`
**When** applied to a route with `rbac('manager')`
**Then** only users with role 'manager' can access

**Given** a user with role 'employee' accessing manager-only route
**When** the RBAC middleware processes the request
**Then** response is `{ success: false, error: { code: "FORBIDDEN", message: "..." } }` with 403 status

**Given** role inheritance is configured (manager inherits employee permissions)
**When** a manager accesses an employee-only route
**Then** access is granted (FR7: Manager inherits Employee permissions)

---

### Story 2.7: Implement Users List Endpoint (Manager Only)

As a **manager**,
I want to view all users in the system,
So that I can manage team assignments and view employee data.

**Acceptance Criteria:**

**Given** an authenticated manager
**When** GET `/api/v1/users` is called
**Then** response includes list of all users with their profiles
**And** supports pagination via `?page=1&limit=20`
**And** supports filtering by role via `?role=employee`
**And** response format is `{ success: true, data: [...], meta: { pagination: {...} } }`

**Given** an authenticated employee
**When** GET `/api/v1/users` is called
**Then** response is 403 Forbidden

---

### Story 2.8: Setup Frontend Auth Context and Service

As a **frontend developer**,
I want auth state management and API service,
So that the UI can handle authentication flows.

**Acceptance Criteria:**

**Given** the React frontend
**When** AuthContext is implemented
**Then** it provides:
- `user` state (null or user object)
- `isAuthenticated` boolean
- `isLoading` boolean
- `login(email, password)` function
- `logout()` function
- `refreshUser()` function

**And** authService.js provides:
- `login(email, password)` → API call
- `logout()` → API call
- `forgotPassword(email)` → API call
- `getProfile()` → API call
- `updateProfile(data)` → API call

**And** tokens are stored securely and attached to all API requests

---

### Story 2.9: Implement Login Page UI

As a **user**,
I want a login page to enter my credentials,
So that I can access the application.

**Acceptance Criteria:**

**Given** the login page is displayed
**When** I view the page
**Then** I see email input, password input, and login button
**And** I see a "Forgot password?" link

**Given** I enter valid credentials and click login
**When** authentication succeeds
**Then** I am redirected to the dashboard
**And** loading state is shown during API call

**Given** I enter invalid credentials
**When** authentication fails
**Then** an error message is displayed
**And** password field is cleared

---

### Story 2.10: Implement Protected Routes

As a **frontend developer**,
I want route protection based on authentication and role,
So that unauthorized access is prevented.

**Acceptance Criteria:**

**Given** a ProtectedRoute component
**When** an unauthenticated user tries to access a protected route
**Then** they are redirected to `/login`
**And** the original URL is preserved for post-login redirect

**Given** a RoleProtectedRoute component with `roles={['manager']}`
**When** an employee tries to access it
**Then** they are redirected to an "Access Denied" page or dashboard

**Given** an authenticated user accesses a protected route
**When** the component renders
**Then** the protected content is displayed

---

## Epic 3: Admin Data Management

**Goal:** Les Managers peuvent créer et gérer équipes, projets et catégories de temps.

### Story 3.1: Implement Teams CRUD API

As a **manager**,
I want to create, view, update, and delete teams,
So that I can organize employees into groups.

**Acceptance Criteria:**

**Given** an authenticated manager
**When** POST `/api/v1/teams` is called with `{ name, description }`
**Then** a new team is created
**And** response includes `{ success: true, data: { id, name, description, createdAt } }`

**Given** an authenticated manager
**When** GET `/api/v1/teams` is called
**Then** response includes list of all teams with member counts
**And** supports pagination

**Given** an authenticated manager
**When** GET `/api/v1/teams/:id` is called
**Then** response includes team details with list of members and assigned projects

**Given** an authenticated manager
**When** PATCH `/api/v1/teams/:id` is called
**Then** team name/description is updated

**Given** an authenticated manager
**When** DELETE `/api/v1/teams/:id` is called
**Then** team is deleted (cascade removes team_members, team_projects)

**Given** an employee tries any team mutation endpoint
**When** the request is processed
**Then** response is 403 Forbidden

---

### Story 3.2: Implement Team Member Assignment API

As a **manager**,
I want to add and remove members from teams,
So that I can manage team composition.

**Acceptance Criteria:**

**Given** an authenticated manager and an existing team
**When** POST `/api/v1/teams/:teamId/members` is called with `{ userId }`
**Then** the user is added to the team
**And** response confirms the assignment

**Given** a user already in the team
**When** trying to add them again
**Then** response is 400 with "User already in team"

**Given** an authenticated manager
**When** DELETE `/api/v1/teams/:teamId/members/:userId` is called
**Then** the user is removed from the team

**Given** an authenticated manager
**When** GET `/api/v1/teams/:teamId/members` is called
**Then** response includes list of all team members with their profiles

**Given** FR43: User can belong to multiple teams
**When** a user is added to a second team
**Then** the assignment succeeds (no unique constraint)

---

### Story 3.3: Implement Projects CRUD API

As a **manager**,
I want to create, view, update, and archive projects,
So that I can track time against specific work items.

**Acceptance Criteria:**

**Given** an authenticated manager
**When** POST `/api/v1/projects` is called with `{ name, description, budgetHours }`
**Then** a new project is created
**And** a unique code is auto-generated (e.g., "PRJ-001")
**And** response includes `{ success: true, data: { id, code, name, description, budgetHours, isArchived: false } }`

**Given** an authenticated user (any role)
**When** GET `/api/v1/projects` is called
**Then** response includes list of active projects
**And** supports `?includeArchived=true` filter (manager only)
**And** supports pagination

**Given** an authenticated manager
**When** PATCH `/api/v1/projects/:id` is called with `{ name, description, budgetHours }`
**Then** project details are updated (code is immutable)

**Given** an authenticated manager
**When** POST `/api/v1/projects/:id/archive` is called
**Then** project isArchived is set to true

**Given** an authenticated manager
**When** POST `/api/v1/projects/:id/restore` is called
**Then** project isArchived is set to false

---

### Story 3.4: Implement Team-Project Assignment API

As a **manager**,
I want to assign projects to teams,
So that team members can track time on assigned projects.

**Acceptance Criteria:**

**Given** an authenticated manager
**When** POST `/api/v1/teams/:teamId/projects` is called with `{ projectId }`
**Then** the project is assigned to the team
**And** response confirms the assignment

**Given** an authenticated manager
**When** DELETE `/api/v1/teams/:teamId/projects/:projectId` is called
**Then** the project is unassigned from the team

**Given** an authenticated manager
**When** GET `/api/v1/teams/:teamId/projects` is called
**Then** response includes list of all projects assigned to the team

**Given** an authenticated user
**When** GET `/api/v1/projects` with `?myTeams=true` is called
**Then** response includes only projects assigned to the user's teams

---

### Story 3.5: Implement Categories CRUD API

As a **manager**,
I want to create, view, update, and deactivate categories,
So that time entries can be classified by type of work.

**Acceptance Criteria:**

**Given** an authenticated manager
**When** POST `/api/v1/categories` is called with `{ name, description, color }`
**Then** a new category is created
**And** color is validated as hex format (#RRGGBB)
**And** response includes category data

**Given** an authenticated user (any role)
**When** GET `/api/v1/categories` is called
**Then** response includes list of active categories
**And** supports `?includeInactive=true` filter (manager only)

**Given** an authenticated manager
**When** PATCH `/api/v1/categories/:id` is called
**Then** category details are updated

**Given** an authenticated manager
**When** DELETE `/api/v1/categories/:id` is called
**Then** category isActive is set to false (soft delete)
**And** existing time entries keep their category reference

---

### Story 3.6: Implement Admin Management UI - Teams

As a **manager**,
I want a UI to manage teams,
So that I can organize the workforce visually.

**Acceptance Criteria:**

**Given** I navigate to the Teams management page
**When** the page loads
**Then** I see a list of all teams with member counts
**And** I see a "Create Team" button

**Given** I click "Create Team"
**When** the modal opens
**Then** I can enter name and description
**And** clicking "Save" creates the team and refreshes the list

**Given** I click on a team row
**When** the detail panel opens
**Then** I see team members list
**And** I see assigned projects
**And** I can add/remove members via user selector
**And** I can add/remove projects via project selector

**Given** I click "Delete" on a team
**When** confirmation is accepted
**Then** the team is deleted and list refreshes

---

### Story 3.7: Implement Admin Management UI - Projects

As a **manager**,
I want a UI to manage projects,
So that I can configure work tracking.

**Acceptance Criteria:**

**Given** I navigate to the Projects management page
**When** the page loads
**Then** I see a list of all projects with code, name, budget, status
**And** archived projects are visually distinct or filtered

**Given** I click "Create Project"
**When** the form opens
**Then** I can enter name, description, budget hours
**And** code is shown as auto-generated preview
**And** clicking "Save" creates the project

**Given** I click "Archive" on a project
**When** the action completes
**Then** the project moves to archived state
**And** I can "Restore" it back to active

**Given** I edit a project's budget
**When** I save changes
**Then** the new budget is reflected in dashboards

---

### Story 3.8: Implement Admin Management UI - Categories

As a **manager**,
I want a UI to manage time categories,
So that I can define how time is classified.

**Acceptance Criteria:**

**Given** I navigate to the Categories management page
**When** the page loads
**Then** I see a list of all categories with color chips
**And** inactive categories are grayed out

**Given** I click "Create Category"
**When** the form opens
**Then** I can enter name, description
**And** I can pick a color from a palette
**And** clicking "Save" creates the category

**Given** I click "Deactivate" on a category
**When** the action completes
**Then** the category is marked inactive
**And** it's no longer selectable for new time entries
**And** existing entries keep their category (historical data preserved)

---

## Epic 4: Time Tracking - 3 Modes

**Goal:** Les employés peuvent pointer leur temps avec le mode qui leur convient (Simple, Journée, Template).

### Story 4.1: Implement Time Entries CRUD API

As an **employee**,
I want API endpoints to manage my time entries,
So that I can create, view, update and delete my time records.

**Acceptance Criteria:**

**Given** an authenticated employee
**When** POST `/api/v1/time-entries` is called with `{ startTime, endTime?, projectId?, categoryId?, description?, entryMode }`
**Then** a new time entry is created for the user
**And** response includes the created entry with calculated duration
**And** entry mode is one of: 'simple', 'day', 'template'

**Given** an authenticated employee
**When** GET `/api/v1/time-entries` is called
**Then** response includes only the user's own time entries
**And** supports date range filter `?startDate=&endDate=`
**And** supports pagination
**And** entries are sorted by startTime descending

**Given** an authenticated employee
**When** PATCH `/api/v1/time-entries/:id` is called
**Then** the entry is updated only if:
- The entry belongs to the user
- The associated timesheet is in 'draft' status
**And** otherwise returns 403

**Given** an authenticated employee
**When** DELETE `/api/v1/time-entries/:id` is called
**Then** the entry is deleted only if conditions above are met

---

### Story 4.2: Implement Simple Mode - Start Timer API

As an **employee**,
I want to start a timer with one click,
So that I can track time with minimal friction.

**Acceptance Criteria:**

**Given** an authenticated employee with no active timer
**When** POST `/api/v1/time-entries/start` is called with `{ projectId?, categoryId?, description? }`
**Then** a new time entry is created with:
- `startTime` = now
- `endTime` = null (indicates running)
- `entryMode` = 'simple'
**And** response includes the running entry

**Given** an employee already has an active timer
**When** POST `/api/v1/time-entries/start` is called
**Then** response is 400 with "Timer already running"

**Given** an authenticated employee
**When** GET `/api/v1/time-entries/active` is called
**Then** response includes the active entry (if any) or null

---

### Story 4.3: Implement Simple Mode - Stop Timer API

As an **employee**,
I want to stop my running timer,
So that my time entry is completed and saved.

**Acceptance Criteria:**

**Given** an authenticated employee with an active timer
**When** POST `/api/v1/time-entries/stop` is called
**Then** the active entry is updated with:
- `endTime` = now
- `durationMinutes` = calculated from startTime to endTime
**And** response includes the completed entry

**Given** an employee with no active timer
**When** POST `/api/v1/time-entries/stop` is called
**Then** response is 404 with "No active timer found"

**Given** an optional `{ projectId?, categoryId?, description? }` is provided with stop
**When** the timer is stopped
**Then** these values update the entry (allows adding details at stop time)

---

### Story 4.4: Implement Simple Mode UI

As an **employee**,
I want a simple timer interface,
So that I can start/stop tracking in less than 10 seconds.

**Acceptance Criteria:**

**Given** I open the time tracking page
**When** no timer is running
**Then** I see a prominent "Start" button (touch-friendly >44px)
**And** I see optional project/category selectors
**And** I see an optional description field

**Given** I click Start
**When** the timer begins
**Then** I see elapsed time updating in real-time (HH:MM:SS)
**And** the Start button changes to "Stop"
**And** the elapsed time is visually prominent

**Given** I click Stop
**When** the timer stops
**Then** the entry is saved and displayed in my history
**And** a success message is briefly shown
**And** the interface resets to initial state

**Given** I have a running timer
**When** I navigate away and return
**Then** the timer continues from where it was (synced with backend)

---

### Story 4.5: Implement Day Mode - Day Start/End API

As an **employee**,
I want to record when I start and end my workday,
So that I can manage my daily time blocks.

**Acceptance Criteria:**

**Given** an authenticated employee
**When** POST `/api/v1/time-entries/day/start` is called
**Then** a new "day container" entry is created with:
- `startTime` = now
- `endTime` = null
- `entryMode` = 'day'
**And** response includes the day entry

**Given** an employee with an active day
**When** POST `/api/v1/time-entries/day/end` is called
**Then** the day entry is updated with:
- `endTime` = now
**And** response includes the completed day

**Given** an employee with an active day
**When** GET `/api/v1/time-entries/day/active` is called
**Then** response includes the day entry and its time blocks (child entries)

---

### Story 4.6: Implement Day Mode - Time Block Management API

As an **employee**,
I want to split my day into blocks assigned to projects,
So that I can allocate my daily time accurately.

**Acceptance Criteria:**

**Given** an employee with an active day
**When** POST `/api/v1/time-entries/day/:dayId/blocks` is called with:
`{ startTime, endTime, projectId?, categoryId?, description? }`
**Then** a time block is created within the day's time range
**And** blocks cannot overlap
**And** blocks cannot exceed day boundaries

**Given** an employee with a day containing blocks
**When** PATCH `/api/v1/time-entries/day/:dayId/blocks/:blockId` is called
**Then** the block is updated (resize/move)
**And** validation prevents overlaps

**Given** an employee with a day containing blocks
**When** DELETE `/api/v1/time-entries/day/:dayId/blocks/:blockId` is called
**Then** the block is removed

**Given** FR23: drag-drop capability
**When** blocks are reordered via API
**Then** the start/end times are recalculated accordingly

---

### Story 4.7: Implement Day Mode UI with Timeline

As an **employee**,
I want a visual timeline to manage my day's time blocks,
So that I can easily see and edit my time allocation.

**Acceptance Criteria:**

**Given** I open Day Mode
**When** I have an active day
**Then** I see a timeline visualization showing:
- Day start to current time (or end time if day is ended)
- Existing time blocks as colored segments
- Empty/unassigned time as gaps

**Given** I click an empty gap on the timeline
**When** the block creation modal opens
**Then** I can set project, category, description
**And** the block is created for that time range

**Given** I drag a block edge
**When** I resize it
**Then** the block duration changes
**And** changes are saved automatically

**Given** I drag a block
**When** I drop it at a new position
**Then** the block moves (if no overlap)
**And** other blocks adjust if needed

**Given** FR22: visual timeline
**When** viewing the timeline
**Then** blocks show project name and duration
**And** colors correspond to categories

---

### Story 4.8: Implement Templates CRUD API

As an **employee**,
I want to save and manage day templates,
So that I can quickly create recurring time patterns.

**Acceptance Criteria:**

**Given** an authenticated employee
**When** POST `/api/v1/templates` is called with:
`{ name, description, config: { blocks: [...] } }`
**Then** a template is created for the user
**And** config stores the block structure (relative times, projects, categories)

**Given** an authenticated employee
**When** GET `/api/v1/templates` is called
**Then** response includes only the user's templates
**And** supports pagination

**Given** an authenticated employee
**When** PATCH `/api/v1/templates/:id` is called
**Then** the template name, description, or config is updated

**Given** an authenticated employee
**When** DELETE `/api/v1/templates/:id` is called
**Then** the template is deleted

**Given** FR24: create template from existing day
**When** POST `/api/v1/templates/from-day/:dayEntryId` is called
**Then** a template is created copying the day's block structure

---

### Story 4.9: Implement Template Application API

As an **employee**,
I want to apply a template to create a pre-filled day,
So that I can set up my time tracking in one click.

**Acceptance Criteria:**

**Given** an authenticated employee with a template
**When** POST `/api/v1/templates/:id/apply` is called with `{ date }`
**Then** a new day entry is created for that date
**And** blocks from template are created with absolute times based on date
**And** the day remains in 'draft' status (editable)
**And** response includes the created day with its blocks

**Given** a template with project/category references
**When** the template is applied
**Then** projects and categories are preserved if still active
**And** archived projects are flagged or skipped with warning

---

### Story 4.10: Implement Template Mode UI

As an **employee**,
I want a UI to manage and apply my templates,
So that I can efficiently set up recurring days.

**Acceptance Criteria:**

**Given** I navigate to Templates section
**When** the page loads
**Then** I see my list of saved templates with names and descriptions
**And** I see a "Create Template" button

**Given** I click "Create Template"
**When** the builder opens
**Then** I can add time blocks with project/category/description
**And** I can set relative start/end times (e.g., 09:00, 12:00)
**And** I can preview how it will look
**And** clicking "Save" creates the template

**Given** I have a completed day
**When** I click "Save as Template" on the day view
**Then** a modal asks for template name and description
**And** clicking "Save" creates a template from that day

**Given** I view my templates list
**When** I click "Apply" on a template
**Then** I select a date
**And** the template is applied, creating a new day
**And** I'm navigated to the day view to edit if needed

---

## Epic 5: Timesheet Workflow

**Goal:** Les feuilles de temps suivent un workflow de validation complet avec garde-fous.

### Story 5.1: Implement Timesheets CRUD API

As an **employee**,
I want API endpoints to manage my weekly timesheets,
So that I can view and submit my time for approval.

**Acceptance Criteria:**

**Given** an authenticated employee
**When** GET `/api/v1/timesheets` is called
**Then** response includes the user's timesheets
**And** supports filtering by `?status=draft|submitted|validated|rejected`
**And** supports filtering by `?weekStart=YYYY-MM-DD`
**And** includes summary (total hours, entry count) for each timesheet

**Given** an authenticated employee
**When** GET `/api/v1/timesheets/:id` is called
**Then** response includes timesheet details with all associated time entries

**Given** an authenticated employee
**When** GET `/api/v1/timesheets/current` is called
**Then** response includes the current week's timesheet (auto-created if not exists)
**And** includes all time entries for that week

---

### Story 5.2: Implement Timesheet Submission API

As an **employee**,
I want to submit my timesheet for approval,
So that my manager can validate my work hours.

**Acceptance Criteria:**

**Given** an employee with a draft timesheet
**When** POST `/api/v1/timesheets/:id/submit` is called
**Then** timesheet status changes from 'draft' to 'submitted'
**And** `submittedAt` timestamp is set
**And** response includes updated timesheet

**Given** an employee with a submitted/validated timesheet
**When** POST `/api/v1/timesheets/:id/submit` is called
**Then** response is 400 with "Timesheet already submitted"

**Given** FR33: submitted timesheet is locked
**When** employee tries to modify time entries of submitted timesheet
**Then** modification is rejected with 403 "Cannot modify submitted timesheet"

---

### Story 5.3: Implement Timesheet Validation API

As a **manager**,
I want to validate or reject employee timesheets,
So that I can approve work hours for payroll.

**Acceptance Criteria:**

**Given** a manager viewing a submitted timesheet (not their own)
**When** POST `/api/v1/timesheets/:id/validate` is called
**Then** status changes from 'submitted' to 'validated'
**And** `validatedAt` timestamp is set
**And** `validatedBy` is set to the manager's ID

**Given** a manager viewing a submitted timesheet (not their own)
**When** POST `/api/v1/timesheets/:id/reject` is called with `{ reason }`
**Then** status changes from 'submitted' to 'draft' (back to editable)
**And** `rejectionReason` is stored
**And** employee can now edit and resubmit

**Given** FR38: manager's own timesheet
**When** the manager tries to validate their own timesheet
**Then** response is 403 "Cannot validate own timesheet"

---

### Story 5.4: Implement Timesheet Reopen API

As a **manager**,
I want to reopen a validated timesheet if needed,
So that corrections can be made within a reasonable timeframe.

**Acceptance Criteria:**

**Given** FR36: timesheet validated less than 1 month ago
**When** POST `/api/v1/timesheets/:id/reopen` is called by a manager
**Then** status changes from 'validated' to 'draft'
**And** employee can edit their entries again

**Given** FR37: timesheet validated more than 1 month ago
**When** POST `/api/v1/timesheets/:id/reopen` is called
**Then** response is 403 "Cannot reopen timesheets older than 1 month"

**Given** the reopen action
**When** it succeeds
**Then** an audit log entry is created recording who reopened and when

---

### Story 5.5: Implement Manager Timesheet List API

As a **manager**,
I want to view all timesheets in the system,
So that I can monitor and validate employee hours.

**Acceptance Criteria:**

**Given** an authenticated manager
**When** GET `/api/v1/timesheets` is called
**Then** response includes timesheets from all users
**And** supports filtering by `?status=submitted` (to see pending validations)
**And** supports filtering by `?userId=` for specific employee
**And** includes employee name and summary data

**Given** an authenticated employee
**When** GET `/api/v1/timesheets` is called
**Then** response includes only their own timesheets

---

### Story 5.6: Implement Employee Timesheet UI

As an **employee**,
I want a timesheet interface to view and submit my weekly hours,
So that I can manage the approval workflow.

**Acceptance Criteria:**

**Given** I navigate to the Timesheet page
**When** the page loads
**Then** I see the current week's timesheet
**And** I see daily breakdown of hours
**And** I see total hours vs target
**And** I see current status (Draft, Submitted, Validated, Rejected)

**Given** my timesheet is in Draft status
**When** I click "Submit for Approval"
**Then** a confirmation dialog appears
**And** after confirmation, status changes to "Submitted"
**And** I see success message

**Given** my timesheet was rejected
**When** I view the timesheet
**Then** I see the rejection reason prominently displayed
**And** I can edit my entries
**And** I can resubmit

**Given** my timesheet is Submitted or Validated
**When** I view my time entries
**Then** edit/delete options are disabled
**And** I see "Awaiting approval" or "Approved by [name]" message

---

### Story 5.7: Implement Manager Validation UI

As a **manager**,
I want a validation interface to review and approve timesheets,
So that I can efficiently process pending submissions.

**Acceptance Criteria:**

**Given** I navigate to the Manager > Timesheets page
**When** the page loads
**Then** I see a list of all timesheets
**And** "Pending Approval" filter is applied by default
**And** I see employee name, week, total hours, status

**Given** I click on a submitted timesheet
**When** the detail view opens
**Then** I see all time entries for that week
**And** I see daily breakdown
**And** I see "Validate" and "Reject" buttons

**Given** I click "Validate"
**When** confirmation completes
**Then** status changes to Validated
**And** list refreshes showing one less pending

**Given** I click "Reject"
**When** the rejection modal opens
**Then** I must enter a reason
**And** clicking "Confirm Rejection" changes status to Draft
**And** employee is notified (UI feedback initially, email future)

---

### Story 5.8: Implement Timesheet Notification System

As a **user**,
I want to be notified of timesheet status changes,
So that I stay informed about approvals and rejections.

**Acceptance Criteria:**

**Given** FR39: notification on status change
**When** a manager validates an employee's timesheet
**Then** a notification is created for the employee
**And** notification appears in the UI notification center

**Given** a manager rejects a timesheet
**When** the rejection is processed
**Then** a notification is created with the rejection reason
**And** the notification links to the rejected timesheet

**Given** an employee submits their timesheet
**When** managers are available
**Then** managers receive a notification of pending review

**Given** notification system (MVP)
**When** implemented
**Then** notifications are stored in database
**And** displayed in a notification dropdown in the header
**And** marked as read when clicked

---

## Epic 6: Employee Dashboard

**Goal:** Les employés visualisent leur performance et accomplissements personnels.

### Story 6.1: Implement Employee Dashboard API

As an **employee**,
I want API endpoints for my dashboard data,
So that the UI can display my KPIs and statistics.

**Acceptance Criteria:**

**Given** an authenticated employee
**When** GET `/api/v1/dashboard/me` is called
**Then** response includes:
```json
{
  "success": true,
  "data": {
    "summary": {
      "hoursThisWeek": 32.5,
      "hoursThisMonth": 140,
      "weeklyTarget": 35,
      "monthlyTarget": 140
    },
    "timesheetStatus": {
      "current": "draft",
      "pending": 0,
      "validated": 4
    }
  }
}
```

**Given** an authenticated employee
**When** GET `/api/v1/dashboard/me/by-project` is called with `?period=week|month`
**Then** response includes hours breakdown by project for donut chart

**Given** an authenticated employee
**When** GET `/api/v1/dashboard/me/trend` is called with `?days=30`
**Then** response includes daily hours for the last N days for line chart

---

### Story 6.2: Implement Reusable Chart Components

As a **frontend developer**,
I want reusable chart components,
So that dashboards can display consistent visualizations.

**Acceptance Criteria:**

**Given** FR82-FR89: chart requirements
**When** chart components are implemented
**Then** the following components exist:
- `DonutChart` - for proportional breakdowns (project/category distribution)
- `LineChart` - for trends over time
- `BarChart` - for comparisons (horizontal and vertical variants)
- `KPICard` - for single metric display with optional trend indicator
- `ProgressBar` - for progress toward goal

**And** all charts accept data prop in standard format
**And** all charts support hover tooltips (FR89)
**And** all charts use consistent color palette
**And** charts are responsive

---

### Story 6.3: Implement Employee Dashboard KPIs Section

As an **employee**,
I want to see my key metrics at a glance,
So that I know my current status immediately.

**Acceptance Criteria:**

**Given** I open my dashboard
**When** the KPI section loads
**Then** I see cards showing:
- Hours this week (e.g., "32.5h / 35h" with progress bar)
- Hours this month (e.g., "140h / 140h target")
- Timesheet status badge (Draft/Submitted/Validated)
- Week-over-week change indicator (↑12% or ↓5%)

**Given** FR54: hours vs objective
**When** I view the hours cards
**Then** progress bars show percentage toward target
**And** color indicates status (green if on track, yellow if behind)

**Given** FR58: auto-update
**When** I add a time entry
**Then** dashboard refreshes or shows updated data without full page reload

---

### Story 6.4: Implement Employee Dashboard Charts

As an **employee**,
I want to see visual breakdowns of my time,
So that I understand where my hours go.

**Acceptance Criteria:**

**Given** FR55: donut chart by project
**When** I view the dashboard
**Then** I see a donut chart showing time distribution by project
**And** each segment shows project name on hover
**And** legend shows project name and percentage

**Given** FR56: line chart trend
**When** I view the dashboard
**Then** I see a line chart showing daily hours for last 30 days
**And** hover shows exact hours for each day
**And** target line is shown for reference (e.g., 7h/day)

**Given** I click on a project segment in the donut
**When** interaction is triggered
**Then** I see a filtered view of time entries for that project (drill-down)

---

### Story 6.5: Implement Employee Time Entry History

As an **employee**,
I want to see my recent time entries,
So that I can review and edit my work history.

**Acceptance Criteria:**

**Given** I view the dashboard or history section
**When** the data loads
**Then** I see a list of recent time entries
**And** each entry shows: date, project, category, duration, description
**And** entries are grouped by date

**Given** an entry in draft timesheet
**When** I click on it
**Then** I can edit or delete the entry

**Given** the history list
**When** I scroll down
**Then** more entries are loaded (infinite scroll or pagination)
**And** I can filter by date range

---

### Story 6.6: Implement Employee Dashboard Page

As an **employee**,
I want a complete dashboard page,
So that I have a central view of my performance.

**Acceptance Criteria:**

**Given** I log in as an employee
**When** I am redirected to the dashboard
**Then** I see:
- KPI cards at the top (Story 6.3)
- Charts section below (Story 6.4)
- Recent entries list (Story 6.5)
- Quick action: "Start Timer" button

**Given** loading state
**When** data is being fetched
**Then** skeleton loaders are shown for each section

**Given** error state
**When** API fails
**Then** error message is shown with retry option

**Given** mobile view
**When** screen is narrow
**Then** layout adapts (cards stack, charts resize)

---

## Epic 7: Manager Dashboards

**Goal:** Les Managers pilotent équipes et projets avec des données actionnables et alertes.

### Story 7.1: Implement Team Dashboard API

As a **manager**,
I want API endpoints for team dashboard data,
So that I can monitor team performance.

**Acceptance Criteria:**

**Given** an authenticated manager
**When** GET `/api/v1/dashboard/team` is called with `?teamId=`
**Then** response includes:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalHoursThisWeek": 245,
      "avgHoursPerEmployee": 35,
      "pendingTimesheets": 3,
      "teamSize": 7
    },
    "alerts": [
      { "userId": "...", "name": "John", "hours": 48, "level": "warning" },
      { "userId": "...", "name": "Jane", "hours": 52, "level": "critical" }
    ]
  }
}
```

**Given** FR61: overload alerts
**When** an employee exceeds thresholds
**Then** alerts include: >45h = "warning", >50h = "critical"

**Given** an authenticated manager
**When** GET `/api/v1/dashboard/team/by-employee` is called
**Then** response includes hours breakdown by employee for bar chart

**Given** an authenticated manager
**When** GET `/api/v1/dashboard/team/trend` is called with `?weeks=4`
**Then** response includes weekly totals for stacked area chart

---

### Story 7.2: Implement Team Dashboard KPIs Section

As a **manager**,
I want to see team metrics at a glance,
So that I can quickly assess team status.

**Acceptance Criteria:**

**Given** I open the team dashboard
**When** the KPI section loads
**Then** I see cards showing:
- Total hours this week (team aggregate)
- Average hours per employee
- Pending timesheets count
- Number of alerts (with severity indicators)

**Given** FR60: team hours displayed
**When** viewing KPIs
**Then** comparison to previous week is shown (↑12% or ↓5%)

**Given** employees with overload
**When** alerts exist
**Then** alert count is prominently displayed with warning color

---

### Story 7.3: Implement Team Dashboard Charts

As a **manager**,
I want charts to compare and analyze team data,
So that I can identify patterns and issues.

**Acceptance Criteria:**

**Given** FR62: horizontal bar chart
**When** I view the team dashboard
**Then** I see a bar chart comparing employee hours
**And** bars are color-coded by overload status
**And** hover shows exact hours and employee name

**Given** FR63: donut charts for distribution
**When** I view the team dashboard
**Then** I see donut charts for:
- Time by project (team aggregate)
- Time by category (team aggregate)

**Given** FR64: stacked area chart
**When** I view the team dashboard
**Then** I see 4-week trend showing composition by employee
**And** hover shows weekly breakdown

---

### Story 7.4: Implement Employee Drill-Down View

As a **manager**,
I want to drill down into individual employee data,
So that I can understand specific situations.

**Acceptance Criteria:**

**Given** FR65: drill-down capability
**When** I click on an employee in the bar chart or list
**Then** I see that employee's detailed view:
- Their current week hours breakdown
- Their timesheet status
- Their recent time entries
- Their trend for last 30 days

**Given** the drill-down view
**When** viewing an employee with pending timesheet
**Then** I see a "Review Timesheet" action button

**Given** the drill-down view
**When** I click "Back to Team"
**Then** I return to the team dashboard

---

### Story 7.5: Implement Project Dashboard API

As a **manager**,
I want API endpoints for project dashboard data,
So that I can monitor project budget and progress.

**Acceptance Criteria:**

**Given** an authenticated manager
**When** GET `/api/v1/dashboard/project/:projectId` is called
**Then** response includes:
```json
{
  "success": true,
  "data": {
    "project": { "id": "...", "name": "...", "code": "...", "budgetHours": 500 },
    "budget": {
      "consumed": 320,
      "remaining": 180,
      "percentUsed": 64,
      "burnRate": 40,
      "projectedOverrun": false,
      "weeksUntilBudgetExhausted": 4.5
    },
    "contributors": [
      { "userId": "...", "name": "John", "hours": 120 }
    ]
  }
}
```

**Given** FR68: budget tracking
**When** viewing budget data
**Then** consumed/remaining/projection are calculated from time entries

**Given** FR74: projection based on trends
**When** burnRate is calculated
**Then** average hours/week over last 4 weeks is used

---

### Story 7.6: Implement Project Dashboard UI

As a **manager**,
I want a project dashboard with budget visualization,
So that I can track project health.

**Acceptance Criteria:**

**Given** I navigate to a project dashboard
**When** the page loads
**Then** I see:
- Project name and code
- Budget gauge (FR72: progress bar showing % consumed)
- Budget KPIs (consumed, remaining, projection)
- Alert if overrun risk (FR73)

**Given** FR69: projection chart
**When** viewing the project dashboard
**Then** I see a line chart showing:
- Historical hours per week
- Projected trend line
- Budget limit line
**And** overrun date is highlighted if projected

**Given** FR70: distribution charts
**When** viewing the project dashboard
**Then** I see bar charts for:
- Hours by team
- Hours by category

**Given** FR71: leaderboard
**When** viewing the project dashboard
**Then** I see top contributors ranked by hours

---

### Story 7.7: Implement Manager Dashboard Navigation

As a **manager**,
I want easy navigation between dashboard views,
So that I can quickly access team and project data.

**Acceptance Criteria:**

**Given** I log in as a manager
**When** I access the main dashboard
**Then** I see tabs or navigation for:
- My Dashboard (personal, same as employee)
- Team Dashboard
- Project Dashboard (with project selector)

**Given** I'm on the team dashboard
**When** I have multiple teams
**Then** I can select which team to view via dropdown

**Given** I'm viewing a project in the team dashboard charts
**When** I click on a project segment
**Then** I'm navigated to that project's dashboard (drill-down)

**Given** FR66: auto-refresh
**When** viewing any manager dashboard
**Then** data refreshes periodically (e.g., every 30 seconds)
**And** manual refresh button is available

---

### Story 7.8: Implement Manager Alerts Panel

As a **manager**,
I want a centralized alerts panel,
So that I can see all issues requiring attention.

**Acceptance Criteria:**

**Given** I'm on any manager dashboard
**When** alerts exist
**Then** I see an alerts panel showing:
- Employees over 45h (⚠️ warning)
- Employees over 50h (🔴 critical)
- Projects at risk of overrun
- Pending timesheets awaiting validation

**Given** I click on an alert
**When** it's an employee overload alert
**Then** I'm taken to that employee's drill-down view

**Given** I click on a budget alert
**When** it's a project at risk
**Then** I'm taken to that project's dashboard

**Given** I click on a pending timesheet alert
**When** navigation occurs
**Then** I'm taken to the timesheet validation page with filter applied

---

## Epic 8: Audit Trail & Polish

**Goal:** Traçabilité complète pour conformité et finitions UX "Zéro Friction".

### Story 8.1: Implement Audit Logging Service

As a **developer**,
I want an audit logging service,
So that all significant actions are recorded for compliance.

**Acceptance Criteria:**

**Given** FR75-FR81: audit requirements
**When** the audit service is implemented
**Then** `auditService.log(userId, action, entityType, entityId, oldValues, newValues)` exists
**And** logs are written to the `audit_logs` table
**And** logs include timestamp automatically

**Given** FR79: permanent history
**When** audit logs are created
**Then** no delete operations are allowed on audit_logs table

**Given** FR80: invisible to users
**When** standard API endpoints are called
**Then** audit logs are not exposed to employees or managers

**Given** FR81: accessible for compliance
**When** GET `/api/v1/admin/audit-logs` is called with admin service role
**Then** logs can be queried with filters (userId, action, dateRange, entityType)

---

### Story 8.2: Integrate Audit Logging Across Services

As a **developer**,
I want audit logging integrated into all services,
So that actions are automatically recorded.

**Acceptance Criteria:**

**Given** FR75: time entry modifications
**When** a time entry is created, updated, or deleted
**Then** an audit log is created with old and new values

**Given** FR76: timesheet validations
**When** a timesheet is submitted, validated, rejected, or reopened
**Then** an audit log is created including:
- The action type
- The manager who performed validation/rejection
- The rejection reason if applicable

**Given** FR77: post-validation changes
**When** a validated timesheet is reopened
**Then** audit log captures who reopened and why

**Given** FR78: admin entity changes
**When** projects, categories, or teams are created/modified/deleted
**Then** audit logs capture the changes

---

### Story 8.3: Implement Mobile-First Time Tracking UI

As an **employee using mobile**,
I want an optimized mobile interface,
So that I can track time efficiently on my phone.

**Acceptance Criteria:**

**Given** FR90: mobile-first tracking
**When** I access the time tracking page on mobile
**Then** the interface is optimized for touch:
- Start/Stop buttons are prominent and centered
- Buttons are at least 44px tall (FR91)
- Minimal scrolling needed for primary actions

**Given** FR92: navigation efficiency
**When** I want to perform common actions
**Then** I can do so in ≤2 taps:
- Start timer: 1 tap
- Stop timer: 1 tap
- Add to project: 2 taps (timer + project select)

**Given** FR93: minimal confirmations
**When** I perform routine actions
**Then** no unnecessary confirmation dialogs appear
**And** confirmations only appear for destructive actions (delete)

---

### Story 8.4: Implement Responsive Layout System

As a **user**,
I want the app to adapt to my screen size,
So that I have optimal experience on any device.

**Acceptance Criteria:**

**Given** mobile viewport (<768px)
**When** viewing any page
**Then** layout uses single column
**And** navigation is via hamburger menu
**And** cards stack vertically
**And** charts resize to fit width

**Given** tablet viewport (768px-1024px)
**When** viewing any page
**Then** layout uses 2 columns where appropriate
**And** navigation may be collapsed or expanded

**Given** FR94: desktop optimization for managers
**When** a manager views dashboards on desktop (>1024px)
**Then** layout uses multi-column grid
**And** charts display side-by-side
**And** more data visible without scrolling

---

### Story 8.5: Implement Role-Contextual UI

As a **user**,
I want the interface adapted to my role,
So that I see relevant features without clutter.

**Acceptance Criteria:**

**Given** FR95: role-based UI
**When** an employee logs in
**Then** navigation shows:
- Dashboard
- Time Tracking
- Timesheets
- Templates

**Given** a manager logs in
**When** they view the navigation
**Then** additional items appear:
- Team Dashboard
- Project Dashboard
- Validation Queue
- Admin (Teams, Projects, Categories)

**Given** an employee accessing manager routes
**When** they try to navigate via URL
**Then** they are redirected to their dashboard with error

---

### Story 8.6: Implement Performance Optimizations

As a **user**,
I want the app to be fast and responsive,
So that I don't waste time waiting.

**Acceptance Criteria:**

**Given** NFR1: API response time
**When** simple CRUD endpoints are called
**Then** response time is <200ms (p95)

**Given** NFR2: dashboard loading
**When** dashboard data is requested
**Then** response time is <500ms including calculations

**Given** NFR6: lazy loading
**When** viewing a page with charts
**Then** charts are loaded lazily (not blocking initial render)

**Given** NFR7: code splitting
**When** the frontend bundle is built
**Then** routes are code-split (separate chunks per page)
**And** total initial bundle size is reasonable (<500KB gzipped)

---

### Story 8.7: Implement Accessibility Compliance

As a **user with accessibility needs**,
I want the app to be accessible,
So that I can use it effectively.

**Acceptance Criteria:**

**Given** NFR23: contrast requirements
**When** any text or UI element is displayed
**Then** color contrast meets WCAG 2.1 AA standard (4.5:1 for text)

**Given** NFR24: keyboard navigation
**When** I use keyboard only
**Then** I can:
- Navigate between all interactive elements with Tab
- Activate buttons with Enter/Space
- Close modals with Escape
- Focus is visible and follows logical order

**Given** NFR25: chart accessibility
**When** screen readers encounter charts
**Then** alternative text describes the data
**And** data tables are available as alternative

**Given** NFR26: semantic colors
**When** colors are used for meaning
**Then** secondary indicators exist (icons, text labels)
**And** colors follow consistent meaning (green=success, red=error, yellow=warning)

---

### Story 8.8: Implement Backend Test Coverage

As a **developer**,
I want comprehensive test coverage,
So that code quality is maintained.

**Acceptance Criteria:**

**Given** NFR32: >80% backend coverage
**When** tests are run with coverage report
**Then** overall coverage exceeds 80%

**Given** NFR33: 100% route coverage
**When** route tests are analyzed
**Then** every API endpoint has at least one test
**And** happy path and error cases are tested

**Given** NFR35: security tests
**When** security test suite runs
**Then** tests verify:
- Unauthenticated requests return 401
- Unauthorized role requests return 403
- Input validation rejects malicious input
- SQL injection attempts are blocked

---

### Story 8.9: Implement Frontend Test Coverage

As a **developer**,
I want frontend test coverage,
So that UI components work reliably.

**Acceptance Criteria:**

**Given** NFR34: >60% frontend coverage
**When** tests are run with coverage report
**Then** overall coverage exceeds 60%

**Given** critical components
**When** testing is complete
**Then** the following have tests:
- AuthContext and protected routes
- Time tracking components (timer, timeline)
- Dashboard components (charts, KPIs)
- Form components (create/edit modals)

**Given** component tests
**When** they run
**Then** they use Testing Library with user-centric queries
**And** mocking is done for API calls

---

### Story 8.10: Implement CI/CD Pipeline Completion

As a **developer**,
I want the CI/CD pipeline fully operational,
So that deployment is automated and reliable.

**Acceptance Criteria:**

**Given** NFR37: automated testing in CI
**When** code is pushed to any branch
**Then** GitHub Actions runs:
- Lint checks
- Backend tests with coverage
- Frontend tests with coverage
- Build verification

**Given** NFR38: pipeline speed
**When** the full pipeline runs
**Then** total time is <10 minutes

**Given** NFR44-45: Docker deployment
**When** PR is merged to main
**Then** Docker images are built and pushed to Docker Hub
**And** images are tagged with: latest, branch-name, commit-sha

**Given** NFR43: health checks
**When** containers are deployed
**Then** health check endpoints are used for readiness probes

