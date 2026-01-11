// backend/services/categories.service.js

const { supabase } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel, camelToSnake } = require('../utils/transformers');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * Get all categories with pagination
 * @param {Object} options - Query options
 * @param {boolean} options.includeInactive - Include inactive categories (default: false)
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @returns {Promise<Object>} { data: Category[], pagination: PaginationMeta }
 * @throws {AppError} If database query fails
 * Story 3.5: Categories CRUD API - AC2
 */
const getAll = async (options = {}) => {
  const { includeInactive = false } = options;
  const { page, limit, offset } = parsePaginationParams(options);

  let query = supabase
    .from('categories')
    .select('id, name, description, color, is_active, created_at, updated_at', { count: 'exact' });

  // Filter by active status unless includeInactive is true
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error, count } = await query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[CATEGORIES] Get all categories failed:', { error: error.message });
    throw new AppError('Failed to retrieve categories', 500, 'DATABASE_ERROR');
  }

  // Transform data to camelCase
  const transformedData = (data || []).map(category => snakeToCamel(category));

  return {
    data: transformedData,
    pagination: buildPaginationMeta(page, limit, count || 0)
  };
};

/**
 * Get category by ID
 * @param {string} id - Category UUID
 * @returns {Promise<Object>} Category data in camelCase
 * @throws {AppError} If category not found
 * Story 3.5: Categories CRUD API - AC3
 */
const getById = async (id) => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description, color, is_active, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new AppError('Category not found', 404, 'NOT_FOUND');
  }

  return snakeToCamel(data);
};

/**
 * Create a new category
 * @param {Object} data - Category data { name, description?, color }
 * @returns {Promise<Object>} Created category in camelCase
 * @throws {AppError} If creation fails
 * Story 3.5: Categories CRUD API - AC1
 */
const create = async (data) => {
  const { name, description, color } = data;

  const { data: createdCategory, error } = await supabase
    .from('categories')
    .insert({
      name,
      description: description || null,
      color,
      is_active: true
    })
    .select('id, name, description, color, is_active, created_at, updated_at')
    .single();

  if (error) {
    // Check for duplicate name (unique constraint)
    if (error.code === '23505' || error.message.includes('duplicate')) {
      throw new AppError('A category with this name already exists', 409, 'DUPLICATE_NAME');
    }
    console.error('[CATEGORIES] Create category failed:', { error: error.message });
    throw new AppError('Failed to create category', 500, 'CREATE_FAILED');
  }

  return snakeToCamel(createdCategory);
};

/**
 * Update an existing category
 * @param {string} id - Category UUID
 * @param {Object} data - Update data { name?, description?, color? }
 * @returns {Promise<Object>} Updated category in camelCase
 * @throws {AppError} If category not found or update fails
 * Story 3.5: Categories CRUD API - AC4
 */
const update = async (id, data) => {
  // Whitelist allowed fields
  const allowedFields = ['name', 'description', 'color'];
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([key]) => allowedFields.includes(key))
  );

  // If no valid fields to update, fetch and return current category
  if (Object.keys(filtered).length === 0) {
    return getById(id);
  }

  // Convert to snake_case for database and add updated_at timestamp
  const dbData = {
    ...camelToSnake(filtered),
    updated_at: new Date().toISOString()
  };

  const { data: updatedCategory, error } = await supabase
    .from('categories')
    .update(dbData)
    .eq('id', id)
    .select('id, name, description, color, is_active, created_at, updated_at')
    .single();

  if (error) {
    // Check for duplicate name first (before checking not found)
    if (error.code === '23505' || error.message.includes('duplicate')) {
      throw new AppError('A category with this name already exists', 409, 'DUPLICATE_NAME');
    }
    // Check for not found error
    if (error.code === 'PGRST116') {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }
    console.error('[CATEGORIES] Update category failed:', { id, error: error.message });
    throw new AppError('Update failed', 500, 'UPDATE_FAILED');
  }

  if (!updatedCategory) {
    throw new AppError('Category not found', 404, 'NOT_FOUND');
  }

  return snakeToCamel(updatedCategory);
};

/**
 * Deactivate a category (soft delete)
 * Sets is_active to false instead of deleting
 * @param {string} id - Category UUID
 * @returns {Promise<Object>} Success message
 * @throws {AppError} If category not found
 * Story 3.5: Categories CRUD API - AC5
 */
const deactivate = async (id) => {
  // First check if category exists
  const { data: existingCategory, error: findError } = await supabase
    .from('categories')
    .select('id, is_active')
    .eq('id', id)
    .single();

  if (findError || !existingCategory) {
    throw new AppError('Category not found', 404, 'NOT_FOUND');
  }

  // Check if already inactive
  if (!existingCategory.is_active) {
    throw new AppError('Category is already deactivated', 400, 'ALREADY_INACTIVE');
  }

  const { error } = await supabase
    .from('categories')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) {
    console.error('[CATEGORIES] Deactivate category failed:', { id, error: error.message });
    throw new AppError('Failed to deactivate category', 500, 'DEACTIVATE_FAILED');
  }

  return { message: 'Category deactivated' };
};

/**
 * Activate a category
 * Sets is_active to true
 * @param {string} id - Category UUID
 * @returns {Promise<Object>} Activated category in camelCase
 * @throws {AppError} If category not found
 * Story 3.5: Categories CRUD API - AC6
 */
const activate = async (id) => {
  // First check if category exists
  const { data: existingCategory, error: findError } = await supabase
    .from('categories')
    .select('id, is_active')
    .eq('id', id)
    .single();

  if (findError || !existingCategory) {
    throw new AppError('Category not found', 404, 'NOT_FOUND');
  }

  // Check if already active
  if (existingCategory.is_active) {
    throw new AppError('Category is already active', 400, 'ALREADY_ACTIVE');
  }

  const { data: activatedCategory, error } = await supabase
    .from('categories')
    .update({
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('id, name, description, color, is_active, created_at, updated_at')
    .single();

  if (error) {
    console.error('[CATEGORIES] Activate category failed:', { id, error: error.message });
    throw new AppError('Failed to activate category', 500, 'ACTIVATE_FAILED');
  }

  return snakeToCamel(activatedCategory);
};

module.exports = { getAll, getById, create, update, deactivate, activate };
