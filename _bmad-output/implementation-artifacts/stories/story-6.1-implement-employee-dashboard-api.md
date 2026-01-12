# Story 6.1: Implement Employee Dashboard API

## Story Info
- **Epic:** Epic 6 - Employee Dashboard
- **Story ID:** 6.1
- **Status:** ready-for-dev
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR53, FR54, FR55, FR56, FR57

## User Story

**As an** employee,
**I want** API endpoints for my dashboard data,
**So that** the UI can display my KPIs and statistics.

## Acceptance Criteria

### AC1: Main Dashboard Endpoint
**Given** an authenticated employee
**When** GET `/api/v1/dashboard/me` is called
**Then** response includes:
```json
{
  "success": true,
  "data": {
    "summary": {
      "hoursThisWeek": 32.5,
      "hoursThisMonth": 140,
      "weeklyTarget": 35,
      "monthlyTarget": 140,
      "weeklyProgress": 92.8,
      "monthlyProgress": 100
    },
    "comparison": {
      "weekOverWeek": 12.5,
      "monthOverMonth": -5.2
    },
    "timesheetStatus": {
      "current": "draft",
      "currentWeekStart": "2026-01-06",
      "pending": 0,
      "validated": 4,
      "rejected": 0
    }
  }
}
```

### AC2: Hours By Project Endpoint (FR55)
**Given** an authenticated employee
**When** GET `/api/v1/dashboard/me/by-project` is called with `?period=week`
**Then** response includes hours breakdown by project:
```json
{
  "success": true,
  "data": {
    "period": "week",
    "periodStart": "2026-01-06",
    "periodEnd": "2026-01-12",
    "breakdown": [
      { "projectId": "uuid-1", "projectName": "Time Manager", "projectCode": "TM-001", "hours": 20.5, "percentage": 63.1 },
      { "projectId": "uuid-2", "projectName": "Client Portal", "projectCode": "CP-002", "hours": 12.0, "percentage": 36.9 }
    ],
    "totalHours": 32.5
  }
}
```
**And** supports `?period=month` for monthly breakdown

### AC3: Hours By Category Endpoint
**Given** an authenticated employee
**When** GET `/api/v1/dashboard/me/by-category` is called with `?period=week`
**Then** response includes hours breakdown by category:
```json
{
  "success": true,
  "data": {
    "period": "week",
    "breakdown": [
      { "categoryId": "uuid-1", "categoryName": "Development", "hours": 25.0, "percentage": 76.9 },
      { "categoryId": "uuid-2", "categoryName": "Meeting", "hours": 7.5, "percentage": 23.1 }
    ],
    "totalHours": 32.5
  }
}
```

### AC4: Trend Endpoint (FR56)
**Given** an authenticated employee
**When** GET `/api/v1/dashboard/me/trend` is called with `?days=30`
**Then** response includes daily hours for line chart:
```json
{
  "success": true,
  "data": {
    "period": { "days": 30, "start": "2025-12-13", "end": "2026-01-12" },
    "dailyTarget": 7,
    "trend": [
      { "date": "2025-12-13", "hours": 7.5, "dayOfWeek": "Saturday" },
      { "date": "2025-12-14", "hours": 0, "dayOfWeek": "Sunday" },
      { "date": "2025-12-15", "hours": 8.0, "dayOfWeek": "Monday" }
    ],
    "average": 6.8,
    "total": 204
  }
}
```
**And** supports `?days=7` for weekly view
**And** supports `?days=90` for quarterly view

### AC5: Weekly Target from Profile
**Given** the user has a `weekly_hours_target` in their profile
**When** dashboard data is calculated
**Then** `weeklyTarget` uses the profile value
**And** `monthlyTarget` is calculated as weeklyTarget * 4
**And** `dailyTarget` is calculated as weeklyTarget / 5

### AC6: Comparison Calculations
**Given** current week/month data
**When** calculating comparisons
**Then** `weekOverWeek` = ((thisWeek - lastWeek) / lastWeek) * 100
**And** `monthOverMonth` = ((thisMonth - lastMonth) / lastMonth) * 100
**And** returns 0 if previous period has no data

### AC7: Timesheet Status Counts
**Given** the user's timesheets
**When** calculating status counts
**Then** `pending` = count where status = 'submitted'
**And** `validated` = count where status = 'validated'
**And** `rejected` = count where status = 'rejected'
**And** `current` = status of current week's timesheet

### AC8: Authorization
**Given** any dashboard endpoint
**When** called without authentication
**Then** returns 401 Unauthorized
**And** employee can only access their own data

---

## Technical Implementation

### Files to Create

#### 1. Routes - `backend/routes/dashboards.routes.js`
```javascript
const express = require('express');
const router = express.Router();
const dashboardsController = require('../controllers/dashboards.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  periodQuerySchema,
  trendQuerySchema
} = require('../validators/dashboards.validator');

router.use(authenticate);

// Employee dashboard endpoints
router.get('/me', dashboardsController.getMyDashboard);
router.get('/me/by-project', validate(periodQuerySchema, 'query'), dashboardsController.getMyByProject);
router.get('/me/by-category', validate(periodQuerySchema, 'query'), dashboardsController.getMyByCategory);
router.get('/me/trend', validate(trendQuerySchema, 'query'), dashboardsController.getMyTrend);

module.exports = router;
```

#### 2. Controller - `backend/controllers/dashboards.controller.js`
```javascript
const dashboardsService = require('../services/dashboards.service');

const getMyDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await dashboardsService.getEmployeeDashboard(userId);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getMyByProject = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || 'week';

    const data = await dashboardsService.getByProject(userId, period);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getMyByCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || 'week';

    const data = await dashboardsService.getByCategory(userId, period);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getMyTrend = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;

    const data = await dashboardsService.getTrend(userId, days);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyDashboard,
  getMyByProject,
  getMyByCategory,
  getMyTrend
};
```

#### 3. Service - `backend/services/dashboards.service.js`
```javascript
const supabase = require('../utils/supabase');
const AppError = require('../utils/AppError');

// Helper: Get current week start (Monday)
const getCurrentWeekStart = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

// Helper: Get current month start
const getCurrentMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

// Helper: Get previous week start
const getPreviousWeekStart = () => {
  const current = new Date(getCurrentWeekStart());
  current.setDate(current.getDate() - 7);
  return current.toISOString().split('T')[0];
};

// Helper: Get previous month start
const getPreviousMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
};

// Helper: Calculate hours in a period
const calculateHours = async (userId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('duration_minutes')
    .eq('user_id', userId)
    .gte('start_time', `${startDate}T00:00:00Z`)
    .lte('start_time', `${endDate}T23:59:59Z`);

  if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');

  return data.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) / 60;
};

const getEmployeeDashboard = async (userId) => {
  // Get user profile for target
  const { data: profile } = await supabase
    .from('profiles')
    .select('weekly_hours_target')
    .eq('id', userId)
    .single();

  const weeklyTarget = profile?.weekly_hours_target || 35;
  const monthlyTarget = weeklyTarget * 4;

  // Calculate current week/month hours
  const weekStart = getCurrentWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const monthStart = getCurrentMonthStart();
  const now = new Date();

  const hoursThisWeek = await calculateHours(userId, weekStart, weekEnd.toISOString().split('T')[0]);
  const hoursThisMonth = await calculateHours(userId, monthStart, now.toISOString().split('T')[0]);

  // Calculate previous periods for comparison
  const prevWeekStart = getPreviousWeekStart();
  const prevWeekEnd = new Date(prevWeekStart);
  prevWeekEnd.setDate(prevWeekEnd.getDate() + 6);
  const hoursLastWeek = await calculateHours(userId, prevWeekStart, prevWeekEnd.toISOString().split('T')[0]);

  const prevMonthStart = getPreviousMonthStart();
  const prevMonthEnd = new Date(monthStart);
  prevMonthEnd.setDate(prevMonthEnd.getDate() - 1);
  const hoursLastMonth = await calculateHours(userId, prevMonthStart, prevMonthEnd.toISOString().split('T')[0]);

  // Calculate comparisons
  const weekOverWeek = hoursLastWeek > 0 ? ((hoursThisWeek - hoursLastWeek) / hoursLastWeek) * 100 : 0;
  const monthOverMonth = hoursLastMonth > 0 ? ((hoursThisMonth - hoursLastMonth) / hoursLastMonth) * 100 : 0;

  // Get timesheet status counts
  const { data: timesheets } = await supabase
    .from('timesheets')
    .select('status, week_start')
    .eq('user_id', userId);

  const currentTimesheet = timesheets?.find(t => t.week_start === weekStart);
  const pending = timesheets?.filter(t => t.status === 'submitted').length || 0;
  const validated = timesheets?.filter(t => t.status === 'validated').length || 0;
  const rejected = timesheets?.filter(t => t.status === 'rejected').length || 0;

  return {
    summary: {
      hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
      hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
      weeklyTarget,
      monthlyTarget,
      weeklyProgress: Math.round((hoursThisWeek / weeklyTarget) * 1000) / 10,
      monthlyProgress: Math.round((hoursThisMonth / monthlyTarget) * 1000) / 10
    },
    comparison: {
      weekOverWeek: Math.round(weekOverWeek * 10) / 10,
      monthOverMonth: Math.round(monthOverMonth * 10) / 10
    },
    timesheetStatus: {
      current: currentTimesheet?.status || 'none',
      currentWeekStart: weekStart,
      pending,
      validated,
      rejected
    }
  };
};

const getByProject = async (userId, period) => {
  const { startDate, endDate } = getPeriodDates(period);

  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      duration_minutes,
      projects (id, name, code)
    `)
    .eq('user_id', userId)
    .gte('start_time', `${startDate}T00:00:00Z`)
    .lte('start_time', `${endDate}T23:59:59Z`);

  if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');

  // Aggregate by project
  const byProject = {};
  let totalMinutes = 0;

  data.forEach(entry => {
    const projectId = entry.projects?.id || 'no-project';
    const projectName = entry.projects?.name || 'Sans projet';
    const projectCode = entry.projects?.code || '';

    if (!byProject[projectId]) {
      byProject[projectId] = {
        projectId,
        projectName,
        projectCode,
        minutes: 0
      };
    }
    byProject[projectId].minutes += entry.duration_minutes || 0;
    totalMinutes += entry.duration_minutes || 0;
  });

  const breakdown = Object.values(byProject).map(p => ({
    projectId: p.projectId,
    projectName: p.projectName,
    projectCode: p.projectCode,
    hours: Math.round(p.minutes / 6) / 10,
    percentage: totalMinutes > 0 ? Math.round((p.minutes / totalMinutes) * 1000) / 10 : 0
  })).sort((a, b) => b.hours - a.hours);

  return {
    period,
    periodStart: startDate,
    periodEnd: endDate,
    breakdown,
    totalHours: Math.round(totalMinutes / 6) / 10
  };
};

const getByCategory = async (userId, period) => {
  const { startDate, endDate } = getPeriodDates(period);

  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      duration_minutes,
      categories (id, name)
    `)
    .eq('user_id', userId)
    .gte('start_time', `${startDate}T00:00:00Z`)
    .lte('start_time', `${endDate}T23:59:59Z`);

  if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');

  // Aggregate by category
  const byCategory = {};
  let totalMinutes = 0;

  data.forEach(entry => {
    const categoryId = entry.categories?.id || 'no-category';
    const categoryName = entry.categories?.name || 'Sans catégorie';

    if (!byCategory[categoryId]) {
      byCategory[categoryId] = {
        categoryId,
        categoryName,
        minutes: 0
      };
    }
    byCategory[categoryId].minutes += entry.duration_minutes || 0;
    totalMinutes += entry.duration_minutes || 0;
  });

  const breakdown = Object.values(byCategory).map(c => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    hours: Math.round(c.minutes / 6) / 10,
    percentage: totalMinutes > 0 ? Math.round((c.minutes / totalMinutes) * 1000) / 10 : 0
  })).sort((a, b) => b.hours - a.hours);

  return {
    period,
    periodStart: startDate,
    periodEnd: endDate,
    breakdown,
    totalHours: Math.round(totalMinutes / 6) / 10
  };
};

const getTrend = async (userId, days) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);

  const { data: profile } = await supabase
    .from('profiles')
    .select('weekly_hours_target')
    .eq('id', userId)
    .single();

  const dailyTarget = (profile?.weekly_hours_target || 35) / 5;

  const { data, error } = await supabase
    .from('time_entries')
    .select('start_time, duration_minutes')
    .eq('user_id', userId)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString());

  if (error) throw new AppError(error.message, 500, 'DATABASE_ERROR');

  // Build daily map
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyMap = {};

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyMap[dateStr] = {
      date: dateStr,
      minutes: 0,
      dayOfWeek: dayNames[d.getDay()]
    };
  }

  // Aggregate entries
  data.forEach(entry => {
    const dateStr = entry.start_time.split('T')[0];
    if (dailyMap[dateStr]) {
      dailyMap[dateStr].minutes += entry.duration_minutes || 0;
    }
  });

  const trend = Object.values(dailyMap).map(d => ({
    date: d.date,
    hours: Math.round(d.minutes / 6) / 10,
    dayOfWeek: d.dayOfWeek
  }));

  const totalHours = trend.reduce((sum, d) => sum + d.hours, 0);
  const workDays = trend.filter(d => !['Saturday', 'Sunday'].includes(d.dayOfWeek)).length;

  return {
    period: {
      days,
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    },
    dailyTarget: Math.round(dailyTarget * 10) / 10,
    trend,
    average: workDays > 0 ? Math.round((totalHours / workDays) * 10) / 10 : 0,
    total: Math.round(totalHours * 10) / 10
  };
};

// Helper: Get period start/end dates
const getPeriodDates = (period) => {
  const now = new Date();
  let startDate, endDate;

  if (period === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(now.setDate(diff)).toISOString().split('T')[0];
    endDate = new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 6)).toISOString().split('T')[0];
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  } else {
    throw new AppError('Invalid period', 400, 'VALIDATION_ERROR');
  }

  return { startDate, endDate };
};

module.exports = {
  getEmployeeDashboard,
  getByProject,
  getByCategory,
  getTrend
};
```

#### 4. Validator - `backend/validators/dashboards.validator.js`
```javascript
const { z } = require('zod');

const periodQuerySchema = z.object({
  period: z.enum(['week', 'month']).optional().default('week')
}).strict();

const trendQuerySchema = z.object({
  days: z.string().regex(/^\d+$/).transform(Number).optional()
}).strict();

module.exports = {
  periodQuerySchema,
  trendQuerySchema
};
```

#### 5. Register Route - `backend/routes/index.js`
```javascript
const dashboardsRoutes = require('./dashboards.routes');
router.use('/dashboard', dashboardsRoutes);
```

---

## Testing Requirements

### Unit Tests - `backend/tests/services/dashboards.service.test.js`

#### getEmployeeDashboard tests
- Returns correct hours for current week
- Returns correct hours for current month
- Calculates weekly progress correctly
- Calculates month-over-month comparison
- Returns 0 comparison when no previous data
- Returns correct timesheet status counts

#### getByProject tests
- Groups hours by project correctly
- Calculates percentages correctly
- Handles entries with no project
- Filters by week period
- Filters by month period

#### getByCategory tests
- Groups hours by category correctly
- Handles entries with no category

#### getTrend tests
- Returns correct number of days
- Calculates daily hours correctly
- Returns correct day of week
- Calculates average excluding weekends
- Handles days with no entries (returns 0)

### Integration Tests - `backend/tests/routes/dashboards.routes.test.js`

#### GET /dashboard/me tests
- Without auth returns 401
- Returns summary with hours and targets
- Returns comparison data
- Returns timesheet status

#### GET /dashboard/me/by-project tests
- Returns breakdown by project
- Supports period=week
- Supports period=month
- Returns 400 for invalid period

#### GET /dashboard/me/by-category tests
- Returns breakdown by category

#### GET /dashboard/me/trend tests
- Returns daily trend data
- Supports days parameter
- Defaults to 30 days

### Coverage Target
- >80% coverage for dashboards.service.js
- 100% route coverage

---

## What User Can Do After This Story

**Changements visibles pour l'utilisateur:**
- Nouvel endpoint GET /api/v1/dashboard/me avec resume personnel
- Endpoint GET /api/v1/dashboard/me/by-project pour distribution par projet
- Endpoint GET /api/v1/dashboard/me/by-category pour distribution par categorie
- Endpoint GET /api/v1/dashboard/me/trend pour tendance journaliere

**Pour tester manuellement:**
1. S'authentifier en tant qu'employee
2. Appeler GET /api/v1/dashboard/me
3. Verifier les heures semaine/mois et comparaisons
4. Appeler GET /api/v1/dashboard/me/by-project?period=week
5. Appeler GET /api/v1/dashboard/me/trend?days=30

**Prerequis pour tester:**
- Token JWT employee valide
- Des time_entries existantes (Epic 4)
- Profil avec weekly_hours_target (optionnel, default 35)

## E2E Testing Notes

**Scenarios de test end-to-end:**
1. Employee appelle /dashboard/me → donnees completes
2. Distribution par projet correcte
3. Tendance 30 jours avec valeurs journalieres
4. Comparaison week-over-week calculee

**Commandes de test:**
```bash
# Dashboard principal
curl -X GET http://localhost:3000/api/v1/dashboard/me \
  -H "Authorization: Bearer $TOKEN"

# Par projet (semaine)
curl -X GET "http://localhost:3000/api/v1/dashboard/me/by-project?period=week" \
  -H "Authorization: Bearer $TOKEN"

# Tendance 30 jours
curl -X GET "http://localhost:3000/api/v1/dashboard/me/trend?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

**Stories liees pour test complet:**
- Epic 4 (time entries) pour avoir des donnees
- Story 6.6 (Dashboard Page) consommera ces endpoints

## Frontend/Backend Balance

**Type de story:** backend-only

**Backend (cette story):**
- GET /api/v1/dashboard/me (resume principal)
- GET /api/v1/dashboard/me/by-project (donut chart data)
- GET /api/v1/dashboard/me/by-category (donut chart data)
- GET /api/v1/dashboard/me/trend (line chart data)

**Frontend associe:**
- Story 6.3 (KPIs) utilisera /dashboard/me
- Story 6.4 (Charts) utilisera /by-project, /by-category, /trend
- Story 6.6 (Page) assemblera le tout

---

## Definition of Done

- [ ] Route /dashboard/me implementee
- [ ] Route /dashboard/me/by-project implementee
- [ ] Route /dashboard/me/by-category implementee
- [ ] Route /dashboard/me/trend implementee
- [ ] Service dashboards.service.js avec calculs corrects
- [ ] Validation des query params
- [ ] Tests unitaires (>80% coverage)
- [ ] Tests integration
- [ ] Format reponse API respecte
- [ ] Comparaisons week/month calculees
- [ ] Target provenant du profil utilisateur

---

## Notes

- Le weekly_hours_target vient du profil utilisateur (default 35)
- Les calculs de comparaison gèrent le cas où la période précédente est vide (retourne 0)
- Les pourcentages sont arrondis à 1 décimale
- Le trend exclut les weekends du calcul de moyenne
- Performance: les requêtes devraient être optimisées avec des index sur user_id et start_time

---

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### Implementation Date
_A remplir apres implementation_

### Debug Log References
_A remplir pendant implementation_

### Completion Notes List
_A remplir apres implementation_

### File List
| File | Action | Description |
|------|--------|-------------|
| `backend/routes/dashboards.routes.js` | Create | Dashboard API routes |
| `backend/controllers/dashboards.controller.js` | Create | Controller methods |
| `backend/services/dashboards.service.js` | Create | Business logic & calculs |
| `backend/validators/dashboards.validator.js` | Create | Query param validation |
| `backend/routes/index.js` | Modify | Register dashboard routes |
| `backend/tests/routes/dashboards.routes.test.js` | Create | Integration tests |
| `backend/tests/services/dashboards.service.test.js` | Create | Unit tests |
