---
name: 'step-09-report'
description: 'Générer et afficher le rapport final de sprint-close'
statusFile: '{implementation_artifacts}/sprint-close-status.yaml'
---

# Step 9: Rapport Final

## STEP GOAL:

Générer et afficher le rapport final du sprint-close, récapitulant toutes les actions menées, le changelog, les issues rencontrées, et les instructions pour finaliser la release.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Compile ALL information from status file
- 🔄 CRITICAL: Present clear, actionable summary
- ✅ Communicate in {communication_language}

### Step-Specific Rules:

- 🎯 This is the FINAL step - no next step
- ✅ Display comprehensive report in terminal
- 📝 CRITICAL: Include copy-paste ready Git commands for pending operations
- 💾 Mark workflow as completed

## MANDATORY SEQUENCE

### 1. Load Complete Status

Read `{statusFile}` and compile all data:

- Epic info
- Validation results (code review, tests, docker)
- Issues log
- Retrospective
- Changelog
- Git ops results AND manual_instructions

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
  git_operations_pending: [list]
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

🔀 STATUT RELEASE
─────────────────────────────────────────────────────────────────
• Push: {done or pending}
• PR: {pr_url or "En attente"}
• Merge: {done or "En attente"}
• Tag: {tag or "En attente"}
• Nouvelle branche: {new_branch or "En attente"}
─────────────────────────────────────────────────────────────────
```

### 4. Display Git Instructions (CRITICAL for release completion)

**IF any git operations are pending:**

```
🚀 INSTRUCTIONS POUR FINALISER LA RELEASE
═════════════════════════════════════════════════════════════════

Les agents n'ont pas les permissions pour certaines opérations Git.
Voici les commandes à exécuter pour finaliser la release :

┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1: Créer la Pull Request                                  │
├─────────────────────────────────────────────────────────────────┤
│ Via GitHub CLI :                                                │
│                                                                 │
│ gh pr create --title "Release: Epic {epic_number} - {epic_name}" \
│   --body "$(cat <<'EOF'                                         │
│ ## Summary                                                      │
│ {changelog_content_condensed}                                   │
│                                                                 │
│ ## Validation Results                                           │
│ - Tests: {tests_status}                                         │
│ - Docker: {docker_status}                                       │
│ - Code Review: {review_status}                                  │
│ EOF                                                             │
│ )" --base main --head {current_branch}                          │
│                                                                 │
│ OU via l'interface :                                            │
│ https://github.com/{owner}/{repo}/compare/main...{branch}       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2: Merger la PR (après review/approbation)                │
├─────────────────────────────────────────────────────────────────┤
│ gh pr merge --merge --delete-branch                             │
│                                                                 │
│ OU via l'interface GitHub : Merge pull request                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 3: Créer le tag de release                                │
├─────────────────────────────────────────────────────────────────┤
│ git checkout main                                               │
│ git pull origin main                                            │
│ git tag -a v{epic_number}.0 -m "Release Epic {epic_number}: {epic_name}"
│ git push origin v{epic_number}.0                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ÉTAPE 4: Créer la branche pour le prochain epic                 │
├─────────────────────────────────────────────────────────────────┤
│ git checkout main                                               │
│ git pull origin main                                            │
│ git checkout -b epic-{next_epic_number}-{next_epic_slug}        │
│ git push -u origin epic-{next_epic_number}-{next_epic_slug}     │
└─────────────────────────────────────────────────────────────────┘

═════════════════════════════════════════════════════════════════
```

### 5. Finalize Status File

Update `{statusFile}`:

```yaml
status: "COMPLETED"
completed_at: "{timestamp}"
stepsCompleted: [..., "step-09-report"]
current_step: null

final_summary:
  success: true/false
  issues_count: N
  manual_actions_required:
    - pr_creation
    - merge
    - tag_creation
    - next_branch_creation
  git_instructions_provided: true
```

### 6. Final Message

Display:

```
╔══════════════════════════════════════════════════════════════╗
║  ✅ Sprint Close complété !                                  ║
║                                                              ║
║  Validations terminées. Pour finaliser la release :          ║
║  → Exécutez les commandes Git ci-dessus                      ║
║                                                              ║
║  Prêt pour Epic {next_epic_number} après la release.         ║
╚══════════════════════════════════════════════════════════════╝
```

"**🎊 Workflow sprint-close terminé !**

Le rapport ci-dessus résume toutes les actions effectuées.
Suivez les instructions Git pour compléter la release.

Bonne continuation ! 🚀"

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Complete report generated
- All sections populated
- Git instructions clearly provided with copy-paste commands
- Status file finalized
- Clear next steps communicated

### ❌ SYSTEM FAILURE:

- Incomplete report
- Missing Git instructions when operations are pending
- Not providing copy-paste ready commands
- Leaving user without clear path to complete release
