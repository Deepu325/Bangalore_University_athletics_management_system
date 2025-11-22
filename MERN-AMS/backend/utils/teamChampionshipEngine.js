/**
 * TEAM CHAMPIONSHIP SCORING ENGINE - Phase 5
 * Calculates team points based on final event rankings
 * 
 * Scoring Rules:
 * - 1st place: 5 points
 * - 2nd place: 3 points
 * - 3rd place: 1 point
 * - Mixed Relay & Half Marathon: 0 points (excluded)
 */

import { Event, Result, TeamScore, College, Athlete } from '../models/index.js';

const POINTS_TABLE = {
  1: 5,
  2: 3,
  3: 1
};

const EXCLUDED_EVENTS = ['Mixed Relay', 'Half Marathon'];

/**
 * Calculate team points for a specific event's finals
 * Finds top 3 finalists and allocates points
 * @param {ObjectId} eventId - Event ID
 * @returns {Array} - Array of { collegeId, collegeName, position, points, athleteName }
 */
export async function calculateEventTeamPoints(eventId) {
  try {
    const event = await Event.findById(eventId);
    if (!event) throw new Error('Event not found');

    // Skip excluded events
    if (EXCLUDED_EVENTS.includes(event.name)) {
      console.log(`⏭️  Skipping ${event.name} (excluded from team scoring)`);
      return [];
    }

    // Skip if event doesn't count for team
    if (!event.countForTeam) {
      console.log(`⏭️  ${event.name} does not count for team`);
      return [];
    }

    // Get finalists (top 8 with final performances)
    if (!event.finalists || event.finalists.length === 0) {
      console.warn(`⚠️ No finalists for event ${event.name}`);
      return [];
    }

    const teamPoints = [];

    // Sort finalists by final performance and assign points to top 3
    const sortedFinalists = [...event.finalists].sort((a, b) => {
      // Find final result for each
      const resultA = event.finalResults?.find(fr => fr.athleteId === a.athleteId);
      const resultB = event.finalResults?.find(fr => fr.athleteId === b.athleteId);
      
      return (resultA?.rank || 999) - (resultB?.rank || 999);
    });

    // Top 3 positions
    for (let position = 1; position <= 3 && position <= sortedFinalists.length; position++) {
      const finalist = sortedFinalists[position - 1];
      const athlete = await Athlete.findById(finalist.athleteId);
      
      if (athlete) {
        teamPoints.push({
          collegeId: athlete.college || 'Unknown',
          collegeName: athlete.college || 'Unknown',
          position,
          points: POINTS_TABLE[position],
          athleteName: athlete.name,
          athleteId: finalist.athleteId,
          eventName: event.name,
          eventId: eventId.toString()
        });
      }
    }

    return teamPoints;
  } catch (err) {
    console.error('❌ Error calculating event team points:', err);
    throw err;
  }
}

/**
 * Calculate all team points for all events
 * @returns {Object} - { byCollege: {...}, byEvent: {...}, totals: [...] }
 */
export async function calculateAllTeamPoints() {
  try {
    console.log('🏆 Calculating team championship points...');

    // Get all events that count for team
    const events = await Event.find({ countForTeam: true });

    const pointsByCollege = {}; // college -> { points, medals, eventBreakdown }
    const pointsByEvent = {}; // eventId -> pointsArray

    // Process each event
    for (const event of events) {
      if (EXCLUDED_EVENTS.includes(event.name)) continue;

      const eventPoints = await calculateEventTeamPoints(event._id);
      pointsByEvent[event._id.toString()] = eventPoints;

      // Aggregate by college
      for (const ep of eventPoints) {
        if (!pointsByCollege[ep.collegeName]) {
          pointsByCollege[ep.collegeName] = {
            collegeId: ep.collegeName,
            collegeName: ep.collegeName,
            totalPoints: 0,
            medals: { gold: 0, silver: 0, bronze: 0 },
            eventBreakdown: []
          };
        }

        pointsByCollege[ep.collegeName].totalPoints += ep.points;
        
        // Count medals
        if (ep.position === 1) pointsByCollege[ep.collegeName].medals.gold++;
        if (ep.position === 2) pointsByCollege[ep.collegeName].medals.silver++;
        if (ep.position === 3) pointsByCollege[ep.collegeName].medals.bronze++;
        
        pointsByCollege[ep.collegeName].eventBreakdown.push({
          eventName: ep.eventName,
          position: ep.position,
          points: ep.points,
          athleteName: ep.athleteName
        });
      }
    }

    // Sort colleges by total points (descending)
    const totals = Object.values(pointsByCollege)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((college, index) => ({
        ...college,
        rank: index + 1
      }));

    console.log(`✅ Team championship points calculated for ${totals.length} colleges`);
    return {
      byCollege: pointsByCollege,
      byEvent: pointsByEvent,
      totals,
      timestamp: new Date()
    };
  } catch (err) {
    console.error('❌ Error calculating all team points:', err);
    throw err;
  }
}

/**
 * Get team championship rankings sorted by total points
 * Includes medal counts and event breakdown
 * @returns {Array} - Ranked colleges with points and medals
 */
export async function getTeamChampionshipRankings() {
  try {
    const allPoints = await calculateAllTeamPoints();
    return allPoints.totals;
  } catch (err) {
    console.error('❌ Error getting team rankings:', err);
    throw err;
  }
}

/**
 * Get team championship summary (top colleges and winners)
 * @returns {Object} - { champion, runnerUp, thirdPlace, topTen }
 */
export async function getTeamChampionshipSummary() {
  try {
    console.log('🥇 Generating Team Championship Summary...');

    const rankings = await getTeamChampionshipRankings();

    return {
      champion: rankings[0] || null,
      runnerUp: rankings[1] || null,
      thirdPlace: rankings[2] || null,
      topTen: rankings.slice(0, 10),
      totalColleges: rankings.length,
      timestamp: new Date(),
      summary: {
        championCollege: rankings[0]?.collegeName || 'N/A',
        championPoints: rankings[0]?.totalPoints || 0,
        championGolds: rankings[0]?.medals?.gold || 0,
        championSilvers: rankings[0]?.medals?.silver || 0,
        championBronzes: rankings[0]?.medals?.bronze || 0
      }
    };
  } catch (err) {
    console.error('❌ Error generating team championship summary:', err);
    throw err;
  }
}

/**
 * Get college-specific team score breakdown
 * @param {string} collegeName - College name
 * @returns {Object} - College score details with event breakdown
 */
export async function getCollegeTeamScore(collegeName) {
  try {
    const rankings = await getTeamChampionshipRankings();
    const college = rankings.find(c => c.collegeName === collegeName);

    if (!college) {
      return { collegeName, totalPoints: 0, rank: null, medals: {}, eventBreakdown: [] };
    }

    return college;
  } catch (err) {
    console.error('❌ Error getting college team score:', err);
    throw err;
  }
}

/**
 * Update TeamScore collection with calculated points
 * Should be called after all finals are completed
 * @returns {Object} - Upsert results
 */
export async function persistTeamScoresToDB() {
  try {
    console.log('💾 Persisting team scores to database...');

    const rankings = await getTeamChampionshipRankings();

    // Clear existing scores
    await TeamScore.deleteMany({});

    // Insert new scores
    for (const ranking of rankings) {
      await TeamScore.create({
        collegeId: ranking.collegeId,
        collegeName: ranking.collegeName,
        category: 'Overall',
        golds: ranking.medals.gold,
        silvers: ranking.medals.silver,
        bronzes: ranking.medals.bronze,
        points: ranking.totalPoints,
        rank: ranking.rank,
        updatedAt: new Date()
      });
    }

    console.log(`✅ Team scores persisted for ${rankings.length} colleges`);
    return { success: true, collegesUpdated: rankings.length };
  } catch (err) {
    console.error('❌ Error persisting team scores:', err);
    throw err;
  }
}

export default {
  calculateEventTeamPoints,
  calculateAllTeamPoints,
  getTeamChampionshipRankings,
  getTeamChampionshipSummary,
  getCollegeTeamScore,
  persistTeamScoresToDB
};
