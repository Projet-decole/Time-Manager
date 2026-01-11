---
name: 'step-01-init'
description: 'Initialiser le workflow sprint-close, détecter le mode, charger le contexte'
nextStepFile: './step-02-code-review.md'
continueFile: './step-01b-continue.md'
statusFile: '{implementation_artifacts}/sprint-close-status.yaml'
statusTemplate: '../data/status-template.yaml'
sprintStatusFile: '{implementation_artifacts}/sprint-status.yaml'
---

# Step 1: Initialisation

## STEP GOAL:

Initialiser le workflow sprint-close en détectant le mode d'exécution (Interactif/YOLO), chargeant le contexte de l'epic, et vérifiant les prérequis.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER proceed without verifying prerequisites
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step, ensure entire file is read
- ✅ YOU MUST ALWAYS communicate in {communication_language}

### Role Reinforcement:

- ✅ You are a sprint orchestrator preparing for epic closure
- ✅ Verify all prerequisites before proceeding
- ✅ Be clear about which mode is being used

### Step-Specific Rules:

- 🎯 Focus ONLY on initialization and mode detection
- 🚫 FORBIDDEN to start validation steps here
- 💬 Confirm mode and context with user if interactive

## EXECUTION PROTOCOLS:

- 🎯 Check for existing sprint-close-status.yaml (continuation)
- 💾 Create status file from template
- 📖 Load sprint-status.yaml for epic context

## MANDATORY SEQUENCE

### 1. Check for Continuation

Look for existing `{statusFile}`:

```
IF {statusFile} exists AND has stepsCompleted with entries:
  → STOP, load {continueFile}
IF {statusFile} does not exist OR stepsCompleted is empty:
  → Continue with initialization
```

### 2. Detect Execution Mode

Check if mode was specified:

- `--mode=yolo` or `--yolo` → Set mode to **YOLO**
- `--mode=interactive` or no flag → Set mode to **Interactive** (default)

Display:

"**🚀 Sprint Close - Initialisation**

Mode détecté : **{mode}**

En mode **Interactif** : Je vous consulterai si des problèmes surviennent.
En mode **YOLO** : Je bouclerai automatiquement jusqu'au succès."

### 3. Load Epic Context

Read `{sprintStatusFile}` to extract:

- `current_epic` → epic_number
- `epic_name`
- List of stories for this epic

Display:

"**Epic en cours :** {epic_number} - {epic_name}
**Stories à valider :** {story_count}"

### 4. Verify Prerequisites

Check:

- [ ] All stories have status "completed" or "reviewed"
- [ ] Application compiles (optional quick check)
- [ ] Git working directory is clean (or warn if not)

IF prerequisites NOT met:

```
Display warning with details
IF mode == interactive:
  Ask user: "Voulez-vous continuer malgré tout ? [O/N]"
IF mode == yolo:
  Log warning and continue
```

### 5. Create Status File

Copy `{statusTemplate}` to `{statusFile}` and populate:

```yaml
epic_number: {epic_number}
epic_name: "{epic_name}"
mode: "{mode}"
started_at: "{current_timestamp}"
current_step: "step-01-init"
stepsCompleted: ["step-01-init"]
```

### 6. Display Summary and Proceed

"**✅ Initialisation terminée**

| Paramètre | Valeur |
|-----------|--------|
| Epic | {epic_number} - {epic_name} |
| Mode | {mode} |
| Stories | {story_count} |

**Prochaine étape :** Revue de code de toutes les stories

Démarrage..."

→ Load and execute `{nextStepFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Mode correctly detected
- Epic context loaded
- Prerequisites verified (or acknowledged)
- Status file created
- Proceeding to step 2

### ❌ SYSTEM FAILURE:

- Starting without loading context
- Not creating status file
- Ignoring critical prerequisite failures in interactive mode
