# Story 6.3: Implement Employee Dashboard KPIs Section

## Story Info
- **Epic:** Epic 6 - Employee Dashboard
- **Story ID:** 6.3
- **Status:** completed
- **Priority:** High
- **Estimated Effort:** Small
- **FRs Covered:** FR54, FR57

## User Story

**As an** employee,
**I want** to see my key metrics at a glance,
**So that** I know my current status immediately.

## Acceptance Criteria

### AC1: Hours This Week Card
**Given** I open my dashboard
**When** the KPI section loads
**Then** I see a card showing:
  - Title: "Heures cette semaine"
  - Value: current hours (e.g., "32.5h")
  - Target: weekly target (e.g., "/ 35h")
  - Progress bar showing percentage
  - Color: green if ≥80%, yellow if 50-80%, red if <50%

### AC2: Hours This Month Card
**Given** I view the KPIs
**When** data is loaded
**Then** I see a card showing:
  - Title: "Heures ce mois"
  - Value: current month hours
  - Target: monthly target (weekly × 4)
  - Progress bar

### AC3: Timesheet Status Card (FR57)
**Given** I view the KPIs
**When** data is loaded
**Then** I see a card showing:
  - Title: "Feuille de temps"
  - Status badge (Brouillon, Soumis, Validé, Rejeté)
  - Link to current week timesheet
  - Count of pending/validated timesheets if relevant

### AC4: Week-over-Week Trend
**Given** the hours cards
**When** comparison data is available
**Then** I see trend indicator:
  - ↑ 12% in green if positive
  - ↓ 5% in red if negative
  - → 0% in gray if neutral
  - Text: "vs sem. dernière"

### AC5: Progress Bar Colors
**Given** FR54: hours vs objective
**When** I view the hours cards
**Then** progress bars show percentage toward target
**And** color indicates status:
  - Green (#22C55E) if ≥80%
  - Yellow (#F59E0B) if 50-80%
  - Red (#EF4444) if <50%

### AC6: Loading State
**Given** data is being fetched
**When** KPIs are loading
**Then** skeleton cards are shown
**And** layout is preserved

### AC7: Responsive Layout
**Given** different screen sizes
**When** viewing KPIs
**Then** cards stack on mobile (1 column)
**And** show 2 columns on tablet
**And** show 4 columns on desktop

---

## Technical Implementation

### Files to Create

#### 1. Component - `frontend/src/components/features/dashboard/DashboardKPIs.jsx`
```jsx
import { Clock, Calendar, FileCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { KPICard } from '@/components/charts/KPICard';
import { StatusBadge } from '@/components/features/timesheets/StatusBadge';

export const DashboardKPIs = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <KPICard key={i} loading />
        ))}
      </div>
    );
  }

  const { summary, comparison, timesheetStatus } = data;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Hours This Week */}
      <KPICard
        title="Heures cette semaine"
        value={summary.hoursThisWeek}
        unit="h"
        target={summary.weeklyTarget}
        trend={comparison.weekOverWeek}
        icon={Clock}
      />

      {/* Hours This Month */}
      <KPICard
        title="Heures ce mois"
        value={summary.hoursThisMonth}
        unit="h"
        target={summary.monthlyTarget}
        trend={comparison.monthOverMonth}
        icon={Calendar}
      />

      {/* Weekly Progress */}
      <KPICard
        title="Progression semaine"
        value={summary.weeklyProgress}
        unit="%"
        target={100}
        icon={TrendingUp}
      />

      {/* Timesheet Status */}
      <TimesheetStatusCard
        status={timesheetStatus}
      />
    </div>
  );
};

const TimesheetStatusCard = ({ status }) => {
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">Feuille de temps</p>
        <FileCheck className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="mb-3">
        <StatusBadge status={status.current} size="lg" />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {status.validated} validée{status.validated > 1 ? 's' : ''}
        </span>
        <Link
          to={`/timesheets?week=${status.currentWeekStart}`}
          className="text-primary hover:underline"
        >
          Voir →
        </Link>
      </div>

      {status.pending > 0 && (
        <p className="text-xs text-amber-600 mt-2">
          {status.pending} en attente de validation
        </p>
      )}
    </div>
  );
};
```

#### 2. Hook - `frontend/src/hooks/useDashboard.js`
```javascript
import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '@/services/dashboardService';

export const useDashboard = () => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    try {
      setState(s => ({ ...s, loading: true, error: null }));
      const response = await dashboardService.getMyDashboard();
      setState({ data: response.data, loading: false, error: null });
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};

export const useDashboardByProject = (period = 'week') => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(s => ({ ...s, loading: true }));
        const response = await dashboardService.getByProject(period);
        setState({ data: response.data, loading: false, error: null });
      } catch (err) {
        setState(s => ({ ...s, loading: false, error: err.message }));
      }
    };
    fetchData();
  }, [period]);

  return state;
};

export const useDashboardTrend = (days = 30) => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(s => ({ ...s, loading: true }));
        const response = await dashboardService.getTrend(days);
        setState({ data: response.data, loading: false, error: null });
      } catch (err) {
        setState(s => ({ ...s, loading: false, error: err.message }));
      }
    };
    fetchData();
  }, [days]);

  return state;
};
```

#### 3. Service - `frontend/src/services/dashboardService.js`
```javascript
import { apiClient } from './apiClient';

export const dashboardService = {
  getMyDashboard: () => {
    return apiClient.get('/dashboard/me');
  },

  getByProject: (period = 'week') => {
    return apiClient.get(`/dashboard/me/by-project?period=${period}`);
  },

  getByCategory: (period = 'week') => {
    return apiClient.get(`/dashboard/me/by-category?period=${period}`);
  },

  getTrend: (days = 30) => {
    return apiClient.get(`/dashboard/me/trend?days=${days}`);
  }
};
```

---

## Testing Requirements

### Component Tests

**DashboardKPIs.test.jsx**
- Renders 4 KPI cards
- Shows loading skeletons when loading=true
- Displays correct hours values
- Shows progress bars with correct colors
- Shows trend indicators
- Timesheet status card shows correct badge
- Link to timesheet works

**useDashboard.test.js**
- Fetches dashboard data on mount
- Returns loading state initially
- Returns data after fetch
- Handles errors

### Coverage Target
- >60% coverage for components
- 100% coverage for hooks

---

## What User Can Do After This Story

**Changements visibles pour l'utilisateur:**
- Section KPIs avec 4 cartes metriques
- Visualisation heures semaine/mois avec progression
- Indicateurs de tendance week-over-week
- Statut de la feuille de temps courante

**Pour tester manuellement:**
1. Naviguer vers le dashboard (apres Story 6.6)
2. Verifier les 4 cartes KPI
3. Verifier les couleurs des barres de progression
4. Verifier les tendances (fleches + pourcentages)
5. Cliquer sur le lien vers la feuille de temps

**Prerequis pour tester:**
- Story 6.1 (API) implementee
- Story 6.2 (Charts) implementee
- Des time entries existantes

## Frontend/Backend Balance

**Type de story:** frontend-only

**Backend requis (deja implemente):**
- GET /api/v1/dashboard/me (Story 6.1)

**Frontend (cette story):**
- DashboardKPIs component
- TimesheetStatusCard component
- useDashboard hook
- dashboardService

---

## Definition of Done

- [x] DashboardKPIs composant cree
- [x] TimesheetStatusCard composant cree
- [x] useDashboard hook cree
- [x] dashboardService cree
- [x] Loading skeletons
- [x] Trend indicators fonctionnels
- [x] Progress bar colors correctes
- [x] Responsive layout (1/2/4 colonnes)
- [x] Tests composants (>60%)
- [x] Tests hooks
- [x] Lien vers timesheet fonctionne

---

## Notes

- Utiliser KPICard de Story 6.2
- Les couleurs suivent le design system defini
- Le trend compare avec la semaine precedente
- StatusBadge reutilise de Story 5.6

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Implementation Date
2026-01-12

### File List
| File | Action | Description |
|------|--------|-------------|
| `frontend/src/components/features/dashboard/DashboardKPIs.jsx` | Create | KPI cards section with 4 cards (hours week/month, progress, timesheet status) |
| `frontend/src/components/features/dashboard/TimesheetStatusBadge.jsx` | Create | Status badge component for timesheet states |
| `frontend/src/components/features/dashboard/index.js` | Create | Export index for dashboard components |
| `frontend/src/hooks/useDashboard.js` | Create | Dashboard hooks (useDashboard, useDashboardByProject, useDashboardByCategory, useDashboardTrend) |
| `frontend/src/services/dashboardService.js` | Create | API service for dashboard endpoints |
| `frontend/src/__tests__/components/features/dashboard/DashboardKPIs.test.jsx` | Create | Component tests for DashboardKPIs and TimesheetStatusCard |
| `frontend/src/__tests__/components/features/dashboard/TimesheetStatusBadge.test.jsx` | Create | Component tests for TimesheetStatusBadge |
| `frontend/src/__tests__/hooks/useDashboard.test.js` | Create | Hook tests for all dashboard hooks |
| `frontend/src/__tests__/services/dashboardService.test.js` | Create | Service tests for dashboardService |
