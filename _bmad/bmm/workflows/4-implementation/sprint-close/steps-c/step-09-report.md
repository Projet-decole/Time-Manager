---
name: 'step-09-report'
description: 'Générer et afficher le rapport final de sprint-close'
statusFile: '{implementation_artifacts}/sprint-close-status.yaml'
---

# Step 9: Rapport Final

## STEP GOAL:

Générer et afficher le rapport final du sprint-close, récapitulant toutes les actions menées, le changelog, les issues rencontrées, et les informations importantes.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Compile ALL information from status file
- 🔄 CRITICAL: Present clear, actionable summary
- ✅ Communicate in {communication_language}

### Step-Specific Rules:

- 🎯 This is the FINAL step - no next step
- ✅ Display comprehensive report in terminal
- 💾 Mark workflow as completed

## MANDATORY SEQUENCE

### 1. Load Complete Status

Read `{statusFile}` and compile all data:

- Epic info
- Validation results (code review, tests, docker)
- Issues log
- Retrospective
- Changelog
- Git ops results

### 2. Calculate Summary Statistics

```yaml
summary:
  total_steps: 9
  steps_completed: {count}
  duration: {started_at to now}
  issues_found: {count}
  issues_resolved: {count}
  tests_passed: true/false
  docker_valid: true/false
  release_complete: true/false
```

### 3. Generate Final Report

Display comprehensive report:

```
╔══════════════════════════════════════════════════════════════╗
║                    🎉 SPRINT CLOSE TERMINÉ                   ║
╠══════════════════════════════════════════════════════════════╣
║  Epic {epic_number}: {epic_name}                             ║
║  Mode: {mode}                                                ║
║  Durée: {duration}                                           ║
╚══════════════════════════════════════════════════════════════╝

📊 RÉSUMÉ DES VALIDATIONS
─────────────────────────────────────────────────────────────────
| Étape              | Statut      | Détails                   |
|--------------------+-------------+---------------------------|
| Revue de code      | {status}    | {issues_found} issues     |
| Tests unitaires    | {status}    | {passed}/{total}          |
| Tests intégration  | {status}    | {passed}/{total}          |
| Tests E2E          | {status}    | {passed}/{total}          |
| Docker builds      | {status}    | Backend + Frontend        |
| Documentation      | {status}    | {files_updated} fichiers  |
─────────────────────────────────────────────────────────────────

🎉 CHANGELOG UTILISATEUR
─────────────────────────────────────────────────────────────────
{changelog_content}
─────────────────────────────────────────────────────────────────

⚠️ ISSUES RENCONTRÉES
─────────────────────────────────────────────────────────────────
{IF issues_log is not empty:}
| # | Étape | Issue | Résolution |
|---+-------+-------+------------|
{for each issue}
| {n} | {step} | {issue} | {resolution} |

{IF issues_log is empty:}
Aucune issue rencontrée. 🎊
─────────────────────────────────────────────────────────────────

🔄 RÉTROSPECTIVE
─────────────────────────────────────────────────────────────────
**Ce qui a bien fonctionné:**
{list went_well}

**À améliorer:**
{list to_improve}

**Actions pour le prochain epic:**
{list actions}
─────────────────────────────────────────────────────────────────

🔀 RELEASE
─────────────────────────────────────────────────────────────────
• PR: {pr_url or "Non créée"}
• Tag: {tag or "Non créé"}
• Nouvelle branche: {new_branch or "Non créée"}
─────────────────────────────────────────────────────────────────

{IF manual_steps_required:}
⚡ ACTIONS MANUELLES REQUISES
─────────────────────────────────────────────────────────────────
{list manual steps}
─────────────────────────────────────────────────────────────────

╔══════════════════════════════════════════════════════════════╗
║  ✅ Sprint Close complété avec succès !                      ║
║  Prêt pour Epic {next_epic_number}                           ║
╚══════════════════════════════════════════════════════════════╝
```

### 4. Finalize Status File

Update `{statusFile}`:

```yaml
status: "COMPLETED"
completed_at: "{timestamp}"
stepsCompleted: [..., "step-09-report"]
current_step: null

final_summary:
  success: true/false
  issues_count: N
  manual_actions_required: [list or empty]
```

### 5. Cleanup (Optional)

IF all operations successful and no manual steps required:
- Optionally archive status file
- Sprint-close workflow complete

Display:

"**🎊 Workflow sprint-close terminé !**

Le rapport ci-dessus résume toutes les actions effectuées.
Vous êtes prêt à démarrer l'Epic {next_epic_number}.

Bonne continuation ! 🚀"

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Complete report generated
- All sections populated
- Status file finalized
- Clear next steps communicated

### ❌ SYSTEM FAILURE:

- Incomplete report
- Missing sections
- Not finalizing status file
- Leaving user without clear next steps
