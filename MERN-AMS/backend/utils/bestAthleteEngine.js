/**
 * BEST ATHLETE ENGINE - Phase 5
 * Identifies best male and female athletes based on total AFI points
 * across all their final performances
 */

import { Event, Result, Athlete, College } from '../models/index.js';
import { calculateAthleteAFIPoints } from './afiEngine.js';

const EXCLUDED_EVENTS = ['Mixed Relay', 'Half Marathon'];

/**
 * Get all eligible athletes for best athlete selection
 * @param {string} gender - "Male" or "Female"
 * @returns {Array} - Array of athlete IDs
 */
async function getEligibleAthletes(gender) {
  try {
    const athletes = await Athlete.find({ gender });
    return athletes.map(a => a._id);
  } catch (err) {
    console.error('❌ Error getting eligible athletes:', err);
    throw err;
  }
}

/**
 * Calculate AFI points for all athletes in a specific gender
 * @param {string} gender - "Male" or "Female"
 * @returns {Array} - Sorted array of { athleteId, name, college, totalAFIPoints, eventCount, breakdown }
 */
export async function calculateAllAthletesAFIPoints(gender) {
  try {
    console.log(`🏃 Calculating AFI points for all ${gender} athletes...`);

    const athletes = await getEligibleAthletes(gender);
    const athletesData = [];

    for (const athleteId of athletes) {
      const afiData = await calculateAthleteAFIPoints(athleteId);
      athletesData.push(afiData);
    }

    // Sort by totalAFIPoints descending
    athletesData.sort((a, b) => b.totalAFIPoints - a.totalAFIPoints);

    console.log(`✅ AFI points calculated for ${athletesData.length} ${gender} athletes`);
    return athletesData;
  } catch (err) {
    console.error('❌ Error calculating all athletes AFI points:', err);
    throw err;
  }
}

/**
 * Find best male athlete based on total AFI points
 * @returns {Object} - { athleteId, name, college, totalAFIPoints, rank, breakdown }
 */
export async function getBestMaleAthlete() {
  try {
    const maleAthletes = await calculateAllAthletesAFIPoints('Male');
    
    if (maleAthletes.length === 0) {
      console.warn('⚠️ No male athletes found');
      return null;
    }

    return {
      ...maleAthletes[0],
      rank: 1,
      category: 'Male'
    };
  } catch (err) {
    console.error('❌ Error getting best male athlete:', err);
    throw err;
  }
}

/**
 * Find best female athlete based on total AFI points
 * @returns {Object} - { athleteId, name, college, totalAFIPoints, rank, breakdown }
 */
export async function getBestFemaleAthlete() {
  try {
    const femaleAthletes = await calculateAllAthletesAFIPoints('Female');
    
    if (femaleAthletes.length === 0) {
      console.warn('⚠️ No female athletes found');
      return null;
    }

    return {
      ...femaleAthletes[0],
      rank: 1,
      category: 'Female'
    };
  } catch (err) {
    console.error('❌ Error getting best female athlete:', err);
    throw err;
  }
}

/**
 * Get top N athletes for a specific gender
 * @param {string} gender - "Male" or "Female"
 * @param {number} limit - Number of athletes to return (default: 10)
 * @returns {Array} - Sorted array of top athletes with ranks
 */
export async function getTopAthletes(gender, limit = 10) {
  try {
    const athletes = await calculateAllAthletesAFIPoints(gender);
    
    return athletes.slice(0, limit).map((athlete, index) => ({
      ...athlete,
      rank: index + 1
    }));
  } catch (err) {
    console.error('❌ Error getting top athletes:', err);
    throw err;
  }
}

/**
 * Get best athletes for both genders (summary)
 * @returns {Object} - { bestMaleAthlete, bestFemaleAthlete, topMaleAthletes, topFemaleAthletes }
 */
export async function getBestAthletesSummary() {
  try {
    console.log('🏅 Generating Best Athletes Summary...');

    const [bestMale, bestFemale, topMales, topFemales] = await Promise.all([
      getBestMaleAthlete(),
      getBestFemaleAthlete(),
      getTopAthletes('Male', 10),
      getTopAthletes('Female', 10)
    ]);

    return {
      bestMaleAthlete: bestMale,
      bestFemaleAthlete: bestFemale,
      topMaleAthletes: topMales,
      topFemaleAthletes: topFemales,
      timestamp: new Date(),
      summary: {
        bestMaleCollege: bestMale?.college || 'N/A',
        bestFemaleCollege: bestFemale?.college || 'N/A',
        bestMalePoints: bestMale?.totalAFIPoints || 0,
        bestFemalePoints: bestFemale?.totalAFIPoints || 0
      }
    };
  } catch (err) {
    console.error('❌ Error generating best athletes summary:', err);
    throw err;
  }
}

/**
 * Get athlete details with all final performances
 * @param {ObjectId} athleteId - Athlete ID
 * @returns {Object} - Detailed athlete info with all finals data
 */
export async function getAthleteDetailsSummary(athleteId) {
  try {
    const athlete = await Athlete.findById(athleteId);
    if (!athlete) throw new Error('Athlete not found');

    // Get all final results for this athlete
    const results = await Result.find({ 
      athlete: athleteId, 
      round: 5 
    }).populate('event');

    const afiData = await calculateAthleteAFIPoints(athleteId);

    return {
      athleteId: athleteId.toString(),
      name: athlete.name,
      gender: athlete.gender,
      college: athlete.college,
      bibNumber: athlete.bibNumber,
      totalAFIPoints: afiData.totalAFIPoints,
      eventCount: afiData.eventCount,
      finalPerformances: results.map(r => ({
        eventName: r.event?.name,
        eventCategory: r.event?.category,
        performance: r.timeMs || r.score,
        rank: r.rank,
        afiPoints: r.points || 0
      })),
      breakdown: afiData.breakdown
    };
  } catch (err) {
    console.error('❌ Error getting athlete details summary:', err);
    throw err;
  }
}

export default {
  getBestMaleAthlete,
  getBestFemaleAthlete,
  getTopAthletes,
  getBestAthletesSummary,
  getAthleteDetailsSummary,
  calculateAllAthletesAFIPoints
};
