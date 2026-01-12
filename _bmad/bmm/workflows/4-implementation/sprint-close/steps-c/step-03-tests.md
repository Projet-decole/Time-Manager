---
name: 'step-03-tests'
description: 'Exécuter la suite complète de tests : unit, integration, E2E'
nextStepFile: './step-04-docker.md'
statusFile: '{implementation_artifacts}/sprint-close-status.yaml'
---

# Step 3: Tests Exhaustifs

## STEP GOAL:

Exécuter la suite complète de tests (unitaires, intégration, E2E) pour valider la non-régression et le bon fonctionnement de l'application.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 📖 CRITICAL: Run ALL test suites, not partial
- 🔄 CRITICAL: Capture and track all failures
- ✅ Communicate in {communication_language}

### Step-Specific Rules:

- 🎯 Execute tests in correct order (unit first, then Docker-dependent)
- 🐳 CRITICAL: Integration and E2E tests REQUIRE Docker running
- 🚫 FORBIDDEN to skip failing tests without acknowledgment
- 💬 In interactive mode: stop and consult on failures
- 🔁 In YOLO mode: loop until all tests pass

## MANDATORY SEQUENCE

### 1. Verify Environment Prerequisites

**1.1 Check npm dependencies:**

```bash
npm install
```

Display: "Vérification des dépendances npm..."

**1.2 Check Docker daemon (REQUIRED for integration & E2E):**

```bash
docker info > /dev/null 2>&1
```

```
IF Docker is NOT running:
  IF mode == interactive:
    Display:
    "**🐳 Docker requis**

    Les tests d'intégration et E2E nécessitent Docker.
    Docker ne semble pas être en cours d'exécution.

    **Action requise :**
    Veuillez lancer Docker Desktop ou le daemon Docker, puis confirmez.

    [C] Confirmer que Docker est lancé
    [S] Skip les tests d'intégration et E2E (non recommandé)
    [A] Abandonner"

    Wait for user choice
    IF C: Re-check Docker, loop if still not running
    IF S: Mark integration/e2e as skipped, continue with unit only
    IF A: Exit workflow

  IF mode == yolo:
    Log: "DOCKER_NOT_RUNNING - Integration and E2E tests will fail"
    Attempt to start Docker (platform-dependent):
      - Linux: `sudo systemctl start docker`
      - macOS/Windows: Cannot auto-start Docker Desktop
    IF still not running after attempt:
      Log to issues_log: "Docker not running, skipping integration/E2E"
      Continue with unit tests only
```

### 2. Announce Test Suite

Display:

"**🧪 Tests Exhaustifs**

Exécution de la suite complète :
1. Tests unitaires (backend + frontend) - Sans Docker
2. Tests d'intégration API - Requiert Docker
3. Tests E2E (Playwright) - Requiert Docker

Cela peut prendre quelques minutes..."

### 3. Execute Tests (Ordered by Dependencies)

**3.1 Unit Tests (No Docker required):**

```bash
npm run test:unit
```

Capture results. These can run regardless of Docker status.

**3.2 Integration Tests (Docker required):**

```bash
npm run test:integration
```

IF Docker not running: Skip and log.

**3.3 E2E Tests (Docker required):**

```bash
npm run test:e2e
```

IF Docker not running: Skip and log.

### 4. Parse Results

Extract from output:

```yaml
tests:
  unit:
    passed: true/false
    total: N
    failed: N
    duration: Xs
  integration:
    passed: true/false/skipped
    total: N
    failed: N
    skipped_reason: null | "Docker not running"
  e2e:
    passed: true/false/skipped
    total: N
    failed: N
    skipped_reason: null | "Docker not running"
  coverage:
    backend: X%
    frontend: X%
```

### 5. Handle Failures (Mode-Dependent)

**IF any tests failed:**

```
IF mode == interactive:
  Display:
  "**❌ Échecs de tests détectés**

  **Unitaires:** {unit_failed} échecs
  **Intégration:** {integration_failed} échecs {or 'skipped'}
  **E2E:** {e2e_failed} échecs {or 'skipped'}

  Détails :
  {list failed test names}

  Options:
  [F] Fixer et relancer les tests
  [D] Voir les détails des erreurs
  [S] Skip et continuer (non recommandé)
  [A] Abandonner"

  Wait for user choice
  Handle accordingly

IF mode == yolo:
  Log failures to issues_log
  Increment attempt counter
  IF attempts < 5:
    Display: "Tentative {attempt}/5 - Relance des tests..."
    Re-run tests
  ELSE:
    Log: "TESTS_FAILED_AFTER_5_ATTEMPTS"
    Continue with warning
```

### 6. Check Coverage

IF coverage enabled:

```
backend_target: 80%
frontend_target: 60%

IF backend_coverage < 80% OR frontend_coverage < 60%:
  Display warning (but don't block)
  Log to issues_log
```

### 7. Update Status and Proceed

Update `{statusFile}`:

```yaml
validation_results.tests:
  status: "passed" | "passed_with_warnings" | "failed" | "partial_skipped"
  attempts: {count}
  docker_available: true/false
  unit_passed: true/false
  integration_passed: true/false/skipped
  e2e_passed: true/false/skipped
  coverage:
    backend: X%
    frontend: X%

stepsCompleted: [..., "step-03-tests"]
current_step: "step-04-docker"
```

Display:

"**✅ Tests terminés**

| Suite | Résultat |
|-------|----------|
| Unitaires | {status} |
| Intégration | {status} |
| E2E | {status} |
| Couverture Backend | {X}% |
| Couverture Frontend | {X}% |

**Prochaine étape :** Validation Docker"

→ Load and execute `{nextStepFile}`

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- All test suites executed (or skipped with acknowledgment)
- Docker availability checked before dependent tests
- Results captured and tracked
- Failures handled appropriately per mode
- Status file updated

### ❌ SYSTEM FAILURE:

- Running integration/E2E tests without Docker check
- Skipping test suites without logging
- Not capturing failures
- Proceeding without user acknowledgment in interactive mode
