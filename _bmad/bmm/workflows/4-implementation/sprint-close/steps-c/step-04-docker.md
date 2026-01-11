---
name: 'step-04-docker'
description: 'Valider les builds Docker (dev et prod)'
nextStepFile: './step-05-documentation.md'
statusFile: '{implementation_artifacts}/sprint-close-status.yaml'
---

# Step 4: Validation Docker

## STEP GOAL:

Valider que les images Docker (dev et prod) se construisent correctement pour garantir le déploiement.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Build BOTH dev and prod images
- 🔄 CRITICAL: Capture and track build failures
- ✅ Communicate in {communication_language}

### Step-Specific Rules:

- 🎯 Execute via `npm run docker:validate`
- 🚫 FORBIDDEN to skip failing builds without acknowledgment
- 💬 In interactive mode: stop and consult on failures
- 🔁 In YOLO mode: loop until builds succeed

## MANDATORY SEQUENCE

### 1. Announce Docker Validation

Display:

"**🐳 Validation Docker**

Construction des images :
1. Backend (dev + prod)
2. Frontend (dev + prod)

Cela peut prendre quelques minutes..."

### 2. Execute Docker Builds

Run: `npm run docker:validate`

This command executes:
1. `docker build -t time-manager-backend:test ./backend`
2. `docker build -t time-manager-frontend:test ./frontend`

Capture output and results for each build.

### 3. Parse Results

Extract from output:

```yaml
docker:
  backend:
    status: "success" | "failed"
    duration: Xs
    image_size: XMB
    error: null | "error message"
  frontend:
    status: "success" | "failed"
    duration: Xs
    image_size: XMB
    error: null | "error message"
```

### 4. Handle Failures (Mode-Dependent)

**IF any build failed:**

```
IF mode == interactive:
  Display:
  "**❌ Échec de build Docker**

  **Backend:** {backend_status}
  **Frontend:** {frontend_status}

  Erreur :
  {error_message}

  Options:
  [F] Fixer et relancer le build
  [D] Voir les logs complets
  [S] Skip et continuer (non recommandé)
  [A] Abandonner"

  Wait for user choice
  Handle accordingly

IF mode == yolo:
  Log failure to issues_log
  Increment attempt counter
  IF attempts < 3:
    Display: "Tentative {attempt}/3 - Relance du build..."
    Re-run build
  ELSE:
    Log: "DOCKER_BUILD_FAILED_AFTER_3_ATTEMPTS"
    Continue with warning
```

### 5. Check Image Sizes (Optional)

IF builds succeeded, check image sizes:

```
IF backend_size > 500MB OR frontend_size > 200MB:
  Display warning about large image sizes
  Log to issues_log (informational)
```

### 6. Update Status and Proceed

Update `{statusFile}`:

```yaml
validation_results.docker:
  status: "passed" | "passed_with_warnings" | "failed"
  attempts: {count}
  backend:
    status: "success" | "failed"
    size: XMB
  frontend:
    status: "success" | "failed"
    size: XMB

stepsCompleted: [..., "step-04-docker"]
current_step: "step-05-documentation"
```

Display:

"**✅ Validation Docker terminée**

| Image | Statut | Taille |
|-------|--------|--------|
| Backend | {status} | {size}MB |
| Frontend | {status} | {size}MB |

**Prochaine étape :** Mise à jour documentation"

→ Load and execute `{nextStepFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Both images built successfully
- Results captured and tracked
- Failures handled appropriately per mode
- Status file updated

### ❌ SYSTEM FAILURE:

- Skipping Docker validation entirely
- Not capturing build errors
- Proceeding without user acknowledgment in interactive mode
