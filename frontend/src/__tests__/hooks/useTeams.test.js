// frontend/src/__tests__/hooks/useTeams.test.js
// Story 3.6: Tests for useTeams and useTeamDetails hooks

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTeams, useTeamDetails } from '../../hooks/useTeams';
import { teamsService } from '../../services/teamsService';

// Mock the teamsService
vi.mock('../../services/teamsService', () => ({
  teamsService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getMembers: vi.fn(),
    getProjects: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    assignProject: vi.fn(),
    unassignProject: vi.fn()
  }
}));

const mockTeams = [
  { id: '1', name: 'Team A', memberCount: 5 },
  { id: '2', name: 'Team B', memberCount: 3 }
];

const mockPaginatedResponse = {
  success: true,
  data: mockTeams,
  meta: {
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 }
  }
};

describe('useTeams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches teams on mount', async () => {
    teamsService.getAll.mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() => useTeams());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.teams).toEqual(mockTeams);
    expect(result.current.pagination.total).toBe(2);
    expect(teamsService.getAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('handles API error', async () => {
    teamsService.getAll.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTeams());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.teams).toEqual([]);
  });

  it('handles unsuccessful response', async () => {
    teamsService.getAll.mockResolvedValue({ success: false });

    const { result } = renderHook(() => useTeams());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Erreur lors du chargement des equipes');
  });

  it('creates a team and refreshes list', async () => {
    teamsService.getAll.mockResolvedValue(mockPaginatedResponse);
    teamsService.create.mockResolvedValue({ success: true, data: { id: '3', name: 'New' } });

    const { result } = renderHook(() => useTeams());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createTeam({ name: 'New Team' });
    });

    expect(teamsService.create).toHaveBeenCalledWith({ name: 'New Team' });
    // Should have called getAll twice (initial + after create)
    expect(teamsService.getAll).toHaveBeenCalledTimes(2);
  });

  it('updates a team and refreshes list', async () => {
    teamsService.getAll.mockResolvedValue(mockPaginatedResponse);
    teamsService.update.mockResolvedValue({ success: true, data: { id: '1', name: 'Updated' } });

    const { result } = renderHook(() => useTeams());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateTeam('1', { name: 'Updated Team' });
    });

    expect(teamsService.update).toHaveBeenCalledWith('1', { name: 'Updated Team' });
    expect(teamsService.getAll).toHaveBeenCalledTimes(2);
  });

  it('deletes a team and refreshes list', async () => {
    teamsService.getAll.mockResolvedValue(mockPaginatedResponse);
    teamsService.delete.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useTeams());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteTeam('1');
    });

    expect(teamsService.delete).toHaveBeenCalledWith('1');
    expect(teamsService.getAll).toHaveBeenCalledTimes(2);
  });

  it('goes to a specific page', async () => {
    teamsService.getAll.mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() => useTeams());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      result.current.goToPage(2);
    });

    expect(teamsService.getAll).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
  });

  it('refreshes the current page', async () => {
    teamsService.getAll.mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() => useTeams());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(teamsService.getAll).toHaveBeenCalledTimes(2);
  });
});

describe('useTeamDetails', () => {
  const mockTeam = { id: '1', name: 'Team A', description: 'Desc' };
  // API returns nested structure: { id: membershipId, user: {...} }
  const mockMembersApiResponse = [
    { id: 'm1', user: { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', role: 'employee' } },
    { id: 'm2', user: { id: 'u2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', role: 'manager' } }
  ];
  // Hook flattens to: { id: userId, membershipId, firstName, lastName, email, role }
  const expectedMembers = [
    { id: 'u1', membershipId: 'm1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', role: 'employee' },
    { id: 'u2', membershipId: 'm2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', role: 'manager' }
  ];
  // API returns nested structure: { id: assignmentId, project: {...} }
  const mockProjectsApiResponse = [
    { id: 'a1', project: { id: 'p1', name: 'Project A', code: 'PA', description: 'Desc A', status: 'active', budgetHours: 100 } },
    { id: 'a2', project: { id: 'p2', name: 'Project B', code: 'PB', description: 'Desc B', status: 'active', budgetHours: 200 } }
  ];
  // Hook flattens to: { id: projectId, assignmentId, name, code, description, status, budgetHours }
  const expectedProjects = [
    { id: 'p1', assignmentId: 'a1', name: 'Project A', code: 'PA', description: 'Desc A', status: 'active', budgetHours: 100 },
    { id: 'p2', assignmentId: 'a2', name: 'Project B', code: 'PB', description: 'Desc B', status: 'active', budgetHours: 200 }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    teamsService.getById.mockResolvedValue({ success: true, data: mockTeam });
    teamsService.getMembers.mockResolvedValue({ success: true, data: mockMembersApiResponse });
    teamsService.getProjects.mockResolvedValue({ success: true, data: mockProjectsApiResponse });
  });

  it('fetches team details on mount', async () => {
    const { result } = renderHook(() => useTeamDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.team).toEqual(mockTeam);
    expect(result.current.members).toEqual(expectedMembers);
    expect(result.current.projects).toEqual(expectedProjects);
  });

  it('does not fetch when teamId is null', async () => {
    const { result } = renderHook(() => useTeamDetails(null));

    // Should remain empty without fetching
    expect(teamsService.getById).not.toHaveBeenCalled();
    expect(result.current.team).toBeNull();
    expect(result.current.members).toEqual([]);
    expect(result.current.projects).toEqual([]);
  });

  it('handles team fetch error', async () => {
    teamsService.getById.mockRejectedValue(new Error('Team not found'));

    const { result } = renderHook(() => useTeamDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Team not found');
  });

  it('adds a member and refreshes', async () => {
    teamsService.addMember.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useTeamDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addMember('u3');
    });

    expect(teamsService.addMember).toHaveBeenCalledWith('1', 'u3');
    // Should have refreshed members and team
    expect(teamsService.getMembers).toHaveBeenCalledTimes(2);
    expect(teamsService.getById).toHaveBeenCalledTimes(2);
  });

  it('removes a member and refreshes', async () => {
    teamsService.removeMember.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useTeamDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.removeMember('u1');
    });

    expect(teamsService.removeMember).toHaveBeenCalledWith('1', 'u1');
    expect(teamsService.getMembers).toHaveBeenCalledTimes(2);
  });

  it('assigns a project and refreshes', async () => {
    teamsService.assignProject.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useTeamDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.assignProject('p3');
    });

    expect(teamsService.assignProject).toHaveBeenCalledWith('1', 'p3');
    expect(teamsService.getProjects).toHaveBeenCalledTimes(2);
  });

  it('unassigns a project and refreshes', async () => {
    teamsService.unassignProject.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useTeamDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.unassignProject('p1');
    });

    expect(teamsService.unassignProject).toHaveBeenCalledWith('1', 'p1');
    expect(teamsService.getProjects).toHaveBeenCalledTimes(2);
  });

  it('refreshes all data', async () => {
    const { result } = renderHook(() => useTeamDetails('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refresh();
    });

    // Should have called each fetch twice (initial + refresh)
    expect(teamsService.getById).toHaveBeenCalledTimes(2);
    expect(teamsService.getMembers).toHaveBeenCalledTimes(2);
    expect(teamsService.getProjects).toHaveBeenCalledTimes(2);
  });

  it('resets state when teamId changes to null', async () => {
    const { result, rerender } = renderHook(
      ({ teamId }) => useTeamDetails(teamId),
      { initialProps: { teamId: '1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.team).toEqual(mockTeam);

    rerender({ teamId: null });

    expect(result.current.team).toBeNull();
    expect(result.current.members).toEqual([]);
    expect(result.current.projects).toEqual([]);
  });
});
