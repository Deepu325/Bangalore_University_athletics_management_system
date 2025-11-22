import express from 'express';
import { TeamScore } from '../models/index.js';
import { recalcTeamScores, getTeamRankings, getTeamChampionshipSummary, recalculateAllTeamScores } from '../utils/teamScoring.js';

const router = express.Router();

/**
 * GET /team-scores
 * Get ranked team scores for a specific category with tie-breaking
 * Query: ?category=Male or Female
 */
router.get('/', async (req, res) => {
  try {
    const { category = 'Male' } = req.query;

    const rankings = await getTeamRankings(category);

    res.json({
      success: true,
      category,
      count: rankings.length,
      rankings
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /team-scores/summary
 * Get championship summary (top teams for Men & Women)
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await getTeamChampionshipSummary();

    res.json({
      success: true,
      summary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /team-scores/:category
 * Alternative route for getting rankings by category
 */
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;

    if (!['Male', 'Female'].includes(category)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Category must be Male or Female' 
      });
    }

    const rankings = await getTeamRankings(category);

    res.json({
      success: true,
      category,
      count: rankings.length,
      rankings
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /team-scores/recalculate/:category
 * Manually trigger recalculation for a category
 */
router.post('/recalculate/:category', async (req, res) => {
  try {
    const { category } = req.params;

    if (!['Male', 'Female'].includes(category)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Category must be Male or Female' 
      });
    }

    await recalcTeamScores(category);

    res.json({
      success: true,
      message: `Team scores recalculated for ${category}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /team-scores/recalculate-all
 * Full recalculation from scratch (use with caution)
 */
router.post('/recalculate-all', async (req, res) => {
  try {
    await recalculateAllTeamScores();

    res.json({
      success: true,
      message: 'All team scores recalculated from scratch'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
