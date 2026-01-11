// frontend/src/__tests__/components/features/projects/ProjectsList.test.jsx
// Story 3.7: Admin Management UI - Projects

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectsList } from '../../../../components/features/projects/ProjectsList';

const mockProjects = [
  {
    id: '1',
    code: 'PRJ-001',
    name: 'Time Manager',
    description: 'Main project',
    budgetHours: 500,
    totalHoursTracked: 120,
    status: 'active'
  },
  {
    id: '2',
    code: 'PRJ-002',
    name: 'Mobile App',
    description: null,
    budgetHours: null,
    totalHoursTracked: 50,
    status: 'archived'
  }
];

describe('ProjectsList', () => {
  const defaultProps = {
    projects: mockProjects,
    onEdit: vi.fn(),
    onArchive: vi.fn(),
    onRestore: vi.fn(),
    onRowClick: vi.fn(),
    loading: false
  };

  it('renders loading state', () => {
    render(<ProjectsList {...defaultProps} loading={true} />);

    // Loading spinner should be present
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders empty state when no projects', () => {
    render(<ProjectsList {...defaultProps} projects={[]} />);

    expect(screen.getByText('Aucun projet')).toBeInTheDocument();
  });

  it('renders project list with all columns', () => {
    render(<ProjectsList {...defaultProps} />);

    // Check headers
    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('Nom')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Heures suivies')).toBeInTheDocument();
    expect(screen.getByText('Statut')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check project data
    expect(screen.getByText('PRJ-001')).toBeInTheDocument();
    expect(screen.getByText('Time Manager')).toBeInTheDocument();
    expect(screen.getByText('500h')).toBeInTheDocument();
  });

  it('displays status badges correctly', () => {
    render(<ProjectsList {...defaultProps} />);

    expect(screen.getByText('Actif')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('shows Archive button for active projects', () => {
    render(<ProjectsList {...defaultProps} />);

    const archiveButton = screen.getByRole('button', { name: 'Archiver' });
    expect(archiveButton).toBeInTheDocument();
  });

  it('shows Restore button for archived projects', () => {
    render(<ProjectsList {...defaultProps} />);

    const restoreButton = screen.getByRole('button', { name: 'Restaurer' });
    expect(restoreButton).toBeInTheDocument();
  });

  it('calls onEdit when Modifier button is clicked', () => {
    render(<ProjectsList {...defaultProps} />);

    const editButtons = screen.getAllByRole('button', { name: 'Modifier' });
    fireEvent.click(editButtons[0]);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockProjects[0]);
  });

  it('calls onArchive when Archiver button is clicked', () => {
    render(<ProjectsList {...defaultProps} />);

    const archiveButton = screen.getByRole('button', { name: 'Archiver' });
    fireEvent.click(archiveButton);

    expect(defaultProps.onArchive).toHaveBeenCalledWith('1');
  });

  it('calls onRestore when Restaurer button is clicked', () => {
    render(<ProjectsList {...defaultProps} />);

    const restoreButton = screen.getByRole('button', { name: 'Restaurer' });
    fireEvent.click(restoreButton);

    expect(defaultProps.onRestore).toHaveBeenCalledWith('2');
  });

  it('applies archived styling to archived projects', () => {
    const { container } = render(<ProjectsList {...defaultProps} />);

    // Check that archived row has opacity class
    const rows = container.querySelectorAll('tr');
    const archivedRow = Array.from(rows).find(row =>
      row.textContent?.includes('PRJ-002')
    );

    expect(archivedRow).toHaveClass('opacity-60');
  });
});
