
import { Event, Result, TeamScore, College } from '../models/index.js';

const POINTS = { 1: 5, 2: 3, 3: 1 };

/**
 * Recalculate team scores for a specific category (Male/Female)
 * Called after results are entered/updated
 * @param {String} category - 'Male' or 'Female'
 */
export async function recalcTeamScores(category) {
  try {
    console.log(`🔄 Recalculating team scores for ${category}...`);

    // 1) Get events that count for team and match category
    const events = await Event.find({ 
      gender: category, 
      countForTeam: true 
    });

    if (events.length === 0) {
      console.log(`ℹ️  No counted events for ${category}`);
      return;
    }

    // 2) Get all results for those events, positions 1-3
    const eventIds = events.map(e => e._id);
    const results = await Result.find({ 
      eventId: { $in: eventIds }, 
      position: { $in: [1, 2, 3] } 
    }).populate('collegeId');

    // 3) Aggregate by college
    const scoreMap = {}; // collegeId -> {golds, silvers, bronzes, points, collegeName}
    
    for (const r of results) {
      const collegeId = r.collegeId._id.toString();
      const collegeName = r.collegeId.name || 'Unknown';

      if (!scoreMap[collegeId]) {
        scoreMap[collegeId] = { 
          golds: 0, 
          silvers: 0, 
          bronzes: 0, 
          points: 0,
          collegeName 
        };
      }

      if (r.position === 1) {
        scoreMap[collegeId].golds++;
        scoreMap[collegeId].points += POINTS[1];
      }
      if (r.position === 2) {
        scoreMap[collegeId].silvers++;
        scoreMap[collegeId].points += POINTS[2];
      }
      if (r.position === 3) {
        scoreMap[collegeId].bronzes++;
        scoreMap[collegeId].points += POINTS[3];
      }
    }

    // 4) Upsert into team_scores collection with tie-break data
    for (const [collegeId, scores] of Object.entries(scoreMap)) {
      await TeamScore.updateOne(
        { collegeId, category },
        {
          $set: {
            golds: scores.golds,
            silvers: scores.silvers,
            bronzes: scores.bronzes,
            points: scores.points,
            collegeName: scores.collegeName,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }

    // 5) Get all colleges and ensure zero-score teams exist
    const allColleges = await College.find();
    const scoreMapIds = Object.keys(scoreMap);

    for (const college of allColleges) {
      const collegeIdStr = college._id.toString();
      if (!scoreMapIds.includes(collegeIdStr)) {
        // College has no medals in this category
        await TeamScore.updateOne(
          { collegeId: college._id, category },
          {
            $set: {
              golds: 0,
              silvers: 0,
              bronzes: 0,
              points: 0,
              collegeName: college.name,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
      }
    }

    console.log(`✅ Team scores recalculated for ${category}`);
  } catch (err) {
    console.error('❌ Error recalculating team scores:', err);
    throw err;
  }
}

/**
 * Get ranked team scores with tie-breaking
 * @param {String} category - 'Male' or 'Female'
 * @returns {Array} - sorted array of team scores with ranks
 */
export async function getTeamRankings(category) {
  try {
    const teamScores = await TeamScore.find({ category })
      .sort({ 
        points: -1, 
        golds: -1, 
        silvers: -1, 
        bronzes: -1, 
        collegeName: 1 
      });

    // Add rank field
    const ranked = teamScores.map((score, index) => ({
      ...score.toObject(),
      rank: index + 1
    }));

    return ranked;
  } catch (err) {
    console.error('❌ Error getting team rankings:', err);
    throw err;
  }
}

/**
 * Get team championship summary (top teams for Men & Women)
 * @returns {Object} - { men: [...], women: [...] }
 */
export async function getTeamChampionshipSummary() {
  try {
    const menRankings = await getTeamRankings('Male');
    const womenRankings = await getTeamRankings('Female');

    return {
      men: menRankings.slice(0, 3), // Top 3
      women: womenRankings.slice(0, 3),
      menChampion: menRankings[0] || null,
      womenChampion: womenRankings[0] || null
    };
  } catch (err) {
    console.error('❌ Error getting championship summary:', err);
    throw err;
  }
}

/**
 * Recalculate all team scores (full recompute from scratch)
 * Useful for data corrections
 */
export async function recalculateAllTeamScores() {
  try {
    console.log('🔄 Full recalculation of all team scores...');
    
    // Clear all team scores
    await TeamScore.deleteMany({});
    
    // Recalculate for both categories
    await recalcTeamScores('Male');
    await recalcTeamScores('Female');
    
    console.log('✅ Full team score recalculation complete');
  } catch (err) {
    console.error('❌ Error in full recalculation:', err);
    throw err;
  }
}
