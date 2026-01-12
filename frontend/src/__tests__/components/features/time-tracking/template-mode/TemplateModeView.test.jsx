// frontend/src/__tests__/components/features/time-tracking/template-mode/TemplateModeView.test.jsx
// Story 4.10: Implement Template Mode UI - TemplateModeView Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TemplateModeView } from '../../../../../components/features/time-tracking/template-mode/TemplateModeView';
import { useTemplates } from '../../../../../hooks/useTemplates';
import { useTemplate } from '../../../../../hooks/useTemplate';
import { useProjects } from '../../../../../hooks/useProjects';
import { useCategories } from '../../../../../hooks/useCategories';
import { useToast } from '../../../../../components/ui/Toast';

// Mock hooks
vi.mock('../../../../../hooks/useTemplates', () => ({
  useTemplates: vi.fn()
}));

vi.mock('../../../../../hooks/useTemplate', () => ({
  useTemplate: vi.fn()
}));

vi.mock('../../../../../hooks/useProjects', () => ({
  useProjects: vi.fn()
}));

vi.mock('../../../../../hooks/useCategories', () => ({
  useCategories: vi.fn()
}));

vi.mock('../../../../../components/ui/Toast', () => ({
  useToast: vi.fn()
}));

describe('TemplateModeView', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  };

  const defaultTemplatesHook = {
    templates: [],
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    clearError: vi.fn(),
    hasTemplates: false
  };

  const defaultTemplateHook = {
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isApplying: false,
    isBusy: false,
    error: null,
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    apply: vi.fn(),
    createFromDay: vi.fn(),
    clearError: vi.fn()
  };

  const defaultProjectsHook = {
    projects: [],
    loading: false
  };

  const defaultCategoriesHook = {
    categories: [],
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useToast.mockReturnValue(mockToast);
    useTemplates.mockReturnValue(defaultTemplatesHook);
    useTemplate.mockReturnValue(defaultTemplateHook);
    useProjects.mockReturnValue(defaultProjectsHook);
    useCategories.mockReturnValue(defaultCategoriesHook);
  });

  describe('Loading State', () => {
    it('renders loading skeleton while fetching templates', () => {
      useTemplates.mockReturnValue({
        ...defaultTemplatesHook,
        isLoading: true
      });

      render(<TemplateModeView />);

      // Check for skeleton elements (animated pulse)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders loading skeleton while fetching projects', () => {
      useProjects.mockReturnValue({
        ...defaultProjectsHook,
        loading: true
      });

      render(<TemplateModeView />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('renders EmptyTemplatesState when no templates', () => {
      useTemplates.mockReturnValue({
        ...defaultTemplatesHook,
        hasTemplates: false,
        templates: []
      });

      render(<TemplateModeView />);

      expect(screen.getByText('Aucun template')).toBeInTheDocument();
      expect(screen.getByText(/Creez votre premier template/)).toBeInTheDocument();
      expect(screen.getByText('Nouveau Template')).toBeInTheDocument();
    });

    it('opens builder modal when clicking create button in empty state', async () => {
      useTemplates.mockReturnValue({
        ...defaultTemplatesHook,
        hasTemplates: false
      });

      render(<TemplateModeView />);

      const createButton = screen.getByRole('button', { name: /Nouveau Template/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Nouveau template')).toBeInTheDocument();
      });
    });
  });

  describe('Templates List State', () => {
    const mockTemplates = [
      {
        id: 'template-1',
        name: 'Morning Development',
        description: 'Standard morning routine',
        entries: [
          { id: 'e1', startTime: '09:00', endTime: '12:00' }
        ]
      },
      {
        id: 'template-2',
        name: 'Meeting Day',
        description: null,
        entries: [
          { id: 'e2', startTime: '10:00', endTime: '11:00' },
          { id: 'e3', startTime: '14:00', endTime: '15:00' }
        ]
      }
    ];

    it('renders header with title and create button', () => {
      useTemplates.mockReturnValue({
        ...defaultTemplatesHook,
        hasTemplates: true,
        templates: mockTemplates
      });

      render(<TemplateModeView />);

      expect(screen.getByText('Mes Templates')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Nouveau Template/i })).toBeInTheDocument();
    });

    it('renders template cards', () => {
      useTemplates.mockReturnValue({
        ...defaultTemplatesHook,
        hasTemplates: true,
        templates: mockTemplates
      });

      render(<TemplateModeView />);

      expect(screen.getByText('Morning Development')).toBeInTheDocument();
      expect(screen.getByText('Meeting Day')).toBeInTheDocument();
    });
  });

  describe('Create Template Flow', () => {
    it('opens builder modal for new template', async () => {
      useTemplates.mockReturnValue({
        ...defaultTemplatesHook,
        hasTemplates: true,
        templates: [{ id: '1', name: 'Test', entries: [] }]
      });

      render(<TemplateModeView />);

      const createButton = screen.getByRole('button', { name: /Nouveau Template/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Nouveau template')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows toast when list error occurs', async () => {
      useTemplates.mockReturnValue({
        ...defaultTemplatesHook,
        error: 'Network error'
      });

      render(<TemplateModeView />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Network error');
      });
    });

    it('shows toast when template operation error occurs', async () => {
      useTemplate.mockReturnValue({
        ...defaultTemplateHook,
        error: 'Create failed'
      });

      render(<TemplateModeView />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Create failed');
      });
    });
  });
});
