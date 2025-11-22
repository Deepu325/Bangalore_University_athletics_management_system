import mongoose from 'mongoose';

const teamScoreSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  collegeName: {
    type: String
  },
  category: {
    type: String,
    enum: ['Male', 'Female', 'Overall'],
    required: true
  },
  golds: {
    type: Number,
    default: 0
  },
  silvers: {
    type: Number,
    default: 0
  },
  bronzes: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number
  },
  // Phase 5: Event-wise breakdown
  eventDetails: [{
    eventName: String,
    eventId: mongoose.Schema.Types.ObjectId,
    position: Number,
    points: Number,
    athleteName: String,
    athleteId: String
  }],
  // Phase 5: AFI points (alternative scoring)
  totalAFIPoints: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for fast queries
teamScoreSchema.index({ category: 1, points: -1, golds: -1, silvers: -1 });

export default mongoose.model('TeamScore', teamScoreSchema);
