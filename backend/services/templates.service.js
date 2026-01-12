// backend/services/templates.service.js
//
// Templates CRUD and Application Service
// Story 4.8: Templates CRUD API
// Story 4.9: Template Application API (merged into 4.8)
//
// TRANSACTION LIMITATION NOTE:
// Supabase JS client does not support true database transactions.
// Operations like create/update with entries use a "pseudo-transaction" pattern:
// 1. Create/update the parent record
// 2. Create/update child records
// 3. If step 2 fails, attempt to rollback step 1
//
// This is NOT atomic - if the rollback fails, orphaned records may remain.
// In production, consider:
// - Using Supabase Edge Functions with pg_admin for true transactions
// - Implementing a periodic cleanup job for orphaned records
// - Adding database-level triggers to handle consistency
//

const { supabase } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel } = require('../utils/transformers');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * Transform a template entry from database format to API response format
 * @param {Object} entry - Database entry record
 * @returns {Object} Transformed entry with camelCase keys and formatted times
 */
const transformEntry = (entry) => {
  const transformed = snakeToCamel(entry);

  // Format TIME columns to HH:MM string
  if (transformed.startTime) {
    transformed.startTime = formatTimeToHHMM(transformed.startTime);
  }
  if (transformed.endTime) {
    transformed.endTime = formatTimeToHHMM(transformed.endTime);
  }

  // Flatten project and category relations
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
 * Transform a template from database format to API response format
 * @param {Object} template - Database template record
 * @returns {Object} Transformed template with camelCase keys
 */
const transformTemplate = (template) => {
  const transformed = snakeToCamel(template);

  // Transform entries if present
  if (transformed.templateEntries) {
    transformed.entries = transformed.templateEntries.map(transformEntry);
    delete transformed.templateEntries;
  } else if (transformed.entries) {
    // Handle case where entries are already named correctly
    transformed.entries = transformed.entries.map(transformEntry);
  }

  return transformed;
};

/**
 * Format a TIME column value to HH:MM string
 * @param {string} time - Time value from database (can be HH:MM:SS or HH:MM)
 * @returns {string} Time in HH:MM format
 */
const formatTimeToHHMM = (time) => {
  if (!time) return null;
  // Database TIME returns as HH:MM:SS, we want HH:MM
  return time.substring(0, 5);
};

/**
 * Get all templates for a user with pagination
 * @param {string} userId - User UUID
 * @param {Object} options - Query options (page, limit)
 * @returns {Promise<Object>} { data: Template[], pagination: PaginationMeta }
 * @throws {AppError} If database query fails
 * Story 4.8: Templates CRUD API - AC2
 */
const getAll = async (userId, options = {}) => {
  const { page, limit, offset } = parsePaginationParams(options);

  // First, get templates count
  const { count, error: countError } = await supabase
    .from('templates')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    console.error('[TEMPLATES] Count templates failed:', { error: countError.message });
    throw new AppError('Failed to retrieve templates', 500, 'DATABASE_ERROR');
  }

  // Get templates with entries
  const { data: templates, error } = await supabase
    .from('templates')
    .select(`
      id,
      user_id,
      name,
      description,
      created_at,
      updated_at,
      template_entries (
        id,
        template_id,
        start_time,
        end_time,
        project_id,
        category_id,
        description,
        sort_order,
        created_at,
        updated_at,
        projects:project_id (id, code, name),
        categories:category_id (id, name, color)
      )
    `)
    .eq('user_id', userId)
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[TEMPLATES] Get all templates failed:', { error: error.message });
    throw new AppError('Failed to retrieve templates', 500, 'DATABASE_ERROR');
  }

  // Transform data
  const transformedData = (templates || []).map(template => {
    const transformed = transformTemplate(template);
    // Sort entries by sort_order
    if (transformed.entries) {
      transformed.entries.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    return transformed;
  });

  return {
    data: transformedData,
    pagination: buildPaginationMeta(page, limit, count || 0)
  };
};

/**
 * Get a template by ID with authorization check
 * @param {string} id - Template UUID
 * @param {string} requestingUserId - User UUID making the request
 * @returns {Promise<Object>} Template with entries
 * @throws {AppError} If template not found or user not authorized
 * Story 4.8: Templates CRUD API - AC3
 */
const getById = async (id, requestingUserId) => {
  const { data: template, error } = await supabase
    .from('templates')
    .select(`
      id,
      user_id,
      name,
      description,
      created_at,
      updated_at,
      template_entries (
        id,
        template_id,
        start_time,
        end_time,
        project_id,
        category_id,
        description,
        sort_order,
        created_at,
        updated_at,
        projects:project_id (id, code, name),
        categories:category_id (id, name, color)
      )
    `)
    .eq('id', id)
    .single();

  if (error || !template) {
    throw new AppError('Template not found', 404, 'NOT_FOUND');
  }

  // Check authorization
  if (template.user_id !== requestingUserId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  const transformed = transformTemplate(template);
  // Sort entries by sort_order
  if (transformed.entries) {
    transformed.entries.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  return transformed;
};

/**
 * Create a new template with entries
 * @param {string} userId - User UUID
 * @param {Object} data - Template data
 * @param {string} data.name - Template name
 * @param {string} data.description - Template description (optional)
 * @param {Array} data.entries - Array of template entries
 * @returns {Promise<Object>} Created template with entries
 * @throws {AppError} If creation fails
 * Story 4.8: Templates CRUD API - AC1
 */
const create = async (userId, data) => {
  const { name, description, entries } = data;

  // 1. Create template
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .insert({
      user_id: userId,
      name,
      description: description || null,
      config: null // Using template_entries instead of JSONB config
    })
    .select()
    .single();

  if (templateError) {
    console.error('[TEMPLATES] Create template failed:', { error: templateError.message });
    throw new AppError('Failed to create template', 500, 'DATABASE_ERROR');
  }

  // 2. Create entries
  const entriesData = entries.map((entry, index) => ({
    template_id: template.id,
    start_time: entry.startTime,
    end_time: entry.endTime,
    project_id: entry.projectId || null,
    category_id: entry.categoryId || null,
    description: entry.description || null,
    sort_order: index
  }));

  const { data: createdEntries, error: entriesError } = await supabase
    .from('template_entries')
    .insert(entriesData)
    .select(`
      id,
      template_id,
      start_time,
      end_time,
      project_id,
      category_id,
      description,
      sort_order,
      created_at,
      updated_at,
      projects:project_id (id, code, name),
      categories:category_id (id, name, color)
    `);

  if (entriesError) {
    // Cleanup template if entries fail
    await supabase.from('templates').delete().eq('id', template.id);

    // Check for foreign key violations
    if (entriesError.code === '23503') {
      if (entriesError.message.includes('project_id')) {
        throw new AppError('Invalid project ID in entries', 400, 'INVALID_PROJECT_ID');
      }
      if (entriesError.message.includes('category_id')) {
        throw new AppError('Invalid category ID in entries', 400, 'INVALID_CATEGORY_ID');
      }
    }

    console.error('[TEMPLATES] Create template entries failed:', { error: entriesError.message });
    throw new AppError('Failed to create template entries', 500, 'DATABASE_ERROR');
  }

  // Transform and return
  const transformed = transformTemplate({
    ...template,
    template_entries: createdEntries
  });

  // Sort entries by sort_order
  if (transformed.entries) {
    transformed.entries.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  return transformed;
};

/**
 * Update a template and optionally replace its entries
 * @param {string} id - Template UUID
 * @param {string} userId - User UUID making the request
 * @param {Object} data - Update data
 * @param {string} data.name - New template name (optional)
 * @param {string} data.description - New description (optional, null to clear)
 * @param {Array} data.entries - New entries array (optional, replaces existing)
 * @returns {Promise<Object>} Updated template with entries
 * @throws {AppError} If template not found, user not authorized, or update fails
 * Story 4.8: Templates CRUD API - AC4
 */
const update = async (id, userId, data) => {
  // 1. Verify ownership
  const { data: existingTemplate, error: fetchError } = await supabase
    .from('templates')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingTemplate) {
    throw new AppError('Template not found', 404, 'NOT_FOUND');
  }

  if (existingTemplate.user_id !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  // 2. Update template if name or description provided
  const templateUpdate = {};
  if (data.name !== undefined) {
    templateUpdate.name = data.name;
  }
  if (data.description !== undefined) {
    templateUpdate.description = data.description;
  }

  if (Object.keys(templateUpdate).length > 0) {
    templateUpdate.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('templates')
      .update(templateUpdate)
      .eq('id', id);

    if (updateError) {
      console.error('[TEMPLATES] Update template failed:', { error: updateError.message });
      throw new AppError('Failed to update template', 500, 'DATABASE_ERROR');
    }
  }

  // 3. Replace entries if provided (full replacement strategy)
  if (data.entries !== undefined) {
    // Delete existing entries
    const { error: deleteError } = await supabase
      .from('template_entries')
      .delete()
      .eq('template_id', id);

    if (deleteError) {
      console.error('[TEMPLATES] Delete old entries failed:', { error: deleteError.message });
      throw new AppError('Failed to update template entries', 500, 'DATABASE_ERROR');
    }

    // Insert new entries
    const entriesData = data.entries.map((entry, index) => ({
      template_id: id,
      start_time: entry.startTime,
      end_time: entry.endTime,
      project_id: entry.projectId || null,
      category_id: entry.categoryId || null,
      description: entry.description || null,
      sort_order: index
    }));

    const { error: insertError } = await supabase
      .from('template_entries')
      .insert(entriesData);

    if (insertError) {
      // Check for foreign key violations
      if (insertError.code === '23503') {
        if (insertError.message.includes('project_id')) {
          throw new AppError('Invalid project ID in entries', 400, 'INVALID_PROJECT_ID');
        }
        if (insertError.message.includes('category_id')) {
          throw new AppError('Invalid category ID in entries', 400, 'INVALID_CATEGORY_ID');
        }
      }

      console.error('[TEMPLATES] Insert new entries failed:', { error: insertError.message });
      throw new AppError('Failed to update template entries', 500, 'DATABASE_ERROR');
    }
  }

  // 4. Fetch and return updated template
  return getById(id, userId);
};

/**
 * Delete a template (entries cascade via FK)
 * @param {string} id - Template UUID
 * @param {string} userId - User UUID making the request
 * @returns {Promise<Object>} Success message
 * @throws {AppError} If template not found or user not authorized
 * Story 4.8: Templates CRUD API - AC5
 */
const remove = async (id, userId) => {
  // 1. Verify ownership
  const { data: existingTemplate, error: fetchError } = await supabase
    .from('templates')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existingTemplate) {
    throw new AppError('Template not found', 404, 'NOT_FOUND');
  }

  if (existingTemplate.user_id !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  // 2. Delete template (entries cascade via FK)
  const { error: deleteError } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('[TEMPLATES] Delete template failed:', { error: deleteError.message });
    throw new AppError('Failed to delete template', 500, 'DATABASE_ERROR');
  }

  return { message: 'Template deleted successfully' };
};

/**
 * Convert day blocks to template entries format
 * @param {Array} blocks - Array of time blocks from a day entry
 * @returns {Array} Template entries with HH:MM times
 * Story 4.8: Templates CRUD API - AC6
 */
const convertDayBlocksToEntries = (blocks) => {
  return blocks.map((block, index) => {
    // Extract time portion from ISO timestamp
    const startDate = new Date(block.startTime);
    const endDate = new Date(block.endTime);

    const startTime = startDate.toISOString().substring(11, 16); // "HH:MM"
    const endTime = endDate.toISOString().substring(11, 16); // "HH:MM"

    return {
      startTime,
      endTime,
      projectId: block.projectId || null,
      categoryId: block.categoryId || null,
      description: block.description || null,
      sortOrder: index
    };
  });
};

/**
 * Create a template from an existing day entry's blocks
 * @param {string} userId - User UUID
 * @param {string} dayId - Day entry UUID
 * @param {Object} data - Template data
 * @param {string} data.name - Template name
 * @param {string} data.description - Template description (optional)
 * @returns {Promise<Object>} Created template with entries and meta
 * @throws {AppError} If day not found, not owned, not a day entry, or has no blocks
 * Story 4.8: Templates CRUD API - AC6
 */
const createFromDay = async (userId, dayId, data) => {
  // 1. Fetch day entry
  const { data: dayEntry, error: dayError } = await supabase
    .from('time_entries')
    .select(`
      id,
      user_id,
      entry_mode,
      parent_id
    `)
    .eq('id', dayId)
    .single();

  if (dayError || !dayEntry) {
    throw new AppError('Day entry not found', 404, 'NOT_FOUND');
  }

  // 2. Check ownership
  if (dayEntry.user_id !== userId) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  // 3. Validate it's a day mode entry (parent day, not a block)
  if (dayEntry.entry_mode !== 'day' || dayEntry.parent_id !== null) {
    throw new AppError('Entry is not a day mode entry', 400, 'NOT_DAY_MODE_ENTRY');
  }

  // 4. Fetch blocks for this day
  const { data: blocks, error: blocksError } = await supabase
    .from('time_entries')
    .select(`
      id,
      start_time,
      end_time,
      project_id,
      category_id,
      description
    `)
    .eq('parent_id', dayId)
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

  if (blocksError) {
    console.error('[TEMPLATES] Fetch day blocks failed:', { error: blocksError.message });
    throw new AppError('Failed to retrieve day blocks', 500, 'DATABASE_ERROR');
  }

  // 5. Check if day has blocks
  if (!blocks || blocks.length === 0) {
    throw new AppError('Day entry has no time blocks', 400, 'NO_BLOCKS');
  }

  // 6. Convert blocks to template entries format
  const blocksCamelCase = blocks.map(b => snakeToCamel(b));
  const entries = convertDayBlocksToEntries(blocksCamelCase);

  // 7. Create template with entries
  const template = await create(userId, {
    name: data.name,
    description: data.description,
    entries
  });

  // 8. Add meta information
  return {
    ...template,
    meta: {
      sourceDayId: dayId,
      blockCount: blocks.length
    }
  };
};

/**
 * Convert template entry relative time to absolute timestamp
 * @param {string} templateTime - Time in HH:MM format
 * @param {string} targetDate - Date in YYYY-MM-DD format
 * @returns {string} ISO 8601 timestamp
 * Story 4.9: Template Application API - AC3
 */
const convertToAbsoluteTime = (templateTime, targetDate) => {
  // Parse time (HH:MM)
  const [hours, minutes] = templateTime.split(':').map(Number);

  // Create date object for target date
  const date = new Date(targetDate + 'T00:00:00.000Z');
  date.setUTCHours(hours, minutes, 0, 0);

  return date.toISOString();
};

/**
 * Check if a date already has time entries for a user
 * @param {string} userId - User UUID
 * @param {string} date - Target date (YYYY-MM-DD)
 * @returns {Promise<Object>} { hasEntries: boolean, count: number }
 * Story 4.9: Template Application API - AC2
 */
const checkDateHasEntries = async (userId, date) => {
  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');

  const { count, error } = await supabase
    .from('time_entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString())
    .is('parent_id', null); // Only count parent entries (days/simple)

  if (error) {
    console.error('[TEMPLATES] Check date entries failed:', { error: error.message });
    throw new AppError('Failed to check existing entries', 500, 'DATABASE_ERROR');
  }

  return { hasEntries: count > 0, count: count || 0 };
};

/**
 * Validate project and category references for template entries
 * @param {Array} entries - Template entries
 * @returns {Promise<Object>} { validEntries: Array, warnings: Array }
 * Story 4.9: Template Application API - AC4
 */
const validateReferences = async (entries) => {
  const warnings = [];
  const validEntries = [];

  // Collect all unique project and category IDs
  const projectIds = [...new Set(entries.filter(e => e.projectId).map(e => e.projectId))];
  const categoryIds = [...new Set(entries.filter(e => e.categoryId).map(e => e.categoryId))];

  // Fetch projects if any
  let projectMap = new Map();
  if (projectIds.length > 0) {
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, is_archived')
      .in('id', projectIds);

    if (projectsError) {
      console.error('[TEMPLATES] Fetch projects failed:', { error: projectsError.message });
    } else {
      projectMap = new Map((projects || []).map(p => [p.id, p]));
    }
  }

  // Fetch categories if any
  let categoryMap = new Map();
  if (categoryIds.length > 0) {
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, is_active')
      .in('id', categoryIds);

    if (categoriesError) {
      console.error('[TEMPLATES] Fetch categories failed:', { error: categoriesError.message });
    } else {
      categoryMap = new Map((categories || []).map(c => [c.id, c]));
    }
  }

  // Process entries
  entries.forEach((entry, index) => {
    const validEntry = { ...entry };

    // Check project
    if (entry.projectId) {
      const project = projectMap.get(entry.projectId);
      if (!project || project.is_archived) {
        validEntry.projectId = null;
        warnings.push({
          type: 'ARCHIVED_PROJECT',
          entryIndex: index,
          projectId: entry.projectId,
          message: 'Project was archived, entry created without project'
        });
      }
    }

    // Check category
    if (entry.categoryId) {
      const category = categoryMap.get(entry.categoryId);
      if (!category || !category.is_active) {
        validEntry.categoryId = null;
        warnings.push({
          type: 'INACTIVE_CATEGORY',
          entryIndex: index,
          categoryId: entry.categoryId,
          message: 'Category was deactivated, entry created without category'
        });
      }
    }

    validEntries.push(validEntry);
  });

  return { validEntries, warnings };
};

/**
 * Calculate day start and end times from template entries
 * @param {Array} entries - Template entries with absolute times
 * @returns {Object|null} { dayStart: string, dayEnd: string, durationMinutes: number }
 * Story 4.9: Template Application API - AC3
 */
const calculateDayBoundaries = (entries) => {
  if (!entries.length) return null;

  const startTimes = entries.map(e => new Date(e.startTime));
  const endTimes = entries.map(e => new Date(e.endTime));

  const dayStart = new Date(Math.min(...startTimes));
  const dayEnd = new Date(Math.max(...endTimes));
  const durationMinutes = Math.round((dayEnd - dayStart) / 60000);

  return {
    dayStart: dayStart.toISOString(),
    dayEnd: dayEnd.toISOString(),
    durationMinutes
  };
};

/**
 * Calculate duration in minutes between two timestamps
 * @param {string} startTime - Start timestamp
 * @param {string} endTime - End timestamp
 * @returns {number} Duration in minutes
 */
const calculateBlockDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end - start) / 60000);
};

/**
 * Apply a template to create a pre-filled day with time blocks
 * @param {string} templateId - Template UUID
 * @param {string} userId - User UUID
 * @param {string} date - Target date (YYYY-MM-DD)
 * @returns {Promise<Object>} Created day with blocks and meta
 * @throws {AppError} If template not found, not owned, date has entries, etc.
 * Story 4.9: Template Application API - AC1-AC9
 */
const applyTemplate = async (templateId, userId, date) => {
  // 1. Get template with entries and verify ownership
  const template = await getById(templateId, userId);

  // 2. Validate template has entries
  if (!template.entries || template.entries.length === 0) {
    throw new AppError('Template has no entries to apply', 400, 'TEMPLATE_EMPTY');
  }

  // 3. Check if date already has time entries
  const dateCheck = await checkDateHasEntries(userId, date);
  if (dateCheck.hasEntries) {
    const error = new AppError('Date already has time entries', 400, 'DATE_HAS_ENTRIES');
    error.data = { date, existingEntriesCount: dateCheck.count };
    throw error;
  }

  // 4. Validate project/category references (check archived/inactive)
  const { validEntries, warnings } = await validateReferences(template.entries);

  // 5. Convert relative times to absolute timestamps
  const entriesWithAbsoluteTimes = validEntries.map(entry => ({
    ...entry,
    startTime: convertToAbsoluteTime(entry.startTime, date),
    endTime: convertToAbsoluteTime(entry.endTime, date)
  }));

  // 6. Calculate day boundaries from entry times
  const boundaries = calculateDayBoundaries(entriesWithAbsoluteTimes);

  // 7. Create day entry with entryMode='template'
  const dayInsertData = {
    user_id: userId,
    start_time: boundaries.dayStart,
    end_time: boundaries.dayEnd,
    duration_minutes: boundaries.durationMinutes,
    project_id: null,
    category_id: null,
    description: null,
    entry_mode: 'template',
    parent_id: null
  };

  const { data: createdDay, error: dayError } = await supabase
    .from('time_entries')
    .insert(dayInsertData)
    .select()
    .single();

  if (dayError) {
    console.error('[TEMPLATES] Create day from template failed:', { error: dayError.message });
    throw new AppError('Failed to create day entry', 500, 'CREATE_FAILED');
  }

  // 8. Create block entries with entryMode='template'
  const blocksInsertData = entriesWithAbsoluteTimes.map(entry => ({
    user_id: userId,
    parent_id: createdDay.id,
    start_time: entry.startTime,
    end_time: entry.endTime,
    duration_minutes: calculateBlockDuration(entry.startTime, entry.endTime),
    project_id: entry.projectId || null,
    category_id: entry.categoryId || null,
    description: entry.description || null,
    entry_mode: 'template'
  }));

  const { data: createdBlocks, error: blocksError } = await supabase
    .from('time_entries')
    .insert(blocksInsertData)
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
    `);

  if (blocksError) {
    // Cleanup day if blocks fail
    await supabase.from('time_entries').delete().eq('id', createdDay.id);
    console.error('[TEMPLATES] Create blocks from template failed:', { error: blocksError.message });
    throw new AppError('Failed to create time blocks', 500, 'CREATE_FAILED');
  }

  // 9. Transform and return day with blocks and meta
  const transformedDay = snakeToCamel(createdDay);
  const transformedBlocks = (createdBlocks || []).map(block => {
    const transformed = snakeToCamel(block);
    // Flatten project and category relations
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

  // Sort blocks by start time
  transformedBlocks.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return {
    data: {
      ...transformedDay,
      blocks: transformedBlocks
    },
    templateId: template.id,
    templateName: template.name,
    entriesApplied: transformedBlocks.length,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  createFromDay,
  applyTemplate,
  // Export for testing
  transformEntry,
  transformTemplate,
  formatTimeToHHMM,
  convertDayBlocksToEntries,
  convertToAbsoluteTime,
  checkDateHasEntries,
  validateReferences,
  calculateDayBoundaries,
  calculateBlockDuration
};
