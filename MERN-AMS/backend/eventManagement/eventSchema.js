/**
 * Event Management Database Schema (MongoDB)
 */

const eventSchema = {
  eventId: String, // Unique identifier
  eventName: String,
  category: String, // Track, Relay, Jump, Throw, Combined
  eventType: String, // Specific event (100m, 4x100m, Long Jump, etc.)
  distance: String,
  date: Date,
  venue: String,
  currentStage: Number, // 1-13
  status: String, // Active, Completed, Locked
  createdAt: Date,
  updatedAt: Date,
  lockedAt: Date,

  // Athletes data
  athletes: [{
    chestNo: String,
    name: String,
    college: String,
    status: String, // P, A, DIS
    performances: {
      round1: String,
      heats: String,
      final: String
    },
    attempts: {
      a1: String,
      a2: String,
      a3: String,
      a4: String,
      a5: String,
      a6: String,
      best: String
    },
    rank: Number,
    heatNumber: Number,
    lane: Number,
    finalPerformance: String,
    finalRank: Number,
    awardPoints: Number
  }],

  // For Relay events
  teams: [{
    teamNumber: Number,
    college: String,
    athletes: [{
      chestNo: String,
      name: String,
      legPosition: Number
    }],
    performance: String,
    rank: Number,
    awardPoints: Number
  }],

  // For Combined events
  day1: {
    athletes: [{
      chestNo: String,
      name: String,
      college: String,
      points: Number
    }],
    date: Date
  },
  day2: {
    athletes: [{
      chestNo: String,
      name: String,
      college: String,
      points: Number,
      totalPoints: Number
    }],
    date: Date
  },

  // Stage data
  stageHistory: [{
    stage: Number,
    timestamp: Date,
    dataSnapshot: Object
  }],

  // Results
  finalResults: [{
    chestNo: String,
    name: String,
    college: String,
    finalPerformance: String,
    position: Number,
    awardPoints: Number
  }],

  // Championship
  championshipPoints: {
    college: Number
  },

  // Verification & Publishing
  verificationData: {
    verified: Boolean,
    committee: [String],
    verifiedAt: Date,
    signature: String
  },

  // PDF generation
  pdfs: {
    callRoom: String,
    eventSheet: String,
    heats: String,
    results: String
  },

  notes: String
};

/**
 * Collections needed:
 * - events (main event records)
 * - athletes (athlete master data)
 * - colleges (college registry)
 * - championship (championship standings)
 * - logs (audit trail)
 */

const collections = {
  events: 'events',
  athletes: 'athletes',
  colleges: 'colleges',
  championship: 'championship',
  logs: 'audit_logs'
};

/**
 * Mongoose-like schema definition for reference
 */
const mongooseSchemaExample = `
const eventSchema = new Schema({
  eventId: { type: String, unique: true, required: true },
  eventName: { type: String, required: true },
  category: { type: String, enum: ['Track', 'Relay', 'Jump', 'Throw', 'Combined'], required: true },
  eventType: String,
  distance: String,
  date: Date,
  venue: String,
  currentStage: { type: Number, min: 1, max: 13, default: 1 },
  status: { type: String, enum: ['Active', 'Completed', 'Locked'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  athletes: [{
    chestNo: String,
    name: String,
    college: String,
    status: { type: String, enum: ['P', 'A', 'DIS'], default: 'P' },
    performances: {
      round1: String,
      heats: String,
      final: String
    },
    rank: Number,
    awardPoints: Number
  }],
  finalResults: [{
    chestNo: String,
    name: String,
    college: String,
    finalPerformance: String,
    position: { type: Number, min: 1, max: 3 },
    awardPoints: { type: Number, default: 0 }
  }],
  verified: { type: Boolean, default: false },
  verificationData: {
    committee: [String],
    verifiedAt: Date,
    signature: String
  }
});
`;

module.exports = {
  eventSchema,
  collections,
  mongooseSchemaExample
};
