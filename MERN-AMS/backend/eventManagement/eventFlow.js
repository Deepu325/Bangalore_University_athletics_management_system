/**
 * Enhanced Event Flow Controller
 * Manages complete event lifecycle with proper error handling and state management
 * Implements 13-stage workflow for all event categories
 */

const TrackEventManager = require('./eventCategories/Track/TrackEventManager');
const RelayEventManager = require('./eventCategories/Relay/RelayEventManager');
const JumpEventManager = require('./eventCategories/Jump/JumpEventManager');
const ThrowEventManager = require('./eventCategories/Throw/ThrowEventManager');
const CombinedEventManager = require('./eventCategories/Combined/CombinedEventManager');
const StageController = require('./stages/StageController');
const PDFFormatter = require('./stages/PDFFormatter');

const {
  CATEGORIES,
  TRACK_EVENTS,
  RELAY_EVENTS,
  JUMP_EVENTS,
  THROW_EVENTS,
  COMBINED_EVENTS,
  STAGES,
  SCORING
} = require('./shared/constants');

const {
  calculateChampionshipPoints,
  formatTime,
  parseTime,
  rankByTime,
  rankByDistance,
  assignIAAFLanes
} = require('./shared/utils');

const { validateAthlete, validateTrackPerformance, validateFieldPerformance } = require('./validation');

class EventFlow {
  constructor() {
    this.events = new Map();
    this.eventRegistry = [];
    this.championshipStandings = {};
    this.auditLog = [];
  }

  /**
   * Create event with full validation
   */
  createEvent(eventData) {
    try {
      const { name, gender, date, venue } = eventData;

      // Validate required fields
      if (!name || !gender) {
        throw new Error('Event name and gender are required');
      }

      // Determine category
      const category = this._determineCategory(name);
      if (!category) {
        throw new Error(`Unknown event: ${name}`);
      }

      const eventId = `${name}-${gender}-${Date.now()}`;
      const eventManager = this._createEventManager(name, category);

      if (!eventManager) {
        throw new Error('Failed to create event manager');
      }

      const stageController = new StageController(eventManager);
      const pdfFormatter = new PDFFormatter(name, category);

      const eventRecord = {
        eventId,
        name,
        gender,
        category,
        date: date || new Date(),
        venue: venue || 'TBD',
        stage: 1,
        status: 'CREATED',
        eventManager,
        stageController,
        pdfFormatter,
        athletes: [],
        performances: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        history: [
          {
            stage: 1,
            timestamp: new Date(),
            action: 'EVENT_CREATED',
            data: eventData
          }
        ]
      };

      this.events.set(eventId, eventRecord);
      this.eventRegistry.push({
        eventId,
        name,
        gender,
        category,
        stage: 1,
        status: 'CREATED'
      });

      this._logAudit(eventId, 'EVENT_CREATED', eventData);

      return {
        success: true,
        eventId,
        message: `Event "${name}" (${gender}) created successfully`,
        stage: 1
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stage 1: Event Creation (Complete)
   * Already handled by createEvent
   */
  stage1_EventCreation(eventId) {
    const event = this.events.get(eventId);
    if (!event) return { success: false, error: 'Event not found' };

    return {
      success: true,
      stage: 1,
      message: 'Event created',
      event: {
        eventId,
        name: event.name,
        gender: event.gender,
        category: event.category,
        status: event.status
      }
    };
  }

  /**
   * Stage 2: Call Room Generation
   * Create call room with athletes
   */
  stage2_GenerateCallRoom(eventId, athletes) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      // Validate athletes
      if (!Array.isArray(athletes) || athletes.length === 0) {
        throw new Error('Valid athletes array required');
      }

      const validatedAthletes = athletes.map(athlete => {
        const validation = validateAthlete(athlete);
        if (!validation.valid) throw new Error(validation.errors.join(', '));
        return validation.sanitized;
      });

      event.athletes = validatedAthletes;
      event.stage = 2;
      event.status = 'CALLROOM_GENERATED';
      event.updatedAt = new Date();
      event.history.push({
        stage: 2,
        timestamp: new Date(),
        action: 'CALLROOM_GENERATED',
        athleteCount: validatedAthletes.length
      });

      this._updateRegistry(eventId, 2, 'CALLROOM_GENERATED');
      this._logAudit(eventId, 'CALLROOM_GENERATED', { athleteCount: validatedAthletes.length });

      return {
        success: true,
        stage: 2,
        message: 'Call room generated',
        athleteCount: validatedAthletes.length,
        callRoom: validatedAthletes.map((a, idx) => ({
          bib: idx + 1,
          name: a.name,
          college: a.college,
          status: 'PRESENT'
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 3: Attendance Marking
   * Mark athletes as present/absent/disqualified
   */
  stage3_MarkAttendance(eventId, attendanceData) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      if (event.stage !== 2) throw new Error(`Expected stage 2, got stage ${event.stage}`);

      const { marked } = attendanceData;
      if (!Array.isArray(marked)) throw new Error('Marked attendance array required');

      // Update athlete attendance
      marked.forEach(({ bib, status }) => {
        if (bib > 0 && bib <= event.athletes.length) {
          event.athletes[bib - 1].status = status; // PRESENT, ABSENT, DIS
        }
      });

      event.stage = 3;
      event.status = 'ATTENDANCE_MARKED';
      event.updatedAt = new Date();
      event.history.push({
        stage: 3,
        timestamp: new Date(),
        action: 'ATTENDANCE_MARKED',
        markedCount: marked.length
      });

      const presentCount = event.athletes.filter(a => a.status === 'PRESENT').length;

      this._updateRegistry(eventId, 3, 'ATTENDANCE_MARKED');
      this._logAudit(eventId, 'ATTENDANCE_MARKED', { presentCount, totalCount: event.athletes.length });

      return {
        success: true,
        stage: 3,
        message: 'Attendance marked',
        presentCount,
        totalCount: event.athletes.length,
        presentAthletes: event.athletes.filter(a => a.status === 'PRESENT')
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 4: Generate Event Sheets
   * Create officials sheets based on category
   */
  stage4_GenerateEventSheets(eventId) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      if (event.stage !== 3) throw new Error(`Expected stage 3, got stage ${event.stage}`);

      const presentAthletes = event.athletes.filter(a => a.status === 'PRESENT');

      event.stage = 4;
      event.status = 'SHEETS_GENERATED';
      event.updatedAt = new Date();
      event.history.push({
        stage: 4,
        timestamp: new Date(),
        action: 'SHEETS_GENERATED',
        sheetType: event.category
      });

      this._updateRegistry(eventId, 4, 'SHEETS_GENERATED');
      this._logAudit(eventId, 'SHEETS_GENERATED', { athleteCount: presentAthletes.length });

      return {
        success: true,
        stage: 4,
        message: 'Event sheets generated',
        athleteCount: presentAthletes.length,
        sheetType: event.category,
        athletes: presentAthletes
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 5: Round 1 Scoring
   * Score round 1 performances
   */
  stage5_ScoreRound1(eventId, performances) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      if (event.stage !== 4) throw new Error(`Expected stage 4, got stage ${event.stage}`);

      if (!Array.isArray(performances) || performances.length === 0) {
        throw new Error('Valid performances array required');
      }

      // Validate performances based on category
      const validatedPerformances = performances.map(perf => {
        let validation;

        if (['track', 'relay'].includes(event.category)) {
          validation = validateTrackPerformance(perf);
        } else if (['jump', 'throw'].includes(event.category)) {
          validation = validateFieldPerformance(perf);
        } else {
          validation = { valid: true, sanitized: perf };
        }

        if (!validation.valid) throw new Error(validation.errors?.join(', '));
        return validation.sanitized;
      });

      // Rank athletes based on category
      let ranked;
      if (['track', 'relay'].includes(event.category)) {
        ranked = rankByTime(validatedPerformances);
      } else {
        ranked = rankByDistance(validatedPerformances);
      }

      event.performances['round1'] = ranked;
      event.stage = 5;
      event.status = 'ROUND1_SCORED';
      event.updatedAt = new Date();
      event.history.push({
        stage: 5,
        timestamp: new Date(),
        action: 'ROUND1_SCORED',
        performanceCount: ranked.length
      });

      this._updateRegistry(eventId, 5, 'ROUND1_SCORED');
      this._logAudit(eventId, 'ROUND1_SCORED', { performanceCount: ranked.length });

      return {
        success: true,
        stage: 5,
        message: 'Round 1 scored',
        rankings: ranked.slice(0, 10) // Top 10
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 6: Top Selection
   * Select top athletes for heats/finals
   */
  stage6_SelectTop(eventId, topCount = 8) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      if (event.stage !== 5) throw new Error(`Expected stage 5, got stage ${event.stage}`);

      const round1 = event.performances['round1'] || [];
      if (round1.length === 0) throw new Error('No round 1 performances found');

      const topAthletes = round1.slice(0, Math.min(topCount, round1.length));

      event.performances['qualified'] = topAthletes;
      event.stage = 6;
      event.status = 'TOP_SELECTED';
      event.updatedAt = new Date();
      event.history.push({
        stage: 6,
        timestamp: new Date(),
        action: 'TOP_SELECTED',
        selectedCount: topAthletes.length
      });

      this._updateRegistry(eventId, 6, 'TOP_SELECTED');
      this._logAudit(eventId, 'TOP_SELECTED', { selectedCount: topAthletes.length });

      return {
        success: true,
        stage: 6,
        message: `Top ${topAthletes.length} athletes selected`,
        qualifiedAthletes: topAthletes
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 7: Generate Heats
   * Create heat groups with IAAF lane assignment
   */
  stage7_GenerateHeats(eventId) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      if (event.stage !== 6) throw new Error(`Expected stage 6, got stage ${event.stage}`);

      const qualified = event.performances['qualified'] || [];
      if (qualified.length === 0) throw new Error('No qualified athletes');

      // Generate heats
      const heats = this._generateHeatsForEvent(qualified, event.category);

      event.performances['heats'] = heats;
      event.stage = 7;
      event.status = 'HEATS_GENERATED';
      event.updatedAt = new Date();
      event.history.push({
        stage: 7,
        timestamp: new Date(),
        action: 'HEATS_GENERATED',
        heatCount: heats.length
      });

      this._updateRegistry(eventId, 7, 'HEATS_GENERATED');
      this._logAudit(eventId, 'HEATS_GENERATED', { heatCount: heats.length });

      return {
        success: true,
        stage: 7,
        message: `${heats.length} heats generated`,
        heats: heats.map((h, idx) => ({
          heatNumber: idx + 1,
          athletes: h.map(a => ({
            name: a.name,
            college: a.college,
            lane: a.lane || idx + 1
          }))
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 8: Score Heats
   * Record heat performances
   */
  stage8_ScoreHeats(eventId, heatPerformances) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      if (event.stage !== 7) throw new Error(`Expected stage 7, got stage ${event.stage}`);

      if (!Array.isArray(heatPerformances)) throw new Error('Heat performances array required');

      event.performances['heatsScored'] = heatPerformances;
      event.stage = 8;
      event.status = 'HEATS_SCORED';
      event.updatedAt = new Date();
      event.history.push({
        stage: 8,
        timestamp: new Date(),
        action: 'HEATS_SCORED',
        performanceCount: heatPerformances.length
      });

      this._updateRegistry(eventId, 8, 'HEATS_SCORED');
      this._logAudit(eventId, 'HEATS_SCORED', { performanceCount: heatPerformances.length });

      return {
        success: true,
        stage: 8,
        message: 'Heat performances recorded',
        performanceCount: heatPerformances.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 9: Pre-Final Sheet
   * Select finalists
   */
  stage9_PreFinalSheet(eventId, finalCount = 8) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      if (event.stage !== 8) throw new Error(`Expected stage 8, got stage ${event.stage}`);

      const heatScores = event.performances['heatsScored'] || [];
      const ranked = rankByTime(heatScores);
      const finalists = ranked.slice(0, Math.min(finalCount, ranked.length));

      event.performances['finalists'] = finalists;
      event.stage = 9;
      event.status = 'PREFINAL_GENERATED';
      event.updatedAt = new Date();
      event.history.push({
        stage: 9,
        timestamp: new Date(),
        action: 'PREFINAL_GENERATED',
        finalistCount: finalists.length
      });

      this._updateRegistry(eventId, 9, 'PREFINAL_GENERATED');
      this._logAudit(eventId, 'PREFINAL_GENERATED', { finalistCount: finalists.length });

      return {
        success: true,
        stage: 9,
        message: `${finalists.length} finalists selected`,
        finalists
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 10: Final Scoring
   * Score final and award championship points
   */
  stage10_ScoreFinal(eventId, finalPerformances) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      if (event.stage !== 9) throw new Error(`Expected stage 9, got stage ${event.stage}`);

      const ranked = rankByTime(finalPerformances);
      event.performances['final'] = ranked;

      // Award championship points
      ranked.forEach((athlete, index) => {
        const points = SCORING.CHAMPIONSHIP_POINTS[index] || 0;
        if (points > 0) {
          const college = athlete.college;
          this.championshipStandings[college] = (this.championshipStandings[college] || 0) + points;
        }
      });

      event.stage = 10;
      event.status = 'FINAL_SCORED';
      event.updatedAt = new Date();
      event.history.push({
        stage: 10,
        timestamp: new Date(),
        action: 'FINAL_SCORED',
        winners: ranked.slice(0, 3).map(a => a.name)
      });

      this._updateRegistry(eventId, 10, 'FINAL_SCORED');
      this._logAudit(eventId, 'FINAL_SCORED', { winners: ranked.slice(0, 3).map(a => a.name) });

      return {
        success: true,
        stage: 10,
        message: 'Final scored',
        results: ranked.slice(0, 10),
        champions: ranked.slice(0, 3).map((a, idx) => ({
          position: idx + 1,
          name: a.name,
          college: a.college,
          performance: a.performance,
          points: SCORING.CHAMPIONSHIP_POINTS[idx]
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 11: Results Announcement
   */
  stage11_AnnounceResults(eventId) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      if (event.stage !== 10) throw new Error(`Expected stage 10, got stage ${event.stage}`);

      const final = event.performances['final'] || [];

      event.stage = 11;
      event.status = 'ANNOUNCED';
      event.updatedAt = new Date();
      event.history.push({
        stage: 11,
        timestamp: new Date(),
        action: 'RESULTS_ANNOUNCED'
      });

      this._updateRegistry(eventId, 11, 'ANNOUNCED');
      this._logAudit(eventId, 'RESULTS_ANNOUNCED', {});

      return {
        success: true,
        stage: 11,
        message: 'Results announced',
        finalResults: final
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 12: Name Correction
   */
  stage12_CorrectNames(eventId, corrections) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      if (event.stage !== 11) throw new Error(`Expected stage 11, got stage ${event.stage}`);

      if (!Array.isArray(corrections)) throw new Error('Corrections array required');

      corrections.forEach(({ athleteIndex, field, newValue }) => {
        if (event.athletes[athleteIndex]) {
          event.athletes[athleteIndex][field] = newValue;
        }
      });

      event.stage = 12;
      event.status = 'NAMES_CORRECTED';
      event.updatedAt = new Date();
      event.history.push({
        stage: 12,
        timestamp: new Date(),
        action: 'NAMES_CORRECTED',
        correctionCount: corrections.length
      });

      this._updateRegistry(eventId, 12, 'NAMES_CORRECTED');
      this._logAudit(eventId, 'NAMES_CORRECTED', { correctionCount: corrections.length });

      return {
        success: true,
        stage: 12,
        message: 'Names corrected',
        correctionCount: corrections.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stage 13: Verify & Lock
   */
  stage13_VerifyAndLock(eventId) {
    try {
      const event = this.events.get(eventId);
      if (!event) throw new Error('Event not found');

      if (event.stage !== 12) throw new Error(`Expected stage 12, got stage ${event.stage}`);

      event.stage = 13;
      event.status = 'LOCKED';
      event.locked = true;
      event.updatedAt = new Date();
      event.history.push({
        stage: 13,
        timestamp: new Date(),
        action: 'EVENT_LOCKED'
      });

      this._updateRegistry(eventId, 13, 'LOCKED');
      this._logAudit(eventId, 'EVENT_LOCKED', {});

      return {
        success: true,
        stage: 13,
        message: 'Event locked',
        lockedAt: event.updatedAt
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get event summary
   */
  getEventSummary(eventId) {
    const event = this.events.get(eventId);
    if (!event) return { success: false, error: 'Event not found' };

    return {
      success: true,
      eventId,
      name: event.name,
      gender: event.gender,
      category: event.category,
      stage: event.stage,
      status: event.status,
      athleteCount: event.athletes.length,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      history: event.history
    };
  }

  /**
   * Get championship standings
   */
  getChampionshipStandings() {
    return Object.entries(this.championshipStandings)
      .sort((a, b) => b[1] - a[1])
      .map(([college, points], idx) => ({
        position: idx + 1,
        college,
        points
      }));
  }

  /**
   * Helper: Determine event category
   */
  _determineCategory(eventName) {
    if (TRACK_EVENTS.includes(eventName)) return 'track';
    if (RELAY_EVENTS.includes(eventName)) return 'relay';
    if (JUMP_EVENTS.includes(eventName)) return 'jump';
    if (THROW_EVENTS.includes(eventName)) return 'throw';
    if (COMBINED_EVENTS.includes(eventName)) return 'combined';
    return null;
  }

  /**
   * Helper: Create event manager
   */
  _createEventManager(name, category) {
    try {
      switch (category) {
        case 'track':
          return new TrackEventManager(name, CATEGORIES.TRACK);
        case 'relay':
          return new RelayEventManager(name);
        case 'jump':
          return new JumpEventManager(name);
        case 'throw':
          return new ThrowEventManager(name);
        case 'combined':
          return new CombinedEventManager(name);
        default:
          return null;
      }
    } catch (error) {
      console.error('Error creating event manager:', error);
      return null;
    }
  }

  /**
   * Helper: Generate heats based on category
   */
  _generateHeatsForEvent(athletes, category) {
    const heats = [];
    const athletesPerHeat = category === 'relay' ? 2 : 4;

    for (let i = 0; i < athletes.length; i += athletesPerHeat) {
      const heat = athletes.slice(i, i + athletesPerHeat);
      if (category === 'track' || category === 'relay') {
        // Assign IAAF lanes
        heat.forEach((athlete, idx) => {
          athlete.lane = assignIAAFLanes(idx);
        });
      }
      heats.push(heat);
    }

    return heats;
  }

  /**
   * Helper: Update registry
   */
  _updateRegistry(eventId, stage, status) {
    const idx = this.eventRegistry.findIndex(e => e.eventId === eventId);
    if (idx !== -1) {
      this.eventRegistry[idx].stage = stage;
      this.eventRegistry[idx].status = status;
    }
  }

  /**
   * Helper: Log audit trail
   */
  _logAudit(eventId, action, data) {
    this.auditLog.push({
      eventId,
      action,
      data,
      timestamp: new Date()
    });
  }

  /**
   * Get all events
   */
  getAllEvents() {
    return this.eventRegistry;
  }

  /**
   * Get audit log
   */
  getAuditLog() {
    return this.auditLog;
  }
}

module.exports = EventFlow;
