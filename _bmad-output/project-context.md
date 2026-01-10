---
project_name: 'Time Manager'
user_name: 'Lunos'
date: '2026-01-10'
sections_completed: ['technology_stack', 'critical_rules', 'patterns', 'testing', 'anti_patterns']
status: complete
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents MUST follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Backend (CommonJS)

```
Node.js         20.x (Alpine)
Express         5.1.0
Supabase SDK    2.58.0
Jest            30.2.0
Supertest       7.1.4
```

**CRITICAL:** Backend uses CommonJS (`require`/`module.exports`), NOT ESM.

### Frontend (ESM)

```
React           19.1.1
Vite            7.1.7
Vitest          3.2.4
Testing Library 16.3.0
ESLint          9.36.0
```

**CRITICAL:** Frontend uses ESM (`import`/`export`).

### Database

```
Supabase (PostgreSQL)
Authentication: Supabase Auth (NOT custom JWT)
```

---

## Critical Implementation Rules

### 1. Module Systems - DO NOT MIX

```javascript
// BACKEND (CommonJS) - CORRECT
const express = require('express');
module.exports = { myFunction };

// BACKEND - WRONG
import express from 'express'; // NO ESM in backend!

// FRONTEND (ESM) - CORRECT
import React from 'react';
export const MyComponent = () => {};
```

### 2. Authentication - Use Supabase Auth ONLY

```javascript
// CORRECT - Use Supabase Auth
const { data: { user } } = await supabase.auth.getUser();

// WRONG - Do NOT implement custom JWT
const token = jwt.sign(payload, secret); // NO!
```

### 3. API Response Format - ALWAYS Use Standard Wrapper

```javascript
// CORRECT - Standard response format
res.json({
  success: true,
  data: result,
  meta: { pagination: { page, limit, total } }
});

res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Human readable message',
    details: [{ field: 'email', message: 'Invalid' }]
  }
});

// WRONG - Raw response
res.json(result); // NO! Missing wrapper
res.json({ error: 'Something wrong' }); // NO! Wrong format
```

### 4. Database Naming vs API Naming

```javascript
// Database columns: snake_case
// user_id, created_at, week_start

// API/JavaScript: camelCase
// userId, createdAt, weekStart

// Transform in controllers:
const transformToApi = (dbRow) => ({
  userId: dbRow.user_id,
  createdAt: dbRow.created_at,
  weekStart: dbRow.week_start
});
```

### 5. Error Handling - Use AppError Class

```javascript
// CORRECT - Use AppError
const AppError = require('../utils/AppError');
throw new AppError('Resource not found', 404, 'NOT_FOUND');

// WRONG - Generic errors
throw new Error('Not found'); // NO! Missing status code
res.status(404).json({ message: 'Not found' }); // NO! Use middleware
```

### 6. File Naming Conventions

```
Backend:
  routes/time-entries.routes.js     (kebab-case.routes.js)
  controllers/time-entries.controller.js
  services/time-entries.service.js
  validators/time-entries.validator.js

Frontend:
  components/TimeEntryCard.jsx      (PascalCase.jsx)
  hooks/useTimeEntries.js           (useCamelCase.js)
  services/timeEntries.service.js   (camelCase.service.js)
  pages/TimeTrackingPage.jsx        (PascalCase.jsx)
```

### 7. API Endpoints - Plural, kebab-case

```javascript
// CORRECT
GET    /api/v1/time-entries
POST   /api/v1/time-entries
GET    /api/v1/time-entries/:id
POST   /api/v1/time-entries/start
POST   /api/v1/time-entries/stop

// WRONG
GET    /api/v1/timeEntry      // NO! Use plural, kebab-case
GET    /api/v1/time_entries   // NO! Use kebab-case
```

---

## Code Patterns

### Backend Controller Pattern

```javascript
// controllers/time-entries.controller.js
const timeEntriesService = require('../services/time-entries.service');
const AppError = require('../utils/AppError');

const getAll = async (req, res, next) => {
  try {
    const { data, pagination } = await timeEntriesService.getAll(req.query);
    res.json({
      success: true,
      data,
      meta: { pagination }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll };
```

### Backend Service Pattern

```javascript
// services/time-entries.service.js
const supabase = require('../utils/supabase');
const AppError = require('../utils/AppError');

const getAll = async (filters) => {
  const { data, error, count } = await supabase
    .from('time_entries')
    .select('*', { count: 'exact' })
    .eq('user_id', filters.userId);

  if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');

  return {
    data: data.map(transformToApi),
    pagination: { total: count }
  };
};

module.exports = { getAll };
```

### Frontend Component Pattern

```jsx
// components/features/time-tracking/TimeEntryCard.jsx
import { useState } from 'react';
import { Card } from '@/components/ui/Card';

export const TimeEntryCard = ({ entry, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await onDelete(entry.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      {/* Component content */}
    </Card>
  );
};
```

### Frontend Hook Pattern

```javascript
// hooks/useTimeEntries.js
import { useState, useEffect } from 'react';
import { timeEntriesService } from '@/services/timeEntries.service';

export const useTimeEntries = (filters) => {
  const [state, setState] = useState({
    data: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(s => ({ ...s, loading: true, error: null }));
        const response = await timeEntriesService.getAll(filters);
        setState({ data: response.data, loading: false, error: null });
      } catch (err) {
        setState(s => ({ ...s, loading: false, error: err.message }));
      }
    };
    fetchData();
  }, [filters]);

  return state;
};
```

---

## Testing Rules

### Backend Tests (Jest)

```javascript
// tests/routes/time-entries.routes.test.js
const request = require('supertest');
const app = require('../../app');

describe('GET /api/v1/time-entries', () => {
  it('should return 401 without auth', async () => {
    const res = await request(app).get('/api/v1/time-entries');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return entries with valid auth', async () => {
    const res = await request(app)
      .get('/api/v1/time-entries')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
```

### Frontend Tests (Vitest)

```javascript
// __tests__/components/TimeEntryCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TimeEntryCard } from '@/components/features/time-tracking/TimeEntryCard';

describe('TimeEntryCard', () => {
  it('renders entry data', () => {
    const entry = { id: '1', description: 'Test entry' };
    render(<TimeEntryCard entry={entry} onDelete={vi.fn()} />);
    expect(screen.getByText('Test entry')).toBeInTheDocument();
  });
});
```

### Coverage Requirements

- Backend: >80% coverage required
- Frontend: >60% coverage required
- Run `npm test` before committing

---

## Anti-Patterns - DO NOT DO

### 1. Direct Database Access in Controllers

```javascript
// WRONG - DB in controller
const getAll = async (req, res) => {
  const { data } = await supabase.from('users').select('*');
  res.json(data);
};

// CORRECT - Use service layer
const getAll = async (req, res, next) => {
  try {
    const result = await usersService.getAll();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
```

### 2. Inline Error Responses

```javascript
// WRONG - Inline error handling
if (!user) {
  return res.status(404).json({ message: 'User not found' });
}

// CORRECT - Throw AppError, let middleware handle
if (!user) {
  throw new AppError('User not found', 404, 'NOT_FOUND');
}
```

### 3. Frontend Security Checks Only

```javascript
// WRONG - Security in frontend only
{user.role === 'manager' && <AdminPanel />}

// CORRECT - Backend MUST verify, frontend is just UX
// Backend: rbac.middleware.js checks role
// Frontend: conditional render is just for UX
```

### 4. Hardcoded Supabase Credentials

```javascript
// WRONG
const supabase = createClient('https://xxx.supabase.co', 'public-key');

// CORRECT - Use environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

### 5. Mixing snake_case and camelCase

```javascript
// WRONG - Inconsistent
const user_data = await getUser(); // snake in JS
res.json({ user_id: user.id }); // snake in API

// CORRECT - Transform at boundaries
const userData = await getUser(); // camelCase in JS
res.json({ userId: user.id }); // camelCase in API
```

---

## Quick Reference

| Aspect | Rule |
|--------|------|
| Backend modules | CommonJS (`require`) |
| Frontend modules | ESM (`import`) |
| DB columns | snake_case |
| API fields | camelCase |
| API endpoints | /kebab-case/plural |
| Component files | PascalCase.jsx |
| Route files | kebab-case.routes.js |
| Auth | Supabase Auth ONLY |
| Response format | `{ success, data, error }` |
| Errors | AppError class |
| Tests backend | Jest + Supertest |
| Tests frontend | Vitest + Testing Library |

---

**Document Status:** COMPLETE
**Last Updated:** 2026-01-10
**Reference:** See `_bmad-output/planning-artifacts/architecture.md` for full architectural decisions.
