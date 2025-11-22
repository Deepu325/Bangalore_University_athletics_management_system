/**
 * Event Management System - Configuration
 * Environment and system settings
 */

const config = {
  // System Info
  system: {
    name: 'Athletics Meet Event Management System',
    version: '1.0.0',
    championship: '61st Inter-Collegiate Athletic Championship 2025–26',
    university: 'Bangalore University',
    developedBy: 'Deepu K C',
    institution: 'Soundarya Institute of Management and Science (SIMS)',
    guidedBy: ['Dr. Harish P M', 'Lt. Suresh Reddy M S'],
    experts: ['Dr. Venkata Chalapathi', 'Mr. Chidananda', 'Dr. Manjanna B P']
  },

  // Stage Configuration
  stages: {
    total: 13,
    sequentialProgression: true, // Must follow order 1→2→...→13
    allowRevert: true, // Can go back to previous stage
    requireVerification: true // Stage 13 requires committee approval
  },

  // Event Categories
  categories: {
    track: {
      name: 'Track',
      events: [
        '100m', '200m', '400m', '800m', '1500m', '5000m', '10000m',
        '100mH (Women)', '110mH (Men)', '400mH', '3000m Steeplechase', '20km Walk'
      ],
      timeFormat: 'HH:MM:SS:ML',
      heatsPerGroup: 8,
      scoring: 'time'
    },
    relay: {
      name: 'Relay',
      events: [
        '4×100m Relay', '4×400m Relay', 'Mixed 4×100m Relay', 'Mixed 4×400m Relay'
      ],
      teamSize: 4,
      timeFormat: 'HH:MM:SS:ML',
      scoring: 'time'
    },
    jump: {
      name: 'Jump',
      events: ['Long Jump', 'Triple Jump', 'High Jump', 'Pole Vault'],
      attempts: 6,
      distanceFormat: 'meters',
      scoring: 'distance'
    },
    throw: {
      name: 'Throw',
      events: ['Shot Put', 'Discus Throw', 'Javelin Throw', 'Hammer Throw'],
      preliminaryAttempts: 3,
      finalAttempts: 3,
      distanceFormat: 'meters',
      scoring: 'distance'
    },
    combined: {
      name: 'Combined',
      events: [
        'Decathlon (Men)',
        'Heptathlon (Women)'
      ],
      scoringMethod: 'manual',
      decathlonEvents: 10,
      heptathlon Events: 7
    }
  },

  // Scoring Configuration
  scoring: {
    championshipPoints: {
      1st: 5,
      2nd: 3,
      3rd: 1
    },
    topSelection: {
      default: 8,
      maximum: 16
    }
  },

  // IAAF Lane Assignment
  iaafLanes: {
    1: 3,
    2: 4,
    3: 2,
    4: 5,
    5: 6,
    6: 1,
    7: 7,
    8: 8
  },

  // Time Configuration
  time: {
    format: 'HH:MM:SS:ML',
    precision: 'milliseconds',
    example: '00:10:45:32'
  },

  // Distance Configuration
  distance: {
    format: 'meters',
    precision: 2,
    example: '6.45'
  },

  // PDF Configuration
  pdf: {
    includeHeader: true,
    includeFooter: true,
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 20,
      bottom: 20,
      left: 15,
      right: 15
    },
    header: {
      logo: 'BU_LOGO',
      title: 'BANGALORE UNIVERSITY',
      subtitle: 'Directorate of Physical Education & Sports',
      venue: 'UCPE Stadium, Jnanabharathi Campus, Bengaluru – 560056',
      event: '61st Inter-Collegiate Athletic Championship 2025–26',
      developer: 'Developed by SIMS'
    },
    footer: {
      copyright: '© 2025 Bangalore University | Athletic Meet Management System',
      developer: 'Developed by: Deepu K C',
      institution: 'Soundarya Institute of Management and Science (SIMS)',
      guided: 'Guided By: Dr. Harish P M & Lt. Suresh Reddy M S, PED, SIMS',
      experts: 'Dr. Venkata Chalapathi | Mr. Chidananda | Dr. Manjanna B P'
    }
  },

  // Database Configuration
  database: {
    type: 'mongodb',
    collections: {
      events: 'events',
      athletes: 'athletes',
      colleges: 'colleges',
      championship: 'championship',
      auditLogs: 'audit_logs'
    },
    indexes: {
      events: ['eventId', 'eventName', 'category', 'status'],
      athletes: ['chestNo', 'name', 'college'],
      championship: ['college', 'points']
    }
  },

  // Attendance Statuses
  attendance: {
    P: 'Present',
    A: 'Absent',
    DIS: 'Disqualified'
  },

  // Event Status
  eventStatus: {
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    LOCKED: 'Locked',
    PUBLISHED: 'Published'
  },

  // Validation Rules
  validation: {
    athleteFields: {
      chestNo: { type: 'string', required: true },
      name: { type: 'string', required: true },
      college: { type: 'string', required: true }
    },
    performanceFields: {
      track: {
        type: 'time',
        format: 'HH:MM:SS:ML',
        required: true
      },
      field: {
        type: 'distance',
        format: 'decimal',
        unit: 'meters',
        required: true
      },
      combined: {
        type: 'points',
        format: 'integer',
        required: true
      }
    }
  },

  // Environment
  environment: {
    development: true,
    production: false,
    debugMode: true
  },

  // API Configuration
  api: {
    baseUrl: '/api/events',
    version: 'v1',
    timeout: 30000,
    rateLimit: {
      enabled: false
    }
  },

  // Heat Generation Rules
  heats: {
    groupSize: 8,
    minGroupSize: 7,
    avoidSameCollege: true,
    laneAssignment: 'IAAF'
  },

  // Field Event Rules
  fieldEvents: {
    jumpAttempts: 6,
    throwPreliminaryAttempts: 3,
    throwFinalAttempts: 3,
    foulMarker: 'F',
    passMarker: '–',
    clearanceMarker: 'O',
    failMarker: 'X'
  },

  // Relay Rules
  relay: {
    athletesPerTeam: 4,
    legsPerTeam: 4,
    lanePerTeam: true, // Lane assigned to team, not individual
    timeRecordedOnce: true
  },

  // Combined Event Rules
  combined: {
    decathlon: {
      name: 'Decathlon',
      gender: 'Men',
      days: 2,
      day1Events: 5,
      day2Events: 5,
      totalEvents: 10,
      scoringMethod: 'manual'
    },
    heptathlon: {
      name: 'Heptathlon',
      gender: 'Women',
      days: 2,
      day1Events: 4,
      day2Events: 3,
      totalEvents: 7,
      scoringMethod: 'manual'
    }
  },

  // Features
  features: {
    automaticHeatsGeneration: true,
    automaticLaneAssignment: true,
    automaticRanking: true,
    automaticChampionshipCalculation: true,
    pdfGeneration: true,
    eventLocking: true,
    nameCorrection: true,
    auditTrail: true,
    dataExport: true
  }
};

module.exports = config;
