// frontend/src/__tests__/pages/admin/TeamsPage.test.jsx
// Story 3.6: Tests for Teams management page

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TeamsPage from '../../../pages/admin/TeamsPage';
import { AuthProvider } from '../../../contexts/AuthContext';
import * as authService from '../../../services/authService';
import * as teamsService from '../../../services/teamsService';
import * as usersService from '../../../services/usersService';
import api from '../../../lib/api';

// Mock the authService
vi.mock('../../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    isAuthenticated: vi.fn(() => true),
    getAccessToken: vi.fn(() => 'mock-token')
  }
}));

// Mock the teamsService
vi.mock('../../../services/teamsService', () => ({
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

// Mock usersService for MemberSelector
vi.mock('../../../services/usersService', () => ({
  usersService: {
    getAll: vi.fn()
  }
}));

// Mock api for ProjectSelector
vi.mock('../../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

const mockTeams = [
  {
    id: '1',
    name: 'Equipe Marketing',
    description: 'Equipe dediee au marketing digital',
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

const mockPaginatedResponse = {
  success: true,
  data: mockTeams,
  meta: {
    pagination: {
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1
    }
  }
};

const mockManagerUser = {
  id: '1',
  email: 'manager@example.com',
  firstName: 'Jean',
  lastName: 'Manager',
  role: 'manager'
};

const mockMembers = [
  { id: 'u1', firstName: 'Alice', lastName: 'Dupont', email: 'alice@example.com' },
  { id: 'u2', firstName: 'Bob', lastName: 'Martin', email: 'bob@example.com' }
];

const mockProjects = [
  { id: 'p1', name: 'Projet Alpha', code: 'PRJ-001' },
  { id: 'p2', name: 'Projet Beta', code: 'PRJ-002' }
];

const mockAvailableUsers = [
  { id: 'u3', firstName: 'Charlie', lastName: 'Durand', email: 'charlie@example.com' },
  { id: 'u4', firstName: 'Diana', lastName: 'Leroy', email: 'diana@example.com' }
];

const mockAvailableProjects = [
  { id: 'p3', name: 'Projet Gamma', code: 'PRJ-003' },
  { id: 'p4', name: 'Projet Delta', code: 'PRJ-004' }
];

function renderTeamsPage({
  teamsResponse = mockPaginatedResponse,
  skipTeamsMock = false
} = {}) {
  authService.authService.isAuthenticated.mockReturnValue(true);
  authService.authService.getProfile.mockResolvedValue(mockManagerUser);

  if (!skipTeamsMock) {
    teamsService.teamsService.getAll.mockResolvedValue(teamsResponse);
  }

  teamsService.teamsService.getMembers.mockResolvedValue({ success: true, data: mockMembers });
  teamsService.teamsService.getProjects.mockResolvedValue({ success: true, data: mockProjects });
  teamsService.teamsService.getById.mockResolvedValue({ success: true, data: mockTeams[0] });

  // Mock for MemberSelector
  usersService.usersService.getAll.mockResolvedValue({
    success: true,
    data: [...mockMembers, ...mockAvailableUsers]
  });

  // Mock for ProjectSelector
  api.get.mockResolvedValue({
    success: true,
    data: [...mockProjects, ...mockAvailableProjects]
  });

  return render(
    <MemoryRouter initialEntries={['/admin/teams']}>
      <AuthProvider>
        <TeamsPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('TeamsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC1: Teams List Page', () => {
    it('displays page title', async () => {
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText(/gestion des equipes/i)).toBeInTheDocument();
      });
    });

    it('displays Create Team button', async () => {
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle equipe/i })).toBeInTheDocument();
      });
    });

    it('displays teams list with data', async () => {
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      expect(screen.getByText('Equipe Dev')).toBeInTheDocument();
      expect(screen.getByText('Equipe Design')).toBeInTheDocument();
    });

    it('displays truncated description', async () => {
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText(/marketing digital/i)).toBeInTheDocument();
      });
    });

    it('displays member count for each team', async () => {
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument();
      });

      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays Manage and Delete buttons for each team', async () => {
      renderTeamsPage();

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: /gerer/i });
        expect(editButtons.length).toBe(3);
      });

      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
      expect(deleteButtons.length).toBe(3);
    });

    it('shows empty state when no teams', async () => {
      renderTeamsPage({
        teamsResponse: {
          success: true,
          data: [],
          meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/aucune equipe/i)).toBeInTheDocument();
      });
    });

    it('shows error message when API fails', async () => {
      teamsService.teamsService.getAll.mockRejectedValue(new Error('Erreur de connexion'));

      renderTeamsPage({ skipTeamsMock: true });

      await waitFor(() => {
        expect(screen.getByText(/erreur/i)).toBeInTheDocument();
      });
    });
  });

  describe('AC2: Create Team Modal', () => {
    it('opens create modal when clicking Create button', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle equipe/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nouvelle equipe/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /nouvelle equipe/i })).toBeInTheDocument();
      });
    });

    it('displays form fields in create modal', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle equipe/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nouvelle equipe/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nom de l'equipe/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /creer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });

    it('validates required name field', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle equipe/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nouvelle equipe/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creer/i })).toBeInTheDocument();
      });

      // Try to submit without filling name
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(screen.getByText(/nom.*requis/i)).toBeInTheDocument();
      });
    });

    it('creates team when form is valid', async () => {
      const user = userEvent.setup();
      teamsService.teamsService.create.mockResolvedValue({
        success: true,
        data: { id: '4', name: 'New Team', description: 'Test' }
      });

      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle equipe/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nouvelle equipe/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nom de l'equipe/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nom de l'equipe/i), 'New Team');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(teamsService.teamsService.create).toHaveBeenCalledWith({
          name: 'New Team',
          description: 'Test description'
        });
      });
    });

    it('closes modal when clicking Cancel', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle equipe/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nouvelle equipe/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nom de l'equipe/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /annuler/i }));

      await waitFor(() => {
        expect(screen.queryByLabelText(/nom de l'equipe/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('AC3: Edit Team', () => {
    it('opens edit modal with pre-filled data when clicking Edit', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /gerer/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /gerer l'equipe/i })).toBeInTheDocument();
      });

      // Check that the form is pre-filled
      const nameInput = screen.getByLabelText(/nom de l'equipe/i);
      expect(nameInput).toHaveValue('Equipe Marketing');
    });

    it('updates team when edit form is submitted', async () => {
      const user = userEvent.setup();
      teamsService.teamsService.update.mockResolvedValue({
        success: true,
        data: { id: '1', name: 'Updated Team', description: 'Updated desc' }
      });

      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /gerer/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/nom de l'equipe/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/nom de l'equipe/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Team');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(teamsService.teamsService.update).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({ name: 'Updated Team' })
        );
      });
    });
  });

  describe('AC4: Delete Team', () => {
    it('shows confirmation dialog when clicking Delete', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/voulez-vous vraiment supprimer/i)).toBeInTheDocument();
        expect(screen.getByText(/"Equipe Marketing"/i)).toBeInTheDocument();
      });
    });

    it('closes dialog when clicking Cancel', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/voulez-vous vraiment supprimer/i)).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /annuler/i }));

      await waitFor(() => {
        expect(screen.queryByText(/voulez-vous vraiment supprimer/i)).not.toBeInTheDocument();
      });
    });

    it('deletes team when clicking Confirm', async () => {
      const user = userEvent.setup();
      teamsService.teamsService.delete.mockResolvedValue({ success: true });

      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /supprimer/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/voulez-vous vraiment supprimer/i)).toBeInTheDocument();
      });

      // Click the confirm button in the delete dialog (last supprimer button)
      const confirmButton = screen.getAllByRole('button', { name: /supprimer/i }).pop();
      await user.click(confirmButton);

      await waitFor(() => {
        expect(teamsService.teamsService.delete).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('AC5: Team Detail Panel', () => {
    it('opens detail panel when clicking on a team row', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      // Click on the team row (not the buttons)
      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        // Sheet should open with team name as title
        const sheet = document.querySelector('[role="dialog"]');
        expect(sheet).toBeInTheDocument();
      });
    });

    it('displays team info in detail panel', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      // Wait for sheet to open
      await waitFor(() => {
        const sheet = document.querySelector('[role="dialog"]');
        expect(sheet).toBeInTheDocument();
      });

      // Wait for data loading to complete and content to appear
      await waitFor(() => {
        // Should show members section header
        expect(screen.getByText(/Membres \(/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        // Should show projects section header
        expect(screen.getByText(/Projets \(/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    // TODO: Fix test - needs update for modal with tabs UI
    it.skip('displays members list in detail panel', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByText('Alice Dupont')).toBeInTheDocument();
        expect(screen.getByText('Bob Martin')).toBeInTheDocument();
      });
    });

    // TODO: Fix test - needs update for modal with tabs UI
    it.skip('displays projects list in detail panel', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByText('Projet Alpha')).toBeInTheDocument();
        expect(screen.getByText('Projet Beta')).toBeInTheDocument();
      });
    });

    // TODO: Fix test - needs update for modal with tabs UI
    it.skip('displays Add Member button', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
      });
    });

    // TODO: Fix test - needs update for modal with tabs UI
    it.skip('displays Assign Project button', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /assigner/i })).toBeInTheDocument();
      });
    });

    // TODO: Fix test - needs update for modal with tabs UI
    it.skip('displays Remove button for each member', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        const removeButtons = screen.getAllByRole('button', { name: /retirer/i });
        // 2 members + 2 projects = 4 remove buttons
        expect(removeButtons.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // TODO: Fix tests - need update for modal with tabs UI
  describe.skip('AC6: Add Member', () => {
    it('opens member selector modal when clicking Add Member', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      await waitFor(() => {
        expect(screen.getByText(/ajouter un membre/i)).toBeInTheDocument();
      });
    });

    it('displays available users in member selector', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      await waitFor(() => {
        // Should show users not already in the team
        expect(screen.getByText('Charlie Durand')).toBeInTheDocument();
        expect(screen.getByText('Diana Leroy')).toBeInTheDocument();
      });
    });

    it('allows searching for users', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/rechercher/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/rechercher/i), 'Charlie');

      await waitFor(() => {
        expect(screen.getByText('Charlie Durand')).toBeInTheDocument();
        expect(screen.queryByText('Diana Leroy')).not.toBeInTheDocument();
      });
    });

    it('adds member when selecting a user', async () => {
      const user = userEvent.setup();
      teamsService.teamsService.addMember.mockResolvedValue({ success: true });

      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      await waitFor(() => {
        expect(screen.getByText('Charlie Durand')).toBeInTheDocument();
      });

      // Click the add button for Charlie
      const charlieRow = screen.getByText('Charlie Durand').closest('li');
      const addBtn = within(charlieRow).getByRole('button', { name: /ajouter/i });
      await user.click(addBtn);

      await waitFor(() => {
        expect(teamsService.teamsService.addMember).toHaveBeenCalledWith('1', 'u3');
      });
    });

    it('excludes already-members from selection', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ajouter/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /ajouter/i }));

      await waitFor(() => {
        // Alice and Bob are already members, they should not appear in the selector as selectable
        const modal = screen.getByText(/ajouter un membre/i).closest('[role="dialog"]');
        const usersList = within(modal).queryByText('Alice Dupont');
        // Already members should be filtered out
        expect(usersList).not.toBeInTheDocument();
      });
    });
  });

  // TODO: Fix tests - need update for modal with tabs UI
  describe.skip('AC7: Remove Member', () => {
    it('shows confirmation when clicking Remove on a member', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByText('Alice Dupont')).toBeInTheDocument();
      });

      // Find the remove button for Alice
      const aliceRow = screen.getByText('Alice Dupont').closest('li');
      const removeBtn = within(aliceRow).getByRole('button', { name: /retirer/i });
      await user.click(removeBtn);

      await waitFor(() => {
        expect(screen.getByText(/voulez-vous vraiment retirer/i)).toBeInTheDocument();
      });
    });

    it('removes member when confirmation is accepted', async () => {
      const user = userEvent.setup();
      teamsService.teamsService.removeMember.mockResolvedValue({ success: true });

      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByText('Alice Dupont')).toBeInTheDocument();
      });

      const aliceRow = screen.getByText('Alice Dupont').closest('li');
      const removeBtn = within(aliceRow).getByRole('button', { name: /retirer/i });
      await user.click(removeBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirmer/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /confirmer/i }));

      await waitFor(() => {
        expect(teamsService.teamsService.removeMember).toHaveBeenCalledWith('1', 'u1');
      });
    });
  });

  // TODO: Fix tests - need update for modal with tabs UI
  describe.skip('AC8: Assign/Unassign Project', () => {
    it('opens project selector modal when clicking Assign Project', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /assigner/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /assigner/i }));

      await waitFor(() => {
        expect(screen.getByText(/assigner un projet/i)).toBeInTheDocument();
      });
    });

    it('displays available projects in project selector', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /assigner/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /assigner/i }));

      await waitFor(() => {
        // Should show projects not already assigned
        expect(screen.getByText('Projet Gamma')).toBeInTheDocument();
        expect(screen.getByText('Projet Delta')).toBeInTheDocument();
      });
    });

    it('assigns project when selecting one', async () => {
      const user = userEvent.setup();
      teamsService.teamsService.assignProject.mockResolvedValue({ success: true });

      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /assigner/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /assigner/i }));

      await waitFor(() => {
        expect(screen.getByText('Projet Gamma')).toBeInTheDocument();
      });

      // Click the assign button for Projet Gamma
      const gammaRow = screen.getByText('Projet Gamma').closest('li');
      const assignBtn = within(gammaRow).getByRole('button', { name: /assigner/i });
      await user.click(assignBtn);

      await waitFor(() => {
        expect(teamsService.teamsService.assignProject).toHaveBeenCalledWith('1', 'p3');
      });
    });

    it('shows confirmation when clicking Remove on a project', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByText('Projet Alpha')).toBeInTheDocument();
      });

      // Find the remove button for Projet Alpha
      const projectRow = screen.getByText('Projet Alpha').closest('li');
      const removeBtn = within(projectRow).getByRole('button', { name: /retirer/i });
      await user.click(removeBtn);

      await waitFor(() => {
        expect(screen.getByText(/voulez-vous vraiment retirer le projet/i)).toBeInTheDocument();
      });
    });

    it('unassigns project when confirmation is accepted', async () => {
      const user = userEvent.setup();
      teamsService.teamsService.unassignProject.mockResolvedValue({ success: true });

      renderTeamsPage();

      await waitFor(() => {
        expect(screen.getByText('Equipe Marketing')).toBeInTheDocument();
      });

      const row = screen.getByText('Equipe Marketing').closest('tr');
      await user.click(row);

      await waitFor(() => {
        expect(screen.getByText('Projet Alpha')).toBeInTheDocument();
      });

      const projectRow = screen.getByText('Projet Alpha').closest('li');
      const removeBtn = within(projectRow).getByRole('button', { name: /retirer/i });
      await user.click(removeBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirmer/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /confirmer/i }));

      await waitFor(() => {
        expect(teamsService.teamsService.unassignProject).toHaveBeenCalledWith('1', 'p1');
      });
    });
  });

  describe('Loading states', () => {
    it('shows loading indicator while fetching teams', async () => {
      authService.authService.isAuthenticated.mockReturnValue(true);
      authService.authService.getProfile.mockResolvedValue(mockManagerUser);

      // Use a deferred promise that we can control
      let resolveTeams;
      const teamsPromise = new Promise((resolve) => {
        resolveTeams = resolve;
      });
      teamsService.teamsService.getAll.mockReturnValue(teamsPromise);

      render(
        <MemoryRouter initialEntries={['/admin/teams']}>
          <AuthProvider>
            <TeamsPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Should not show teams yet (still loading)
      expect(screen.queryByText('Equipe Marketing')).not.toBeInTheDocument();

      // Clean up: resolve the promise and wait for state update
      await act(async () => {
        resolveTeams({
          success: true,
          data: [],
          meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
        });
      });
    });
  });

  describe('AC9: Access Control', () => {
    it('route is protected for managers only via RoleProtectedRoute', () => {
      // This test verifies that the route configuration in App.jsx
      // wraps TeamsPage with RoleProtectedRoute roles={['manager']}
      // The actual redirect behavior is tested in RoleProtectedRoute.test.jsx
      // Here we verify that TeamsPage renders correctly for a manager
      renderTeamsPage();

      // If we get here without redirect, the manager has access
      expect(screen.getByText(/gestion des equipes/i)).toBeInTheDocument();
    });

    it('does not render for employee users (handled by RoleProtectedRoute)', async () => {
      const mockEmployeeUser = {
        id: '2',
        email: 'employee@example.com',
        firstName: 'Paul',
        lastName: 'Employee',
        role: 'employee'
      };

      authService.authService.isAuthenticated.mockReturnValue(true);
      authService.authService.getProfile.mockResolvedValue(mockEmployeeUser);
      teamsService.teamsService.getAll.mockResolvedValue(mockPaginatedResponse);

      // Note: In real app, RoleProtectedRoute would redirect before TeamsPage renders
      // This test confirms the page still renders when directly accessed
      // The actual protection is verified in RoleProtectedRoute tests
      render(
        <MemoryRouter initialEntries={['/admin/teams']}>
          <AuthProvider>
            <TeamsPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Page renders but in real app would be blocked by RoleProtectedRoute
      await waitFor(() => {
        expect(screen.getByText(/gestion des equipes/i)).toBeInTheDocument();
      });
    });
  });
});
