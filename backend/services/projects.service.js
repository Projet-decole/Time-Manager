// backend/services/projects.service.js

const { supabase } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel, camelToSnake } = require('../utils/transformers');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * Generate the next sequential project code
 * Format: PRJ-XXX where XXX is padded to 3 digits minimum
 * Uses numeric sorting to avoid alphabetical ordering issues (PRJ-999 vs PRJ-1000)
 * @returns {Promise<string>} Next code like "PRJ-001", "PRJ-002", etc.
 * @throws {AppError} If database query fails
 */
const generateNextCode = async () => {
  // Get all project codes to find the maximum numerically
  // Note: Alphabetical sort fails for PRJ-999 vs PRJ-1000, so we must sort numerically
  const { data, error } = await supabase
    .from('projects')
    .select('code');

  if (error) {
    console.error('[PROJECTS] Failed to generate next code:', { error: error.message });
    throw new AppError('Failed to generate project code', 500, 'CODE_GENERATION_FAILED');
  }

  let maxNumber = 0;

  if (data && data.length > 0) {
    // Extract all numbers and find the maximum
    for (const project of data) {
      if (!project.code) continue; // Skip null/undefined codes
      const match = project.code.match(/PRJ-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }
  }

  const nextNumber = maxNumber + 1;

  // Pad to 3 digits minimum
  return `PRJ-${String(nextNumber).padStart(3, '0')}`;
};

/**
 * Get all projects with pagination and total hours tracked
 * @param {Object} options - Query options
 * @param {boolean} options.includeArchived - Include archived projects (manager only)
 * @param {Object} options.pagination - Pagination options { page?, limit? }
 * @returns {Promise<Object>} { data: Project[], pagination: PaginationMeta }
 * @throws {AppError} If database query fails
 */
const getAll = async (options = {}) => {
  const { includeArchived = false, ...pagination } = options;
  const { page, limit, offset } = parsePaginationParams(pagination);

  // Build query with time_entries aggregation
  let query = supabase
    .from('projects')
    .select(`
      id,
      code,
      name,
      description,
      budget_hours,
      status,
      created_at,
      updated_at,
      time_entries(duration_minutes)
    `, { count: 'exact' });

  // Filter by status unless includeArchived is true
  if (!includeArchived) {
    query = query.eq('status', 'active');
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[PROJECTS] Get all projects failed:', { error: error.message });
    throw new AppError('Failed to retrieve projects', 500, 'DATABASE_ERROR');
  }

  // Transform data to camelCase and calculate total hours tracked
  const transformedData = (data || []).map(project => {
    const { time_entries, ...rest } = project;

    // Calculate total hours from duration_minutes
    const totalMinutes = (time_entries || []).reduce((sum, entry) => {
      return sum + (entry.duration_minutes || 0);
    }, 0);
    const totalHoursTracked = Math.round((totalMinutes / 60) * 100) / 100; // Round to 2 decimals

    return {
      ...snakeToCamel(rest),
      totalHoursTracked
    };
  });

  return {
    data: transformedData,
    pagination: buildPaginationMeta(page, limit, count || 0)
  };
};

/**
 * Get project by ID with teams and total hours tracked
 * @param {string} id - Project UUID
 * @returns {Promise<Object>} Project data with teams and hours in camelCase
 * @throws {AppError} If project not found
 */
const getById = async (id) => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      code,
      name,
      description,
      budget_hours,
      status,
      created_at,
      updated_at,
      time_entries(duration_minutes),
      team_projects(
        teams(
          id,
          name
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('Project not found', 404, 'NOT_FOUND');
  }

  // Transform to camelCase and flatten relations
  const { time_entries, team_projects, ...projectData } = data;

  // Calculate total hours from duration_minutes
  const totalMinutes = (time_entries || []).reduce((sum, entry) => {
    return sum + (entry.duration_minutes || 0);
  }, 0);
  const totalHoursTracked = Math.round((totalMinutes / 60) * 100) / 100;

  // Extract teams from nested structure
  const teams = (team_projects || [])
    .filter(tp => tp.teams) // Filter out any null teams
    .map(tp => snakeToCamel(tp.teams));

  return {
    ...snakeToCamel(projectData),
    totalHoursTracked,
    teams
  };
};

/**
 * Create a new project with retry logic for race conditions
 * @param {Object} data - Project data { name, description?, budgetHours? }
 * @param {number} retryCount - Internal retry counter (default: 0)
 * @returns {Promise<Object>} Created project in camelCase
 * @throws {AppError} If creation fails after retries
 */
const create = async (data, retryCount = 0) => {
  const MAX_RETRIES = 3;
  const { name, description, budgetHours } = data;

  // Generate the next sequential code
  const code = await generateNextCode();

  const { data: createdProject, error } = await supabase
    .from('projects')
    .insert({
      code,
      name,
      description: description || null,
      budget_hours: budgetHours || null,
      status: 'active'
    })
    .select('id, code, name, description, budget_hours, status, created_at, updated_at')
    .single();

  if (error) {
    // Check for duplicate code (unique constraint) - retry if race condition
    if (error.code === '23505' || error.message.includes('duplicate')) {
      if (retryCount < MAX_RETRIES) {
        // Race condition: another request created a project with this code
        // Wait a small random delay and retry
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return create(data, retryCount + 1);
      }
      throw new AppError('Failed to generate unique project code after retries', 409, 'DUPLICATE_CODE');
    }
    console.error('[PROJECTS] Create project failed:', { error: error.message });
    throw new AppError('Failed to create project', 500, 'CREATE_FAILED');
  }

  return snakeToCamel(createdProject);
};

/**
 * Update an existing project
 * @param {string} id - Project UUID
 * @param {Object} data - Update data { name?, description?, budgetHours? }
 * @returns {Promise<Object>} Updated project in camelCase
 * @throws {AppError} If project not found or update fails
 */
const update = async (id, data) => {
  // Whitelist allowed fields (code is immutable)
  const allowedFields = ['name', 'description', 'budgetHours'];
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([key]) => allowedFields.includes(key))
  );

  // If no valid fields to update, fetch and return current project
  if (Object.keys(filtered).length === 0) {
    return getById(id);
  }

  // Convert to snake_case for database and add updated_at timestamp
  const dbData = {
    ...camelToSnake(filtered),
    updated_at: new Date().toISOString()
  };

  const { data: updatedProject, error } = await supabase
    .from('projects')
    .update(dbData)
    .eq('id', id)
    .select('id, code, name, description, budget_hours, status, created_at, updated_at')
    .single();

  if (error) {
    // Check for not found error
    if (error.code === 'PGRST116') {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }
    console.error('[PROJECTS] Update project failed:', { id, error: error.message });
    throw new AppError('Update failed', 500, 'UPDATE_FAILED');
  }

  if (!updatedProject) {
    throw new AppError('Project not found', 404, 'NOT_FOUND');
  }

  return snakeToCamel(updatedProject);
};

/**
 * Archive a project (soft delete)
 * @param {string} id - Project UUID
 * @returns {Promise<Object>} Archived project in camelCase
 * @throws {AppError} If project not found
 */
const archive = async (id) => {
  const { data: archivedProject, error } = await supabase
    .from('projects')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, code, name, description, budget_hours, status, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }
    console.error('[PROJECTS] Archive project failed:', { id, error: error.message });
    throw new AppError('Failed to archive project', 500, 'ARCHIVE_FAILED');
  }

  if (!archivedProject) {
    throw new AppError('Project not found', 404, 'NOT_FOUND');
  }

  return snakeToCamel(archivedProject);
};

/**
 * Restore an archived project
 * @param {string} id - Project UUID
 * @returns {Promise<Object>} Restored project in camelCase
 * @throws {AppError} If project not found
 */
const restore = async (id) => {
  const { data: restoredProject, error } = await supabase
    .from('projects')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, code, name, description, budget_hours, status, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }
    console.error('[PROJECTS] Restore project failed:', { id, error: error.message });
    throw new AppError('Failed to restore project', 500, 'RESTORE_FAILED');
  }

  if (!restoredProject) {
    throw new AppError('Project not found', 404, 'NOT_FOUND');
  }

  return snakeToCamel(restoredProject);
};

/**
 * Get projects assigned to user's teams
 * Story 3.4: Team-Project Assignment API - AC5
 * @param {string} userId - User UUID
 * @param {Object} pagination - Pagination options { page?, limit? }
 * @returns {Promise<Object>} { data: Project[], pagination: PaginationMeta }
 * @throws {AppError} If database query fails
 */
const getProjectsForUserTeams = async (userId, pagination = {}) => {
  const { page, limit, offset } = parsePaginationParams(pagination);

  // First get all team IDs the user belongs to
  const { data: memberships, error: memberError } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId);

  if (memberError) {
    console.error('[PROJECTS] Get user teams failed:', { userId, error: memberError.message });
    throw new AppError('Failed to retrieve user teams', 500, 'DATABASE_ERROR');
  }

  // If user is not in any teams, return empty result
  if (!memberships || memberships.length === 0) {
    return {
      data: [],
      pagination: buildPaginationMeta(page, limit, 0)
    };
  }

  const teamIds = memberships.map(m => m.team_id);

  // Get projects assigned to those teams
  const { data: teamProjects, error: projectsError } = await supabase
    .from('team_projects')
    .select('project_id')
    .in('team_id', teamIds);

  if (projectsError) {
    console.error('[PROJECTS] Get team projects failed:', { teamIds, error: projectsError.message });
    throw new AppError('Failed to retrieve team projects', 500, 'DATABASE_ERROR');
  }

  // If no projects assigned to user's teams, return empty result
  if (!teamProjects || teamProjects.length === 0) {
    return {
      data: [],
      pagination: buildPaginationMeta(page, limit, 0)
    };
  }

  // Get unique project IDs
  const projectIds = [...new Set(teamProjects.map(tp => tp.project_id))];

  // Get projects with pagination
  const { data, error, count } = await supabase
    .from('projects')
    .select(`
      id,
      code,
      name,
      description,
      budget_hours,
      status,
      created_at,
      updated_at,
      time_entries(duration_minutes)
    `, { count: 'exact' })
    .in('id', projectIds)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[PROJECTS] Get projects by IDs failed:', { projectIds, error: error.message });
    throw new AppError('Failed to retrieve projects', 500, 'DATABASE_ERROR');
  }

  // Transform data to camelCase and calculate total hours tracked
  const transformedData = (data || []).map(project => {
    const { time_entries, ...rest } = project;

    // Calculate total hours from duration_minutes
    const totalMinutes = (time_entries || []).reduce((sum, entry) => {
      return sum + (entry.duration_minutes || 0);
    }, 0);
    const totalHoursTracked = Math.round((totalMinutes / 60) * 100) / 100;

    return {
      ...snakeToCamel(rest),
      totalHoursTracked
    };
  });

  return {
    data: transformedData,
    pagination: buildPaginationMeta(page, limit, count || 0)
  };
};

module.exports = { getAll, getById, create, update, archive, restore, generateNextCode, getProjectsForUserTeams };
