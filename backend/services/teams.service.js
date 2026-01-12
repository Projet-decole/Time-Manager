// backend/services/teams.service.js

const { supabase } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel, camelToSnake } = require('../utils/transformers');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * Get all teams with pagination, member counts and project counts
 * @param {Object} pagination - Pagination options { page?: number, limit?: number }
 * @returns {Promise<Object>} { data: Team[], pagination: PaginationMeta }
 * @throws {AppError} If database query fails
 */
const getAll = async (pagination = {}) => {
  const { page, limit, offset } = parsePaginationParams(pagination);

  // Get teams with member and project counts using subqueries
  const { data, error, count } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      description,
      created_at,
      updated_at,
      team_members(count),
      team_projects(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[TEAMS] Get all teams failed:', { error: error.message });
    throw new AppError('Failed to retrieve teams', 500, 'DATABASE_ERROR');
  }

  // Transform data to camelCase and add memberCount and projectCount
  const transformedData = (data || []).map(team => {
    const { team_members, team_projects, ...rest } = team;
    const memberCount = team_members?.[0]?.count || 0;
    const projectCount = team_projects?.[0]?.count || 0;
    return {
      ...snakeToCamel(rest),
      memberCount,
      projectCount
    };
  });

  return {
    data: transformedData,
    pagination: buildPaginationMeta(page, limit, count || 0)
  };
};

/**
 * Get team by ID with members and projects
 * @param {string} id - Team UUID
 * @returns {Promise<Object>} Team data with members and projects in camelCase
 * @throws {AppError} If team not found
 */
const getById = async (id) => {
  // Get team with members and projects
  const { data, error } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      description,
      created_at,
      updated_at,
      team_members(
        profiles(
          id,
          email,
          first_name,
          last_name,
          role
        )
      ),
      team_projects(
        projects(
          id,
          code,
          name
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('Team not found', 404, 'NOT_FOUND');
  }

  // Transform to camelCase and flatten relations
  const { team_members, team_projects, ...teamData } = data;

  // Extract members from nested structure
  const members = (team_members || [])
    .filter(tm => tm.profiles) // Filter out any null profiles
    .map(tm => snakeToCamel(tm.profiles));

  // Extract projects from nested structure
  const projects = (team_projects || [])
    .filter(tp => tp.projects) // Filter out any null projects
    .map(tp => snakeToCamel(tp.projects));

  return {
    ...snakeToCamel(teamData),
    members,
    projects
  };
};

/**
 * Create a new team
 * @param {Object} data - Team data { name, description? }
 * @returns {Promise<Object>} Created team in camelCase
 * @throws {AppError} If creation fails
 */
const create = async (data) => {
  const { name, description } = data;

  const { data: createdTeam, error } = await supabase
    .from('teams')
    .insert({
      name,
      description: description || null
    })
    .select('id, name, description, created_at, updated_at')
    .single();

  if (error) {
    // Check for duplicate name (unique constraint)
    if (error.code === '23505' || error.message.includes('duplicate')) {
      throw new AppError('A team with this name already exists', 409, 'DUPLICATE_NAME');
    }
    console.error('[TEAMS] Create team failed:', { error: error.message });
    throw new AppError('Failed to create team', 500, 'CREATE_FAILED');
  }

  return snakeToCamel(createdTeam);
};

/**
 * Update an existing team
 * @param {string} id - Team UUID
 * @param {Object} data - Update data { name?, description? }
 * @returns {Promise<Object>} Updated team in camelCase
 * @throws {AppError} If team not found or update fails
 */
const update = async (id, data) => {
  // Whitelist allowed fields
  const allowedFields = ['name', 'description'];
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([key]) => allowedFields.includes(key))
  );

  // If no valid fields to update, return error (validator should prevent this)
  if (Object.keys(filtered).length === 0) {
    throw new AppError('No valid fields provided for update', 400, 'VALIDATION_ERROR');
  }

  // Convert to snake_case for database and add updated_at timestamp
  const dbData = {
    ...camelToSnake(filtered),
    updated_at: new Date().toISOString()
  };

  const { data: updatedTeam, error } = await supabase
    .from('teams')
    .update(dbData)
    .eq('id', id)
    .select('id, name, description, created_at, updated_at')
    .single();

  if (error) {
    // Check for duplicate name first (before checking not found)
    if (error.code === '23505' || error.message.includes('duplicate')) {
      throw new AppError('A team with this name already exists', 409, 'DUPLICATE_NAME');
    }
    // Check for not found error
    if (error.code === 'PGRST116') {
      throw new AppError('Team not found', 404, 'NOT_FOUND');
    }
    console.error('[TEAMS] Update team failed:', { id, error: error.message });
    throw new AppError('Update failed', 500, 'UPDATE_FAILED');
  }

  if (!updatedTeam) {
    throw new AppError('Team not found', 404, 'NOT_FOUND');
  }

  return snakeToCamel(updatedTeam);
};

/**
 * Delete a team
 * Database CASCADE handles removing team_members and team_projects
 * @param {string} id - Team UUID
 * @returns {Promise<Object>} Success message
 * @throws {AppError} If team not found
 */
const remove = async (id) => {
  // First check if team exists
  const { data: existingTeam, error: findError } = await supabase
    .from('teams')
    .select('id')
    .eq('id', id)
    .single();

  if (findError || !existingTeam) {
    throw new AppError('Team not found', 404, 'NOT_FOUND');
  }

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[TEAMS] Delete team failed:', { id, error: error.message });
    throw new AppError('Failed to delete team', 500, 'DELETE_FAILED');
  }

  return { message: 'Team deleted successfully' };
};

/**
 * Get team members with pagination
 * Story 3.2: Team Member Assignment API - AC4
 * @param {string} teamId - Team UUID
 * @param {Object} pagination - Pagination options { page?: number, limit?: number }
 * @returns {Promise<Object>} { data: Member[], pagination: PaginationMeta }
 * @throws {AppError} If team not found or database query fails
 */
const getMembers = async (teamId, pagination = {}) => {
  // First verify team exists
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .single();

  if (teamError || !team) {
    throw new AppError('Team not found', 404, 'NOT_FOUND');
  }

  const { page, limit, offset } = parsePaginationParams(pagination);

  // Get team members with profile data
  const { data, error, count } = await supabase
    .from('team_members')
    .select(`
      id,
      team_id,
      user_id,
      created_at,
      profiles(
        id,
        email,
        first_name,
        last_name,
        role
      )
    `, { count: 'exact' })
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[TEAMS] Get team members failed:', { teamId, error: error.message });
    throw new AppError('Failed to retrieve team members', 500, 'DATABASE_ERROR');
  }

  // Transform data to camelCase and flatten user profile
  const transformedData = (data || []).map(member => ({
    id: member.id,
    userId: member.user_id,
    teamId: member.team_id,
    createdAt: member.created_at,
    user: member.profiles ? snakeToCamel(member.profiles) : null
  }));

  return {
    data: transformedData,
    pagination: buildPaginationMeta(page, limit, count || 0)
  };
};

/**
 * Add a member to a team
 * Story 3.2: Team Member Assignment API - AC1
 * @param {string} teamId - Team UUID
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Created membership in camelCase
 * @throws {AppError} If team/user not found or already a member
 */
const addMember = async (teamId, userId) => {
  // Verify team exists
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .single();

  if (teamError || !team) {
    throw new AppError('Team not found', 404, 'TEAM_NOT_FOUND');
  }

  // Verify user exists
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Insert the membership
  const { data: membership, error: insertError } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId
    })
    .select('id, team_id, user_id, created_at')
    .single();

  if (insertError) {
    // Check for duplicate (UNIQUE constraint violation)
    if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
      throw new AppError('User already in team', 400, 'ALREADY_MEMBER');
    }
    console.error('[TEAMS] Add member failed:', { teamId, userId, error: insertError.message });
    throw new AppError('Failed to add member to team', 500, 'ADD_MEMBER_FAILED');
  }

  return {
    id: membership.id,
    teamId: membership.team_id,
    userId: membership.user_id,
    createdAt: membership.created_at
  };
};

/**
 * Remove a member from a team
 * Story 3.2: Team Member Assignment API - AC3
 * @param {string} teamId - Team UUID
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Success message
 * @throws {AppError} If membership not found
 */
const removeMember = async (teamId, userId) => {
  // First check if membership exists
  const { data: membership, error: findError } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single();

  if (findError || !membership) {
    throw new AppError('Member not found in team', 404, 'NOT_MEMBER');
  }

  const { error: deleteError } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (deleteError) {
    console.error('[TEAMS] Remove member failed:', { teamId, userId, error: deleteError.message });
    throw new AppError('Failed to remove member from team', 500, 'REMOVE_MEMBER_FAILED');
  }

  return { message: 'Member removed successfully' };
};

/**
 * Check if a user is a member of a team
 * Story 3.2: Team Member Assignment API
 * @param {string} teamId - Team UUID
 * @param {string} userId - User UUID
 * @returns {Promise<boolean>} True if member, false otherwise
 */
const isMember = async (teamId, userId) => {
  const { data, error } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
};

// ===========================================
// Story 3.4: Team-Project Assignment API
// ===========================================

/**
 * Get team projects with pagination
 * Story 3.4: Team-Project Assignment API - AC4
 * @param {string} teamId - Team UUID
 * @param {Object} pagination - Pagination options { page?: number, limit?: number }
 * @returns {Promise<Object>} { data: TeamProject[], pagination: PaginationMeta }
 * @throws {AppError} If team not found or database query fails
 */
const getProjects = async (teamId, pagination = {}) => {
  // First verify team exists
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .single();

  if (teamError || !team) {
    throw new AppError('Team not found', 404, 'NOT_FOUND');
  }

  const { page, limit, offset } = parsePaginationParams(pagination);

  // Get team projects with project data
  const { data, error, count } = await supabase
    .from('team_projects')
    .select(`
      id,
      team_id,
      project_id,
      created_at,
      projects(
        id,
        code,
        name,
        description,
        budget_hours,
        status
      )
    `, { count: 'exact' })
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[TEAMS] Get team projects failed:', { teamId, error: error.message });
    throw new AppError('Failed to retrieve team projects', 500, 'DATABASE_ERROR');
  }

  // Transform data to camelCase and flatten project data
  const transformedData = (data || []).map(teamProject => ({
    id: teamProject.id,
    teamId: teamProject.team_id,
    projectId: teamProject.project_id,
    createdAt: teamProject.created_at,
    project: teamProject.projects ? snakeToCamel(teamProject.projects) : null
  }));

  return {
    data: transformedData,
    pagination: buildPaginationMeta(page, limit, count || 0)
  };
};

/**
 * Assign a project to a team
 * Story 3.4: Team-Project Assignment API - AC1
 * @param {string} teamId - Team UUID
 * @param {string} projectId - Project UUID
 * @returns {Promise<Object>} Created assignment in camelCase
 * @throws {AppError} If team/project not found or already assigned
 */
const assignProject = async (teamId, projectId) => {
  // Verify team exists
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .single();

  if (teamError || !team) {
    throw new AppError('Team not found', 404, 'TEAM_NOT_FOUND');
  }

  // Verify project exists
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
  }

  // Insert the assignment
  const { data: assignment, error: insertError } = await supabase
    .from('team_projects')
    .insert({
      team_id: teamId,
      project_id: projectId
    })
    .select('id, team_id, project_id, created_at')
    .single();

  if (insertError) {
    // Check for duplicate (UNIQUE constraint violation)
    if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
      throw new AppError('Project already assigned to team', 400, 'ALREADY_ASSIGNED');
    }
    console.error('[TEAMS] Assign project failed:', { teamId, projectId, error: insertError.message });
    throw new AppError('Failed to assign project to team', 500, 'ASSIGN_PROJECT_FAILED');
  }

  return {
    id: assignment.id,
    teamId: assignment.team_id,
    projectId: assignment.project_id,
    createdAt: assignment.created_at
  };
};

/**
 * Unassign a project from a team
 * Story 3.4: Team-Project Assignment API - AC3
 * @param {string} teamId - Team UUID
 * @param {string} projectId - Project UUID
 * @returns {Promise<Object>} Success message
 * @throws {AppError} If assignment not found
 */
const unassignProject = async (teamId, projectId) => {
  // First check if assignment exists
  const { data: assignment, error: findError } = await supabase
    .from('team_projects')
    .select('id')
    .eq('team_id', teamId)
    .eq('project_id', projectId)
    .single();

  if (findError || !assignment) {
    throw new AppError('Project not assigned to team', 404, 'NOT_ASSIGNED');
  }

  const { error: deleteError } = await supabase
    .from('team_projects')
    .delete()
    .eq('team_id', teamId)
    .eq('project_id', projectId);

  if (deleteError) {
    console.error('[TEAMS] Unassign project failed:', { teamId, projectId, error: deleteError.message });
    throw new AppError('Failed to unassign project from team', 500, 'UNASSIGN_PROJECT_FAILED');
  }

  return { message: 'Project unassigned successfully' };
};

/**
 * Check if a project is assigned to a team
 * Story 3.4: Team-Project Assignment API
 * @param {string} teamId - Team UUID
 * @param {string} projectId - Project UUID
 * @returns {Promise<boolean>} True if assigned, false otherwise
 */
const isProjectAssigned = async (teamId, projectId) => {
  const { data, error } = await supabase
    .from('team_projects')
    .select('id')
    .eq('team_id', teamId)
    .eq('project_id', projectId)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getMembers,
  addMember,
  removeMember,
  isMember,
  getProjects,
  assignProject,
  unassignProject,
  isProjectAssigned
};
