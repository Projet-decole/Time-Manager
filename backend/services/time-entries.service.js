// backend/services/time-entries.service.js

const { supabase } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel, camelToSnake } = require('../utils/transformers');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * Calculate the Monday (start of week) for a given date
 * @param {string|Date} date - Date to calculate week start for
 * @returns {string} Week start date in 'YYYY-MM-DD' format
 * Story 4.1: Time Entries CRUD API - Timesheet status check
 */
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
};

/**
 * Calculate duration in minutes between two timestamps
 * @param {string} startTime - Start timestamp
 * @param {string|null} endTime - End timestamp (optional)
 * @returns {number|null} Duration in minutes, or null if endTime is not provided
 * Story 4.1: Time Entries CRUD API - AC8
 */
const calculateDuration = (startTime, endTime) => {
  if (!endTime) return null;
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  return Math.round(diffMs / 60000); // Convert to minutes
};

/**
 * Check if a timesheet exists for the user's entry date and if modifications are allowed
 * @param {string} userId - User UUID
 * @param {string} entryDate - Date of the time entry
 * @returns {Promise<Object>} { canModify: boolean, status?: string }
 * Story 4.1: Time Entries CRUD API - AC4, AC5
 */
const checkTimesheetStatus = async (userId, entryDate) => {
  const weekStart = getWeekStart(entryDate);

  const { data: timesheet, error } = await supabase
    .from('timesheets')
    .select('id, status')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (error) {
    console.error('[TIME_ENTRIES] Check timesheet status failed:', { error: error.message });
    // Fail-closed: if we can't verify timesheet status, block modification for data integrity
    throw new AppError('Unable to verify timesheet status', 500, 'TIMESHEET_CHECK_FAILED');
  }

  if (!timesheet) return { canModify: true };
  if (timesheet.status === 'draft') return { canModify: true };

  return { canModify: false, status: timesheet.status };
};

/**
 * Get all time entries for a user with pagination and filters
 * @param {string} userId - User UUID requesting the entries
 * @param {Object} options - Query options
 * @param {string} options.targetUserId - User ID to fetch entries for (manager only)
 * @param {string} options.role - Role of the requesting user
 * @param {string} options.startDate - Filter by start date (YYYY-MM-DD)
 * @param {string} options.endDate - Filter by end date (YYYY-MM-DD)
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @returns {Promise<Object>} { data: TimeEntry[], pagination: PaginationMeta }
 * @throws {AppError} If database query fails
 * Story 4.1: Time Entries CRUD API - AC2, AC6
 */
const getAll = async (userId, options = {}) => {
  const { targetUserId, role, startDate, endDate } = options;
  const { page, limit, offset } = parsePaginationParams(options);

  // Determine which user's entries to fetch
  // Managers can view any user's entries via ?userId= parameter
  let fetchUserId = userId;
  if (role === 'manager' && targetUserId) {
    fetchUserId = targetUserId;
  }

  let query = supabase
    .from('time_entries')
    .select(`
      id,
      user_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      parent_id,
      created_at,
      updated_at,
      projects:project_id (
        id,
        code,
        name
      ),
      categories:category_id (
        id,
        name,
        color
      )
    `, { count: 'exact' })
    .eq('user_id', fetchUserId);

  // Apply date range filters
  if (startDate) {
    const startDateTime = new Date(startDate);
    startDateTime.setUTCHours(0, 0, 0, 0);
    query = query.gte('start_time', startDateTime.toISOString());
  }

  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setUTCHours(23, 59, 59, 999);
    query = query.lte('start_time', endDateTime.toISOString());
  }

  const { data, error, count } = await query
    .order('start_time', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[TIME_ENTRIES] Get all time entries failed:', { error: error.message });
    throw new AppError('Failed to retrieve time entries', 500, 'DATABASE_ERROR');
  }

  // Transform data to camelCase and flatten relations
  const transformedData = (data || []).map(entry => {
    const transformed = snakeToCamel(entry);
    // Flatten project and category data
    if (transformed.projects) {
      transformed.project = transformed.projects;
      delete transformed.projects;
    }
    if (transformed.categories) {
      transformed.category = transformed.categories;
      delete transformed.categories;
    }
    return transformed;
  });

  return {
    data: transformedData,
    pagination: buildPaginationMeta(page, limit, count || 0)
  };
};

/**
 * Get time entry by ID
 * @param {string} id - Time entry UUID
 * @param {string} requestingUserId - User UUID making the request
 * @param {string} userRole - Role of the requesting user
 * @returns {Promise<Object>} Time entry data in camelCase
 * @throws {AppError} If entry not found or user not authorized
 * Story 4.1: Time Entries CRUD API - AC3
 */
const getById = async (id, requestingUserId, userRole) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      id,
      user_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      parent_id,
      created_at,
      updated_at,
      projects:project_id (
        id,
        code,
        name
      ),
      categories:category_id (
        id,
        name,
        color
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('Time entry not found', 404, 'NOT_FOUND');
  }

  // Check authorization: employees can only view their own entries
  if (userRole !== 'manager' && data.user_id !== requestingUserId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  // Transform to camelCase and flatten relations
  const transformed = snakeToCamel(data);
  if (transformed.projects) {
    transformed.project = transformed.projects;
    delete transformed.projects;
  }
  if (transformed.categories) {
    transformed.category = transformed.categories;
    delete transformed.categories;
  }

  return transformed;
};

/**
 * Create a new time entry
 * @param {string} userId - User UUID
 * @param {Object} data - Time entry data
 * @param {string} data.startTime - Start time (ISO 8601)
 * @param {string} data.endTime - End time (ISO 8601, optional)
 * @param {string} data.projectId - Project UUID (optional)
 * @param {string} data.categoryId - Category UUID (optional)
 * @param {string} data.description - Description (optional)
 * @param {string} data.entryMode - Entry mode ('simple', 'day', 'template')
 * @returns {Promise<Object>} Created time entry in camelCase
 * @throws {AppError} If creation fails
 * Story 4.1: Time Entries CRUD API - AC1
 */
const create = async (userId, data) => {
  const { startTime, endTime, projectId, categoryId, description, entryMode } = data;

  // Calculate duration if endTime is provided
  const durationMinutes = calculateDuration(startTime, endTime);

  const insertData = {
    user_id: userId,
    start_time: startTime,
    end_time: endTime || null,
    duration_minutes: durationMinutes,
    project_id: projectId || null,
    category_id: categoryId || null,
    description: description || null,
    entry_mode: entryMode
  };

  const { data: createdEntry, error } = await supabase
    .from('time_entries')
    .insert(insertData)
    .select(`
      id,
      user_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    // Check for foreign key violations
    if (error.code === '23503') {
      if (error.message.includes('project_id')) {
        throw new AppError('Project not found', 400, 'INVALID_PROJECT_ID');
      }
      if (error.message.includes('category_id')) {
        throw new AppError('Category not found', 400, 'INVALID_CATEGORY_ID');
      }
    }
    console.error('[TIME_ENTRIES] Create time entry failed:', { error: error.message });
    throw new AppError('Failed to create time entry', 500, 'CREATE_FAILED');
  }

  return snakeToCamel(createdEntry);
};

/**
 * Update an existing time entry
 * @param {string} id - Time entry UUID
 * @param {string} userId - User UUID making the request
 * @param {Object} data - Update data
 * @param {string} userRole - Role of the requesting user
 * @returns {Promise<Object>} Updated time entry in camelCase
 * @throws {AppError} If entry not found, not authorized, or in non-draft timesheet
 * Story 4.1: Time Entries CRUD API - AC4
 */
const update = async (id, userId, data, userRole) => {
  // First, fetch the existing entry to check ownership and timesheet status
  const { data: existingEntry, error: fetchError } = await supabase
    .from('time_entries')
    .select('id, user_id, start_time, end_time')
    .eq('id', id)
    .single();

  if (fetchError || !existingEntry) {
    throw new AppError('Time entry not found', 404, 'NOT_FOUND');
  }

  // Check ownership (managers can only view, not edit others' entries per story spec)
  if (existingEntry.user_id !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  // Check timesheet status
  const timesheetCheck = await checkTimesheetStatus(userId, existingEntry.start_time);
  if (!timesheetCheck.canModify) {
    throw new AppError(
      'Cannot modify time entry in submitted/validated timesheet',
      403,
      'TIMESHEET_LOCKED'
    );
  }

  // Whitelist allowed fields
  const allowedFields = ['startTime', 'endTime', 'projectId', 'categoryId', 'description'];
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([key]) => allowedFields.includes(key))
  );

  // If no valid fields to update, return current entry
  if (Object.keys(filtered).length === 0) {
    return getById(id, userId, userRole);
  }

  // Convert to snake_case for database
  const dbData = camelToSnake(filtered);

  // Recalculate duration if startTime or endTime changes
  const newStartTime = filtered.startTime || existingEntry.start_time;
  const newEndTime = filtered.hasOwnProperty('endTime') ? filtered.endTime : existingEntry.end_time;
  dbData.duration_minutes = calculateDuration(newStartTime, newEndTime);

  // Add updated_at timestamp
  dbData.updated_at = new Date().toISOString();

  const { data: updatedEntry, error } = await supabase
    .from('time_entries')
    .update(dbData)
    .eq('id', id)
    .select(`
      id,
      user_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    // Check for foreign key violations
    if (error.code === '23503') {
      if (error.message.includes('project_id')) {
        throw new AppError('Project not found', 400, 'INVALID_PROJECT_ID');
      }
      if (error.message.includes('category_id')) {
        throw new AppError('Category not found', 400, 'INVALID_CATEGORY_ID');
      }
    }
    if (error.code === 'PGRST116') {
      throw new AppError('Time entry not found', 404, 'NOT_FOUND');
    }
    console.error('[TIME_ENTRIES] Update time entry failed:', { id, error: error.message });
    throw new AppError('Update failed', 500, 'UPDATE_FAILED');
  }

  if (!updatedEntry) {
    throw new AppError('Time entry not found', 404, 'NOT_FOUND');
  }

  return snakeToCamel(updatedEntry);
};

/**
 * Delete a time entry
 * @param {string} id - Time entry UUID
 * @param {string} userId - User UUID making the request
 * @param {string} userRole - Role of the requesting user
 * @returns {Promise<Object>} Success message
 * @throws {AppError} If entry not found, not authorized, or in non-draft timesheet
 * Story 4.1: Time Entries CRUD API - AC5
 */
const remove = async (id, userId, userRole) => {
  // First, fetch the existing entry to check ownership and timesheet status
  const { data: existingEntry, error: fetchError } = await supabase
    .from('time_entries')
    .select('id, user_id, start_time')
    .eq('id', id)
    .single();

  if (fetchError || !existingEntry) {
    throw new AppError('Time entry not found', 404, 'NOT_FOUND');
  }

  // Check ownership
  if (existingEntry.user_id !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  // Check timesheet status
  const timesheetCheck = await checkTimesheetStatus(userId, existingEntry.start_time);
  if (!timesheetCheck.canModify) {
    throw new AppError(
      'Cannot delete time entry in submitted/validated timesheet',
      403,
      'TIMESHEET_LOCKED'
    );
  }

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[TIME_ENTRIES] Delete time entry failed:', { id, error: error.message });
    throw new AppError('Failed to delete time entry', 500, 'DELETE_FAILED');
  }

  return { message: 'Time entry deleted successfully' };
};

/**
 * Get active timer for a user (Simple Mode only)
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} Active time entry or null
 * Story 4.2: Simple Mode Start Timer API - AC3
 */
const getActiveTimer = async (userId) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      id,
      user_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      created_at,
      updated_at,
      projects:project_id (
        id,
        code,
        name
      ),
      categories:category_id (
        id,
        name,
        color
      )
    `)
    .eq('user_id', userId)
    .is('end_time', null)
    .eq('entry_mode', 'simple')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[TIME_ENTRIES] Get active timer failed:', { error: error.message });
    throw new AppError('Failed to check active timer', 500, 'DATABASE_ERROR');
  }

  if (!data) return null;

  // Transform to camelCase and flatten relations
  const transformed = snakeToCamel(data);
  if (transformed.projects) {
    transformed.project = transformed.projects;
    delete transformed.projects;
  }
  if (transformed.categories) {
    transformed.category = transformed.categories;
    delete transformed.categories;
  }

  return transformed;
};

/**
 * Start a new timer (Simple Mode)
 * @param {string} userId - User UUID
 * @param {Object} data - Timer data
 * @param {string} data.projectId - Project UUID (optional)
 * @param {string} data.categoryId - Category UUID (optional)
 * @param {string} data.description - Description (optional)
 * @returns {Promise<Object>} Created time entry in camelCase
 * @throws {AppError} If timer already running or creation fails
 * Story 4.2: Simple Mode Start Timer API - AC1, AC2, AC4
 */
const startTimer = async (userId, data = {}) => {
  // 1. Check for existing active timer
  const activeTimer = await getActiveTimer(userId);
  if (activeTimer) {
    const error = new AppError('Timer already running', 400, 'TIMER_ALREADY_RUNNING');
    error.data = activeTimer;
    throw error;
  }

  // 2. Create new entry with startTime = now
  const insertData = {
    user_id: userId,
    start_time: new Date().toISOString(),
    end_time: null,
    duration_minutes: null,
    project_id: data.projectId || null,
    category_id: data.categoryId || null,
    description: data.description || null,
    entry_mode: 'simple'
  };

  const { data: createdEntry, error } = await supabase
    .from('time_entries')
    .insert(insertData)
    .select(`
      id,
      user_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    // Handle FK violations
    if (error.code === '23503') {
      if (error.message.includes('project_id')) {
        throw new AppError('Project not found', 400, 'INVALID_PROJECT_ID');
      }
      if (error.message.includes('category_id')) {
        throw new AppError('Category not found', 400, 'INVALID_CATEGORY_ID');
      }
    }
    console.error('[TIME_ENTRIES] Start timer failed:', { error: error.message });
    throw new AppError('Failed to start timer', 500, 'CREATE_FAILED');
  }

  return snakeToCamel(createdEntry);
};

/**
 * Stop the active timer for a user (Simple Mode)
 * @param {string} userId - User UUID
 * @param {Object} data - Optional update data
 * @param {string} data.projectId - Project UUID (optional)
 * @param {string} data.categoryId - Category UUID (optional)
 * @param {string} data.description - Description (optional)
 * @returns {Promise<Object>} Completed time entry in camelCase
 * @throws {AppError} If no active timer or update fails
 * Story 4.3: Simple Mode Stop Timer API - AC1, AC2, AC3
 */
const stopTimer = async (userId, data = {}) => {
  // 1. Find active timer for user (reuse getActiveTimer from Story 4.2)
  const activeTimer = await getActiveTimer(userId);

  if (!activeTimer) {
    throw new AppError('No active timer found', 404, 'NO_ACTIVE_TIMER');
  }

  // 2. Calculate endTime and duration
  const endTime = new Date();
  const startTime = new Date(activeTimer.startTime);
  let durationMinutes = Math.round((endTime - startTime) / 60000);

  // Ensure minimum duration of 1 minute (AC6)
  if (durationMinutes < 1) {
    durationMinutes = 1;
  }

  // 3. Build update data
  const updateData = {
    end_time: endTime.toISOString(),
    duration_minutes: durationMinutes,
    updated_at: endTime.toISOString()
  };

  // 4. Apply optional fields if provided
  if (data.projectId !== undefined) {
    updateData.project_id = data.projectId || null;
  }
  if (data.categoryId !== undefined) {
    updateData.category_id = data.categoryId || null;
  }
  if (data.description !== undefined) {
    updateData.description = data.description || null;
  }

  // 5. Update the entry
  const { data: updatedEntry, error } = await supabase
    .from('time_entries')
    .update(updateData)
    .eq('id', activeTimer.id)
    .eq('user_id', userId)
    .is('end_time', null)
    .eq('entry_mode', 'simple')
    .select(`
      id,
      user_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    // Handle FK violations
    if (error.code === '23503') {
      if (error.message.includes('project_id')) {
        throw new AppError('Project not found', 400, 'INVALID_PROJECT_ID');
      }
      if (error.message.includes('category_id')) {
        throw new AppError('Category not found', 400, 'INVALID_CATEGORY_ID');
      }
    }
    console.error('[TIME_ENTRIES] Stop timer failed:', { error: error.message });
    throw new AppError('Failed to stop timer', 500, 'UPDATE_FAILED');
  }

  return snakeToCamel(updatedEntry);
};

/**
 * Get active day for a user (Day Mode only)
 * An active day is a time entry where entry_mode='day', end_time IS NULL, parent_id IS NULL
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} Active day entry or null
 * Story 4.5: Day Mode Day Start/End API - AC1, AC5
 */
const getActiveDay = async (userId) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      id,
      user_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      parent_id,
      created_at,
      updated_at
    `)
    .eq('user_id', userId)
    .eq('entry_mode', 'day')
    .is('end_time', null)
    .is('parent_id', null)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[TIME_ENTRIES] Get active day failed:', { error: error.message });
    throw new AppError('Failed to check active day', 500, 'DATABASE_ERROR');
  }

  if (!data) return null;

  return snakeToCamel(data);
};

/**
 * Get day entry with all its child time blocks
 * @param {string} dayId - Day entry UUID
 * @param {string} userId - User UUID making the request
 * @returns {Promise<Object>} Day entry with blocks array
 * @throws {AppError} If day not found or user not authorized
 * Story 4.5: Day Mode Day Start/End API - AC3, AC5
 */
const getDayWithBlocks = async (dayId, userId) => {
  // 1. Get the day entry
  const { data: dayEntry, error: dayError } = await supabase
    .from('time_entries')
    .select(`
      id,
      user_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      parent_id,
      created_at,
      updated_at
    `)
    .eq('id', dayId)
    .single();

  if (dayError || !dayEntry) {
    throw new AppError('Day entry not found', 404, 'NOT_FOUND');
  }

  // Check authorization
  if (dayEntry.user_id !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  // 2. Get all child blocks for this day
  const { data: blocks, error: blocksError } = await supabase
    .from('time_entries')
    .select(`
      id,
      user_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      parent_id,
      created_at,
      updated_at,
      projects:project_id (id, code, name),
      categories:category_id (id, name, color)
    `)
    .eq('parent_id', dayId)
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

  if (blocksError) {
    console.error('[TIME_ENTRIES] Get day blocks failed:', { error: blocksError.message });
    throw new AppError('Failed to retrieve day blocks', 500, 'DATABASE_ERROR');
  }

  // Transform day entry
  const transformedDay = snakeToCamel(dayEntry);

  // Transform blocks and flatten relations
  const transformedBlocks = (blocks || []).map(block => {
    const transformed = snakeToCamel(block);
    // Rename projects -> project and categories -> category (or remove if null)
    if (transformed.projects) {
      transformed.project = transformed.projects;
    }
    delete transformed.projects;
    if (transformed.categories) {
      transformed.category = transformed.categories;
    }
    delete transformed.categories;
    return transformed;
  });

  return { ...transformedDay, blocks: transformedBlocks };
};

/**
 * Start a new workday (Day Mode)
 * @param {string} userId - User UUID
 * @param {Object} data - Day data
 * @param {string} data.description - Description (optional)
 * @returns {Promise<Object>} Created day entry in camelCase
 * @throws {AppError} If day already active or creation fails
 * Story 4.5: Day Mode Day Start/End API - AC1, AC2, AC8
 */
const startDay = async (userId, data = {}) => {
  // 1. Check for existing active day
  const activeDay = await getActiveDay(userId);
  if (activeDay) {
    const error = new AppError('A day is already in progress', 400, 'DAY_ALREADY_ACTIVE');
    error.data = activeDay;
    throw error;
  }

  // 2. Create new day entry with startTime = now
  const insertData = {
    user_id: userId,
    start_time: new Date().toISOString(),
    end_time: null,
    duration_minutes: null,
    project_id: null,
    category_id: null,
    description: data.description || null,
    entry_mode: 'day',
    parent_id: null
  };

  const { data: createdEntry, error } = await supabase
    .from('time_entries')
    .insert(insertData)
    .select(`
      id,
      user_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      parent_id,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    console.error('[TIME_ENTRIES] Start day failed:', { error: error.message });
    throw new AppError('Failed to start day', 500, 'CREATE_FAILED');
  }

  return snakeToCamel(createdEntry);
};

/**
 * End the active workday for a user (Day Mode)
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Completed day entry with blocks in camelCase
 * @throws {AppError} If no active day or update fails
 * Story 4.5: Day Mode Day Start/End API - AC3, AC4
 */
const endDay = async (userId) => {
  // 1. Find active day
  const activeDay = await getActiveDay(userId);

  if (!activeDay) {
    throw new AppError('No active day found', 404, 'NO_ACTIVE_DAY');
  }

  // 2. Calculate endTime and duration
  const endTime = new Date();
  const startTime = new Date(activeDay.startTime);
  const durationMinutes = Math.round((endTime - startTime) / 60000);

  // 3. Update the day entry
  const updateData = {
    end_time: endTime.toISOString(),
    duration_minutes: durationMinutes,
    updated_at: endTime.toISOString()
  };

  const { error } = await supabase
    .from('time_entries')
    .update(updateData)
    .eq('id', activeDay.id)
    .eq('user_id', userId)
    .is('end_time', null)
    .eq('entry_mode', 'day');

  if (error) {
    console.error('[TIME_ENTRIES] End day failed:', { error: error.message });
    throw new AppError('Failed to end day', 500, 'UPDATE_FAILED');
  }

  // 4. Return day with blocks
  return getDayWithBlocks(activeDay.id, userId);
};

/**
 * Validate that a block's times are within the day's boundaries
 * @param {Object} block - Block with startTime and endTime
 * @param {Object} day - Day entry with startTime and endTime
 * @returns {Object} { valid: boolean, message?: string }
 * Story 4.6: Day Mode Time Block Management API - AC2
 */
const validateBlockBoundaries = (block, day) => {
  const blockStart = new Date(block.startTime);
  const blockEnd = new Date(block.endTime);
  const dayStart = new Date(day.startTime);

  // Block start must be >= day start
  if (blockStart < dayStart) {
    return { valid: false, message: 'Block start time cannot be before day start' };
  }

  // Block end must be after block start
  if (blockEnd <= blockStart) {
    return { valid: false, message: 'Block end time must be after start time' };
  }

  // If day has ended, block end must be <= day end
  if (day.endTime) {
    const dayEnd = new Date(day.endTime);
    if (blockEnd > dayEnd) {
      return { valid: false, message: 'Block end time cannot be after day end' };
    }
  } else {
    // Day is still active - block end cannot be in the future
    const now = new Date();
    if (blockEnd > now) {
      return { valid: false, message: 'Block end time cannot be in the future' };
    }
  }

  return { valid: true };
};

/**
 * Check if a block overlaps with existing blocks
 * @param {Object} newBlock - Block to check { startTime, endTime }
 * @param {Array} existingBlocks - Array of existing blocks
 * @param {string} excludeBlockId - Optional block ID to exclude (for updates)
 * @returns {Object} { hasOverlap: boolean, conflictingBlocks: Array }
 * Story 4.6: Day Mode Time Block Management API - AC3
 */
const checkBlockOverlap = (newBlock, existingBlocks, excludeBlockId = null) => {
  const newStart = new Date(newBlock.startTime).getTime();
  const newEnd = new Date(newBlock.endTime).getTime();

  const conflicts = existingBlocks.filter(block => {
    // Skip the block being updated
    if (excludeBlockId && block.id === excludeBlockId) {
      return false;
    }

    const existingStart = new Date(block.startTime).getTime();
    const existingEnd = new Date(block.endTime).getTime();

    // Check for any overlap:
    // Overlap occurs when: newStart < existingEnd AND newEnd > existingStart
    return newStart < existingEnd && newEnd > existingStart;
  });

  return {
    hasOverlap: conflicts.length > 0,
    conflictingBlocks: conflicts.map(b => ({
      id: b.id,
      startTime: b.startTime,
      endTime: b.endTime
    }))
  };
};

/**
 * Get all blocks for a specific day
 * @param {string} dayId - Day entry UUID
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} Array of blocks for the day
 * Story 4.6: Day Mode Time Block Management API - AC10
 */
const getBlocksForDay = async (dayId, userId) => {
  const { data: blocks, error } = await supabase
    .from('time_entries')
    .select(`
      id,
      user_id,
      parent_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      created_at,
      updated_at,
      projects:project_id (id, code, name),
      categories:category_id (id, name, color)
    `)
    .eq('parent_id', dayId)
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('[TIME_ENTRIES] Get blocks for day failed:', { error: error.message });
    throw new AppError('Failed to retrieve blocks', 500, 'DATABASE_ERROR');
  }

  // Transform to camelCase and flatten relations
  return (blocks || []).map(block => {
    const transformed = snakeToCamel(block);
    if (transformed.projects) {
      transformed.project = transformed.projects;
    }
    delete transformed.projects;
    if (transformed.categories) {
      transformed.category = transformed.categories;
    }
    delete transformed.categories;
    return transformed;
  });
};

/**
 * Create a new time block within the active day
 * @param {string} userId - User UUID
 * @param {Object} data - Block data
 * @param {string} data.startTime - Start time (ISO 8601)
 * @param {string} data.endTime - End time (ISO 8601)
 * @param {string} data.projectId - Project UUID (optional)
 * @param {string} data.categoryId - Category UUID (optional)
 * @param {string} data.description - Description (optional)
 * @returns {Promise<Object>} Created block in camelCase with relations
 * @throws {AppError} If no active day, boundaries invalid, or overlap exists
 * Story 4.6: Day Mode Time Block Management API - AC1, AC2, AC3
 */
const createBlock = async (userId, data) => {
  // 1. Get active day
  const activeDay = await getActiveDay(userId);
  if (!activeDay) {
    throw new AppError('No active day found. Start a day first.', 404, 'NO_ACTIVE_DAY');
  }

  // 2. Validate block boundaries
  const boundaryCheck = validateBlockBoundaries(data, activeDay);
  if (!boundaryCheck.valid) {
    throw new AppError(boundaryCheck.message, 400, 'BLOCK_OUTSIDE_DAY_BOUNDARIES');
  }

  // 3. Get existing blocks for overlap check
  const existingBlocks = await getBlocksForDay(activeDay.id, userId);

  // 4. Check for overlaps
  const overlapCheck = checkBlockOverlap(data, existingBlocks);
  if (overlapCheck.hasOverlap) {
    const error = new AppError(
      'Time block overlaps with existing block(s)',
      400,
      'BLOCKS_OVERLAP'
    );
    error.data = { conflictingBlocks: overlapCheck.conflictingBlocks };
    throw error;
  }

  // 5. Calculate duration
  const durationMinutes = calculateDuration(data.startTime, data.endTime);

  // 6. Insert block
  const insertData = {
    user_id: userId,
    parent_id: activeDay.id,
    start_time: data.startTime,
    end_time: data.endTime,
    duration_minutes: durationMinutes,
    project_id: data.projectId || null,
    category_id: data.categoryId || null,
    description: data.description || null,
    entry_mode: 'day'
  };

  const { data: createdBlock, error } = await supabase
    .from('time_entries')
    .insert(insertData)
    .select(`
      id,
      user_id,
      parent_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      created_at,
      updated_at,
      projects:project_id (id, code, name),
      categories:category_id (id, name, color)
    `)
    .single();

  if (error) {
    // Handle FK violations
    if (error.code === '23503') {
      if (error.message.includes('project_id')) {
        throw new AppError('Project not found', 400, 'INVALID_PROJECT_ID');
      }
      if (error.message.includes('category_id')) {
        throw new AppError('Category not found', 400, 'INVALID_CATEGORY_ID');
      }
    }
    console.error('[TIME_ENTRIES] Create block failed:', { error: error.message });
    throw new AppError('Failed to create block', 500, 'CREATE_FAILED');
  }

  // Transform and return
  const transformed = snakeToCamel(createdBlock);
  if (transformed.projects) {
    transformed.project = transformed.projects;
  }
  delete transformed.projects;
  if (transformed.categories) {
    transformed.category = transformed.categories;
  }
  delete transformed.categories;

  return transformed;
};

/**
 * List all blocks for the user's active day
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} { data: Array, meta: Object }
 * Story 4.6: Day Mode Time Block Management API - AC10
 */
const listBlocks = async (userId) => {
  // 1. Get active day
  const activeDay = await getActiveDay(userId);

  // If no active day, return empty result with meta
  if (!activeDay) {
    return {
      data: [],
      meta: {
        dayId: null,
        dayStart: null,
        dayEnd: null,
        totalBlocksMinutes: 0,
        unallocatedMinutes: 0
      }
    };
  }

  // 2. Get blocks for the active day
  const blocks = await getBlocksForDay(activeDay.id, userId);

  // 3. Calculate meta statistics
  const totalBlocksMinutes = blocks.reduce((sum, block) => sum + (block.durationMinutes || 0), 0);

  // Calculate day duration so far
  const dayStart = new Date(activeDay.startTime);
  const dayEnd = activeDay.endTime ? new Date(activeDay.endTime) : new Date();
  const dayDurationMinutes = Math.round((dayEnd - dayStart) / 60000);
  const unallocatedMinutes = Math.max(0, dayDurationMinutes - totalBlocksMinutes);

  return {
    data: blocks,
    meta: {
      dayId: activeDay.id,
      dayStart: activeDay.startTime,
      dayEnd: activeDay.endTime,
      totalBlocksMinutes,
      unallocatedMinutes
    }
  };
};

/**
 * Get a specific block by ID with authorization check
 * @param {string} blockId - Block UUID
 * @param {string} userId - User UUID making the request
 * @returns {Promise<Object>} Block data in camelCase
 * @throws {AppError} If block not found or user not authorized
 * Story 4.6: Day Mode Time Block Management API - AC7, AC9
 */
const getBlockById = async (blockId, userId) => {
  const { data: block, error } = await supabase
    .from('time_entries')
    .select(`
      id,
      user_id,
      parent_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      created_at,
      updated_at,
      projects:project_id (id, code, name),
      categories:category_id (id, name, color)
    `)
    .eq('id', blockId)
    .not('parent_id', 'is', null) // Ensure it's a block, not a day container
    .single();

  if (error || !block) {
    throw new AppError('Time block not found', 404, 'NOT_FOUND');
  }

  // Check ownership
  if (block.user_id !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  // Transform to camelCase and flatten relations
  const transformed = snakeToCamel(block);
  if (transformed.projects) {
    transformed.project = transformed.projects;
  }
  delete transformed.projects;
  if (transformed.categories) {
    transformed.category = transformed.categories;
  }
  delete transformed.categories;

  return transformed;
};

/**
 * Update an existing time block
 * @param {string} blockId - Block UUID
 * @param {string} userId - User UUID making the request
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated block in camelCase with relations
 * @throws {AppError} If block not found, not authorized, boundaries invalid, or overlap exists
 * Story 4.6: Day Mode Time Block Management API - AC4, AC5
 */
const updateBlock = async (blockId, userId, data) => {
  // 1. Get the block to update
  const existingBlock = await getBlockById(blockId, userId);

  // 2. Get the parent day
  const { data: parentDay, error: dayError } = await supabase
    .from('time_entries')
    .select('id, user_id, start_time, end_time, entry_mode')
    .eq('id', existingBlock.parentId)
    .single();

  if (dayError || !parentDay) {
    throw new AppError('Parent day not found', 404, 'NOT_FOUND');
  }

  // Transform parent day to camelCase
  const day = snakeToCamel(parentDay);

  // 3. Build updated block with new times
  const updatedStartTime = data.startTime || existingBlock.startTime;
  const updatedEndTime = data.endTime || existingBlock.endTime;
  const updatedBlock = { startTime: updatedStartTime, endTime: updatedEndTime };

  // 4. Validate boundaries
  const boundaryCheck = validateBlockBoundaries(updatedBlock, day);
  if (!boundaryCheck.valid) {
    throw new AppError(boundaryCheck.message, 400, 'BLOCK_OUTSIDE_DAY_BOUNDARIES');
  }

  // 5. Get existing blocks and check for overlaps (excluding this block)
  const existingBlocks = await getBlocksForDay(day.id, userId);
  const overlapCheck = checkBlockOverlap(updatedBlock, existingBlocks, blockId);
  if (overlapCheck.hasOverlap) {
    const error = new AppError(
      'Time block overlaps with existing block(s)',
      400,
      'BLOCKS_OVERLAP'
    );
    error.data = { conflictingBlocks: overlapCheck.conflictingBlocks };
    throw error;
  }

  // 6. Build update data
  const updateData = {
    updated_at: new Date().toISOString()
  };

  if (data.startTime !== undefined) {
    updateData.start_time = data.startTime;
  }
  if (data.endTime !== undefined) {
    updateData.end_time = data.endTime;
  }
  if (data.projectId !== undefined) {
    updateData.project_id = data.projectId;
  }
  if (data.categoryId !== undefined) {
    updateData.category_id = data.categoryId;
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  // Recalculate duration if times changed
  if (data.startTime !== undefined || data.endTime !== undefined) {
    updateData.duration_minutes = calculateDuration(updatedStartTime, updatedEndTime);
  }

  // 7. Update the block
  const { data: updatedEntry, error } = await supabase
    .from('time_entries')
    .update(updateData)
    .eq('id', blockId)
    .eq('user_id', userId)
    .select(`
      id,
      user_id,
      parent_id,
      project_id,
      category_id,
      start_time,
      end_time,
      duration_minutes,
      description,
      entry_mode,
      created_at,
      updated_at,
      projects:project_id (id, code, name),
      categories:category_id (id, name, color)
    `)
    .single();

  if (error) {
    // Handle FK violations
    if (error.code === '23503') {
      if (error.message.includes('project_id')) {
        throw new AppError('Project not found', 400, 'INVALID_PROJECT_ID');
      }
      if (error.message.includes('category_id')) {
        throw new AppError('Category not found', 400, 'INVALID_CATEGORY_ID');
      }
    }
    console.error('[TIME_ENTRIES] Update block failed:', { error: error.message });
    throw new AppError('Failed to update block', 500, 'UPDATE_FAILED');
  }

  // Transform and return
  const transformed = snakeToCamel(updatedEntry);
  if (transformed.projects) {
    transformed.project = transformed.projects;
  }
  delete transformed.projects;
  if (transformed.categories) {
    transformed.category = transformed.categories;
  }
  delete transformed.categories;

  return transformed;
};

/**
 * Delete a time block
 * @param {string} blockId - Block UUID
 * @param {string} userId - User UUID making the request
 * @returns {Promise<Object>} Success message
 * @throws {AppError} If block not found or user not authorized
 * Story 4.6: Day Mode Time Block Management API - AC6
 */
const deleteBlock = async (blockId, userId) => {
  // 1. Get the block to verify ownership (this will throw if not found or forbidden)
  await getBlockById(blockId, userId);

  // 2. Delete the block
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', blockId)
    .eq('user_id', userId);

  if (error) {
    console.error('[TIME_ENTRIES] Delete block failed:', { error: error.message });
    throw new AppError('Failed to delete block', 500, 'DELETE_FAILED');
  }

  return { message: 'Time block deleted successfully' };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getActiveTimer,
  startTimer,
  stopTimer,
  // Day Mode methods (Story 4.5)
  getActiveDay,
  getDayWithBlocks,
  startDay,
  endDay,
  // Day Mode Block methods (Story 4.6)
  createBlock,
  listBlocks,
  updateBlock,
  deleteBlock,
  getBlockById,
  getBlocksForDay,
  validateBlockBoundaries,
  checkBlockOverlap,
  // Exported for testing
  calculateDuration,
  getWeekStart,
  checkTimesheetStatus
};
