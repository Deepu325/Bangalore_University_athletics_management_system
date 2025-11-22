/**
 * Sanitize PED name to generate a valid username
 * - Remove extra whitespace
 * - Convert to lowercase
 * - Replace spaces with underscores
 * - Remove special characters (keep only alphanumeric and underscores)
 * - Limit length to 20 characters
 * 
 * @param {string} pedName - Raw PED name
 * @returns {string} - Sanitized username
 */
export function sanitizeUsername(pedName) {
  if (!pedName || typeof pedName !== 'string') return 'user';
  
  return pedName
    .trim()                              // Remove leading/trailing whitespace
    .toLowerCase()                       // Convert to lowercase
    .replace(/\s+/g, '_')               // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, '')         // Remove special characters
    .replace(/_+/g, '_')                // Replace multiple underscores with single
    .substring(0, 20)                   // Limit to 20 characters
    .replace(/^_+|_+$/g, '');           // Remove leading/trailing underscores
}

/**
 * Generate unique username by appending numeric suffix if needed
 * 
 * @param {string} baseName - Base username
 * @param {object} userModel - Mongoose User model
 * @returns {Promise<string>} - Unique username
 */
export async function generateUniqueUsername(baseName, userModel) {
  let username = baseName;
  let counter = 1;
  
  while (await userModel.findOne({ username })) {
    username = `${baseName}${counter}`;
    counter++;
  }
  
  return username;
}

export default { sanitizeUsername, generateUniqueUsername };
