---
name: 'step-05-documentation'
description: 'Mettre à jour la documentation du projet'
nextStepFile: './step-06-retrospective.md'
statusFile: '{implementation_artifacts}/sprint-close-status.yaml'
docsPath: '{project-root}/docs'
---

# Step 5: Documentation

## STEP GOAL:

Mettre à jour la documentation du projet pour refléter les changements de l'epic (nouvelles fonctionnalités, APIs, configurations).

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Review what changed in this epic
- 🔄 CRITICAL: Update relevant documentation files
- ✅ Communicate in {communication_language}

### Step-Specific Rules:

- 🎯 Focus on user-facing and developer documentation
- 🚫 FORBIDDEN to create unnecessary new docs
- 💬 Autonomous step - minimal user interaction
- ✅ OK to add new sections to existing docs

## EXECUTION PROTOCOLS:

- 🎯 Analyze stories to identify documentation needs
- 💾 Update existing docs, create new only if necessary
- 📖 Keep documentation concise and actionable

## MANDATORY SEQUENCE

### 1. Analyze Epic Changes

Read all story files for current epic and extract:

- New features added
- New API endpoints
- Configuration changes
- New commands or scripts
- Breaking changes

Display:

"**📚 Mise à jour Documentation**

Analyse des changements de l'Epic {epic_number}...

Changements détectés :
- {count} nouvelles fonctionnalités
- {count} nouveaux endpoints API
- {count} changements de configuration"

### 2. Identify Documentation Updates

For each change type, determine target doc:

| Change Type | Target Doc |
|-------------|------------|
| New feature | README.md or feature-specific doc |
| API endpoint | API.md or similar |
| Configuration | CONFIGURATION.md or README |
| New command | README.md or DEVELOPMENT.md |
| Testing changes | TESTING.md |
| Architecture | ARCHITECTURE.md |

### 3. Update Documentation Files

For each identified update:

```
1. Read current doc file
2. Identify appropriate section
3. Add or update content
4. Keep consistent style with existing content
```

Display progress:

"Mise à jour : {doc_file}
- Ajout section : {section_name}
- Modification : {what_changed}"

### 4. Validate Updates

After all updates:

- Verify markdown syntax is valid
- Check for broken internal links (if any)
- Ensure new sections have proper headings

### 5. Update Status and Proceed

Update `{statusFile}`:

```yaml
documentation:
  status: "completed"
  files_updated: [list of files]
  sections_added: [list]
  sections_modified: [list]

stepsCompleted: [..., "step-05-documentation"]
current_step: "step-06-retrospective"
```

Display:

"**✅ Documentation mise à jour**

| Fichier | Action |
|---------|--------|
| {file} | {action} |
| ... | ... |

**Prochaine étape :** Rétrospective"

→ Load and execute `{nextStepFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Documentation analyzed for needed updates
- Relevant files updated
- Status file updated
- No broken markdown

### ❌ SYSTEM FAILURE:

- Skipping documentation entirely
- Creating unnecessary new files
- Breaking existing documentation
