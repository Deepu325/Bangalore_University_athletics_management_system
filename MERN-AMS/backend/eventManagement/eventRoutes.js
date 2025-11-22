/**
 * Event Management API Routes
 * Express.js endpoints for event lifecycle management
 */

const express = require('express');
const router = express.Router();
const AthleticsMeetEventManager = require('./AthleticsMeetEventManager');

// Initialize global event manager
const eventManager = new AthleticsMeetEventManager();

/**
 * POST /api/events/create
 * Create a new event
 */
router.post('/create', (req, res) => {
  const { name, distance, date, venue } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Event name is required'
    });
  }

  const result = eventManager.createEvent({
    name,
    distance,
    date,
    venue
  });

  res.json(result);
});

/**
 * GET /api/events/:eventId
 * Get event details
 */
router.get('/:eventId', (req, res) => {
  const event = eventManager.getEvent(req.params.eventId);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'Event not found'
    });
  }

  res.json({
    success: true,
    eventId: req.params.eventId,
    summary: event.eventManager.getEventSummary()
  });
});

/**
 * GET /api/events/:eventId/summary
 * Get detailed event summary
 */
router.get('/:eventId/summary', (req, res) => {
  const result = eventManager.getEventSummary(req.params.eventId);
  res.json(result);
});

/**
 * POST /api/events/:eventId/stage/:stageNumber
 * Process a specific stage
 */
router.post('/:eventId/stage/:stageNumber', (req, res) => {
  const { eventId, stageNumber } = req.params;
  const data = req.body;

  const result = eventManager.processStage(
    eventId,
    parseInt(stageNumber),
    data
  );

  res.json(result);
});

/**
 * POST /api/events/:eventId/callroom
 * Stage 2: Generate call room
 */
router.post('/:eventId/callroom', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    2,
    req.body
  );

  res.json(result);
});

/**
 * POST /api/events/:eventId/attendance
 * Stage 3: Complete call room (mark attendance)
 */
router.post('/:eventId/attendance', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    3,
    req.body
  );

  res.json(result);
});

/**
 * GET /api/events/:eventId/eventsheet
 * Stage 4: Generate event sheet
 */
router.get('/:eventId/eventsheet', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    4,
    req.query
  );

  res.json(result);
});

/**
 * POST /api/events/:eventId/score-round1
 * Stage 5: Score round 1
 */
router.post('/:eventId/score-round1', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    5,
    req.body
  );

  res.json(result);
});

/**
 * POST /api/events/:eventId/select-top
 * Stage 6: Select top athletes
 */
router.post('/:eventId/select-top', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    6,
    req.body
  );

  res.json(result);
});

/**
 * GET /api/events/:eventId/heats
 * Stage 7: Generate heats
 */
router.get('/:eventId/heats', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    7,
    {}
  );

  res.json(result);
});

/**
 * POST /api/events/:eventId/score-heats
 * Stage 8: Score heats
 */
router.post('/:eventId/score-heats', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    8,
    req.body
  );

  res.json(result);
});

/**
 * GET /api/events/:eventId/prefinal-sheet
 * Stage 9: Pre-final sheet
 */
router.get('/:eventId/prefinal-sheet', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    9,
    {}
  );

  res.json(result);
});

/**
 * POST /api/events/:eventId/score-final
 * Stage 10: Score final
 */
router.post('/:eventId/score-final', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    10,
    req.body
  );

  res.json(result);
});

/**
 * GET /api/events/:eventId/announce
 * Stage 11: Announce results
 */
router.get('/:eventId/announce', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    11,
    {}
  );

  res.json(result);
});

/**
 * POST /api/events/:eventId/correct
 * Stage 12: Correct athlete data
 */
router.post('/:eventId/correct', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    12,
    req.body
  );

  res.json(result);
});

/**
 * POST /api/events/:eventId/verify-publish
 * Stage 13: Verify and publish
 */
router.post('/:eventId/verify-publish', (req, res) => {
  const result = eventManager.processStage(
    req.params.eventId,
    13,
    req.body
  );

  res.json(result);
});

/**
 * GET /api/events
 * Get all events
 */
router.get('/', (req, res) => {
  const events = eventManager.getAllEvents();
  res.json({
    success: true,
    totalEvents: events.length,
    events: events
  });
});

/**
 * GET /api/championship/standings
 * Get championship standings
 */
router.get('/championship/standings', (req, res) => {
  const standings = eventManager.getChampionshipStandings();
  res.json({
    success: true,
    standings: standings
  });
});

/**
 * GET /api/events/:eventId/export
 * Export event results
 */
router.get('/:eventId/export', (req, res) => {
  const result = eventManager.exportEventResults(req.params.eventId);
  res.json(result);
});

/**
 * POST /api/events/:eventId/lock
 * Lock event after verification
 */
router.post('/:eventId/lock', (req, res) => {
  const result = eventManager.lockEvent(req.params.eventId);
  res.json(result);
});

module.exports = router;
