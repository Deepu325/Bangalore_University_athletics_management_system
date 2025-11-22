/**
 * FINAL ANNOUNCEMENT ENGINE - Phase 5
 * Generates and publishes final announcements including:
 * - Best Athlete (Men & Women)
 * - Team Championship Winner
 * - Event-wise Final Rankings
 * - Overall Medal Table
 * - Announcement Messages
 */

import { Event, Result, Athlete, College } from '../models/index.js';
import { getBestAthletesSummary } from './bestAthleteEngine.js';
import { getTeamChampionshipSummary } from './teamChampionshipEngine.js';

/**
 * Generate final announcement data for all events
 * @returns {Object} - Comprehensive announcement data
 */
export async function generateFinalAnnouncement() {
  try {
    console.log('📢 Generating Final Announcement...');

    const [bestAthletes, teamChampionship] = await Promise.all([
      getBestAthletesSummary(),
      getTeamChampionshipSummary()
    ]);

    // Get all events with their final rankings
    const events = await Event.find({});
    const eventRankings = [];

    for (const event of events) {
      if (!event.finalists || event.finalists.length === 0) continue;

      const rankings = event.finalists
        .map(finalist => {
          const finalResult = event.finalResults?.find(fr => fr.athleteId === finalist.athleteId);
          return {
            athleteId: finalist.athleteId,
            athleteName: finalist.name,
            college: finalist.college,
            lane: finalist.lane,
            seed: finalist.seed,
            performance: finalResult?.performance || 'N/A',
            rank: finalResult?.rank || 0,
            points: finalResult?.points || 0
          };
        })
        .sort((a, b) => a.rank - b.rank);

      eventRankings.push({
        eventName: event.name,
        eventId: event._id.toString(),
        gender: event.gender,
        category: event.category,
        rankings: rankings.slice(0, 8), // Top 8 finalists
        winner: rankings[0] || null,
        medals: {
          gold: rankings[0] || null,
          silver: rankings[1] || null,
          bronze: rankings[2] || null
        }
      });
    }

    // Compile overall medal table
    const medalTable = compileMedalTable(eventRankings);

    const announcement = {
      timestamp: new Date(),
      bestAthletes: {
        bestMale: bestAthletes.bestMaleAthlete,
        bestFemale: bestAthletes.bestFemaleAthlete,
        topMales: bestAthletes.topMaleAthletes.slice(0, 5),
        topFemales: bestAthletes.topFemaleAthletes.slice(0, 5)
      },
      teamChampionship: {
        champion: teamChampionship.champion,
        runnerUp: teamChampionship.runnerUp,
        thirdPlace: teamChampionship.thirdPlace,
        topTen: teamChampionship.topTen
      },
      eventRankings: eventRankings,
      medalTable: medalTable,
      messages: generateAnnouncementMessages(bestAthletes, teamChampionship, medalTable),
      status: 'READY_TO_PUBLISH'
    };

    console.log('✅ Final announcement generated');
    return announcement;
  } catch (err) {
    console.error('❌ Error generating final announcement:', err);
    throw err;
  }
}

/**
 * Compile overall medal table from all events
 * @param {Array} eventRankings - Array of event ranking data
 * @returns {Object} - Medal counts by college
 */
function compileMedalTable(eventRankings) {
  const medalCounts = {};

  for (const event of eventRankings) {
    if (event.medals.gold) {
      const college = event.medals.gold.college;
      if (!medalCounts[college]) {
        medalCounts[college] = { gold: 0, silver: 0, bronze: 0, total: 0 };
      }
      medalCounts[college].gold++;
      medalCounts[college].total++;
    }

    if (event.medals.silver) {
      const college = event.medals.silver.college;
      if (!medalCounts[college]) {
        medalCounts[college] = { gold: 0, silver: 0, bronze: 0, total: 0 };
      }
      medalCounts[college].silver++;
      medalCounts[college].total++;
    }

    if (event.medals.bronze) {
      const college = event.medals.bronze.college;
      if (!medalCounts[college]) {
        medalCounts[college] = { gold: 0, silver: 0, bronze: 0, total: 0 };
      }
      medalCounts[college].bronze++;
      medalCounts[college].total++;
    }
  }

  // Sort by gold, then silver, then bronze
  const sorted = Object.entries(medalCounts)
    .map(([college, counts]) => ({ college, ...counts }))
    .sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      return b.bronze - a.bronze;
    });

  return sorted;
}

/**
 * Generate announcement messages for MC and stage display
 * @param {Object} bestAthletes - Best athletes data
 * @param {Object} teamChamp - Team championship data
 * @param {Array} medalTable - Medal table
 * @returns {Array} - Array of announcement messages
 */
function generateAnnouncementMessages(bestAthletes, teamChamp, medalTable) {
  const messages = [];

  // Best male athlete message
  if (bestAthletes.bestMaleAthlete) {
    messages.push({
      type: 'BEST_MALE_ATHLETE',
      message: `🏆 Best Male Athlete: ${bestAthletes.bestMaleAthlete.name} from ${bestAthletes.bestMaleAthlete.college} with ${bestAthletes.bestMaleAthlete.totalAFIPoints} AFI points!`,
      priority: 'HIGH'
    });
  }

  // Best female athlete message
  if (bestAthletes.bestFemaleAthlete) {
    messages.push({
      type: 'BEST_FEMALE_ATHLETE',
      message: `🏆 Best Female Athlete: ${bestAthletes.bestFemaleAthlete.name} from ${bestAthletes.bestFemaleAthlete.college} with ${bestAthletes.bestFemaleAthlete.totalAFIPoints} AFI points!`,
      priority: 'HIGH'
    });
  }

  // Team championship message
  if (teamChamp.champion) {
    messages.push({
      type: 'TEAM_CHAMPION',
      message: `🥇 Team Champions: ${teamChamp.champion.collegeName} with ${teamChamp.champion.totalPoints} points! (${teamChamp.champion.medals.gold} Gold, ${teamChamp.champion.medals.silver} Silver, ${teamChamp.champion.medals.bronze} Bronze)`,
      priority: 'CRITICAL'
    });
  }

  // Runner up message
  if (teamChamp.runnerUp) {
    messages.push({
      type: 'RUNNER_UP',
      message: `🥈 Runner-Up: ${teamChamp.runnerUp.collegeName} with ${teamChamp.runnerUp.totalPoints} points`,
      priority: 'HIGH'
    });
  }

  // Third place message
  if (teamChamp.thirdPlace) {
    messages.push({
      type: 'THIRD_PLACE',
      message: `🥉 Third Place: ${teamChamp.thirdPlace.collegeName} with ${teamChamp.thirdPlace.totalPoints} points`,
      priority: 'HIGH'
    });
  }

  // Most medals message
  if (medalTable.length > 0) {
    const topMedalGetter = medalTable[0];
    messages.push({
      type: 'MOST_MEDALS',
      message: `🎖️ Most Medals: ${topMedalGetter.college} - ${topMedalGetter.gold} Gold, ${topMedalGetter.silver} Silver, ${topMedalGetter.bronze} Bronze`,
      priority: 'MEDIUM'
    });
  }

  return messages;
}

/**
 * Generate PDF-ready announcement data
 * @returns {Object} - Data formatted for PDF generation
 */
export async function generateAnnouncementPDFData() {
  try {
    const announcement = await generateFinalAnnouncement();

    return {
      title: 'Athletics Championship - Final Announcement',
      date: new Date().toLocaleDateString(),
      sections: {
        bestAthletes: {
          title: 'Best Athletes',
          male: announcement.bestAthletes.bestMale,
          female: announcement.bestAthletes.bestFemale,
          topMales: announcement.bestAthletes.topMales,
          topFemales: announcement.bestAthletes.topFemales
        },
        teamChampionship: {
          title: 'Team Championship Results',
          champion: announcement.teamChampionship.champion,
          runnerUp: announcement.teamChampionship.runnerUp,
          thirdPlace: announcement.teamChampionship.thirdPlace,
          topTen: announcement.teamChampionship.topTen
        },
        medalTable: {
          title: 'Overall Medal Table',
          data: announcement.medalTable
        },
        eventResults: {
          title: 'Event-wise Results',
          events: announcement.eventRankings.map(event => ({
            name: event.eventName,
            category: event.category,
            winner: event.medals.gold?.athleteName || 'N/A',
            winnerCollege: event.medals.gold?.college || 'N/A',
            performance: event.medals.gold?.performance || 'N/A'
          }))
        }
      },
      messages: announcement.messages
    };
  } catch (err) {
    console.error('❌ Error generating announcement PDF data:', err);
    throw err;
  }
}

/**
 * Publish final announcement (mock function - in production would send emails, update displays, etc.)
 * @param {Object} announcementData - Announcement data to publish
 * @returns {Object} - Publication status
 */
export async function publishFinalAnnouncement(announcementData) {
  try {
    console.log('📤 Publishing final announcement...');

    if (!announcementData) {
      announcementData = await generateFinalAnnouncement();
    }

    // In production, this would:
    // 1. Send emails to colleges
    // 2. Update display boards
    // 3. Post to social media
    // 4. Generate PDFs
    // 5. Update database with published flag

    console.log('✅ Final announcement published successfully');

    return {
      success: true,
      message: 'Final announcement published',
      timestamp: new Date(),
      announcements: announcementData.messages.length,
      events: announcementData.eventRankings.length,
      colleges: Object.keys(announcementData.medalTable).length
    };
  } catch (err) {
    console.error('❌ Error publishing final announcement:', err);
    throw err;
  }
}

/**
 * Get announcement status and completion percentage
 * @returns {Object} - Status with completion metrics
 */
export async function getAnnouncementStatus() {
  try {
    const events = await Event.find({});
    const eventsWithResults = events.filter(e => e.finalResults && e.finalResults.length > 0);
    const completionPercentage = (eventsWithResults.length / events.length) * 100;

    return {
      totalEvents: events.length,
      eventsWithResults: eventsWithResults.length,
      completionPercentage: Math.round(completionPercentage),
      readyToAnnounce: completionPercentage === 100,
      timestamp: new Date()
    };
  } catch (err) {
    console.error('❌ Error getting announcement status:', err);
    throw err;
  }
}

export default {
  generateFinalAnnouncement,
  generateAnnouncementPDFData,
  publishFinalAnnouncement,
  getAnnouncementStatus
};
