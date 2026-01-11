// frontend/src/__tests__/pages/admin/ProjectsPage.test.jsx
// Story 3.7: Admin Management UI - Projects

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectsPage from '../../../pages/admin/ProjectsPage';
import { projectsService } from '../../../services/projectsService';

// Mock the projects service
vi.mock('../../../services/projectsService', () => ({
  projectsService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    restore: vi.fn()
  }
}));

// Mock window.confirm
const mockConfirm = vi.fn(() => true);
window.confirm = mockConfirm;

const mockProjects = [
  {
    id: '1',
    code: 'PRJ-001',
    name: 'Project One',
    description: 'First project',
    budgetHours: 100,
    totalHoursTracked: 25,
    status: 'active'
  },
  {
    id: '2',
    code: 'PRJ-002',
    name: 'Project Two',
    description: null,
    budgetHours: null,
    totalHoursTracked: 0,
    status: 'archived'
  }
];

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectsService.getAll.mockResolvedValue({
      success: true,
      data: mockProjects,
      meta: {
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
      }
    });
    // Mock getById for detail panel
    projectsService.getById.mockResolvedValue({
      success: true,
      data: { ...mockProjects[0], teams: [] }
    });
  });

  it('renders page with title', async () => {
    render(<ProjectsPage />);

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByText('Gestion des projets')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', async () => {
    // Use a deferred promise that we can control
    let resolveProjects;
    const projectsPromise = new Promise((resolve) => {
      resolveProjects = resolve;
    });
    projectsService.getAll.mockReturnValue(projectsPromise);

    render(<ProjectsPage />);

    // Loading spinner should be present
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();

    // Clean up: resolve the promise and wait for state updates
    resolveProjects({
      success: true,
      data: [],
      meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
    });

    // Wait for component to finish updating
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  it('displays projects after loading', async () => {
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('PRJ-001')).toBeInTheDocument();
      expect(screen.getByText('Project One')).toBeInTheDocument();
    });
  });

  it('displays error message on fetch failure', async () => {
    projectsService.getAll.mockRejectedValue(new Error('Network error'));

    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('has "Nouveau projet" button', async () => {
    render(<ProjectsPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Nouveau projet' })).toBeInTheDocument();
    });
  });

  it('has "Afficher archives" checkbox', async () => {
    render(<ProjectsPage />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Afficher archives')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
  });

  it('toggles show archived and refetches', async () => {
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(projectsService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        includeArchived: false
      });
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(projectsService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        includeArchived: true
      });
    });
  });

  it('opens create modal when clicking "Nouveau projet"', async () => {
    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('PRJ-001')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: 'Nouveau projet' });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Nouveau projet', { selector: 'h2' })).toBeInTheDocument();
    });
  });

  it('calls archive when archive button is clicked', async () => {
    projectsService.archive.mockResolvedValue({
      success: true,
      data: { id: '1', status: 'archived' }
    });

    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('PRJ-001')).toBeInTheDocument();
    });

    const archiveButton = screen.getByRole('button', { name: 'Archiver' });
    fireEvent.click(archiveButton);

    expect(mockConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(projectsService.archive).toHaveBeenCalledWith('1');
    });
  });

  it('calls restore when restore button is clicked', async () => {
    projectsService.restore.mockResolvedValue({
      success: true,
      data: { id: '2', status: 'active' }
    });

    render(<ProjectsPage />);

    await waitFor(() => {
      expect(screen.getByText('PRJ-002')).toBeInTheDocument();
    });

    const restoreButton = screen.getByRole('button', { name: 'Restaurer' });
    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(projectsService.restore).toHaveBeenCalledWith('2');
    });
  });
});
