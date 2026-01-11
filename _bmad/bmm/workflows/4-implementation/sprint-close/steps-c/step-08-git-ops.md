---
name: 'step-08-git-ops'
description: 'Exécuter les opérations Git : push, PR, merge, tag, nouvelle branche'
nextStepFile: './step-09-report.md'
statusFile: '{implementation_artifacts}/sprint-close-status.yaml'
---

# Step 8: Opérations Git

## STEP GOAL:

Exécuter les opérations Git pour finaliser la release : push des changements, création de PR, merge sur main, création du tag de release, et création de la branche pour le prochain epic.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Follow Git best practices
- 🔄 CRITICAL: Verify each step before proceeding
- ✅ Communicate in {communication_language}

### Step-Specific Rules:

- 🎯 Execute Git operations sequentially
- ⚠️ WARNING: Git permissions may require manual intervention
- 💬 In interactive mode: confirm before destructive operations
- 🔁 In YOLO mode: attempt auto, fall back to guidance

## EXECUTION PROTOCOLS:

- 🎯 Verify clean working directory before operations
- 💾 Create meaningful commit messages
- 📖 Use changelog content for PR description

## MANDATORY SEQUENCE

### 1. Verify Git State

Check current state:

```bash
git status
git branch --show-current
```

Display:

"**🔀 Opérations Git**

Branche actuelle : {current_branch}
État : {clean/dirty}
Commits en avance : {count}"

IF working directory is dirty:
- Commit remaining changes with message: "chore: sprint-close updates"

### 2. Push to Remote

```bash
git push origin {current_branch}
```

IF push fails (permissions):
```
Display:
"**⚠️ Push impossible**

Erreur : {error_message}

Action requise :
1. Vérifiez vos permissions sur le repository
2. Exécutez manuellement : git push origin {branch}
3. Revenez ici une fois terminé"

Wait for confirmation (interactive) or log issue (yolo)
```

### 3. Create Pull Request

Using GitHub CLI or API:

```bash
gh pr create \
  --title "Release: Epic {epic_number} - {epic_name}" \
  --body "{changelog_content}" \
  --base main \
  --head {current_branch}
```

Capture PR URL.

IF PR creation fails:
- Guide user to create PR manually
- Provide PR title and body content

### 4. Merge Pull Request

```
IF mode == interactive:
  Display:
  "**PR créée :** {pr_url}

  Voulez-vous merger automatiquement ?
  [M] Merger maintenant
  [W] Attendre review manuelle
  [S] Skip le merge"

  IF M: Proceed with merge
  IF W: Note for manual merge, continue workflow
  IF S: Log skip, continue

IF mode == yolo:
  Attempt auto-merge
  IF fails: Log and continue
```

Merge command:
```bash
gh pr merge {pr_number} --merge --delete-branch
```

### 5. Create Release Tag

After merge (or on current branch if merge skipped):

```bash
git checkout main
git pull origin main
git tag -a v{epic_number}.0 -m "Release Epic {epic_number}: {epic_name}"
git push origin v{epic_number}.0
```

### 6. Create Next Epic Branch

```bash
git checkout -b epic-{next_epic_number}-{next_epic_name}
git push -u origin epic-{next_epic_number}-{next_epic_name}
```

Display:

"**Nouvelle branche créée :** epic-{next_epic_number}-{next_epic_name}"

### 7. Update Status and Proceed

Update `{statusFile}`:

```yaml
git_ops:
  status: "completed" | "partial" | "manual_required"
  pushed: true/false
  pr_url: "{url}" | null
  pr_merged: true/false
  tag: "v{epic_number}.0" | null
  new_branch: "epic-{next}-{name}" | null
  manual_steps_required: [list if any]

stepsCompleted: [..., "step-08-git-ops"]
current_step: "step-09-report"
```

Display:

"**✅ Opérations Git terminées**

| Opération | Statut |
|-----------|--------|
| Push | {status} |
| Pull Request | {pr_url or status} |
| Merge | {status} |
| Tag | {tag or status} |
| Nouvelle branche | {branch or status} |

**Prochaine étape :** Rapport final"

→ Load and execute `{nextStepFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All Git operations attempted
- PR created (even if manual merge needed)
- Tag created (or clear guidance provided)
- New branch ready for next epic
- Status file updated

### ❌ SYSTEM FAILURE:

- Skipping Git operations entirely
- Not handling permission errors gracefully
- Not providing manual intervention guidance
- Leaving workflow in unknown state
