---
name: 'step-07-changelog'
description: 'Générer le changelog orienté utilisateur'
nextStepFile: './step-08-git-ops.md'
statusFile: '{implementation_artifacts}/sprint-close-status.yaml'
changelogTemplate: '../data/changelog-template.md'
---

# Step 7: Changelog Utilisateur

## STEP GOAL:

Générer un changelog orienté utilisateur final qui explique les nouvelles fonctionnalités en termes de bénéfices concrets ("voici ce que vous pouvez faire de nouveau").

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Focus on USER benefits, not technical details
- 🔄 CRITICAL: Use accessible, non-technical language
- ✅ Communicate in {communication_language}

### Step-Specific Rules:

- 🎯 Translate technical changes into user value
- 🚫 FORBIDDEN to use technical jargon
- ✅ Structure by user actions/capabilities
- 💡 Think: "What can users DO now that they couldn't before?"

## EXECUTION PROTOCOLS:

- 🎯 Read all stories and extract user-facing features
- 💾 Categorize by feature type
- 📖 Write in user-friendly language

## MANDATORY SEQUENCE

### 1. Analyze Stories for User Impact

Read all story files for epic {epic_number} and extract:

- User-facing features (what users can now do)
- UX improvements (what's easier/faster)
- Bug fixes affecting users
- New capabilities

**Filter out:**
- Internal refactoring
- Technical improvements invisible to users
- Backend-only changes with no UI impact

### 2. Categorize Changes

Group into categories:

| Category | Description |
|----------|-------------|
| 🆕 Nouvelles fonctionnalités | Features users can now use |
| ⚡ Améliorations | Existing features made better |
| 🐛 Corrections | Bugs fixed that affected users |
| 🎨 Interface | Visual or UX improvements |

### 3. Write User-Friendly Descriptions

For each feature, transform:

**FROM (technical):**
"Implemented CRUD API for projects with soft delete and auto-generated codes"

**TO (user-friendly):**
"Vous pouvez maintenant créer et gérer vos projets. Chaque projet reçoit automatiquement un code unique pour un suivi facile."

### 4. Generate Changelog

Following {changelogTemplate} guidelines:

```markdown
## 🎉 Quoi de neuf dans cette version ?

### 🆕 Nouvelles fonctionnalités

**[Nom de la fonctionnalité]**
[Description orientée utilisateur - ce qu'ils peuvent FAIRE]

### ⚡ Améliorations

**[Nom de l'amélioration]**
[Comment c'est mieux pour l'utilisateur]

### 🐛 Corrections

- [Bug corrigé en termes utilisateur]

---
Version: {version}
Epic: {epic_number} - {epic_name}
```

### 5. Store Changelog

Save changelog content in status file for:
- Terminal display in final report
- Potential inclusion in release notes
- PR description

### 6. Update Status and Proceed

Update `{statusFile}`:

```yaml
changelog:
  status: "generated"
  version: "{epic_number}.0"
  content: |
    [full changelog content]
  features_count: N
  improvements_count: N
  fixes_count: N

stepsCompleted: [..., "step-07-changelog"]
current_step: "step-08-git-ops"
```

Display:

"**✅ Changelog généré**

{display changelog preview}

**Prochaine étape :** Opérations Git"

→ Load and execute `{nextStepFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Changelog written in user-friendly language
- No technical jargon
- Categorized appropriately
- Status file updated

### ❌ SYSTEM FAILURE:

- Using technical language
- Including internal/invisible changes
- Not focusing on user benefits
- Empty changelog (should always have something)
