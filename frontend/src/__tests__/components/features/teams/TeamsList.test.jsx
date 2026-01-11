// frontend/src/__tests__/components/features/teams/TeamsList.test.jsx
// Story 3.6: Admin Management UI - Teams

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamsList } from '../../../../components/features/teams/TeamsList';

const mockTeams = [
  {
    id: '1',
    name: 'Equipe Marketing',
    description: 'Equipe dediee au marketing digital et communication',
    memberCount: 5
  },
  {
    id: '2',
    name: 'Equipe Dev',
    description: 'Equipe de developpement',
    memberCount: 8
  },
  {
    id: '3',
    name: 'Equipe Design',
    description: '',
    memberCount: 3
  }
];

describe('TeamsList', () => {
  const defaultProps = {
    teams: mockTeams,
    onRowClick: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    render(<TeamsList {...defaultProps} loading={true} />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders empty state when no teams', () => {
    render(<TeamsList {...defaultProps} teams={[]} />);

    expect(screen.getByText('Aucune equipe')).toBeInTheDocument();
    expect(screen.getByText(/Creez votre premiere equipe/)).toBeInTheDocument();
  });

  it('renders team list with all columns', () => {
    render(<TeamsList {...defaultProps} />);

    // Check headers
    expect(screen.getByText('Nom')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Membres')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check team data
    expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
    expect(screen.getByText('Equipe Dev')).toBeInTheDocument();
    expect(screen.getByText('Equipe Design')).toBeInTheDocument();
  });

  it('displays member count for each team', () => {
    render(<TeamsList {...defaultProps} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('truncates long descriptions', () => {
    const longDescTeams = [{
      id: '1',
      name: 'Team',
      description: 'A'.repeat(100),
      memberCount: 1
    }];

    render(<TeamsList {...defaultProps} teams={longDescTeams} />);

    // Should be truncated with ellipsis
    const descCell = screen.getByText(/\.\.\.$/);
    expect(descCell).toBeInTheDocument();
  });

  it('shows dash for empty description', () => {
    const teamWithoutDesc = [{
      id: '1',
      name: 'Team',
      description: '',
      memberCount: 1
    }];

    render(<TeamsList {...defaultProps} teams={teamWithoutDesc} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows dash for null description', () => {
    const teamWithNullDesc = [{
      id: '1',
      name: 'Team',
      description: null,
      memberCount: 1
    }];

    render(<TeamsList {...defaultProps} teams={teamWithNullDesc} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('calls onRowClick when clicking on a row', () => {
    render(<TeamsList {...defaultProps} />);

    const row = screen.getByText('Equipe Marketing').closest('tr');
    fireEvent.click(row);

    expect(defaultProps.onRowClick).toHaveBeenCalledWith(mockTeams[0]);
  });

  it('does not call onRowClick when clicking on buttons', () => {
    render(<TeamsList {...defaultProps} />);

    const editButton = screen.getAllByRole('button', { name: /modifier/i })[0];
    fireEvent.click(editButton);

    expect(defaultProps.onRowClick).not.toHaveBeenCalled();
  });

  it('calls onEdit when clicking Edit button', () => {
    render(<TeamsList {...defaultProps} />);

    const editButtons = screen.getAllByRole('button', { name: /modifier/i });
    fireEvent.click(editButtons[0]);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockTeams[0]);
  });

  it('calls onDelete when clicking Delete button', () => {
    render(<TeamsList {...defaultProps} />);

    const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
    fireEvent.click(deleteButtons[0]);

    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockTeams[0]);
  });

  it('renders correct number of edit and delete buttons', () => {
    render(<TeamsList {...defaultProps} />);

    const editButtons = screen.getAllByRole('button', { name: /modifier/i });
    const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });

    expect(editButtons).toHaveLength(3);
    expect(deleteButtons).toHaveLength(3);
  });

  it('handles teams with zero member count', () => {
    const zeroMemberTeam = [{
      id: '1',
      name: 'Empty Team',
      description: 'No members',
      memberCount: 0
    }];

    render(<TeamsList {...defaultProps} teams={zeroMemberTeam} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles teams with undefined member count', () => {
    const undefinedMemberTeam = [{
      id: '1',
      name: 'Team',
      description: 'Test',
      memberCount: undefined
    }];

    render(<TeamsList {...defaultProps} teams={undefinedMemberTeam} />);

    // Should show 0 for undefined (via nullish coalescing)
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
