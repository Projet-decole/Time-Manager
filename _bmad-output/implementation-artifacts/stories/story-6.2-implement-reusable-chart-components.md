# Story 6.2: Implement Reusable Chart Components

## Story Info
- **Epic:** Epic 6 - Employee Dashboard
- **Story ID:** 6.2
- **Status:** completed
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR82-FR89

## User Story

**As a** frontend developer,
**I want** reusable chart components,
**So that** dashboards can display consistent visualizations.

## Acceptance Criteria

### AC1: DonutChart Component
**Given** FR82-83: proportional distribution charts
**When** DonutChart is used
**Then** it accepts data in format: `[{ name, value, color? }]`
**And** displays a donut/pie chart with segments
**And** shows legend with name and percentage
**And** supports hover tooltip with exact value
**And** is responsive and resizes with container

### AC2: LineChart Component
**Given** FR84: trend visualization
**When** LineChart is used
**Then** it accepts data in format: `[{ x: date, y: value }]`
**And** displays a line chart with smooth curve
**And** supports optional target line (dashed horizontal)
**And** shows hover tooltip with exact values
**And** X-axis shows dates, Y-axis shows values
**And** is responsive

### AC3: BarChart Component
**Given** FR85-86: comparison charts
**When** BarChart is used
**Then** it accepts data in format: `[{ name, value, color? }]`
**And** supports `orientation="horizontal"` or `"vertical"`
**And** displays bars with labels
**And** supports color coding based on thresholds
**And** shows hover tooltip
**And** is responsive

### AC4: KPICard Component
**Given** metric display needs
**When** KPICard is used
**Then** it accepts props: `{ title, value, unit?, target?, trend?, icon? }`
**And** displays title and large value
**And** shows optional progress toward target
**And** shows optional trend indicator (↑ green, ↓ red, → neutral)
**And** supports optional icon

### AC5: ProgressBar Component
**Given** goal progress display needs
**When** ProgressBar is used
**Then** it accepts props: `{ value, max, label?, showPercentage? }`
**And** displays horizontal progress bar
**And** color changes based on progress (green >80%, yellow 50-80%, red <50%)
**And** optionally shows percentage text

### AC6: Consistent Color Palette
**Given** all chart components
**When** colors are used
**Then** they follow a consistent palette:
  - Primary: #3B82F6 (blue)
  - Success: #22C55E (green)
  - Warning: #F59E0B (amber)
  - Danger: #EF4444 (red)
  - Neutral: #6B7280 (gray)
  - Chart series: predefined array for multi-segment charts

### AC7: Tooltip Consistency (FR89)
**Given** any chart with hover
**When** user hovers over a data point
**Then** tooltip appears with:
  - Value with proper formatting (numbers, percentages)
  - Label/name
  - Consistent styling across all charts

### AC8: Loading States
**Given** charts waiting for data
**When** loading prop is true
**Then** chart shows skeleton/shimmer state
**And** maintains its expected dimensions

### AC9: Empty States
**Given** charts with no data
**When** data array is empty
**Then** chart shows friendly empty state message
**And** maintains its expected dimensions

---

## Technical Implementation

### Files to Create

#### 1. Base Chart Utilities - `frontend/src/components/charts/chartUtils.js`
```javascript
// Color palette
export const CHART_COLORS = {
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  neutral: '#6B7280',
  series: [
    '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
  ]
};

// Format number with locale
export const formatNumber = (value, decimals = 1) => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(value);
};

// Format percentage
export const formatPercentage = (value) => {
  return `${formatNumber(value)}%`;
};

// Get color for progress value
export const getProgressColor = (value, max) => {
  const percentage = (value / max) * 100;
  if (percentage >= 80) return CHART_COLORS.success;
  if (percentage >= 50) return CHART_COLORS.warning;
  return CHART_COLORS.danger;
};

// Get trend indicator
export const getTrendIndicator = (value) => {
  if (value > 0) return { icon: '↑', color: CHART_COLORS.success, label: 'En hausse' };
  if (value < 0) return { icon: '↓', color: CHART_COLORS.danger, label: 'En baisse' };
  return { icon: '→', color: CHART_COLORS.neutral, label: 'Stable' };
};
```

#### 2. DonutChart - `frontend/src/components/charts/DonutChart.jsx`
```jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, formatNumber, formatPercentage } from './chartUtils';
import { Skeleton } from '@/components/ui/Skeleton';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatNumber(data.value)}h ({formatPercentage(data.percentage)})
        </p>
      </div>
    );
  }
  return null;
};

export const DonutChart = ({
  data = [],
  loading = false,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true
}) => {
  if (loading) {
    return <Skeleton className="w-full" style={{ height }} />;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        Aucune donnée disponible
      </div>
    );
  }

  // Calculate percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map((item, index) => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
    color: item.color || CHART_COLORS.series[index % CHART_COLORS.series.length]
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={dataWithPercentage}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {dataWithPercentage.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            formatter={(value, entry) => (
              <span className="text-sm">
                {value} ({formatPercentage(entry.payload.percentage)})
              </span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
};
```

#### 3. LineChart - `frontend/src/components/charts/LineChart.jsx`
```jsx
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { CHART_COLORS, formatNumber } from './chartUtils';
import { Skeleton } from '@/components/ui/Skeleton';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          {formatNumber(payload[0].value)}h
        </p>
      </div>
    );
  }
  return null;
};

export const LineChart = ({
  data = [],
  loading = false,
  height = 300,
  xKey = 'date',
  yKey = 'hours',
  targetValue = null,
  targetLabel = 'Objectif',
  color = CHART_COLORS.primary
}) => {
  if (loading) {
    return <Skeleton className="w-full" style={{ height }} />;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        Aucune donnée disponible
      </div>
    );
  }

  // Format date for display
  const formattedData = data.map(item => ({
    ...item,
    displayDate: new Date(item[xKey]).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={formattedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 12 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {targetValue !== null && (
          <ReferenceLine
            y={targetValue}
            stroke={CHART_COLORS.warning}
            strokeDasharray="5 5"
            label={{ value: targetLabel, position: 'right', fontSize: 12 }}
          />
        )}
        <Line
          type="monotone"
          dataKey={yKey}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
```

#### 4. BarChart - `frontend/src/components/charts/BarChart.jsx`
```jsx
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CHART_COLORS, formatNumber } from './chartUtils';
import { Skeleton } from '@/components/ui/Skeleton';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          {formatNumber(payload[0].value)}h
        </p>
      </div>
    );
  }
  return null;
};

export const BarChart = ({
  data = [],
  loading = false,
  height = 300,
  orientation = 'vertical',
  nameKey = 'name',
  valueKey = 'value',
  thresholds = null, // { warning: 45, danger: 50 }
  color = CHART_COLORS.primary
}) => {
  if (loading) {
    return <Skeleton className="w-full" style={{ height }} />;
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        Aucune donnée disponible
      </div>
    );
  }

  const getBarColor = (value) => {
    if (!thresholds) return color;
    if (value >= thresholds.danger) return CHART_COLORS.danger;
    if (value >= thresholds.warning) return CHART_COLORS.warning;
    return CHART_COLORS.success;
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout={isHorizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 5, right: 20, bottom: 5, left: isHorizontal ? 80 : 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        {isHorizontal ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey={nameKey}
              tick={{ fontSize: 12 }}
              width={80}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
          </>
        )}
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={valueKey} radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || getBarColor(entry[valueKey])}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
```

#### 5. KPICard - `frontend/src/components/charts/KPICard.jsx`
```jsx
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { getTrendIndicator, formatNumber, getProgressColor } from './chartUtils';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export const KPICard = ({
  title,
  value,
  unit = '',
  target = null,
  trend = null,
  icon: Icon = null,
  loading = false,
  className
}) => {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  const trendInfo = trend !== null ? getTrendIndicator(trend) : null;
  const progress = target ? (value / target) * 100 : null;

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold">{formatNumber(value)}</span>
          {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
          {target && (
            <span className="text-sm text-muted-foreground">
              / {formatNumber(target)}{unit}
            </span>
          )}
        </div>

        {progress !== null && (
          <Progress
            value={Math.min(progress, 100)}
            className="h-2 mb-2"
            indicatorColor={getProgressColor(value, target)}
          />
        )}

        {trendInfo && (
          <div className="flex items-center gap-1 text-sm" style={{ color: trendInfo.color }}>
            <span>{trendInfo.icon}</span>
            <span>{formatNumber(Math.abs(trend))}%</span>
            <span className="text-muted-foreground">vs sem. dernière</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

#### 6. ProgressBar - `frontend/src/components/charts/ProgressBar.jsx`
```jsx
import { getProgressColor, formatPercentage } from './chartUtils';
import { cn } from '@/lib/utils';

export const ProgressBar = ({
  value,
  max,
  label = null,
  showPercentage = true,
  height = 'h-2',
  className
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const color = getProgressColor(value, max);

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm mb-1">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercentage && <span className="font-medium">{formatPercentage(percentage)}</span>}
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', height)}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};
```

#### 7. Index Export - `frontend/src/components/charts/index.js`
```javascript
export { DonutChart } from './DonutChart';
export { LineChart } from './LineChart';
export { BarChart } from './BarChart';
export { KPICard } from './KPICard';
export { ProgressBar } from './ProgressBar';
export * from './chartUtils';
```

---

## Testing Requirements

### Component Tests

**DonutChart.test.jsx**
- Renders with data
- Shows loading skeleton when loading=true
- Shows empty state when data is empty
- Displays correct number of segments
- Legend shows name and percentage
- Tooltip appears on hover

**LineChart.test.jsx**
- Renders with data
- Shows loading state
- Shows empty state
- Displays target reference line when provided
- X-axis shows formatted dates
- Tooltip shows value

**BarChart.test.jsx**
- Renders with data (vertical)
- Renders with horizontal orientation
- Shows loading state
- Shows empty state
- Applies threshold colors correctly
- Tooltip shows value

**KPICard.test.jsx**
- Renders title and value
- Shows unit when provided
- Shows progress bar when target provided
- Shows trend indicator when provided
- Shows correct trend color (green/red)
- Shows loading skeleton

**ProgressBar.test.jsx**
- Renders with value/max
- Shows percentage text
- Applies correct color based on percentage
- Shows label when provided

### Visual Tests (Storybook)
- Each component has story variants
- Light/dark mode compatibility
- Responsive behavior documented

### Coverage Target
- >60% coverage for all chart components
- All props/variants tested

---

## What User Can Do After This Story

**Changements visibles pour l'utilisateur:**
- Rien de visible directement (composants internes)
- Ces composants seront utilises dans les stories suivantes

**Pour tester manuellement:**
- Ouvrir Storybook (si configure)
- Tester chaque composant avec differentes props
- Verifier la responsivite
- Tester les tooltips

**Prerequis pour tester:**
- Recharts installe (`npm install recharts`)
- Storybook configure (optionnel)

## E2E Testing Notes

**Scenarios de test:**
- Pas de tests E2E pour cette story (composants unitaires)
- Tests visuels via Storybook ou Chromatic recommandes

## Frontend/Backend Balance

**Type de story:** frontend-only (composants UI)

**Backend requis:** Aucun

**Frontend (cette story):**
- DonutChart component
- LineChart component
- BarChart component
- KPICard component
- ProgressBar component
- chartUtils helpers

**Stories dependantes:**
- Story 6.3 (KPIs) utilisera KPICard, ProgressBar
- Story 6.4 (Charts) utilisera DonutChart, LineChart
- Story 7.x (Manager Dashboard) utilisera BarChart

---

## Definition of Done

- [x] Recharts installe comme dependance
- [x] DonutChart composant avec legend et tooltip
- [x] LineChart composant avec target line optionnelle
- [x] BarChart composant avec orientation et thresholds
- [x] KPICard composant avec trend et progress
- [x] ProgressBar composant avec couleurs dynamiques
- [x] chartUtils avec palette et helpers
- [x] Index export pour import facile
- [x] Tests composants (>60% coverage)
- [x] Loading states pour tous les composants
- [x] Empty states pour tous les composants
- [x] Responsivite verifiee
- [x] Tooltips fonctionnels

---

## Notes

- Utiliser Recharts (deja mentionne dans architecture.md)
- Suivre la palette de couleurs definie
- Les composants doivent etre autonomes (pas de fetch interne)
- Le parent passe les donnees via props
- Storybook recommande pour documentation visuelle
- Attention aux performances avec beaucoup de points de donnees

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Implementation Date
2026-01-12

### Debug Log References
- Initial tests failed due to vitest cache issue - resolved by clearing cache
- ResponsiveContainer warnings in test environment (expected behavior, tests pass)

### Completion Notes List
- All chart components implemented: DonutChart, LineChart, BarChart, KPICard, ProgressBar
- UI components already existed (Card, Progress, Skeleton) - used relative imports
- All 100 tests pass across 6 test files
- Build passes successfully
- Components use consistent color palette from chartUtils
- Loading and empty states implemented for all components

### File List
| File | Action | Description |
|------|--------|-------------|
| `frontend/src/components/charts/chartUtils.js` | Created | Color palette & helpers |
| `frontend/src/components/charts/DonutChart.jsx` | Created | Pie/donut chart |
| `frontend/src/components/charts/LineChart.jsx` | Created | Line chart with trend |
| `frontend/src/components/charts/BarChart.jsx` | Created | Horizontal/vertical bars |
| `frontend/src/components/charts/KPICard.jsx` | Created | KPI metric card |
| `frontend/src/components/charts/ProgressBar.jsx` | Created | Progress indicator |
| `frontend/src/components/charts/index.js` | Created | Exports |
| `frontend/src/components/ui/Progress.jsx` | Created | Progress bar UI component |
| `frontend/src/components/ui/Skeleton.jsx` | Created | Skeleton loading component |
| `frontend/src/components/ui/index.js` | Updated | Added Progress and Skeleton exports |
| `frontend/src/__tests__/components/charts/chartUtils.test.js` | Created | Utility function tests |
| `frontend/src/__tests__/components/charts/DonutChart.test.jsx` | Created | DonutChart tests |
| `frontend/src/__tests__/components/charts/LineChart.test.jsx` | Created | LineChart tests |
| `frontend/src/__tests__/components/charts/BarChart.test.jsx` | Created | BarChart tests |
| `frontend/src/__tests__/components/charts/KPICard.test.jsx` | Created | KPICard tests |
| `frontend/src/__tests__/components/charts/ProgressBar.test.jsx` | Created | ProgressBar tests |
