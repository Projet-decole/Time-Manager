# Tests - Time Manager

Documentation du framework de tests et bonnes pratiques.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Frontend : Vitest + Testing Library](#frontend--vitest--testing-library)
- [Backend : Jest + Supertest](#backend--jest--supertest)
- [Exécution des tests](#exécution-des-tests)
- [Écrire des tests](#écrire-des-tests)
- [Bonnes pratiques](#bonnes-pratiques)
- [Troubleshooting](#troubleshooting)

## Vue d'ensemble

### Stack de tests

| Workspace | Framework | Librairies | Coverage | Environnement |
|-----------|-----------|------------|----------|---------------|
| **Frontend** | Vitest | React Testing Library, jsdom, @testing-library/jest-dom | Intégré | jsdom (DOM simulé) |
| **Backend** | Jest | Supertest | Intégré | Node.js |

### Objectifs

- **Qualité** : Détecter les régressions avant production
- **Confiance** : Refactoring sans peur de casser le code
- **Documentation** : Les tests documentent le comportement attendu
- **CI/CD** : Validation automatique à chaque commit/push

### Intégration CI/CD

```
Pre-commit (local)     → Tests sur fichiers modifiés (rapide)
Pre-push (local)       → Tests complets (exhaustif)
GitHub Actions (CI)    → Tests + lint + build (validation finale)
```

## Frontend : Vitest + Testing Library

### Configuration

**vite.config.js** :
```javascript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,              // API globale (describe, test, expect)
    environment: "jsdom",        // Simulation du DOM navigateur
    setupFiles: "./src/setupTests.js"
  }
});
```

**src/setupTests.js** :
```javascript
import "@testing-library/jest-dom";  // Matchers supplémentaires (toBeInTheDocument, etc.)
```

### Structure

```
frontend/src/
├── __tests__/          # Tests de composants
│   └── App.test.jsx
├── setupTests.js       # Configuration globale
└── ...
```

### Exemple de test

**src/__tests__/App.test.jsx** :
```javascript
import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import App from "../App";

describe("App Component", () => {
  test("renders without crashing", () => {
    render(<App />);
    // Composant s'affiche sans erreur
  });

  test("displays Vite + React logos", () => {
    render(<App />);
    const logos = screen.getAllByRole("img");
    expect(logos.length).toBeGreaterThan(0);
  });
});
```

### Matchers courants

```javascript
// Présence dans le DOM
expect(element).toBeInTheDocument();
expect(element).not.toBeInTheDocument();

// Visibilité
expect(element).toBeVisible();
expect(element).not.toBeVisible();

// Contenu texte
expect(element).toHaveTextContent("Hello");
expect(element).toContainHTML("<span>Hello</span>");

// Attributs
expect(element).toHaveAttribute("href", "/about");
expect(element).toHaveClass("active");

// Formulaires
expect(input).toHaveValue("test");
expect(checkbox).toBeChecked();
expect(button).toBeDisabled();
```

### Tester les interactions

```javascript
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("button click updates counter", async () => {
  render(<Counter />);
  const button = screen.getByRole("button", { name: /increment/i });
  const counter = screen.getByText(/count: 0/i);

  // Option 1 : fireEvent (synchrone, simulation basique)
  fireEvent.click(button);
  expect(counter).toHaveTextContent("count: 1");

  // Option 2 : userEvent (asynchrone, simulation réaliste)
  const user = userEvent.setup();
  await user.click(button);
  expect(counter).toHaveTextContent("count: 2");
});
```

### Tester les hooks

```javascript
import { renderHook, waitFor } from "@testing-library/react";

test("useCounter hook increments", () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Mocking

```javascript
import { vi } from "vitest";

// Mock d'une fonction
test("calls onSubmit when form submitted", () => {
  const handleSubmit = vi.fn();
  render(<Form onSubmit={handleSubmit} />);

  fireEvent.submit(screen.getByRole("form"));

  expect(handleSubmit).toHaveBeenCalledTimes(1);
  expect(handleSubmit).toHaveBeenCalledWith({ name: "test" });
});

// Mock d'un module
vi.mock("./api", () => ({
  fetchUsers: vi.fn(() => Promise.resolve([{ id: 1, name: "John" }]))
}));

test("displays users from API", async () => {
  render(<UserList />);

  await waitFor(() => {
    expect(screen.getByText("John")).toBeInTheDocument();
  });
});
```

## Backend : Jest + Supertest

### Configuration

**package.json** :
```json
{
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": [
      "/node_modules/",
      "/server.js"
    ]
  }
}
```

- `testEnvironment: "node"` : Tests s'exécutent dans Node.js (pas de DOM)
- `coveragePathIgnorePatterns` : Exclut de la couverture les fichiers non testables

### Structure

```
backend/
├── tests/
│   └── app.test.js     # Tests d'intégration API
├── app.js              # Configuration Express (exporté pour tests)
└── server.js           # Point d'entrée (non testé directement)
```

### Exemple de test

**tests/app.test.js** :
```javascript
const request = require("supertest");
const app = require("../app");

describe("API Health Checks", () => {
  test("GET / should return welcome message", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Time Manager API is running!");
  });

  test("GET /health should return OK status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
    expect(response.body).toHaveProperty("timestamp");
  });
});
```

### Tester des routes CRUD

```javascript
describe("User API", () => {
  test("POST /api/users creates a user", async () => {
    const newUser = { name: "John", email: "john@example.com" };

    const response = await request(app)
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject(newUser);
    expect(response.body).toHaveProperty("id");
  });

  test("GET /api/users/:id returns a user", async () => {
    const response = await request(app)
      .get("/api/users/1")
      .expect(200);

    expect(response.body).toHaveProperty("name");
    expect(response.body).toHaveProperty("email");
  });

  test("PUT /api/users/:id updates a user", async () => {
    const updates = { name: "Jane" };

    const response = await request(app)
      .put("/api/users/1")
      .send(updates)
      .expect(200);

    expect(response.body.name).toBe("Jane");
  });

  test("DELETE /api/users/:id deletes a user", async () => {
    await request(app)
      .delete("/api/users/1")
      .expect(204);
  });
});
```

### Tester l'authentification

```javascript
describe("Protected Routes", () => {
  let token;

  beforeAll(async () => {
    // Créer un utilisateur et obtenir un token
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password" });

    token = response.body.token;
  });

  test("GET /api/profile requires authentication", async () => {
    await request(app)
      .get("/api/profile")
      .expect(401);  // Sans token
  });

  test("GET /api/profile returns user data with valid token", async () => {
    const response = await request(app)
      .get("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty("email");
  });
});
```

### Mocking

```javascript
const supabase = require("../services/supabase");

// Mock de Supabase
jest.mock("../services/supabase", () => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      data: [{ id: 1, name: "John" }],
      error: null
    }))
  }))
}));

test("GET /api/users returns users from database", async () => {
  const response = await request(app).get("/api/users");

  expect(response.status).toBe(200);
  expect(response.body).toHaveLength(1);
  expect(supabase.from).toHaveBeenCalledWith("users");
});
```

### Setup et Teardown

```javascript
describe("Database Tests", () => {
  beforeAll(async () => {
    // Setup : Connexion DB, migrations, etc.
    await connectDatabase();
  });

  afterAll(async () => {
    // Teardown : Fermeture connexion
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Avant chaque test : Seed données
    await seedDatabase();
  });

  afterEach(async () => {
    // Après chaque test : Nettoyage
    await cleanDatabase();
  });

  test("creates a user", async () => {
    // Test isolé avec données fraîches
  });
});
```

## Exécution des tests

### Commandes principales

```bash
# Tous les workspaces
npm test

# Workspace spécifique
npm test --workspace=frontend
npm test --workspace=backend

# Mode watch (re-run automatique)
npm run test:watch --workspace=frontend

# Coverage (backend uniquement configuré)
npm test --workspace=backend
# Génère backend/coverage/
```

### Options Jest/Vitest

```bash
# Run un seul fichier
npm test --workspace=backend -- tests/app.test.js

# Run tests matching un pattern
npm test --workspace=frontend -- App

# Mode verbose (plus de détails)
npm test --workspace=backend -- --verbose

# Update snapshots
npm test --workspace=frontend -- -u
```

### Lecture du coverage

Après `npm test --workspace=backend`, ouvrir `backend/coverage/lcov-report/index.html` :

```
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
All files           |   85.5  |   78.2   |   90.0  |   85.5
 app.js             |   95.0  |   85.0   |  100.0  |   95.0
 controllers/       |   80.0  |   70.0   |   85.0  |   80.0
  userController.js |   80.0  |   70.0   |   85.0  |   80.0
```

**Objectifs** :
- Statements : >80%
- Branches : >70%
- Functions : >80%
- Lines : >80%

## Écrire des tests

### Anatomie d'un bon test

```javascript
test("descriptif clair de ce qui est testé", () => {
  // 1. ARRANGE : Préparation
  const user = { name: "John", age: 30 };

  // 2. ACT : Action
  const result = validateUser(user);

  // 3. ASSERT : Vérification
  expect(result).toBe(true);
});
```

### Nommage des tests

```javascript
// Mauvais : Vague
test("user test", () => { ... });

// Bon : Descriptif
test("validateUser returns true for valid user", () => { ... });

// Très bon : Comportement attendu
test("validateUser returns false when age is negative", () => { ... });
```

### Organisation avec describe

```javascript
describe("UserController", () => {
  describe("createUser", () => {
    test("creates user with valid data", () => { ... });
    test("returns 400 when email is missing", () => { ... });
    test("returns 409 when email already exists", () => { ... });
  });

  describe("getUser", () => {
    test("returns user when ID exists", () => { ... });
    test("returns 404 when ID does not exist", () => { ... });
  });
});
```

### Test des cas d'erreur

```javascript
describe("Error Handling", () => {
  test("returns 400 when request body is invalid", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ invalid: "data" });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  test("returns 500 when database fails", async () => {
    // Mock échec database
    supabase.from.mockImplementationOnce(() => {
      throw new Error("Database connection failed");
    });

    const response = await request(app).get("/api/users");

    expect(response.status).toBe(500);
  });
});
```

### Tester du code asynchrone

```javascript
// Async/await (recommandé)
test("fetches users from API", async () => {
  const users = await fetchUsers();
  expect(users).toHaveLength(5);
});

// Promises (alternative)
test("fetches users from API", () => {
  return fetchUsers().then(users => {
    expect(users).toHaveLength(5);
  });
});

// Callbacks (éviter si possible)
test("fetches users from API", (done) => {
  fetchUsers((users) => {
    expect(users).toHaveLength(5);
    done();
  });
});
```

## Bonnes pratiques

### Principes généraux

**Tests isolés** : Chaque test doit pouvoir s'exécuter indépendamment.

```javascript
// Mauvais : Tests dépendants
let user;
test("creates user", () => { user = createUser(); });
test("gets user", () => { expect(getUser(user.id)).toBeDefined(); });

// Bon : Tests isolés
test("creates user", () => {
  const user = createUser();
  expect(user).toBeDefined();
});

test("gets user", () => {
  const user = createUser();  // Recrée l'utilisateur
  expect(getUser(user.id)).toBeDefined();
});
```

**Tests déterministes** : Résultat toujours identique.

```javascript
// Mauvais : Non déterministe
test("creates user with current date", () => {
  const user = createUser();
  expect(user.createdAt).toBe(new Date());  // Peut échouer aléatoirement
});

// Bon : Déterministe
test("creates user with current date", () => {
  const now = new Date("2024-01-01");
  jest.spyOn(global, "Date").mockImplementation(() => now);

  const user = createUser();
  expect(user.createdAt).toBe(now);
});
```

**Tests rapides** : Éviter les timeouts inutiles.

```javascript
// Mauvais : Lent
test("waits for async operation", async () => {
  await sleep(5000);  // 5 secondes d'attente
  expect(true).toBe(true);
});

// Bon : Rapide
test("waits for async operation", async () => {
  await waitFor(() => expect(element).toBeInTheDocument(), {
    timeout: 1000  // 1 seconde max
  });
});
```

### Quoi tester ?

**Tester** :
- Logique métier (calculs, validations, transformations)
- Intégration API (routes, status codes, réponses)
- Comportement utilisateur (clicks, saisie, navigation)
- Cas d'erreur (données invalides, échecs réseau)

**Ne pas tester** :
- Implémentation interne (détails de code)
- Librairies tierces (React, Express, etc.)
- Getters/setters triviaux
- Configuration (sauf si logique complexe)

### Coverage vs Qualité

**Coverage élevé ≠ Bons tests**

```javascript
// 100% coverage mais test inutile
test("function exists", () => {
  expect(myFunction).toBeDefined();
});

// Coverage partiel mais test utile
test("validates email correctly", () => {
  expect(validateEmail("test@example.com")).toBe(true);
  expect(validateEmail("invalid")).toBe(false);
});
```

Viser la qualité avant la quantité.

### Snapshots (avec précaution)

```javascript
import { render } from "@testing-library/react";

test("matches snapshot", () => {
  const { container } = render(<MyComponent />);
  expect(container).toMatchSnapshot();
});
```

**Avantages** : Détecte les changements involontaires d'UI.

**Inconvénients** :
- Fragiles (changent souvent)
- Peu lisibles (gros fichiers JSON)
- Acceptés aveuglément (`-u`)

**Recommandation** : Utiliser avec parcimonie, privilégier les assertions explicites.

## Troubleshooting

### Tests passent localement mais échouent en CI

**Causes courantes** :
- Variables d'environnement manquantes
- Différence de timezone (`Date`, `Intl`)
- Timeouts trop courts (CI plus lent)
- Tests non isolés (ordre d'exécution différent)

**Solution** :
```javascript
// Fixer la timezone
process.env.TZ = "UTC";

// Augmenter les timeouts en CI
const timeout = process.env.CI ? 10000 : 5000;
jest.setTimeout(timeout);
```

### `ReferenceError: describe is not defined`

**Cause** : Configuration Vitest manquante.

**Solution** :
```javascript
// vite.config.js
export default defineConfig({
  test: {
    globals: true  // Ajouter cette ligne
  }
});
```

### `TypeError: Cannot read property 'toBeInTheDocument'`

**Cause** : `@testing-library/jest-dom` non importé.

**Solution** :
```javascript
// src/setupTests.js
import "@testing-library/jest-dom";
```

### Tests Vitest très lents

**Causes** :
- Re-render inutiles
- Trop de tests dans un fichier
- Timeouts longs

**Solutions** :
```javascript
// Isoler les tests lents
test.concurrent("slow test 1", async () => { ... });
test.concurrent("slow test 2", async () => { ... });

// Diviser en plusieurs fichiers
// App.test.jsx → App.rendering.test.jsx, App.interactions.test.jsx
```

### Mock ne fonctionne pas (Jest)

**Problème** :
```javascript
jest.mock("./module");  // N'est pas appliqué
```

**Solution** : Le mock doit être au top-level (hors des tests).

```javascript
// Correct
jest.mock("./module");

describe("Tests", () => {
  test("uses mock", () => { ... });
});
```

### Warning: `act(...)` wrapper

**Cause** : Mise à jour de state React non wrappée.

```javascript
// Problème
fireEvent.click(button);
expect(counter).toHaveTextContent("1");  // Warning

// Solution
await act(async () => {
  fireEvent.click(button);
});
expect(counter).toHaveTextContent("1");

// Ou utiliser userEvent (déjà wrappé)
await userEvent.click(button);
expect(counter).toHaveTextContent("1");
```

---

## Commandes de référence rapide

```bash
# Tests locaux
npm test                                      # Tous les workspaces
npm test --workspace=frontend                 # Frontend uniquement
npm test --workspace=backend                  # Backend uniquement
npm run test:watch --workspace=frontend       # Mode watch

# Tests spécifiques
npm test --workspace=backend -- app.test.js   # Un fichier
npm test --workspace=frontend -- App          # Pattern

# Coverage
npm test --workspace=backend                  # Génère coverage/
open backend/coverage/lcov-report/index.html  # Voir le rapport

# CI (automatique)
git commit  # Pre-commit : tests sur fichiers modifiés
git push    # Pre-push : tests complets
```

**Tests robustes, code fiable.**
