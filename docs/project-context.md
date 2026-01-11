# Project Context - Time Manager

Ce document contient les regles critiques que les agents AI DOIVENT suivre lors de l'implementation.

---

## Strategie de tests (IMPORTANT)

### Niveaux de tests

| Niveau | Quand | Commande | Contenu |
|--------|-------|----------|---------|
| **Story** | Pendant dev | `npm run test:unit` | Tests unitaires cibles |
| **Epic** | Avant push | `npm run test:epic` | Unit + Integration + E2E + Docker |
| **CI** | Apres push | Automatique | Validation formelle |

### Regles pour les agents AI

1. **Pendant le dev d'une story** : Ecrire uniquement des tests unitaires pour les nouvelles fonctionnalites
2. **Ne PAS bloquer** sur la couverture de code pendant une story
3. **Tests d'integration** : Uniquement pour les endpoints API critiques
4. **Tests E2E** : Geres par le workflow sprint-close, pas par les stories individuelles

### Commandes disponibles

```bash
npm run test:unit        # Tests unitaires rapides
npm run test:integration # Tests API
npm run test:e2e         # Tests Playwright
npm run test:epic        # Suite complete (fin d'epic)
```

---

## Regles critiques de test Frontend (Vitest + React Testing Library)

### INTERDIT - Patterns qui causent des crashs systeme

#### 1. Promesses infinies
```javascript
// INTERDIT - Cause un blocage du processus
mockService.getAll.mockImplementation(() => new Promise(() => {}));

// CORRECT - Promesse controlee avec cleanup
let resolve;
const promise = new Promise((r) => { resolve = r; });
mockService.getAll.mockReturnValue(promise);
// ... assertions ...
resolve({ success: true, data: [] }); // Toujours resoudre apres le test
```

#### 2. Fake timers avec shouldAdvanceTime
```javascript
// INTERDIT - Cascade infinie de timers avec setTimeout des composants
vi.useFakeTimers({ shouldAdvanceTime: true });

// CORRECT - Utiliser les vrais timers ou fake timers simples
vi.useFakeTimers(); // Sans shouldAdvanceTime
// OU
// Ne pas utiliser de fake timers du tout pour les tests de composants React
```

#### 3. Fake timers + userEvent sans configuration
```javascript
// INTERDIT - userEvent bloque avec fake timers
vi.useFakeTimers();
const user = userEvent.setup(); // Bloque indefiniment

// CORRECT Option 1 - Configurer advanceTimers
vi.useFakeTimers();
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

// CORRECT Option 2 - Ne pas utiliser fake timers (recommande)
const user = userEvent.setup();
```

### OBLIGATOIRE - Timeouts globaux

Le fichier `vite.config.js` DOIT contenir:
```javascript
test: {
  testTimeout: 10000,    // 10s max par test
  hookTimeout: 10000,    // 10s max pour beforeEach/afterEach
  teardownTimeout: 5000, // 5s pour le cleanup
}
```

### RECOMMANDE - Structure des tests

```javascript
describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // NE PAS utiliser vi.useFakeTimers() sauf si absolument necessaire
  });

  afterEach(() => {
    // Si fake timers utilises, TOUJOURS nettoyer
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should do something', async () => {
    const user = userEvent.setup();
    render(<Component />);

    await waitFor(() => {
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });
});
```

---

## Regles generales

### Conventions de code
- **Langue du code:** Anglais
- **Langue des commentaires:** Francais ou Anglais
- **Langue de l'UI:** Francais

### Structure des fichiers
- Tests: `src/__tests__/` miroir de la structure `src/`
- Services: `src/services/`
- Hooks: `src/hooks/`
- Composants: `src/components/`

---

## Historique des incidents critiques

| Date | Incident | Cause | Resolution |
|------|----------|-------|------------|
| 2026-01-11 | Crashs systeme lors des tests | Promesses infinies + shouldAdvanceTime | Retrait fake timers, cleanup promesses |

---

**Derniere mise a jour:** 2026-01-11
