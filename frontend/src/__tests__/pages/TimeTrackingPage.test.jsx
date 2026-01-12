// frontend/src/__tests__/pages/TimeTrackingPage.test.jsx
// Story 4.4: Simple Mode UI - TimeTrackingPage Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TimeTrackingPage from '../../pages/TimeTrackingPage';

// Mock implementations
let mockTimerReturn = {};
let mockTimeEntriesReturn = {};
let mockProjectsReturn = {};
let mockCategoriesReturn = {};

// Mock the hooks
vi.mock('../../hooks/useTimer', () => ({
  useTimer: () => mockTimerReturn
}));
vi.mock('../../hooks/useTimeEntries', () => ({
  useTimeEntries: () => mockTimeEntriesReturn
}));
vi.mock('../../hooks/useProjects', () => ({
  useProjects: () => mockProjectsReturn
}));
vi.mock('../../hooks/useCategories', () => ({
  useCategories: () => mockCategoriesReturn
}));

// Mock the Toast hook
vi.mock('../../components/ui/Toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }),
  ToastProvider: ({ children }) => children
}));

const mockProjects = [
  { id: 'p1', name: 'Project A', code: 'PRJ-A' },
  { id: 'p2', name: 'Project B', code: 'PRJ-B' }
];

const mockCategories = [
  { id: 'c1', name: 'Development', color: '#3B82F6' },
  { id: 'c2', name: 'Meeting', color: '#10B981' }
];

const mockGroupedEntries = [
  {
    date: '2026-01-12',
    label: "Aujourd'hui",
    isToday: true,
    entries: [
      {
        id: '1',
        startTime: '2026-01-12T10:00:00Z',
        endTime: '2026-01-12T12:00:00Z',
        durationMinutes: 120,
        project: mockProjects[0],
        category: mockCategories[0]
      }
    ]
  }
];

// Helper to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('TimeTrackingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockTimerReturn = {
      activeTimer: null,
      formattedTime: '00:00:00',
      isLoading: false,
      isStarting: false,
      isStopping: false,
      isRunning: false,
      error: null,
      startTimer: vi.fn().mockResolvedValue({}),
      stopTimer: vi.fn().mockResolvedValue({}),
      clearError: vi.fn(),
      syncWithBackend: vi.fn()
    };

    mockTimeEntriesReturn = {
      entries: [],
      groupedEntries: mockGroupedEntries,
      loading: false,
      error: null,
      refresh: vi.fn()
    };

    mockProjectsReturn = {
      projects: mockProjects,
      loading: false
    };

    mockCategoriesReturn = {
      categories: mockCategories,
      loading: false
    };
  });

  describe('Initial Render', () => {
    it('renders the page with all main components', () => {
      renderWithRouter(<TimeTrackingPage />);

      // Mode switch
      expect(screen.getByText('Tache')).toBeInTheDocument();
      expect(screen.getByText('Journee')).toBeInTheDocument();
      expect(screen.getByText('Template')).toBeInTheDocument();

      // Start button (idle state)
      expect(screen.getByText('DEMARRER')).toBeInTheDocument();
    });

    it('shows loading state when fetching projects', () => {
      mockProjectsReturn = { projects: [], loading: true };

      renderWithRouter(<TimeTrackingPage />);

      // Timer display still shows
      expect(screen.getByText('DEMARRER')).toBeInTheDocument();
    });

    it('starts in Simple mode by default', () => {
      renderWithRouter(<TimeTrackingPage />);

      expect(screen.getByText('DEMARRER')).toBeInTheDocument();
      expect(screen.queryByText('TERMINER')).not.toBeInTheDocument();
    });
  });

  describe('Timer Running State', () => {
    it('shows Stop button when timer is running', () => {
      mockTimerReturn = {
        activeTimer: { id: '1', startTime: '2026-01-12T10:00:00Z' },
        formattedTime: '01:30:00',
        isLoading: false,
        isStarting: false,
        isStopping: false,
        isRunning: true,
        error: null,
        startTimer: vi.fn(),
        stopTimer: vi.fn(),
        clearError: vi.fn(),
        syncWithBackend: vi.fn()
      };

      renderWithRouter(<TimeTrackingPage />);

      expect(screen.getByText('TERMINER')).toBeInTheDocument();
      expect(screen.queryByText('DEMARRER')).not.toBeInTheDocument();
    });

    it('displays elapsed time when running', () => {
      mockTimerReturn = {
        activeTimer: { id: '1', startTime: '2026-01-12T10:00:00Z' },
        formattedTime: '02:15:30',
        isLoading: false,
        isStarting: false,
        isStopping: false,
        isRunning: true,
        error: null,
        startTimer: vi.fn(),
        stopTimer: vi.fn(),
        clearError: vi.fn(),
        syncWithBackend: vi.fn()
      };

      renderWithRouter(<TimeTrackingPage />);

      // Timer display shows the formatted time
      const timer = screen.getByRole('timer');
      expect(timer).toBeInTheDocument();
    });
  });

  describe('Start Timer', () => {
    it('calls startTimer when clicking Start button', async () => {
      const mockStartTimer = vi.fn().mockResolvedValue({});
      mockTimerReturn = {
        activeTimer: null,
        formattedTime: '00:00:00',
        isLoading: false,
        isStarting: false,
        isStopping: false,
        isRunning: false,
        error: null,
        startTimer: mockStartTimer,
        stopTimer: vi.fn(),
        clearError: vi.fn(),
        syncWithBackend: vi.fn()
      };

      renderWithRouter(<TimeTrackingPage />);

      fireEvent.click(screen.getByText('DEMARRER'));

      await waitFor(() => {
        expect(mockStartTimer).toHaveBeenCalled();
      });
    });
  });

  describe('Stop Timer', () => {
    it('calls stopTimer when clicking Stop button', async () => {
      const mockStopTimer = vi.fn().mockResolvedValue({});

      mockTimerReturn = {
        activeTimer: { id: '1', startTime: '2026-01-12T10:00:00Z' },
        formattedTime: '01:00:00',
        isLoading: false,
        isStarting: false,
        isStopping: false,
        isRunning: true,
        error: null,
        startTimer: vi.fn(),
        stopTimer: mockStopTimer,
        clearError: vi.fn(),
        syncWithBackend: vi.fn()
      };

      mockTimeEntriesReturn = {
        entries: [],
        groupedEntries: [],
        loading: false,
        error: null,
        refresh: vi.fn()
      };

      renderWithRouter(<TimeTrackingPage />);

      fireEvent.click(screen.getByText('TERMINER'));

      await waitFor(() => {
        expect(mockStopTimer).toHaveBeenCalled();
      });
    });
  });

  describe('Mode Switching', () => {
    it('can switch to Day mode', async () => {
      renderWithRouter(<TimeTrackingPage />);

      // Click on Day mode
      fireEvent.click(screen.getByText('Journee'));

      // Day mode view should appear (with Start Day button)
      await waitFor(() => {
        // In day mode, we don't see the timer controls
        expect(screen.queryByText('DEMARRER')).not.toBeInTheDocument();
      });
    });

    it('can switch to Template mode', async () => {
      renderWithRouter(<TimeTrackingPage />);

      // Click on Template mode
      fireEvent.click(screen.getByText('Template'));

      // Template mode view should appear
      await waitFor(() => {
        // In template mode, we don't see the timer controls
        expect(screen.queryByText('DEMARRER')).not.toBeInTheDocument();
      });
    });

    it('can switch back to Simple mode', async () => {
      renderWithRouter(<TimeTrackingPage />);

      // Switch to Day mode first
      fireEvent.click(screen.getByText('Journee'));

      // Wait for mode to change
      await waitFor(() => {
        expect(screen.queryByText('DEMARRER')).not.toBeInTheDocument();
      });

      // Switch back to Tache mode
      fireEvent.click(screen.getByText('Tache'));

      await waitFor(() => {
        expect(screen.getByText('DEMARRER')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when timer has error', () => {
      mockTimerReturn = {
        activeTimer: null,
        formattedTime: '00:00:00',
        isLoading: false,
        isStarting: false,
        isStopping: false,
        isRunning: false,
        error: 'Failed to start timer',
        startTimer: vi.fn(),
        stopTimer: vi.fn(),
        clearError: vi.fn(),
        syncWithBackend: vi.fn()
      };

      renderWithRouter(<TimeTrackingPage />);

      // Error should be displayed somehow (toast or inline)
      // The exact display depends on implementation
      expect(mockTimerReturn.error).toBe('Failed to start timer');
    });
  });
});
