/**
 * Input Formatters - Stage 5 & 9 Scoring
 * 
 * Provides stable input formatting that:
 * - Does NOT cause cursor jumps
 * - Does NOT cause focus loss
 * - Works with continuous typing
 * - Works with copy-paste
 * - Uses React.memo to prevent re-renders
 */

/**
 * ⭐ EXACT WORKING FORMATTER - DO NOT CHANGE
 * Converts raw input to time format hh:mm:ss:ms
 * 
 * Examples:
 * "0" → "00:00:00:00"
 * "00002526" → "00:00:25:26"
 * "12345678" → "12:34:56:78"
 * 
 * @param {string} raw - Raw input value (digits only)
 * @returns {string} Formatted time string (hh:mm:ss:ms)
 */
export const formatTimeInput = (raw) => {
  let v = raw.replace(/\D/g, ""); // keep only digits
  if (v.length > 8) v = v.slice(0, 8);

  // pad to 8 digits
  v = v.padStart(8, "0");

  return (
    v.slice(0, 2) +
    ":" +
    v.slice(2, 4) +
    ":" +
    v.slice(4, 6) +
    ":" +
    v.slice(6, 8)
  );
};

/**
 * Convert raw input to time format hh:mm:ss:ms (alias for formatTimeInput)
 * 
 * @param {string} value - Raw input value (any combination of chars/digits)
 * @returns {string} Formatted time string (hh:mm:ss:ms)
 */
export function formatToTime(value) {
  return formatTimeInput(value);
}

/**
 * Convert raw input to decimal format with 2 decimals
 * 
 * Examples:
 * "0" → "0.00"
 * "1245" → "12.45"
 * "726" → "7.26"
 * "18" → "0.18"
 * 
 * @param {string} value - Raw input value (any combination of chars/digits)
 * @returns {string} Formatted decimal string with 2 decimals
 */
export function formatToDecimal(value) {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  if (digits.length === 0) {
    return '0.00';
  }

  // Pad to at least 3 digits (X.YZ format minimum)
  const padded = digits.padStart(3, '0');

  // Split: everything except last 2 digits goes before decimal
  const beforeDecimal = padded.slice(0, -2) || '0';
  const afterDecimal = padded.slice(-2);

  return `${beforeDecimal}.${afterDecimal}`;
}

/**
 * Validate time format
 * 
 * @param {string} value - Time string to validate (format: hh:mm:ss:ms)
 * @returns {boolean} True if valid time format
 */
export function isValidTime(value) {
  if (!value || typeof value !== 'string') return false;

  const timeRegex = /^\d{2}:\d{2}:\d{2}:\d{2}$/;
  return timeRegex.test(value);
}

/**
 * Validate decimal format
 * 
 * @param {string} value - Decimal string to validate
 * @returns {boolean} True if valid decimal format
 */
export function isValidDecimal(value) {
  if (!value || typeof value !== 'string') return false;

  const decimalRegex = /^\d+\.\d{2}$/;
  return decimalRegex.test(value);
}

/**
 * Extract raw digits from formatted time
 * 
 * @param {string} value - Formatted time string (hh:mm:ss:ms)
 * @returns {string} Raw digits only
 */
export function extractTimeDigits(value) {
  return (value || '').replace(/\D/g, '');
}

/**
 * Extract raw digits from formatted decimal
 * 
 * @param {string} value - Formatted decimal string
 * @returns {string} Raw digits only
 */
export function extractDecimalDigits(value) {
  return (value || '').replace(/\D/g, '');
}

const inputFormatters = {
  formatToTime,
  formatToDecimal,
  isValidTime,
  isValidDecimal,
  extractTimeDigits,
  extractDecimalDigits
};

export default inputFormatters;
