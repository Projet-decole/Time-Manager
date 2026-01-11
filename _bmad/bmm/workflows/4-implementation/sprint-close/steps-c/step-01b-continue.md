---
name: 'step-01b-continue'
description: 'Reprendre le workflow sprint-close en cours'
statusFile: '{implementation_artifacts}/sprint-close-status.yaml'
workflowPath: '{project-root}/_bmad/bmm/workflows/4-implementation/sprint-close'
---

# Step 1b: Continuation

## STEP GOAL:

Reprendre un workflow sprint-close interrompu en chargeant l'état sauvegardé et en routant vers l'étape appropriée.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Read status file completely before routing
- 🔄 CRITICAL: Route to correct step based on progress
- ✅ YOU MUST ALWAYS communicate in {communication_language}

### Step-Specific Rules:

- 🎯 Focus ONLY on resuming workflow
- 🚫 FORBIDDEN to restart from beginning if progress exists
- 💬 Inform user of current state before resuming

## MANDATORY SEQUENCE

### 1. Load Status File

Read `{statusFile}` and extract:

- `epic_number`, `epic_name`
- `mode` (interactive/yolo)
- `current_step`
- `stepsCompleted` array
- `validation_results`
- `issues_log`

### 2. Welcome Back

Display:

"**🔄 Reprise du Sprint Close**

**Epic :** {epic_number} - {epic_name}
**Mode :** {mode}
**Dernière étape :** {current_step}
**Progression :** {stepsCompleted.length}/9 étapes

**Étapes complétées :**
{list stepsCompleted with checkmarks}

**Résumé des validations :**
- Revue de code : {validation_results.code_review.status}
- Tests : {validation_results.tests.status}
- Docker : {validation_results.docker.status}"

### 3. Check for Issues

IF `issues_log` has unresolved entries AND mode == interactive:

Display:

"**⚠️ Issues en suspens :**
{list issues without resolution}

Voulez-vous les traiter maintenant ou continuer ? [T]raiter / [C]ontinuer"

### 4. Route to Current Step

Based on `current_step`, determine next step file:

| current_step | Route to |
|--------------|----------|
| step-01-init | step-02-code-review.md |
| step-02-code-review | step-02-code-review.md (retry) |
| step-03-tests | step-03-tests.md (retry) |
| step-04-docker | step-04-docker.md (retry) |
| step-05-documentation | step-05-documentation.md |
| step-06-retrospective | step-06-retrospective.md |
| step-07-changelog | step-07-changelog.md |
| step-08-git-ops | step-08-git-ops.md |
| step-09-report | step-09-report.md |

Display:

"**Reprise à l'étape :** {current_step}

Continuation..."

→ Load and execute the appropriate step file

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Status file loaded correctly
- User informed of current state
- Routed to correct step

### ❌ SYSTEM FAILURE:

- Not loading status file
- Restarting from beginning when progress exists
- Routing to wrong step
