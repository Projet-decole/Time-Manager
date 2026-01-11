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

- 🎯 Execute tests via npm run test:epic
- 🚫 FORBIDDEN to skip failing tests without acknowledgment
- 💬 In interactive mode: stop and consult on failures
- 🔁 In YOLO mode: loop until all tests pass

## MANDATORY SEQUENCE

### 1. Announce Test Suite

Display:

"**🧪 Tests Exhaustifs**

Exécution de la suite complète :
1. Tests unitaires (backend + frontend)
2. Tests d'intégration API
3. Tests E2E (Playwright)

Cela peut prendre quelques minutes..."

### 2. Execute Tests

Run: `npm run test:epic`

This command executes sequentially:
1. `npm run test:unit`
2. `npm run test:integration`
3. `npm run test:e2e`

Capture output and results for each phase.

### 3. Parse Results

Extract from output:

```yaml
tests:
  unit:
    passed: true/false
    total: N
    failed: N
    duration: Xs
  integration:
    passed: true/false
    total: N
    failed: N
  e2e:
    passed: true/false
    total: N
    failed: N
  coverage:
    backend: X%
    frontend: X%
```

### 4. Handle Failures (Mode-Dependent)

**IF any tests failed:**

```
IF mode == interactive:
  Display:
  "**❌ Échecs de tests détectés**

  **Unitaires:** {unit_failed} échecs
  **Intégration:** {integration_failed} échecs
  **E2E:** {e2e_failed} échecs

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

### 5. Check Coverage

IF coverage enabled:

```
backend_target: 80%
frontend_target: 60%

IF backend_coverage < 80% OR frontend_coverage < 60%:
  Display warning (but don't block)
  Log to issues_log
```

### 6. Update Status and Proceed

Update `{statusFile}`:

```yaml
validation_results.tests:
  status: "passed" | "passed_with_warnings" | "failed"
  attempts: {count}
  unit_passed: true/false
  integration_passed: true/false
  e2e_passed: true/false
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

- All test suites executed
- Results captured and tracked
- Failures handled appropriately per mode
- Status file updated

### ❌ SYSTEM FAILURE:

- Skipping test suites
- Not capturing failures
- Proceeding without user acknowledgment in interactive mode
