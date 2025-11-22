/**
 * Main Event Management System
 * Orchestrates event creation, stage progression, and result management
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
  STAGES
} = require('./shared/constants');

const {
  calculateChampionshipPoints
} = require('./shared/utils');

class AthleticsMeetEventManager {
  constructor() {
    this.events = new Map(); // eventId → eventManager
    this.eventRegistry = [];
    this.championshipPoints = {};
  }

  /**
   * Create a new event with appropriate category manager
   */
  createEvent(eventData) {
    const eventId = `${eventData.name}-${Date.now()}`;
    let eventManager;

    // Determine event category and instantiate appropriate manager
    if (TRACK_EVENTS.includes(eventData.name)) {
      eventManager = new TrackEventManager(eventData.name, CATEGORIES.TRACK);
    } else if (RELAY_EVENTS.includes(eventData.name)) {
      eventManager = new RelayEventManager(eventData.name);
    } else if (JUMP_EVENTS.includes(eventData.name)) {
      eventManager = new JumpEventManager(eventData.name);
    } else if (THROW_EVENTS.includes(eventData.name)) {
      eventManager = new ThrowEventManager(eventData.name);
    } else if (COMBINED_EVENTS.includes(eventData.name)) {
      eventManager = new CombinedEventManager(eventData.name);
    } else {
      return {
        success: false,
        error: 'Unknown event type'
      };
    }

    // Initialize stage controller and PDF formatter
    const stageController = new StageController(eventManager);
    const pdfFormatter = new PDFFormatter(eventData.name, eventManager.eventType);

    // Create event
    const result = eventManager.createEvent(eventData);

    // Store event
    this.events.set(eventId, {
      eventManager,
      stageController,
      pdfFormatter,
      eventId,
      eventData,
      createdAt: new Date()
    });

    this.eventRegistry.push({
      eventId,
      eventName: eventData.name,
      category: eventManager.eventType,
      stage: 2,
      status: 'Active',
      createdAt: new Date()
    });

    return {
      success: true,
      eventId,
      eventName: eventData.name,
      category: eventManager.eventType,
      stage: 2,
      message: `Event "${eventData.name}" created successfully`
    };
  }

  /**
   * Get event by ID
   */
  getEvent(eventId) {
    return this.events.get(eventId);
  }

  /**
   * Process stage for event
   */
  processStage(eventId, stageNumber, data) {
    const event = this.events.get(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    const { eventManager, stageController, pdfFormatter } = event;

    try {
      let result;

      switch (stageNumber) {
        case 2:
          result = eventManager.generateCallRoom(data.athletes);
          // Generate PDF
          if (eventManager.eventType === 'Relay') {
            result.pdf = pdfFormatter.generateCallRoomPDF(result.callRoom);
          } else {
            result.pdf = pdfFormatter.generateCallRoomPDF(result.callRoom);
          }
          break;

        case 3:
          result = eventManager.completeCallRoom(data.attendanceData);
          break;

        case 4:
          result = eventManager.generateEventSheets(data.day);
          // Generate appropriate PDF
          if (eventManager.eventType === 'Track') {
            result.pdf = pdfFormatter.generateTrackOfficialsPDF(result.eventSheet);
          } else if (eventManager.eventType === 'Relay') {
            result.pdf = pdfFormatter.generateRelayOfficialsPDF(result.eventSheet);
          } else if (['Jump', 'Throw'].includes(eventManager.eventType)) {
            result.pdf = pdfFormatter.generateFieldOfficialsPDF(result.eventSheet);
          } else if (eventManager.eventType === 'Combined') {
            result.pdf = pdfFormatter.generateCombinedEventPDF(result.eventSheet, data.day, eventManager.eventStructure);
          }
          break;

        case 5:
          result = eventManager.scoreRound1(data.performances || data.attemptData || data.day1Data);
          break;

        case 6:
          result = eventManager.selectTopAthletes(data.topCount || 8);
          break;

        case 7:
          result = eventManager.generateHeats();
          result.pdf = pdfFormatter.generateHeatsPDF(result.heats);
          break;

        case 8:
          result = eventManager.scoreHeats(data.heatPerformances || data.heatAttempts || data.finalRoundData);
          break;

        case 9:
          result = eventManager.generatePreFinalSheet();
          break;

        case 10:
          result = eventManager.scoreFinal(data.finalPerformances || data.finalAttempts);
          result.pdf = pdfFormatter.generateResultsPDF(result.finalResults);
          break;

        case 11:
          result = eventManager.announceResults();
          break;

        case 12:
          result = eventManager.correctAthleteData(data.corrections);
          break;

        case 13:
          result = eventManager.publishAndLock(data.verificationData);
          // Add championship points
          if (result.finalResults) {
            const points = calculateChampionshipPoints(result.finalResults);
            this.addChampionshipPoints(points);
            result.championshipPoints = points;
          }
          break;

        default:
          return { success: false, error: 'Invalid stage' };
      }

      return {
        success: true,
        stage: stageNumber,
        stageName: STAGES[stageNumber],
        ...result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stage: stageNumber
      };
    }
  }

  /**
   * Add championship points from event results
   */
  addChampionshipPoints(points) {
    Object.entries(points).forEach(([college, pts]) => {
      this.championshipPoints[college] = (this.championshipPoints[college] || 0) + pts;
    });
  }

  /**
   * Get championship standings
   */
  getChampionshipStandings() {
    return Object.entries(this.championshipPoints)
      .sort((a, b) => b[1] - a[1])
      .map((entry, idx) => ({
        rank: idx + 1,
        college: entry[0],
        points: entry[1]
      }));
  }

  /**
   * Get all events
   */
  getAllEvents() {
    return this.eventRegistry;
  }

  /**
   * Get event summary
   */
  getEventSummary(eventId) {
    const event = this.events.get(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    return {
      success: true,
      eventId,
      eventRegistry: this.eventRegistry.find(e => e.eventId === eventId),
      eventSummary: event.eventManager.getEventSummary()
    };
  }

  /**
   * Lock event after verification
   */
  lockEvent(eventId) {
    const event = this.events.get(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    event.eventManager.eventLocked = true;
    
    const registry = this.eventRegistry.find(e => e.eventId === eventId);
    if (registry) {
      registry.status = 'Locked';
      registry.lockedAt = new Date();
    }

    return {
      success: true,
      eventId,
      status: 'Event locked and published'
    };
  }

  /**
   * Export event results to JSON
   */
  exportEventResults(eventId) {
    const event = this.events.get(eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    return {
      success: true,
      eventId,
      eventName: event.eventData.name,
      category: event.eventManager.eventType,
      finalResults: event.eventManager.finalResults,
      championshipPoints: this.championshipPoints
    };
  }
}

module.exports = AthleticsMeetEventManager;
