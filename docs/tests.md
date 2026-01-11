# Tests - Time Manager

> **Frontend** : Vitest + React Testing Library | **Backend** : Jest + Supertest

## Stack

| Workspace | Framework | Environnement | Coverage |
|-----------|-----------|---------------|----------|
| Frontend | Vitest 3 | jsdom | Integre |
| Backend | Jest 30 | Node.js | Integre |

## Commandes

```bash
# Tous les workspaces
npm test

# Workspace specifique
npm test --workspace=frontend
npm test --workspace=backend

# Mode watch
npm run test:watch --workspace=frontend

# Un fichier specifique
npm test --workspace=backend -- tests/app.test.js

# Verbose
npm test --workspace=backend -- --verbose
```

## Frontend - Vitest

### Configuration (`vite.config.js`)

```javascript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js"
  }
});
```

### Setup (`src/setupTests.js`)

```javascript
import "@testing-library/jest-dom";
```

### Exemple de test

```javascript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect } from "vitest";

describe("MyComponent", () => {
  test("renders and responds to click", async () => {
    render(<MyComponent />);

    expect(screen.getByText("Hello")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("Clicked")).toBeInTheDocument();
  });
});
```

### Matchers courants

```javascript
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toHaveTextContent("Hello");
expect(element).toHaveAttribute("href", "/about");
expect(input).toHaveValue("test");
expect(button).toBeDisabled();
```

### Mocking (Vitest)

```javascript
import { vi } from "vitest";

const handleSubmit = vi.fn();
render(<Form onSubmit={handleSubmit} />);
fireEvent.submit(screen.getByRole("form"));
expect(handleSubmit).toHaveBeenCalledTimes(1);

// Mock module
vi.mock("./api", () => ({
  fetchUsers: vi.fn(() => Promise.resolve([{ id: 1, name: "John" }]))
}));
```

## Backend - Jest

### Configuration (`package.json`)

```json
{
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": ["/node_modules/", "/server.js"]
  }
}
```

### Exemple de test API

```javascript
const request = require("supertest");
const app = require("../app");

describe("API Endpoints", () => {
  test("GET /health returns OK", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("healthy");
  });

  test("POST /api/v1/auth/login with valid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data.session");
  });

  test("GET /api/v1/users requires auth", async () => {
    const response = await request(app).get("/api/v1/users");
    expect(response.status).toBe(401);
  });
});
```

### Test avec authentification

```javascript
describe("Protected Routes", () => {
  let token;

  beforeAll(async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "password" });
    token = response.body.data.session.access_token;
  });

  test("GET /api/v1/users/me with token", async () => {
    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
```

### Mocking (Jest)

```javascript
jest.mock("../utils/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null })
    }))
  }
}));
```

## Structure des tests

```
frontend/src/
├── __tests__/
│   └── App.test.jsx

backend/tests/
├── setup.js
├── app.test.js
├── routes/
│   ├── auth.routes.test.js
│   └── users.routes.test.js
├── middleware/
│   ├── auth.middleware.test.js
│   └── rbac.middleware.test.js
└── services/
```

## Bonnes pratiques

**Pattern AAA** :
```javascript
test("description", () => {
  // Arrange
  const user = { name: "John" };

  // Act
  const result = validateUser(user);

  // Assert
  expect(result).toBe(true);
});
```

**Tests isoles** : Chaque test doit pouvoir s'executer independamment.

**Tests deterministes** : Mocker les dates, random, etc.

**Quoi tester** :
- Logique metier
- Integration API
- Cas d'erreur

**Ne pas tester** :
- Implementation interne
- Librairies tierces

## Troubleshooting

| Probleme | Solution |
|----------|----------|
| `describe is not defined` | Ajouter `globals: true` dans vite.config.js |
| `toBeInTheDocument` undefined | Import `@testing-library/jest-dom` dans setupTests |
| Tests OK local, KO en CI | Verifier NODE_ENV, timezone, tests isoles |
| Warning `act(...)` | Utiliser `await` avec userEvent ou wrapper avec `act()` |
