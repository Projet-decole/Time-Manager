---
stepsCompleted: ['step-01-discovery', 'step-02-classification', 'step-03-requirements', 'step-04-tools', 'step-05-plan-review', 'step-06-design', 'step-07-foundation', 'step-08-build-complete']
created: 2026-01-11
status: COMPLETE
approvedDate: 2026-01-11
designApprovedDate: 2026-01-11
completedDate: 2026-01-11
workflowName: sprint-close
targetPath: "_bmad/bmm/workflows/4-implementation/sprint-close"
---

# Workflow Creation Plan - Sprint Close

## Discovery Notes

**User's Vision:**
Un workflow orchestré pour clôturer un epic/sprint de manière complète. Couvre la validation technique (tests, revue de code, Docker), la transition (documentation, rétrospective), la communication (changelog utilisateur), la release (git ops), et la préparation du prochain epic.

**Who It's For:**
- Lunos (seul humain sur le projet)
- Équipe d'agents IA BMAD qui exécutent le workflow

**What It Produces:**
- Rapport final de sprint-close contenant :
  - Actions menées
  - Changelog orienté utilisateur ("voici ce que vous pouvez faire de nouveau")
  - Issues rencontrées et résolutions
  - Infos pertinentes
- Branche mergée sur main avec tag de release
- Nouvelle branche pour le prochain epic
- Documentation mise à jour
- Fichier de suivi pour reprise en cours de route

**Key Insights:**

### Deux modes d'exécution

| Mode | Comportement |
|------|--------------|
| **Interactif** | Consultation si issues, validation retro avec remarques utilisateur |
| **YOLO** | Tout automatique, issues dans le rapport, retro sans remarques |

### Flux détaillé (8 étapes)

| # | Étape | Description | Mode Interactif | Mode YOLO |
|---|-------|-------------|-----------------|-----------|
| 1 | Revue de code | Adversariale sur toutes les stories | Consultation si issues | Issues → rapport |
| 2 | Tests exhaustifs | Unit + Integration + E2E + Couverture | Consultation si échecs | Échecs → rapport |
| 3 | Validation Docker | Build images dev + prod | Consultation si échecs | Échecs → rapport |
| 4 | Documentation | Mise à jour auto, nouvelles sections OK | Auto | Auto |
| 5 | Rétrospective | Problèmes, actions, remarques | Consultation | Auto (pas de remarques) |
| 6 | Changelog utilisateur | Résumé orienté utilisateur final | Auto | Auto |
| 7 | Git ops | Push, PR, merge, tag, nouvelle branche | Auto (intervention possible) | Auto |
| 8 | Rapport final | Actions, changelog, issues, infos | Généré | Généré |

### Contexte technique

- Projet Time Manager (Node.js backend, React frontend, Supabase)
- Commande `npm run test:epic` pour tests exhaustifs
- CI/CD avec GitHub Actions + Docker + Render
- Workflows BMAD existants à invoquer : code-review, retrospective
- Fichier de suivi requis (comme sprint-status.yaml) pour reprise

### Risques identifiés

- Git ops : possible intervention manuelle à cause des policies sur les branches et permissions des agents

---

## Classification Decisions

**Workflow Name:** sprint-close
**Target Path:** `_bmad/bmm/workflows/4-implementation/sprint-close/`

**4 Key Decisions:**
1. **Document Output:** false (affichage terminal uniquement)
2. **Module Affiliation:** BMM (software development workflows)
3. **Session Type:** Continuable (avec fichier de suivi pour reprise)
4. **Lifecycle Support:** Create-Only (workflow d'exécution)

**Structure Implications:**
- Dossier `steps-c/` uniquement (pas de steps-e/ ou steps-v/)
- Fichier `step-01b-continue.md` requis pour la reprise
- Tracking `stepsCompleted` dans un fichier de suivi
- Pas de template de document output

---

## Requirements

**Flow Structure:**
- Pattern: Mixte (linéaire avec branchements conditionnels)
  - Mode Interactif : Linéaire avec arrêts conditionnels (échec → proposition correction → attente user)
  - Mode YOLO : Boucles automatiques sur les étapes de validation jusqu'à succès
- Phases: 8 étapes principales
  1. Revue de code
  2. Tests exhaustifs
  3. Validation Docker
  4. Documentation
  5. Rétrospective
  6. Changelog utilisateur
  7. Git ops (push, PR, merge, tag, nouvelle branche)
  8. Rapport final (terminal)
- Deux modes d'exécution: Interactif (défaut) / YOLO

**User Interaction:**
- Style: Majoritairement autonome
- Decision points: Consultation uniquement si problème (mode interactif) ou retro
- Checkpoint frequency: Minimal - seulement sur échec ou étape retro

**Inputs Required:**
- Required:
  - Epic en cours (numéro, nom)
  - Stories de l'epic (fichiers dans implementation_artifacts/stories/)
  - sprint-status.yaml
- Optional:
  - Mode d'exécution (Interactif par défaut, YOLO si spécifié)
  - Nom de la branche pour le prochain epic
- Prerequisites:
  - Toutes les stories développées
  - Application qui compile/démarre

**Output Specifications:**
- Type: Actions + Affichage terminal
- Actions réalisées:
  - Tests exécutés (unit, integration, E2E)
  - Images Docker buildées
  - Documentation mise à jour
  - Code pushé, PR créée, mergée
  - Tag de release créé
  - Nouvelle branche créée
- Affichage terminal: Rapport final (actions, changelog, issues, infos)
- Fichiers modifiés:
  - Fichier de suivi du workflow (pour reprise)
  - Documentation projet
  - sprint-status.yaml

**Success Criteria:**
- Tests passent (Unit + Integration + E2E tous verts)
- Revue de code OK (pas d'issues critiques non résolues)
- Docker builds OK (images dev et prod construites)
- Docs à jour (si nécessaire)
- Retro complétée (problèmes et actions documentés)
- Changelog généré (résumé utilisateur affiché)
- Release effectuée (PR mergée, tag créé)
- Prochaine branche prête (nouvelle branche epic créée)

**Instruction Style:**
- Overall: Mixte
- Prescriptive pour: tests, Docker, git ops (commandes exactes)
- Intent-based pour: retro, changelog (flexibilité créative)

---

## Tools Configuration

**Core BMAD Tools:**
- **Party Mode:** excluded - Non applicable (workflow d'exécution)
- **Advanced Elicitation:** excluded - Pas de questionnement profond nécessaire
- **Brainstorming:** excluded - Non applicable

**LLM Features:**
- **Web-Browsing:** excluded - Pas de recherche externe nécessaire
- **File I/O:** included - Lecture stories, sprint-status, écriture fichier de suivi
- **Sub-Agents:** included - Invocation workflows code-review, retrospective
- **Sub-Processes:** excluded - Exécution séquentielle suffisante

**Memory:**
- Type: Continuable
- Tracking: sidecar-file (sprint-close-status.yaml)
- State: stepsCompleted, currentStep, mode, issues, epic_info

**External Integrations:**
- Git (via Bash commands)
- Docker (via Bash commands)
- npm (via Bash commands)

**Installation Requirements:**
- Aucune installation supplémentaire requise

---

## Design

### Structure des Étapes (10 fichiers)

| # | Fichier | Type | But |
|---|---------|------|-----|
| 01 | step-01-init.md | Init (Continuable) | Charger contexte, détecter mode, vérifier prérequis |
| 01b | step-01b-continue.md | Continuation | Reprendre workflow en cours |
| 02 | step-02-code-review.md | Middle (boucle) | Invoquer code-review, gérer issues |
| 03 | step-03-tests.md | Middle (boucle) | Exécuter tests, gérer échecs |
| 04 | step-04-docker.md | Middle (boucle) | Valider builds Docker |
| 05 | step-05-documentation.md | Middle (simple) | Mettre à jour docs |
| 06 | step-06-retrospective.md | Middle | Invoquer retrospective |
| 07 | step-07-changelog.md | Middle (simple) | Générer changelog utilisateur |
| 08 | step-08-git-ops.md | Middle | Push, PR, merge, tag, branche |
| 09 | step-09-report.md | Final | Afficher rapport terminal |

### Fichier de Suivi

**Nom:** sprint-close-status.yaml

**Contenu:**
- epic_number, epic_name, mode
- started_at, current_step, stepsCompleted
- validation_results (code_review, tests, docker)
- issues_log (step, issue, resolution)
- retrospective (went_well, to_improve, actions)
- git_ops (pr_url, tag, new_branch)
- changelog

### Gestion des Erreurs

| Situation | Mode Interactif | Mode YOLO |
|-----------|-----------------|-----------|
| Code review issues | Proposer fix, attendre | Boucler jusqu'à 0 critiques |
| Tests échecs | Proposer fix, attendre | Boucler jusqu'à succès |
| Docker échec | Afficher, attendre | Boucler jusqu'à succès |
| Git permission | Guider intervention | Idem |

### Structure Fichiers

```
sprint-close/
├── workflow.yaml
├── data/
│   └── changelog-template.md
└── steps-c/
    ├── step-01-init.md
    ├── step-01b-continue.md
    ├── step-02-code-review.md
    ├── step-03-tests.md
    ├── step-04-docker.md
    ├── step-05-documentation.md
    ├── step-06-retrospective.md
    ├── step-07-changelog.md
    ├── step-08-git-ops.md
    └── step-09-report.md
```
