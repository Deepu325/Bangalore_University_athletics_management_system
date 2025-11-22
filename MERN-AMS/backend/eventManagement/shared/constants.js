/**
 * Global Constants for Athletics Meet Event Management
 * 61st Inter-Collegiate Athletic Championship 2025–26
 */

const GLOBAL_HEADER = {
  logo: 'BU_LOGO',
  title: 'BANGALORE UNIVERSITY',
  subtitle: 'Directorate of Physical Education & Sports',
  venue: 'UCPE Stadium, Jnanabharathi Campus, Bengaluru – 560056',
  event: '61st Inter-Collegiate Athletic Championship 2025–26',
  developer: 'Developed by SIMS'
};

const GLOBAL_FOOTER = {
  copyright: '© 2025 Bangalore University | Athletic Meet Management System',
  developer: 'Developed by: Deepu K C',
  institution: 'Soundarya Institute of Management and Science (SIMS)',
  guided: 'Guided By: Dr. Harish P M & Lt. Suresh Reddy M S, PED, SIMS',
  experts: 'Dr. Venkata Chalapathi | Mr. Chidananda | Dr. Manjanna B P'
};

// 13 Stages of Event Management
const STAGES = {
  1: 'Event Creation',
  2: 'Call Room Generation',
  3: 'Call Room Completion',
  4: 'Generate Event Sheets',
  5: 'Round 1 Scoring',
  6: 'Top Selection (Top 8 / Top 16)',
  7: 'Heats Generation',
  8: 'Heats Scoring',
  9: 'Pre-Final Sheet',
  10: 'Final Scoring',
  11: 'Final Announcement',
  12: 'Name Correction',
  13: 'Verification & Publish/Lock'
};

// Event Categories
const CATEGORIES = {
  TRACK: 'Track',
  RELAY: 'Relay',
  JUMP: 'Jump',
  THROW: 'Throw',
  COMBINED: 'Combined'
};

// Track Events
const TRACK_EVENTS = [
  '100m', '200m', '400m', '800m', '1500m', '5000m', '10000m',
  '100mH (Women)', '110mH (Men)', '400mH', '3000m Steeplechase', '20km Walk'
];

// Relay Events
const RELAY_EVENTS = [
  '4×100m Relay', '4×400m Relay', 'Mixed 4×100m Relay', 'Mixed 4×400m Relay'
];

// Jump Events
const JUMP_EVENTS = [
  'Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault'
];

// Throw Events
const THROW_EVENTS = [
  'Shot Put', 'Discus Throw', 'Javelin Throw', 'Hammer Throw'
];

// Combined Events
const COMBINED_EVENTS = [
  'Decathlon (Men)', 'Heptathlon (Women)'
];

// IAAF Lane Assignment (Rank → Lane)
const IAAF_LANE_ASSIGNMENT = {
  1: 3,  // Rank 1 → Lane 3
  2: 4,  // Rank 2 → Lane 4
  3: 2,  // Rank 3 → Lane 2
  4: 5,  // Rank 4 → Lane 5
  5: 6,  // Rank 5 → Lane 6
  6: 1,  // Rank 6 → Lane 1
  7: 7,  // Rank 7 → Lane 7
  8: 8   // Rank 8 → Lane 8
};

// Scoring Rules
const SCORING = {
  1st: 5,   // Gold
  2nd: 3,   // Silver
  3rd: 1    // Bronze
};

// Combined Event Events Breakdown
const DECATHLON_EVENTS = [
  '100m', 'Long Jump', 'Shot Put', 'High Jump', '400m',  // Day 1
  '110mH', 'Discus', 'Pole Vault', 'Javelin', '1500m'    // Day 2
];

const HEPTATHLON_EVENTS = [
  '100mH', 'High Jump', 'Shot Put', '200m',              // Day 1
  'Long Jump', 'Javelin', '800m'                          // Day 2
];

// Field Attempts
const FIELD_ATTEMPTS = 6;
const THROW_PRELIMINARY = 3;
const THROW_FINAL = 3;

// Relay Team Size
const RELAY_TEAM_SIZE = 4;

// Heat Grouping
const HEAT_GROUP_SIZE = 8;

module.exports = {
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
};
