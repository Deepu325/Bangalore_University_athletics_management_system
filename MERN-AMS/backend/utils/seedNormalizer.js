/**
 * JSON Seed Data Normalizer
 * Converts incoming JSON seed data to match Athlete schema exactly
 * 
 * Fixes:
 * - collegeId → college (ObjectId)
 * - "M" → "Male", "F" → "Female"
 * - Removes unknown fields (strict mode)
 * - Validates required fields
 */

import mongoose from 'mongoose';

/**
 * Normalize a single athlete record
 * @param {Object} rawData - Raw athlete data from JSON
 * @param {mongoose.Schema.Types.ObjectId} collegeId - College ObjectId
 * @returns {Object} - Normalized athlete data
 */
export function normalizeAthleteRecord(rawData, collegeId) {
  // Map source field names to schema field names
  const normalized = {
    // Personal info
    name: rawData.name || rawData.fullName || '',
    uucms: rawData.uucms || rawData.registrationNumber || '',
    chestNo: rawData.chestNo || rawData.bibNumber || '',
    
    // College (convert from collegeId or use provided)
    college: rawData.college || collegeId || null,
    
    // Gender normalization
    gender: normalizeGender(rawData.gender || rawData.sex),
    
    // Event registrations - handle both array and individual fields
    event1: rawData.event1 || rawData.events?.[0] || null,
    event2: rawData.event2 || rawData.events?.[1] || null,
    relay1: rawData.relay1 || rawData.relayEvents?.[0] || null,
    relay2: rawData.relay2 || rawData.relayEvents?.[1] || null,
    mixedRelay: rawData.mixedRelay || rawData.mixedRelayEvent || null,
    
    // Status
    status: normalizeStatus(rawData.status || 'PRESENT'),
    remarks: rawData.remarks || ''
  };

  // Validate required fields
  if (!normalized.name) {
    throw new Error('Athlete name is required');
  }
  if (!normalized.college) {
    throw new Error('College is required');
  }
  if (!normalized.gender) {
    throw new Error('Gender must be "Male" or "Female"');
  }

  return normalized;
}

/**
 * Normalize gender field
 * Handles: M, F, Male, Female, M/W, boy, girl, etc.
 * @param {String} gender - Raw gender value
 * @returns {String} - "Male" or "Female"
 */
export function normalizeGender(gender) {
  if (!gender) return null;

  const lower = String(gender).toLowerCase().trim();

  if (lower === 'm' || lower === 'male' || lower === 'boy' || lower === 'men') {
    return 'Male';
  }
  if (lower === 'f' || lower === 'female' || lower === 'girl' || lower === 'women') {
    return 'Female';
  }

  return null;
}

/**
 * Normalize status field
 * @param {String} status - Raw status value
 * @returns {String} - Valid status or default
 */
export function normalizeStatus(status) {
  if (!status) return 'PRESENT';

  const upper = String(status).toUpperCase().trim();
  const valid = ['PRESENT', 'ABSENT', 'DISQUALIFIED'];

  if (valid.includes(upper)) {
    return upper;
  }

  return 'PRESENT';
}

/**
 * Normalize an event record
 * @param {Object} rawData - Raw event data
 * @returns {Object} - Normalized event data
 */
export function normalizeEventRecord(rawData) {
  const normalized = {
    name: rawData.name || '',
    code: rawData.code || rawData.eventCode || '',
    category: normalizeCategory(rawData.category),
    gender: normalizeGender(rawData.gender) || rawData.gender || 'Male',
    countForTeam: rawData.countForTeam !== false,
    participants: rawData.participants || rawData.athleteIds || [],
    status: rawData.status || 'Upcoming',
    date: rawData.date || new Date()
  };

  if (!normalized.name) {
    throw new Error('Event name is required');
  }
  if (!normalized.category) {
    throw new Error('Event category is required');
  }

  return normalized;
}

/**
 * Normalize event category
 * @param {String} category - Raw category
 * @returns {String} - Valid category
 */
export function normalizeCategory(category) {
  if (!category) return null;

  const lower = String(category).toLowerCase().trim();
  const valid = ['track', 'field', 'jump', 'throw', 'relay', 'combined'];

  if (valid.includes(lower)) {
    return lower;
  }

  // Try to infer from event name or other clues
  if (lower.includes('relay')) return 'relay';
  if (lower.includes('jump')) return 'jump';
  if (lower.includes('throw')) return 'throw';
  if (lower.includes('walk') || lower.includes('marathon')) return 'field';

  return null;
}

/**
 * Normalize a college record
 * @param {Object} rawData - Raw college data
 * @returns {Object} - Normalized college data
 */
export function normalizeCollegeRecord(rawData) {
  const normalized = {
    code: (rawData.code || rawData.collegeCode || '').toUpperCase().trim(),
    name: rawData.name || rawData.collegeName || '',
    pedName: rawData.pedName || rawData.pedName || rawData.directorName || '',
    pedPhone: String(rawData.pedPhone || rawData.phone || '').trim(),
    location: rawData.location || '',
    contact: rawData.contact || rawData.contactNumber || ''
  };

  if (!normalized.code) {
    throw new Error('College code is required');
  }
  if (!normalized.name) {
    throw new Error('College name is required');
  }
  if (!normalized.pedName) {
    throw new Error('PED name is required');
  }
  if (!normalized.pedPhone || !/^\d{6,15}$/.test(normalized.pedPhone)) {
    throw new Error('PED phone must be 6-15 digits');
  }

  return normalized;
}

/**
 * Batch normalize athlete records
 * @param {Array} rawRecords - Array of raw athlete records
 * @param {String} collegeId - College ObjectId
 * @returns {Array} - Normalized records
 */
export function normalizeAthletes(rawRecords, collegeId) {
  if (!Array.isArray(rawRecords)) {
    throw new Error('Records must be an array');
  }

  return rawRecords.map((record, index) => {
    try {
      return normalizeAthleteRecord(record, collegeId);
    } catch (err) {
      console.error(`Error normalizing athlete at index ${index}:`, err.message);
      return null;
    }
  }).filter(Boolean);
}

/**
 * Batch normalize event records
 * @param {Array} rawRecords - Array of raw event records
 * @returns {Array} - Normalized records
 */
export function normalizeEvents(rawRecords) {
  if (!Array.isArray(rawRecords)) {
    throw new Error('Records must be an array');
  }

  return rawRecords.map((record, index) => {
    try {
      return normalizeEventRecord(record);
    } catch (err) {
      console.error(`Error normalizing event at index ${index}:`, err.message);
      return null;
    }
  }).filter(Boolean);
}

/**
 * Batch normalize college records
 * @param {Array} rawRecords - Array of raw college records
 * @returns {Array} - Normalized records
 */
export function normalizeColleges(rawRecords) {
  if (!Array.isArray(rawRecords)) {
    throw new Error('Records must be an array');
  }

  return rawRecords.map((record, index) => {
    try {
      return normalizeCollegeRecord(record);
    } catch (err) {
      console.error(`Error normalizing college at index ${index}:`, err.message);
      return null;
    }
  }).filter(Boolean);
}

export default {
  normalizeAthleteRecord,
  normalizeEventRecord,
  normalizeCollegeRecord,
  normalizeGender,
  normalizeStatus,
  normalizeCategory,
  normalizeAthletes,
  normalizeEvents,
  normalizeColleges
};
