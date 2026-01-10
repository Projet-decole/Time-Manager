// backend/utils/transformers.js

/**
 * Checks if a value is a plain object (not Date, RegExp, etc.)
 *
 * @param {*} obj - Value to check
 * @returns {boolean} True if plain object
 */
const isPlainObject = (obj) => {
  if (obj === null || typeof obj !== 'object') return false;
  const proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto === null;
};

/**
 * Converts snake_case object keys to camelCase.
 * Handles nested objects, arrays, and primitives.
 * Preserves Date, RegExp, and other built-in objects.
 *
 * @param {*} obj - Object, array, or primitive to transform
 * @returns {*} Transformed value with camelCase keys
 */
const snakeToCamel = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (!isPlainObject(obj)) return obj;

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {});
};

/**
 * Converts camelCase object keys to snake_case.
 * Handles nested objects, arrays, and primitives.
 * Preserves Date, RegExp, and other built-in objects.
 *
 * @param {*} obj - Object, array, or primitive to transform
 * @returns {*} Transformed value with snake_case keys
 */
const camelToSnake = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (!isPlainObject(obj)) return obj;

  return Object.keys(obj).reduce((acc, key) => {
    // Handle acronyms followed by words (e.g., URLPath -> url_path)
    // Handle normal camelCase (e.g., userId -> user_id)
    const snakeKey = key
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
    acc[snakeKey] = camelToSnake(obj[key]);
    return acc;
  }, {});
};

module.exports = { snakeToCamel, camelToSnake };
