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

- 🐳 CRITICAL: Docker daemon MUST be running before builds
- 🎯 Execute via `npm run docker:validate`
- 🚫 FORBIDDEN to skip failing builds without acknowledgment
- 💬 In interactive mode: stop and consult on failures
- 🔁 In YOLO mode: loop until builds succeed

## MANDATORY SEQUENCE

### 1. Verify Docker Daemon Running

```bash
docker info > /dev/null 2>&1
```

```
IF Docker is NOT running:
  IF mode == interactive:
    Display:
    "**🐳 Docker requis pour la validation**

    Le daemon Docker ne semble pas être en cours d'exécution.
    Les builds d'images ne peuvent pas être effectués.

    **Action requise :**
    Veuillez lancer Docker Desktop ou le daemon Docker.

    Commandes selon votre système :
    - **Linux:** `sudo systemctl start docker`
    - **macOS/Windows:** Lancez Docker Desktop

    [C] Confirmer que Docker est lancé
    [S] Skip la validation Docker (non recommandé)
    [A] Abandonner"

    Wait for user choice
    IF C: Re-check Docker, loop if still not running
    IF S: Log skip, continue to next step
    IF A: Exit workflow

  IF mode == yolo:
    Log: "DOCKER_NOT_RUNNING - Cannot validate builds"
    Log to issues_log: "Docker validation skipped - daemon not running"
    Update status with docker_available: false
    Continue to next step
```

### 2. Announce Docker Validation

Display:

"**🐳 Validation Docker**

Construction des images :
1. Backend (dev + prod)
2. Frontend (dev + prod)

Cela peut prendre quelques minutes..."

### 3. Execute Docker Builds

Run: `npm run docker:validate`

This command executes:
1. `docker build -t time-manager-backend:test ./backend`
2. `docker build -t time-manager-frontend:test ./frontend`

Capture output and results for each build.

### 4. Parse Results

Extract from output:

```yaml
docker:
  daemon_running: true/false
  backend:
    status: "success" | "failed" | "skipped"
    duration: Xs
    image_size: XMB
    error: null | "error message"
  frontend:
    status: "success" | "failed" | "skipped"
    duration: Xs
    image_size: XMB
    error: null | "error message"
```

### 5. Handle Failures (Mode-Dependent)

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

### 6. Check Image Sizes (Optional)

IF builds succeeded, check image sizes:

```
IF backend_size > 500MB OR frontend_size > 200MB:
  Display warning about large image sizes
  Log to issues_log (informational)
```

### 7. Update Status and Proceed

Update `{statusFile}`:

```yaml
validation_results.docker:
  status: "passed" | "passed_with_warnings" | "failed" | "skipped"
  docker_available: true/false
  attempts: {count}
  backend:
    status: "success" | "failed" | "skipped"
    size: XMB
  frontend:
    status: "success" | "failed" | "skipped"
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

- Docker daemon verified before builds
- Both images built successfully (or skipped with acknowledgment)
- Results captured and tracked
- Failures handled appropriately per mode
- Status file updated

### ❌ SYSTEM FAILURE:

- Attempting builds without Docker daemon check
- Skipping Docker validation entirely without logging
- Not capturing build errors
- Proceeding without user acknowledgment in interactive mode
