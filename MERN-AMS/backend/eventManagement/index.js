/**
 * Event Management System - Index/Exports
 * Central export file for all modules
 */

// Main System
const AthleticsMeetEventManager = require('./AthleticsMeetEventManager');

// Event Managers
const TrackEventManager = require('./eventCategories/Track/TrackEventManager');
const RelayEventManager = require('./eventCategories/Relay/RelayEventManager');
const JumpEventManager = require('./eventCategories/Jump/JumpEventManager');
const ThrowEventManager = require('./eventCategories/Throw/ThrowEventManager');
const CombinedEventManager = require('./eventCategories/Combined/CombinedEventManager');

// Controllers & Formatters
const StageController = require('./stages/StageController');
const PDFFormatter = require('./stages/PDFFormatter');

// Utilities
const {
  GLOBAL_HEADER,
  GLOBAL_FOOTER,
  STAGES,
  CATEGORIES,
  TRACK_EVENTS,
  RELAY_EVENTS,
  JUMP_EVENTS,
  THROW_EVENTS,
  COMBINED_EVENTS,
  IAAF_LANE_ASSIGNMENT,
  SCORING,
  DECATHLON_EVENTS,
  HEPTATHLON_EVENTS,
  FIELD_ATTEMPTS,
  THROW_PRELIMINARY,
  THROW_FINAL,
  RELAY_TEAM_SIZE,
  HEAT_GROUP_SIZE
} = require('./shared/constants');

const {
  formatTime,
  parseTime,
  rankByTime,
  rankByDistance,
  rankByPoints,
  assignIAAFLanes,
  generateHeats,
  generateRelayHeats,
  calculateChampionshipPoints,
  generateCallRoom,
  generateTrackSheet,
  generateFieldSheet,
  generateRelaySheet,
  selectTop,
  verifyAthleteData,
  generatePDFHeader,
  generatePDFFooter
} = require('./shared/utils');

// API Routes
const eventRoutes = require('./eventRoutes');

// Schema
const { eventSchema, collections } = require('./eventSchema');

/**
 * Export everything as a namespace
 */
module.exports = {
  // Main System
  AthleticsMeetEventManager,

  // Event Managers
  TrackEventManager,
  RelayEventManager,
  JumpEventManager,
  ThrowEventManager,
  CombinedEventManager,

  // Controllers & Formatters
  StageController,
  PDFFormatter,

  // Constants
  constants: {
    GLOBAL_HEADER,
    GLOBAL_FOOTER,
    STAGES,
    CATEGORIES,
    TRACK_EVENTS,
    RELAY_EVENTS,
    JUMP_EVENTS,
    THROW_EVENTS,
    COMBINED_EVENTS,
    IAAF_LANE_ASSIGNMENT,
    SCORING,
    DECATHLON_EVENTS,
    HEPTATHLON_EVENTS,
    FIELD_ATTEMPTS,
    THROW_PRELIMINARY,
    THROW_FINAL,
    RELAY_TEAM_SIZE,
    HEAT_GROUP_SIZE
  },

  // Utilities
  utils: {
    formatTime,
    parseTime,
    rankByTime,
    rankByDistance,
    rankByPoints,
    assignIAAFLanes,
    generateHeats,
    generateRelayHeats,
    calculateChampionshipPoints,
    generateCallRoom,
    generateTrackSheet,
    generateFieldSheet,
    generateRelaySheet,
    selectTop,
    verifyAthleteData,
    generatePDFHeader,
    generatePDFFooter
  },

  // API
  eventRoutes,

  // Database
  schema: eventSchema,
  collections
};
