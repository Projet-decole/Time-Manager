---
name: 'step-02-code-review'
description: 'Exécuter la revue de code adversariale sur toutes les stories de l epic'
nextStepFile: './step-03-tests.md'
statusFile: '{implementation_artifacts}/sprint-close-status.yaml'
codeReviewWorkflow: '{project-root}/_bmad/bmm/workflows/4-implementation/code-review/workflow.yaml'
storiesPath: '{implementation_artifacts}/stories'
---

# Step 2: Revue de Code

## STEP GOAL:

Exécuter une revue de code adversariale sur toutes les stories de l'epic pour identifier les problèmes avant la validation finale.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Review ALL stories, not just some
- 🔄 CRITICAL: Track issues and resolutions
- ✅ Communicate in {communication_language}

### Step-Specific Rules:

- 🎯 Invoke code-review workflow for each story
- 🚫 FORBIDDEN to skip stories
- 💬 In interactive mode: stop on critical issues
- 🔁 In YOLO mode: loop until all critical issues resolved

## EXECUTION PROTOCOLS:

- 🎯 Load list of stories for current epic
- 💾 Update status file after each story review
- 📖 Aggregate results for summary

## MANDATORY SEQUENCE

### 1. Load Stories List

From status file, get `epic_number`.
Find all story files matching: `{storiesPath}/story-{epic_number}*.md`

Display:

"**📝 Revue de Code - Epic {epic_number}**

Stories à reviewer : {story_count}
{list story files}"

### 2. Review Each Story

FOR each story file:

```
1. Display: "Reviewing: {story_file}..."
2. Invoke code-review workflow with:
   - story_file: {story_file}
   - mode: "sprint-close"
3. Capture results:
   - issues_found: count
   - critical_issues: count
   - issues_details: list
4. Update status file:
   validation_results.code_review.stories_reviewed.append({story_id})
```

### 3. Handle Issues (Mode-Dependent)

**IF critical_issues > 0:**

```
IF mode == interactive:
  Display issues with details
  Display: "**🚨 Issues critiques trouvées**

  {list critical issues}

  Options:
  [F] Fixer maintenant (je vous guide)
  [S] Skip et noter pour plus tard
  [A] Abandonner le sprint-close"

  Wait for user choice
  IF F: Guide fix, then re-review that story
  IF S: Log to issues_log, continue
  IF A: Exit workflow

IF mode == yolo:
  Attempt auto-fix if possible
  Re-review story
  IF still critical after 3 attempts:
    Log to issues_log with "UNRESOLVED"
    Continue to next story
```

### 4. Aggregate Results

After all stories reviewed:

```yaml
validation_results.code_review:
  status: "passed" | "passed_with_warnings" | "failed"
  attempts: {attempt_count}
  issues_found: {total_issues}
  issues_resolved: {resolved_count}
  stories_reviewed: [list]
```

### 5. Update Status and Proceed

Update `{statusFile}`:
- Add "step-02-code-review" to stepsCompleted
- Set current_step to "step-03-tests"

Display:

"**✅ Revue de code terminée**

| Métrique | Valeur |
|----------|--------|
| Stories reviewées | {count} |
| Issues trouvées | {issues_found} |
| Issues résolues | {issues_resolved} |
| Statut | {status} |

**Prochaine étape :** Tests exhaustifs"

→ Load and execute `{nextStepFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All stories reviewed
- Issues tracked and handled appropriately
- Status file updated
- Proceeding to tests

### ❌ SYSTEM FAILURE:

- Skipping stories
- Not tracking issues
- Proceeding with unacknowledged critical issues in interactive mode
