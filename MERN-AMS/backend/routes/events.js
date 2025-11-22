import express from 'express';
import { Event, Athlete } from '../models/index.js';
import { 
  calculateAFIPoints, 
  calculateEventAFIPoints, 
  calculateAthleteAFIPoints 
} from '../utils/afiEngine.js';
import { 
  getBestMaleAthlete, 
  getBestFemaleAthlete, 
  getBestAthletesSummary,
  getAthleteDetailsSummary 
} from '../utils/bestAthleteEngine.js';
import { 
  calculateEventTeamPoints, 
  calculateAllTeamPoints,
  getTeamChampionshipRankings,
  getTeamChampionshipSummary,
  persistTeamScoresToDB 
} from '../utils/teamChampionshipEngine.js';
import { 
  generateFinalAnnouncement, 
  generateAnnouncementPDFData,
  publishFinalAnnouncement,
  getAnnouncementStatus 
} from '../utils/announcementEngine.js';

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save qualified athletes for Stage 7 (Heats Generation) - MUST be BEFORE /:id route
router.put('/:eventId/save-qualifiers', async (req, res) => {
  try {
    const { qualified, count } = req.body;

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.round2Qualified = qualified;
    event.qualifierCount = count;

    await event.save();

    res.json({ 
      success: true, 
      message: 'Qualifiers saved',
      qualified 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save top selection (Top 8 or Top 16 athletes) - MUST be BEFORE /:id route
router.post('/:eventId/top-selection', async (req, res) => {
  try {
    const { selectedCount, selectedAthleteIds } = req.body;

    if (!selectedCount || !Array.isArray(selectedAthleteIds)) {
      return res.status(400).json({ 
        message: 'Missing selectedCount or selectedAthleteIds',
        required: { selectedCount: '8 | 16', selectedAthleteIds: '[id1, id2, ...]' }
      });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Store top selection metadata
    event.topSelection = {
      selectedCount,
      selectedAthleteIds,
      timestamp: new Date(),
      status: 'SELECTED'
    };

    await event.save();

    res.json({ 
      success: true, 
      message: `Top ${selectedCount} athletes selected and saved`,
      topSelection: event.topSelection
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save heats results after scoring - MUST be BEFORE /:id route
router.post('/:eventId/heats-results', async (req, res) => {
  try {
    const { heatsResults } = req.body;

    if (!Array.isArray(heatsResults)) {
      return res.status(400).json({ 
        message: 'heatsResults must be an array',
        example: { heatsResults: [{ heatNo: 1, athletes: [{ athleteId: '123', lane: 3, performance: '00:00:10:52' }] }] }
      });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Store heats results
    event.heatsResults = heatsResults;
    event.statusFlow = event.statusFlow || {};
    event.statusFlow.heatsScored = true;

    await event.save();

    res.json({ 
      success: true, 
      message: 'Heats results saved successfully',
      heatsResults: event.heatsResults
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save final sheet with top 8 finalists and lane assignments - MUST be BEFORE /:id route
router.post('/:eventId/final-sheet', async (req, res) => {
  try {
    const { finalists, stage } = req.body;

    if (!Array.isArray(finalists)) {
      return res.status(400).json({ 
        message: 'finalists must be an array of top 8 athletes',
        example: { finalists: [{ athleteId: '123', lane: 3, seed: 1 }], stage: 'pre-final-generated' }
      });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Store finalists with lane assignments
    event.finalists = finalists;
    event.stage = stage || 'pre-final-generated';
    event.statusFlow = event.statusFlow || {};
    event.statusFlow.finalSheetGenerated = true;

    await event.save();

    res.json({ 
      success: true, 
      message: 'Final sheet generated and saved',
      finalists: event.finalists,
      stage: event.stage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= PHASE 5: FINAL SCORING & ANNOUNCEMENT ENDPOINTS =============

// Calculate AFI points for an event's final performance - MUST be BEFORE /:id route
router.post('/:eventId/afi-points', async (req, res) => {
  try {
    const { athleteId, finalPerformance } = req.body;

    if (!athleteId || !finalPerformance) {
      return res.status(400).json({ 
        message: 'Missing athleteId or finalPerformance',
        required: { athleteId: 'string', finalPerformance: 'string (time or distance)' }
      });
    }

    const afiResult = await calculateAFIPoints(req.params.eventId, athleteId, finalPerformance);

    res.json({
      success: true,
      message: 'AFI points calculated',
      afiResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate AFI points for entire event finals - MUST be BEFORE /:id route
router.get('/:eventId/afi-event-points', async (req, res) => {
  try {
    const eventPoints = await calculateEventAFIPoints(req.params.eventId);

    res.json({
      success: true,
      message: 'Event AFI points calculated',
      eventPoints
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get best male athlete overall - MUST be BEFORE /:id route
router.get('/final/best-male', async (req, res) => {
  try {
    const bestMale = await getBestMaleAthlete();

    res.json({
      success: true,
      message: 'Best male athlete retrieved',
      bestMaleAthlete: bestMale
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get best female athlete overall - MUST be BEFORE /:id route
router.get('/final/best-female', async (req, res) => {
  try {
    const bestFemale = await getBestFemaleAthlete();

    res.json({
      success: true,
      message: 'Best female athlete retrieved',
      bestFemaleAthlete: bestFemale
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get best athletes summary for both genders - MUST be BEFORE /:id route
router.get('/final/best-athletes-summary', async (req, res) => {
  try {
    const summary = await getBestAthletesSummary();

    res.json({
      success: true,
      message: 'Best athletes summary retrieved',
      summary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get athlete details with AFI breakdown - MUST be BEFORE /:id route
router.get('/final/athlete/:athleteId', async (req, res) => {
  try {
    const details = await getAthleteDetailsSummary(req.params.athleteId);

    res.json({
      success: true,
      message: 'Athlete details retrieved',
      details
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get team championship rankings - MUST be BEFORE /:id route
router.get('/final/team-championship/rankings', async (req, res) => {
  try {
    const rankings = await getTeamChampionshipRankings();

    res.json({
      success: true,
      message: 'Team championship rankings retrieved',
      rankings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get team championship summary - MUST be BEFORE /:id route
router.get('/final/team-championship/summary', async (req, res) => {
  try {
    const summary = await getTeamChampionshipSummary();

    res.json({
      success: true,
      message: 'Team championship summary retrieved',
      summary
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate and persist all team scores to database - MUST be BEFORE /:id route
router.post('/final/team-championship/persist', async (req, res) => {
  try {
    const result = await persistTeamScoresToDB();

    res.json({
      success: true,
      message: 'Team scores persisted to database',
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate final announcement with all results - MUST be BEFORE /:id route
router.get('/final/announcement/generate', async (req, res) => {
  try {
    const announcement = await generateFinalAnnouncement();

    res.json({
      success: true,
      message: 'Final announcement generated',
      announcement
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get announcement data formatted for PDF - MUST be BEFORE /:id route
router.get('/final/announcement/pdf-data', async (req, res) => {
  try {
    const pdfData = await generateAnnouncementPDFData();

    res.json({
      success: true,
      message: 'Announcement PDF data retrieved',
      pdfData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish final announcement - MUST be BEFORE /:id route
router.post('/final/announcement/publish', async (req, res) => {
  try {
    const { announcementData } = req.body;
    const result = await publishFinalAnnouncement(announcementData);

    res.json({
      success: true,
      message: 'Final announcement published',
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get announcement status - MUST be BEFORE /:id route
router.get('/final/announcement/status', async (req, res) => {
  try {
    const status = await getAnnouncementStatus();

    res.json({
      success: true,
      message: 'Announcement status retrieved',
      status
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save final results for an event - MUST be BEFORE /:id route
router.post('/:eventId/final-results', async (req, res) => {
  try {
    const { finalResults, stage } = req.body;

    if (!Array.isArray(finalResults)) {
      return res.status(400).json({ 
        message: 'finalResults must be an array',
        example: { finalResults: [{ athleteId: '123', performance: '...' }], stage: 'completed' }
      });
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.finalResults = finalResults;
    event.stage = stage || 'completed';
    event.statusFlow = event.statusFlow || {};
    event.statusFlow.finalCompleted = true;

    await event.save();

    res.json({
      success: true,
      message: 'Final results saved successfully',
      finalResults: event.finalResults,
      stage: event.stage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get athletes for an event - MUST be BEFORE /:id route
router.get('/:eventId/athletes', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('participants');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const athletes = event.participants || [];
    res.json({ athletes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate sheet for event - MUST be BEFORE /:id route
router.post('/:eventId/generate-sheet', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('participants');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const sheetData = {
      eventId: event._id,
      eventName: event.name,
      gender: event.gender,
      category: event.category,
      status: event.status,
      timestamp: new Date(),
      participants: event.participants || [],
      heats: event.heats || [],
      heatsResults: event.heatsResults || [],
      finalResults: event.finalResults || [],
      topSelection: event.topSelection || {},
      finalists: event.finalists || []
    };
    
    res.json({ 
      success: true,
      message: 'Sheet generated successfully',
      sheet: sheetData 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const { name, code, category, gender, participants } = req.body;

    // Validate required fields
    if (!name || !category || !gender) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'category', 'gender']
      });
    }

    const event = new Event({
      name,
      code: code || '',
      category,
      gender,
      participants: participants || [],
      status: 'Upcoming'
    });

    const newEvent = await event.save();

    // Attach athletes to this event based on their registrations
    const { attachAthletesToEvent } = await import('../utils/attachAthletesToEvent.js');
    const attachResult = await attachAthletesToEvent(newEvent._id);

    res.status(201).json({
      ok: true,
      event: newEvent,
      attachedAthletes: attachResult.attachedCount
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update event
router.patch('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    Object.assign(event, req.body);
    const updatedEvent = await event.save();

    // Re-attach athletes based on current registrations
    const { attachAthletesToEvent } = await import('../utils/attachAthletesToEvent.js');
    const attachResult = await attachAthletesToEvent(updatedEvent._id);

    res.json({
      ok: true,
      event: updatedEvent,
      participants: attachResult.attachedCount
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
