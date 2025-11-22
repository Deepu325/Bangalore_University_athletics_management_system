import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['track', 'field', 'jump', 'throw', 'relay', 'combined']
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female']
  },
  countForTeam: {
    type: Boolean,
    default: true // Set to false for Half Marathon, Mixed Relay
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete'
  }],
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed'],
    default: 'Upcoming'
  },
  date: {
    type: Date
  },
  // Stage 5: Round 1 Results (ranked by performance)
  round1Results: [{
    type: Object,
    default: []
  }],
  // Stage 6: Top Athletes Selection
  round2Qualified: [{
    type: Object,
    default: []
  }],
  qualifierCount: {
    type: Number,
    default: 0
  },
  // Stage 6: Top Selection (Top 8 or Top 16)
  topSelection: {
    selectedCount: {
      type: Number, // 8 or 16
      default: 0
    },
    selectedAthleteIds: [{
      type: String,
      default: []
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
  // Stage 7: Heats Generation
  heats: [{
    heatNo: Number,
    athletes: [{
      athleteId: String,
      bibNumber: String,
      name: String,
      college: String,
      lane: Number,
      seed: Number
    }]
  }],
  // Stage 8: Heats Results
  heatsResults: [{
    heatNo: Number,
    athletes: [{
      athleteId: String,
      performance: String,
      lane: Number
    }]
  }],
  // Stage 9: Final Results (Top 8 or selected finals)
  finalResults: [{
    athleteId: String,
    bibNumber: String,
    name: String,
    performance: String,
    rank: Number,
    points: Number
  }],
  // Combined team points
  combinedPoints: [{
    collegeId: String,
    collegeName: String,
    totalPoints: Number,
    rank: Number
  }],

  // Phase 4: Finalists selection (Top 8 with lane assignments for finals)
  finalists: [{
    athleteId: String,
    bibNumber: String,
    name: String,
    college: String,
    lane: Number,        // IAAF lane assignment for finals
    seed: Number         // Seed position (1-8)
  }],

  // Status tracking across all stages
  statusFlow: {
    type: Object,
    default: {}
  },

  stage: {
    type: String,
    default: 'created'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Event', eventSchema);
