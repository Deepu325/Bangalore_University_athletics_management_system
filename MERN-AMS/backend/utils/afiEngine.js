/**
 * AFI POINTS ENGINE - Phase 5
 * Converts athletic performance to AFI points based on gender, event type, and performance bracket
 * 
 * Uses AFI lookup tables to compute points for individual performances
 */

import { Event, Result, Athlete, College } from '../models/index.js';

/**
 * Sample AFI lookup tables structure
 * In production, these would be loaded from MongoDB afi_tables collection
 */
const AFI_TABLES = {
  '100m': {
    Male: [
      { min: 0, max: 10.0, points: 800 },
      { min: 10.01, max: 10.5, points: 750 },
      { min: 10.51, max: 11.0, points: 700 },
      { min: 11.01, max: 11.5, points: 650 },
      { min: 11.51, max: 12.0, points: 600 },
      { min: 12.01, max: 999, points: 550 }
    ],
    Female: [
      { min: 0, max: 11.0, points: 800 },
      { min: 11.01, max: 11.5, points: 750 },
      { min: 11.51, max: 12.0, points: 700 },
      { min: 12.01, max: 12.5, points: 650 },
      { min: 12.51, max: 13.0, points: 600 },
      { min: 13.01, max: 999, points: 550 }
    ]
  },
  '400m': {
    Male: [
      { min: 0, max: 45.0, points: 850 },
      { min: 45.01, max: 46.0, points: 800 },
      { min: 46.01, max: 47.0, points: 750 },
      { min: 47.01, max: 48.0, points: 700 },
      { min: 48.01, max: 50.0, points: 650 },
      { min: 50.01, max: 999, points: 600 }
    ],
    Female: [
      { min: 0, max: 52.0, points: 850 },
      { min: 52.01, max: 53.0, points: 800 },
      { min: 53.01, max: 54.0, points: 750 },
      { min: 54.01, max: 55.0, points: 700 },
      { min: 55.01, max: 57.0, points: 650 },
      { min: 57.01, max: 999, points: 600 }
    ]
  },
  '1500m': {
    Male: [
      { min: 0, max: 210, points: 900 }, // in seconds
      { min: 210.01, max: 220, points: 850 },
      { min: 220.01, max: 230, points: 800 },
      { min: 230.01, max: 240, points: 750 },
      { min: 240.01, max: 260, points: 700 },
      { min: 260.01, max: 999, points: 650 }
    ],
    Female: [
      { min: 0, max: 240, points: 900 },
      { min: 240.01, max: 250, points: 850 },
      { min: 250.01, max: 260, points: 800 },
      { min: 260.01, max: 270, points: 750 },
      { min: 270.01, max: 290, points: 700 },
      { min: 290.01, max: 999, points: 650 }
    ]
  },
  'LongJump': {
    Male: [
      { min: 7.5, max: 10, points: 850 },
      { min: 7.0, max: 7.49, points: 800 },
      { min: 6.5, max: 6.99, points: 750 },
      { min: 6.0, max: 6.49, points: 700 },
      { min: 5.5, max: 5.99, points: 650 },
      { min: 0, max: 5.49, points: 600 }
    ],
    Female: [
      { min: 6.5, max: 10, points: 850 },
      { min: 6.0, max: 6.49, points: 800 },
      { min: 5.5, max: 5.99, points: 750 },
      { min: 5.0, max: 5.49, points: 700 },
      { min: 4.5, max: 4.99, points: 650 },
      { min: 0, max: 4.49, points: 600 }
    ]
  }
};

const EXCLUDED_EVENTS = ['Mixed Relay', 'Half Marathon'];

/**
 * Convert time string (HH:MM:SS:ML or MM:SS:ML) to seconds
 * @param {string} timeStr - Time in format HH:MM:SS:ML
 * @returns {number} - Time in seconds
 */
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return null;
  
  const parts = timeStr.split(':').map(p => parseInt(p, 10));
  
  if (parts.length === 3) {
    // MM:SS:ML
    return parts[0] * 60 + parts[1] + parts[2] / 100;
  } else if (parts.length === 4) {
    // HH:MM:SS:ML
    return parts[0] * 3600 + parts[1] * 60 + parts[2] + parts[3] / 100;
  }
  
  return null;
}

/**
 * Look up AFI points for a given performance in a specific event
 * @param {string} eventName - Event name (e.g., "100m", "LongJump")
 * @param {string} gender - "Male" or "Female"
 * @param {number|string} performance - Performance value (time in seconds or distance)
 * @returns {number} - AFI points
 */
function lookupAFIPoints(eventName, gender, performance) {
  const afiTable = AFI_TABLES[eventName];
  
  if (!afiTable) {
    console.warn(`⚠️ AFI table not found for event: ${eventName}`);
    return 0;
  }
  
  const genderTable = afiTable[gender];
  if (!genderTable) {
    console.warn(`⚠️ AFI table not found for gender: ${gender}`);
    return 0;
  }
  
  // For track events (times), lower is better
  // For field events (distances), higher is better
  const perfValue = typeof performance === 'string' ? parseTimeToSeconds(performance) : performance;
  
  if (perfValue === null) return 0;
  
  // Find matching bracket
  let matchedPoints = 0;
  for (const bracket of genderTable) {
    if (perfValue >= bracket.min && perfValue <= bracket.max) {
      matchedPoints = bracket.points;
      break;
    }
  }
  
  return matchedPoints;
}

/**
 * Calculate AFI points for a single athlete's final performance
 * @param {ObjectId} eventId - Event ID
 * @param {ObjectId} athleteId - Athlete ID
 * @param {string} finalPerformance - Final performance (time or distance)
 * @returns {Object} - { athleteId, eventId, afiPoints, isCounted, reason }
 */
export async function calculateAFIPoints(eventId, athleteId, finalPerformance) {
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return { 
        athleteId: athleteId.toString(), 
        eventId: eventId.toString(), 
        afiPoints: 0, 
        isCounted: false, 
        reason: 'Event not found' 
      };
    }

    const athlete = await Athlete.findById(athleteId);
    if (!athlete) {
      return { 
        athleteId: athleteId.toString(), 
        eventId: eventId.toString(), 
        afiPoints: 0, 
        isCounted: false, 
        reason: 'Athlete not found' 
      };
    }

    // Check if event should be excluded
    if (EXCLUDED_EVENTS.includes(event.name)) {
      return {
        athleteId: athleteId.toString(),
        eventId: eventId.toString(),
        afiPoints: 0,
        isCounted: false,
        reason: `Event excluded from AFI: ${event.name}`
      };
    }

    // Check if event counts for team
    if (!event.countForTeam) {
      return {
        athleteId: athleteId.toString(),
        eventId: eventId.toString(),
        afiPoints: 0,
        isCounted: false,
        reason: 'Event does not count for team scoring'
      };
    }

    // Calculate AFI points
    const afiPoints = lookupAFIPoints(event.name, event.gender, finalPerformance);

    return {
      athleteId: athleteId.toString(),
      eventId: eventId.toString(),
      afiPoints,
      isCounted: true,
      eventName: event.name,
      gender: event.gender,
      performance: finalPerformance,
      college: athlete.college
    };
  } catch (err) {
    console.error('❌ Error calculating AFI points:', err);
    return { 
      athleteId: athleteId.toString(), 
      eventId: eventId.toString(), 
      afiPoints: 0, 
      isCounted: false, 
      reason: err.message 
    };
  }
}

/**
 * Calculate AFI points for all athletes in an event's finals
 * @param {ObjectId} eventId - Event ID
 * @returns {Array} - Array of { athleteId, afiPoints, isCounted }
 */
export async function calculateEventAFIPoints(eventId) {
  try {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('Event not found');

    // Get finals (finalists array from event)
    if (!event.finalists || event.finalists.length === 0) {
      console.warn(`⚠️ No finalists found for event ${eventId}`);
      return [];
    }

    const results = [];

    for (const finalist of event.finalists) {
      // Get athlete's final performance from finals results
      const finalResult = event.finalResults?.find(fr => fr.athleteId === finalist.athleteId);
      
      if (finalResult && finalResult.performance) {
        const afiData = await calculateAFIPoints(eventId, finalist.athleteId, finalResult.performance);
        results.push(afiData);
      }
    }

    return results;
  } catch (err) {
    console.error('❌ Error calculating event AFI points:', err);
    throw err;
  }
}

/**
 * Calculate total AFI points for an athlete across all events
 * Only counts final round performances in counted events
 * @param {ObjectId} athleteId - Athlete ID
 * @returns {Object} - { athleteId, totalAFIPoints, eventCount, breakdown }
 */
export async function calculateAthleteAFIPoints(athleteId) {
  try {
    const athlete = await Athlete.findById(athleteId);
    if (!athlete) throw new Error('Athlete not found');

    // Get all events for this athlete
    const results = await Result.find({ athlete: athleteId, round: 5 }); // Round 5 = finals

    let totalAFIPoints = 0;
    const breakdown = [];

    for (const result of results) {
      if (result.points > 0) { // Only if they have a performance
        const afiData = await calculateAFIPoints(result.event, athleteId, result.timeMs || result.score);
        
        if (afiData.isCounted) {
          totalAFIPoints += afiData.afiPoints;
          breakdown.push(afiData);
        }
      }
    }

    return {
      athleteId: athleteId.toString(),
      name: athlete.name,
      college: athlete.college,
      totalAFIPoints,
      eventCount: breakdown.length,
      breakdown
    };
  } catch (err) {
    console.error('❌ Error calculating athlete AFI points:', err);
    throw err;
  }
}

export default {
  calculateAFIPoints,
  calculateEventAFIPoints,
  calculateAthleteAFIPoints,
  lookupAFIPoints,
  parseTimeToSeconds
};
