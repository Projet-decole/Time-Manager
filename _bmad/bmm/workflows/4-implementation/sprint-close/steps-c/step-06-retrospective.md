---
name: 'step-06-retrospective'
description: 'Conduire la rétrospective de l epic'
nextStepFile: './step-07-changelog.md'
statusFile: '{implementation_artifacts}/sprint-close-status.yaml'
retrospectiveWorkflow: '{project-root}/_bmad/bmm/workflows/4-implementation/retrospective/workflow.md'
---

# Step 6: Rétrospective

## STEP GOAL:

Conduire une rétrospective de l'epic pour identifier ce qui a bien fonctionné, ce qui peut être amélioré, et définir des actions concrètes.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Analyze the entire epic execution
- 🔄 CRITICAL: Capture learnings and actions
- ✅ Communicate in {communication_language}

### Step-Specific Rules:

- 🎯 Invoke retrospective workflow OR conduct inline
- 💬 In interactive mode: solicit user remarks
- 🤖 In YOLO mode: generate retro automatically without user input
- ✅ Focus on actionable improvements

## EXECUTION PROTOCOLS:

- 🎯 Review issues_log from this sprint-close
- 💾 Analyze story completion patterns
- 📖 Generate actionable recommendations

## MANDATORY SEQUENCE

### 1. Announce Retrospective

Display:

"**🔄 Rétrospective - Epic {epic_number}**

Analyse de l'epic pour identifier les apprentissages..."

### 2. Gather Data (Mode-Dependent)

```
IF retrospective workflow exists:
  Invoke {retrospectiveWorkflow} with epic context
  Capture results

ELSE:
  Conduct inline retrospective:
```

**Inline Retrospective:**

Analyze from sprint-close-status.yaml and story files:

1. **What went well:**
   - Stories completed on time
   - Tests passing rate
   - Code review issues resolved
   - Smooth implementations

2. **What could improve:**
   - Recurring issues from code review
   - Test failures patterns
   - Documentation gaps
   - Technical debt introduced

3. **Action items:**
   - Specific improvements for next epic
   - Process changes to implement
   - Technical debt to address

### 3. User Remarks (Interactive Mode Only)

```
IF mode == interactive:
  Display:
  "**📝 Vos remarques**

  Avez-vous des observations à ajouter ?
  - Ce qui a bien fonctionné selon vous
  - Ce qui pourrait être amélioré
  - Suggestions pour le prochain epic

  [Tapez vos remarques ou 'skip' pour continuer]"

  Wait for user input
  Add remarks to retrospective

IF mode == yolo:
  Display: "Mode YOLO - rétrospective générée automatiquement"
  Skip user remarks
```

### 4. Generate Summary

Compile retrospective summary:

```yaml
retrospective:
  went_well:
    - item 1
    - item 2
  to_improve:
    - item 1
    - item 2
  actions:
    - action 1 (priority: high/medium/low)
    - action 2
  user_remarks: "..." # Only in interactive mode
```

### 5. Update Status and Proceed

Update `{statusFile}`:

```yaml
retrospective:
  status: "completed"
  went_well: [...]
  to_improve: [...]
  actions: [...]
  user_remarks: "..." | null

stepsCompleted: [..., "step-06-retrospective"]
current_step: "step-07-changelog"
```

Display:

"**✅ Rétrospective terminée**

**Ce qui a bien fonctionné :**
{list went_well}

**À améliorer :**
{list to_improve}

**Actions pour le prochain epic :**
{list actions}

**Prochaine étape :** Génération du changelog"

→ Load and execute `{nextStepFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Retrospective analysis completed
- Actionable items identified
- User remarks captured (interactive mode)
- Status file updated

### ❌ SYSTEM FAILURE:

- Skipping retrospective
- Not generating actionable items
- Not soliciting user remarks in interactive mode
