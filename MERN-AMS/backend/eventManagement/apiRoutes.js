/**
 * Enhanced Event Management API Routes
 * Express.js endpoints using improved EventFlow system
 */

const express = require('express');
const EventFlow = require('./eventFlow');

const router = express.Router();
const eventFlow = new EventFlow();

// ============================================================================
// EVENT LIFECYCLE ENDPOINTS
// ============================================================================

/**
 * POST /api/events
 * Create a new event
 */
router.post('/', (req, res) => {
  try {
    const { name, gender, date, venue } = req.body;

    if (!name || !gender) {
      return res.status(400).json({
        success: false,
        error: 'Event name and gender are required'
      });
    }

    const result = eventFlow.createEvent({
      name,
      gender,
      date: date || new Date(),
      venue: venue || 'TBD'
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/events
 * Get all events
 */
router.get('/', (req, res) => {
  try {
    const events = eventFlow.getAllEvents();
    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/events/:eventId
 * Get event details
 */
router.get('/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    const summary = eventFlow.getEventSummary(eventId);

    if (!summary.success) {
      return res.status(404).json(summary);
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// STAGE ENDPOINTS
// ============================================================================

/**
 * POST /api/events/:eventId/stages/2/callroom
 * Stage 2: Generate call room
 */
router.post('/:eventId/stages/2/callroom', (req, res) => {
  try {
    const { eventId } = req.params;
    const { athletes } = req.body;

    if (!Array.isArray(athletes)) {
      return res.status(400).json({
        success: false,
        error: 'Athletes array is required'
      });
    }

    const result = eventFlow.stage2_GenerateCallRoom(eventId, athletes);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/events/:eventId/stages/3/attendance
 * Stage 3: Mark attendance
 */
router.post('/:eventId/stages/3/attendance', (req, res) => {
  try {
    const { eventId } = req.params;
    const { marked } = req.body;

    if (!Array.isArray(marked)) {
      return res.status(400).json({
        success: false,
        error: 'Marked array is required'
      });
    }

    const result = eventFlow.stage3_MarkAttendance(eventId, { marked });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/events/:eventId/stages/4/sheets
 * Stage 4: Get event sheets
 */
router.get('/:eventId/stages/4/sheets', (req, res) => {
  try {
    const { eventId } = req.params;
    const result = eventFlow.stage4_GenerateEventSheets(eventId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/events/:eventId/stages/5/score-round1
 * Stage 5: Score round 1
 */
router.post('/:eventId/stages/5/score-round1', (req, res) => {
  try {
    const { eventId } = req.params;
    const { performances } = req.body;

    if (!Array.isArray(performances)) {
      return res.status(400).json({
        success: false,
        error: 'Performances array is required'
      });
    }

    const result = eventFlow.stage5_ScoreRound1(eventId, performances);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/events/:eventId/stages/6/select-top
 * Stage 6: Select top athletes
 */
router.post('/:eventId/stages/6/select-top', (req, res) => {
  try {
    const { eventId } = req.params;
    const { topCount = 8 } = req.body;

    const result = eventFlow.stage6_SelectTop(eventId, topCount);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/events/:eventId/stages/7/heats
 * Stage 7: Generate heats
 */
router.get('/:eventId/stages/7/heats', (req, res) => {
  try {
    const { eventId } = req.params;
    const result = eventFlow.stage7_GenerateHeats(eventId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/events/:eventId/stages/8/score-heats
 * Stage 8: Score heats
 */
router.post('/:eventId/stages/8/score-heats', (req, res) => {
  try {
    const { eventId } = req.params;
    const { heatPerformances } = req.body;

    if (!Array.isArray(heatPerformances)) {
      return res.status(400).json({
        success: false,
        error: 'Heat performances array is required'
      });
    }

    const result = eventFlow.stage8_ScoreHeats(eventId, heatPerformances);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/events/:eventId/stages/9/prefinal
 * Stage 9: Get pre-final sheet
 */
router.get('/:eventId/stages/9/prefinal', (req, res) => {
  try {
    const { eventId } = req.params;
    const { finalCount = 8 } = req.query;

    const result = eventFlow.stage9_PreFinalSheet(eventId, parseInt(finalCount));
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/events/:eventId/stages/10/score-final
 * Stage 10: Score final
 */
router.post('/:eventId/stages/10/score-final', (req, res) => {
  try {
    const { eventId } = req.params;
    const { finalPerformances } = req.body;

    if (!Array.isArray(finalPerformances)) {
      return res.status(400).json({
        success: false,
        error: 'Final performances array is required'
      });
    }

    const result = eventFlow.stage10_ScoreFinal(eventId, finalPerformances);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/events/:eventId/stages/11/announce
 * Stage 11: Announce results
 */
router.get('/:eventId/stages/11/announce', (req, res) => {
  try {
    const { eventId } = req.params;
    const result = eventFlow.stage11_AnnounceResults(eventId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/events/:eventId/stages/12/correct-names
 * Stage 12: Correct athlete names
 */
router.post('/:eventId/stages/12/correct-names', (req, res) => {
  try {
    const { eventId } = req.params;
    const { corrections } = req.body;

    if (!Array.isArray(corrections)) {
      return res.status(400).json({
        success: false,
        error: 'Corrections array is required'
      });
    }

    const result = eventFlow.stage12_CorrectNames(eventId, corrections);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/events/:eventId/stages/13/verify-lock
 * Stage 13: Verify and lock event
 */
router.post('/:eventId/stages/13/verify-lock', (req, res) => {
  try {
    const { eventId } = req.params;
    const result = eventFlow.stage13_VerifyAndLock(eventId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// CHAMPIONSHIP & REPORTING ENDPOINTS
// ============================================================================

/**
 * GET /api/championship/standings
 * Get championship standings
 */
router.get('/championship/standings', (req, res) => {
  try {
    const standings = eventFlow.getChampionshipStandings();
    res.json({
      success: true,
      standings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/events/:eventId/audit-log
 * Get audit log for event
 */
router.get('/:eventId/audit-log', (req, res) => {
  try {
    const eventId = req.params.eventId;
    const auditLog = eventFlow.getAuditLog().filter(log => log.eventId === eventId);

    res.json({
      success: true,
      eventId,
      auditLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/system/status
 * Get system status
 */
router.get('/system/status', (req, res) => {
  try {
    const allEvents = eventFlow.getAllEvents();
    const activeEvents = allEvents.filter(e => e.status !== 'LOCKED');
    const lockedEvents = allEvents.filter(e => e.status === 'LOCKED');

    res.json({
      success: true,
      status: {
        totalEvents: allEvents.length,
        activeEvents: activeEvents.length,
        lockedEvents: lockedEvents.length,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
