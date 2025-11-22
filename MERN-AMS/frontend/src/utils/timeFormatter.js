/**
 * Time Parsing & Formatting Utilities
 * Handles conversion between HH:MM:SS:ML format and milliseconds
 * Used for sorting and performance comparisons across all scoring stages
 */

/**
 * Convert formatted time string (HH:MM:SS:ML) to milliseconds
 * @param {string} formatted - Time in format "HH:MM:SS:ML" or just digits
 * @returns {number} Total milliseconds (0 if invalid)
 * 
 * @example
 * digitsToMs("00:01:23:45") // => 83450 (1m 23s 45ms)
 * digitsToMs("00123045") // => 83450 (just digits)
 */
export function digitsToMs(formatted = "") {
  if (!formatted || typeof formatted !== "string") return 0;

  // Remove all non-digits
  const d = formatted.replace(/\D/g, "").padEnd(8, "0");

  const hh = parseInt(d.slice(0, 2), 10) || 0;
  const mm = parseInt(d.slice(2, 4), 10) || 0;
  const ss = parseInt(d.slice(4, 6), 10) || 0;
  const ml = parseInt(d.slice(6, 8), 10) || 0;

  return (hh * 3600 + mm * 60 + ss) * 1000 + ml;
}

/**
 * Convert milliseconds to formatted time string (HH:MM:SS:ML)
 * @param {number} ms - Milliseconds to convert
 * @returns {string} Formatted time string "HH:MM:SS:ML"
 * 
 * @example
 * msToDigits(83450) // => "00:01:23:45"
 */
export function msToDigits(ms = 0) {
  if (ms < 0) ms = 0;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
    String(milliseconds).padStart(2, "0"),
  ].join(":");
}

/**
 * Sort athletes by performance time (ascending - fastest first)
 * @param {Array} athletes - Array of athlete objects with performance property
 * @returns {Array} Sorted athletes by time (low to high)
 * 
 * @example
 * sortByTime([{performance: "00:00:20:50"}, {performance: "00:00:19:30"}])
 * // => [{performance: "00:00:19:30"}, {performance: "00:00:20:50"}]
 */
export function sortByTime(athletes = []) {
  return [...athletes].sort((a, b) => {
    const msA = digitsToMs(a.performance || "99:59:59:99");
    const msB = digitsToMs(b.performance || "99:59:59:99");
    return msA - msB;
  });
}

/**
 * Sort athletes by distance/height (descending - best first)
 * @param {Array} athletes - Array of athlete objects with performance property
 * @returns {Array} Sorted athletes by distance (high to low)
 * 
 * @example
 * sortByDistance([{performance: "7.25"}, {performance: "7.50"}])
 * // => [{performance: "7.50"}, {performance: "7.25"}]
 */
export function sortByDistance(athletes = []) {
  return [...athletes].sort((a, b) => {
    const valA = parseFloat(a.performance || "0");
    const valB = parseFloat(b.performance || "0");
    return valB - valA;
  });
}

/**
 * Determine if event is track/time-based (lower is better)
 * @param {string} eventCategory - Event category ('Track', 'Relay', 'Jump', 'Throw', 'Combined')
 * @returns {boolean} True if time-based (lower is better)
 */
export function isTimeBasedEvent(eventCategory = "") {
  return (
    eventCategory?.toLowerCase() === "track" ||
    eventCategory?.toLowerCase() === "relay"
  );
}

/**
 * Sort athletes based on event type (time ascending or distance descending)
 * @param {Array} athletes - Array of athlete objects
 * @param {string} eventCategory - Event category to determine sort order
 * @returns {Array} Sorted athletes
 * 
 * @example
 * sortByEventType(athletes, "Track") // => sorted by time ascending
 * sortByEventType(athletes, "Jump") // => sorted by distance descending
 */
export function sortByEventType(athletes = [], eventCategory = "") {
  if (isTimeBasedEvent(eventCategory)) {
    return sortByTime(athletes);
  } else {
    return sortByDistance(athletes);
  }
}

/**
 * Compare two performance values based on event type
 * @param {string} perf1 - First performance value
 * @param {string} perf2 - Second performance value
 * @param {string} eventCategory - Event category
 * @returns {number} Negative if perf1 better, positive if perf2 better, 0 if equal
 */
export function comparePerformance(perf1 = "", perf2 = "", eventCategory = "") {
  if (isTimeBasedEvent(eventCategory)) {
    // For time: lower is better
    const ms1 = digitsToMs(perf1);
    const ms2 = digitsToMs(perf2);
    return ms1 - ms2;
  } else {
    // For distance: higher is better
    const val1 = parseFloat(perf1 || "0");
    const val2 = parseFloat(perf2 || "0");
    return val2 - val1;
  }
}

/**
 * Get top N athletes sorted by performance
 * @param {Array} athletes - Array of athlete objects
 * @param {number} count - Number of top athletes to return (8 or 16)
 * @param {string} eventCategory - Event category for sorting
 * @returns {Array} Top N athletes
 */
export function getTopAthletes(athletes = [], count = 8, eventCategory = "") {
  const sorted = sortByEventType(athletes, eventCategory);
  return sorted.slice(0, Math.min(count, sorted.length));
}

/**
 * Filter out athletes with invalid/missing performances
 * @param {Array} athletes - Array of athlete objects
 * @returns {Array} Athletes with valid performances (status OK)
 */
export function getValidPerformances(athletes = []) {
  return athletes.filter(
    (a) => a.performance && a.performance.trim() !== "" && a.scoreStatus !== "DNF" && a.scoreStatus !== "DIS"
  );
}

export default {
  digitsToMs,
  msToDigits,
  sortByTime,
  sortByDistance,
  isTimeBasedEvent,
  sortByEventType,
  comparePerformance,
  getTopAthletes,
  getValidPerformances,
};
