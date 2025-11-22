import express from 'express';
import { Result } from '../models/index.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/results/:eventId
 * Get all results for an event
 */
router.get('/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const results = await Result.find({ event: eventId })
      .populate('athlete', 'name chestNo bibNumber college')
      .populate('event', 'name category gender')
      .sort({ rank: 1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/results/:eventId/athlete/:athleteId
 * Get a single athlete's result for an event
 */
router.get('/:eventId/athlete/:athleteId', verifyToken, async (req, res) => {
  try {
    const { eventId, athleteId } = req.params;

    const result = await Result.findOne({
      event: eventId,
      athlete: athleteId
    })
      .populate('athlete', 'name chestNo bibNumber')
      .populate('event', 'name category');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/results/:eventId/athlete/:athleteId
 * 
 * IMPORTANT: Updates ONLY the specified athlete's result.
 * Uses findOneAndUpdate (not updateMany) to ensure single athlete update.
 * 
 * Body: { score, timeMs, round, status, remarks }
 */
router.put('/:eventId/athlete/:athleteId', verifyToken, async (req, res) => {
  try {
    const { eventId, athleteId } = req.params;
    const { score, timeMs, round, status, remarks } = req.body;

    // Build update object with only provided fields
    const updateData = { updatedAt: new Date() };
    if (score !== undefined) updateData.score = score;
    if (timeMs !== undefined) updateData.timeMs = timeMs;
    if (round !== undefined) updateData.round = round;
    if (status !== undefined) updateData.status = status;
    if (remarks !== undefined) updateData.remarks = remarks;

    // CRITICAL: Use findOneAndUpdate with specific filter
    // This ensures we only update ONE athlete's result
    const result = await Result.findOneAndUpdate(
      {
        event: eventId,
        athlete: athleteId
      },
      { $set: updateData },
      {
        new: true,
        upsert: true // Create if doesn't exist
      }
    )
      .populate('athlete', 'name chestNo bibNumber')
      .populate('event', 'name category');

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/results/:eventId/athlete/:athleteId
 * Partial update for a single athlete's result
 * Same as PUT but with PATCH semantics
 */
router.patch('/:eventId/athlete/:athleteId', verifyToken, async (req, res) => {
  try {
    const { eventId, athleteId } = req.params;

    const updateData = { updatedAt: new Date() };
    Object.assign(updateData, req.body);

    const result = await Result.findOneAndUpdate(
      {
        event: eventId,
        athlete: athleteId
      },
      { $set: updateData },
      {
        new: true,
        upsert: true
      }
    )
      .populate('athlete', 'name chestNo bibNumber')
      .populate('event', 'name category');

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/results/:eventId/athlete/:athleteId
 * Delete a single athlete's result
 */
router.delete('/:eventId/athlete/:athleteId', verifyToken, async (req, res) => {
  try {
    const { eventId, athleteId } = req.params;

    const result = await Result.findOneAndDelete({
      event: eventId,
      athlete: athleteId
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    res.json({ success: true, message: 'Result deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/results/batch
 * Create or update multiple results (use with caution)
 * Body: { results: [{ event, athlete, score, ... }, ...] }
 */
router.post('/batch', verifyToken, async (req, res) => {
  try {
    const { results: resultArray } = req.body;

    if (!Array.isArray(resultArray)) {
      return res.status(400).json({ success: false, message: 'Results must be an array' });
    }

    const ops = resultArray.map(r => ({
      updateOne: {
        filter: { event: r.event, athlete: r.athlete },
        update: { $set: { ...r, updatedAt: new Date() } },
        upsert: true
      }
    }));

    const bulkResult = await Result.bulkWrite(ops);

    res.json({ 
      success: true, 
      message: `${bulkResult.upsertedCount + bulkResult.modifiedCount} results updated`,
      details: bulkResult 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
