# Story 6.4: Implement Employee Dashboard Charts

## Story Info
- **Epic:** Epic 6 - Employee Dashboard
- **Story ID:** 6.4
- **Status:** completed
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR55, FR56

## User Story

**As an** employee,
**I want** to see visual breakdowns of my time,
**So that** I understand where my hours go.

## Acceptance Criteria

### AC1: Donut Chart by Project (FR55)
**Given** I view the dashboard
**When** the charts section loads
**Then** I see a donut chart showing time distribution by project
**And** each segment shows project name on hover
**And** legend shows project name and percentage
**And** colors are distinct and consistent

### AC2: Line Chart Trend (FR56)
**Given** I view the dashboard
**When** the charts section loads
**Then** I see a line chart showing daily hours for last 30 days
**And** hover shows exact hours for each day
**And** target line (7h/day) is shown for reference (dashed)
**And** X-axis shows dates, Y-axis shows hours

### AC3: Period Selector
**Given** the charts section
**When** I interact with period selector
**Then** I can switch between "Semaine" and "Mois" for donut chart
**And** chart updates with new data
**And** I can choose 7, 30, or 90 days for trend chart

### AC4: Drill-Down on Project
**Given** I click on a project segment in the donut
**When** the interaction is triggered
**Then** I see a modal or side panel with:
  - Project name and total hours
  - List of time entries for that project this period
  - Link to filter history by project

### AC5: Loading States
**Given** data is being fetched
**When** charts are loading
**Then** skeleton placeholders are shown
**And** layout is preserved

### AC6: Empty States
**Given** no data for the selected period
**When** charts render
**Then** friendly empty message is shown
**And** suggestion to start tracking time

### AC7: Responsive Layout
**Given** different screen sizes
**When** viewing charts
**Then** charts stack vertically on mobile
**And** show side-by-side on desktop
**And** chart dimensions adapt to container

---

## Technical Implementation

### Files to Create

#### 1. Component - `frontend/src/components/features/dashboard/DashboardCharts.jsx`
```jsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { DonutChart, LineChart } from '@/components/charts';
import { useDashboardByProject, useDashboardByCategory, useDashboardTrend } from '@/hooks/useDashboard';
import { ProjectDrillDown } from './ProjectDrillDown';

export const DashboardCharts = () => {
  const [period, setPeriod] = useState('week');
  const [trendDays, setTrendDays] = useState(30);
  const [selectedProject, setSelectedProject] = useState(null);

  const { data: projectData, loading: projectLoading } = useDashboardByProject(period);
  const { data: trendData, loading: trendLoading } = useDashboardTrend(trendDays);

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Distribution by Project */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Répartition par projet</CardTitle>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="h-8">
              <TabsTrigger value="week" className="text-xs">Semaine</TabsTrigger>
              <TabsTrigger value="month" className="text-xs">Mois</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <DonutChart
            data={projectData?.breakdown.map(p => ({
              name: p.projectName,
              value: p.hours,
              projectId: p.projectId
            })) || []}
            loading={projectLoading}
            height={300}
            onSegmentClick={handleProjectClick}
          />
          {projectData && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Total: {projectData.totalHours}h
            </p>
          )}
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Tendance journalière</CardTitle>
          <Tabs value={String(trendDays)} onValueChange={(v) => setTrendDays(Number(v))}>
            <TabsList className="h-8">
              <TabsTrigger value="7" className="text-xs">7j</TabsTrigger>
              <TabsTrigger value="30" className="text-xs">30j</TabsTrigger>
              <TabsTrigger value="90" className="text-xs">90j</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <LineChart
            data={trendData?.trend || []}
            loading={trendLoading}
            height={300}
            xKey="date"
            yKey="hours"
            targetValue={trendData?.dailyTarget}
            targetLabel="Objectif"
          />
          {trendData && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Moyenne: {trendData.average}h/jour
            </p>
          )}
        </CardContent>
      </Card>

      {/* Drill-down modal */}
      {selectedProject && (
        <ProjectDrillDown
          project={selectedProject}
          period={period}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};
```

#### 2. Component - `frontend/src/components/features/dashboard/ProjectDrillDown.jsx`
```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Clock, ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { timeEntriesService } from '@/services/timeEntriesService';
import { formatDuration, formatDate } from '@/lib/formatters';

export const ProjectDrillDown = ({ project, period, onClose }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        // Fetch entries for this project in the current period
        const response = await timeEntriesService.getAll({
          projectId: project.projectId,
          period
        });
        setEntries(response.data);
      } catch (err) {
        console.error('Failed to fetch entries', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [project.projectId, period]);

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{project.name}</SheetTitle>
          <SheetDescription>
            {project.value}h cette {period === 'week' ? 'semaine' : 'mois'}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune entrée trouvée
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{entry.description || 'Sans description'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(entry.startTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-4 h-4" />
                    {formatDuration(entry.durationMinutes)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <Link to={`/history?projectId=${project.projectId}`}>
            <Button variant="outline" className="w-full">
              <ExternalLink className="w-4 h-4 mr-2" />
              Voir tout l'historique
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

#### 3. Update DonutChart for click handling
```jsx
// In DonutChart.jsx, add onClick support:
<Pie
  data={dataWithPercentage}
  onClick={(data, index) => onSegmentClick?.(data)}
  // ... rest of props
>
```

---

## Testing Requirements

### Component Tests

**DashboardCharts.test.jsx**
- Renders donut and line charts
- Period selector changes data
- Trend days selector changes data
- Shows loading states
- Shows empty states
- Clicking segment opens drill-down

**ProjectDrillDown.test.jsx**
- Opens when project is selected
- Shows project name and hours
- Fetches entries for project
- Shows entries list
- Link to history works
- Closes on close button

### Coverage Target
- >60% coverage for components

---

## What User Can Do After This Story

**Changements visibles pour l'utilisateur:**
- Donut chart de repartition par projet
- Line chart de tendance sur 7/30/90 jours
- Selecteurs de periode
- Drill-down sur un projet pour voir les entries
- Objectif journalier affiche sur le trend

**Pour tester manuellement:**
1. Naviguer vers le dashboard
2. Verifier le donut chart par projet
3. Changer la periode (semaine/mois)
4. Verifier le line chart avec la ligne objectif
5. Changer les jours (7/30/90)
6. Cliquer sur un segment → voir le drill-down

**Prerequis pour tester:**
- Stories 6.1-6.3 implementees
- Des time entries avec differents projets

## Frontend/Backend Balance

**Type de story:** frontend-only

**Backend requis (deja implemente):**
- GET /api/v1/dashboard/me/by-project (Story 6.1)
- GET /api/v1/dashboard/me/trend (Story 6.1)

**Frontend (cette story):**
- DashboardCharts component
- ProjectDrillDown component
- DonutChart click handler

---

## Definition of Done

- [x] DashboardCharts composant cree
- [x] Donut chart avec legend et tooltips
- [x] Line chart avec target line
- [x] Period selectors fonctionnels
- [x] Drill-down sur projet
- [x] Loading/empty states
- [x] Responsive layout
- [x] Tests composants (>60%)

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Implementation Date
2026-01-12

### File List
| File | Action | Description |
|------|--------|-------------|
| `frontend/src/components/features/dashboard/DashboardCharts.jsx` | Create | Charts section with donut/line charts, period selectors |
| `frontend/src/components/features/dashboard/ProjectDrillDown.jsx` | Create | Drill-down panel showing project entries |
| `frontend/src/components/features/dashboard/index.js` | Modify | Added DashboardCharts and ProjectDrillDown exports |
| `frontend/src/components/charts/DonutChart.jsx` | Modify | Added onSegmentClick prop support |
| `frontend/src/__tests__/components/features/dashboard/DashboardCharts.test.jsx` | Create | Comprehensive tests (28 tests) |
| `frontend/src/setupTests.js` | Modify | Improved Recharts mocks for stability |
