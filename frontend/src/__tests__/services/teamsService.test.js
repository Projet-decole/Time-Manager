// frontend/src/__tests__/services/teamsService.test.js
// Story 3.6: Tests for teams service

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { teamsService } from '../../services/teamsService';
import api from '../../lib/api';

// Mock the api module
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

describe('teamsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches teams with default pagination', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: '1', name: 'Team A' }],
        meta: { pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await teamsService.getAll();

      expect(api.get).toHaveBeenCalledWith('/teams?page=1&limit=20');
      expect(result).toEqual(mockResponse);
    });

    it('fetches teams with custom page and limit', async () => {
      const mockResponse = {
        success: true,
        data: [],
        meta: { pagination: { page: 2, limit: 10, total: 15, totalPages: 2 } }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await teamsService.getAll({ page: 2, limit: 10 });

      expect(api.get).toHaveBeenCalledWith('/teams?page=2&limit=10');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getById', () => {
    it('fetches a single team by ID', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'Team A', description: 'Description' }
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await teamsService.getById('1');

      expect(api.get).toHaveBeenCalledWith('/teams/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('create', () => {
    it('creates a team with name only', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'New Team' }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await teamsService.create({ name: 'New Team' });

      expect(api.post).toHaveBeenCalledWith('/teams', { name: 'New Team' });
      expect(result).toEqual(mockResponse);
    });

    it('creates a team with name and description', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'New Team', description: 'Team desc' }
      };
      api.post.mockResolvedValue(mockResponse);

      const result = await teamsService.create({
        name: 'New Team',
        description: 'Team desc'
      });

      expect(api.post).toHaveBeenCalledWith('/teams', {
        name: 'New Team',
        description: 'Team desc'
      });
      expect(result).toEqual(mockResponse);
    });

    it('does not include description when empty', async () => {
      const mockResponse = { success: true, data: { id: '1', name: 'Test' } };
      api.post.mockResolvedValue(mockResponse);

      await teamsService.create({ name: 'Test', description: '' });

      expect(api.post).toHaveBeenCalledWith('/teams', { name: 'Test' });
    });
  });

  describe('update', () => {
    it('updates a team name', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'Updated Team' }
      };
      api.patch.mockResolvedValue(mockResponse);

      const result = await teamsService.update('1', { name: 'Updated Team' });

      expect(api.patch).toHaveBeenCalledWith('/teams/1', { name: 'Updated Team' });
      expect(result).toEqual(mockResponse);
    });

    it('updates team description', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', description: 'New desc' }
      };
      api.patch.mockResolvedValue(mockResponse);

      const result = await teamsService.update('1', { description: 'New desc' });

      expect(api.patch).toHaveBeenCalledWith('/teams/1', { description: 'New desc' });
      expect(result).toEqual(mockResponse);
    });

    it('updates both name and description', async () => {
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'New Name', description: 'New desc' }
      };
      api.patch.mockResolvedValue(mockResponse);

      const result = await teamsService.update('1', {
        name: 'New Name',
        description: 'New desc'
      });

      expect(api.patch).toHaveBeenCalledWith('/teams/1', {
        name: 'New Name',
        description: 'New desc'
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('deletes a team by ID', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValue(mockResponse);

      const result = await teamsService.delete('1');

      expect(api.delete).toHaveBeenCalledWith('/teams/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMembers', () => {
    it('fetches team members', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 'u1', firstName: 'John' }]
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await teamsService.getMembers('team1');

      expect(api.get).toHaveBeenCalledWith('/teams/team1/members');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('addMember', () => {
    it('adds a member to a team', async () => {
      const mockResponse = { success: true };
      api.post.mockResolvedValue(mockResponse);

      const result = await teamsService.addMember('team1', 'user1');

      expect(api.post).toHaveBeenCalledWith('/teams/team1/members', { userId: 'user1' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('removeMember', () => {
    it('removes a member from a team', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValue(mockResponse);

      const result = await teamsService.removeMember('team1', 'user1');

      expect(api.delete).toHaveBeenCalledWith('/teams/team1/members/user1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProjects', () => {
    it('fetches team projects', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 'p1', name: 'Project A' }]
      };
      api.get.mockResolvedValue(mockResponse);

      const result = await teamsService.getProjects('team1');

      expect(api.get).toHaveBeenCalledWith('/teams/team1/projects');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('assignProject', () => {
    it('assigns a project to a team', async () => {
      const mockResponse = { success: true };
      api.post.mockResolvedValue(mockResponse);

      const result = await teamsService.assignProject('team1', 'project1');

      expect(api.post).toHaveBeenCalledWith('/teams/team1/projects', { projectId: 'project1' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('unassignProject', () => {
    it('unassigns a project from a team', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValue(mockResponse);

      const result = await teamsService.unassignProject('team1', 'project1');

      expect(api.delete).toHaveBeenCalledWith('/teams/team1/projects/project1');
      expect(result).toEqual(mockResponse);
    });
  });
});
