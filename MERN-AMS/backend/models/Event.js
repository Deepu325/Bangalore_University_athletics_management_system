import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  // Event Information
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  
  // Event Type & Categorization
  category: {
    type: String,
    required: true,
    enum: ['track', 'field', 'jump', 'throw', 'relay', 'combined'],
    index: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Mixed'],
    index: true
  },
  
  // Team Scoring
  countForTeam: {
    type: Boolean,
    default: true
  },
  
  // Participants in this event
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete'
  }],
  
  // Event Status
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed'],
    default: 'Upcoming',
    index: true
  },
  date: {
    type: Date
  },
  
  // ============ STAGE 5: ROUND 1 RESULTS ============
  round1Results: [{
    athleteId: mongoose.Schema.Types.ObjectId,
    bibNumber: String,
    name: String,
    college: String,
    performance: String,  // Time or distance
    rank: Number,
    points: Number
  }],
  
  // ============ STAGE 6: QUALIFIERS ============
  round2Qualified: [{
    athleteId: mongoose.Schema.Types.ObjectId,
    bibNumber: String,
    name: String,
    college: String,
    performance: String
  }],
  qualifierCount: {
    type: Number,
    default: 0
  },
  
  // ============ STAGE 6: TOP SELECTION ============
  topSelection: {
    selectedCount: {
      type: Number,  // 8 or 16
      default: 0
    },
    selectedAthleteIds: [{
      type: mongoose.Schema.Types.ObjectId
    }],
    timestamp: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['SELECTED', 'PROCESSING', 'HEATS_GENERATED'],
      default: 'SELECTED'
    }
  },
  
  // ============ STAGE 7: HEATS GENERATION ============
  heats: [{
    heatNo: Number,
    athletes: [{
      athleteId: mongoose.Schema.Types.ObjectId,
      bibNumber: String,
      name: String,
      college: String,
      lane: Number,
      seed: Number
    }]
  }],
  
  // ============ STAGE 8: HEATS RESULTS ============
  heatsResults: [{
    heatNo: Number,
    athletes: [{
      athleteId: mongoose.Schema.Types.ObjectId,
      performance: String,
      lane: Number
    }]
  }],
  
  // ============ STAGE 9: FINALS ============
  finalists: [{
    athleteId: mongoose.Schema.Types.ObjectId,
    bibNumber: String,
    name: String,
    college: String,
    lane: Number,        // IAAF lane assignment
    seed: Number         // Seed position
  }],
  
  finalResults: [{
    athleteId: mongoose.Schema.Types.ObjectId,
    bibNumber: String,
    name: String,
    college: String,
    performance: String,
    rank: Number,
    points: Number
  }],
  
  // ============ TEAM POINTS ============
  combinedPoints: [{
    collegeId: mongoose.Schema.Types.ObjectId,
    collegeName: String,
    totalPoints: Number,
    rank: Number
  }],
  
  // ============ WORKFLOW & METADATA ============
  stage: {
    type: String,
    default: 'created',
    index: true
  },
  statusFlow: {
    type: Object,
    default: {}
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  strict: true  // Only accept defined fields
});

// Index for common queries
eventSchema.index({ gender: 1, category: 1 });
eventSchema.index({ name: 1, gender: 1 });

export default mongoose.model('Event', eventSchema);
