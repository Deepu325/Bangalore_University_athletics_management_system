import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    athlete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Athlete',
      required: true,
      index: true
    },
    score: {
      type: Number,
      default: null
    },
    timeMs: {
      type: Number,
      default: null,
      description: 'Time in milliseconds for track events'
    },
    round: {
      type: Number,
      default: 1,
      enum: [1, 2, 3, 4, 5]
    },
    rank: {
      type: Number,
      default: null
    },
    points: {
      type: Number,
      default: 0
    },
    // Phase 5: AFI points for final performance
    afiPoints: {
      type: Number,
      default: 0
    },
    // Phase 5: Whether this result is counted for best athlete ranking
    isCountedForBestAthlete: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED', 'COMPLETED'],
      default: 'PRESENT'
    },
    remarks: {
      type: String,
      default: ''
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: 'results',
    timestamps: false
  }
);

// Compound index: only one result per athlete per event
resultSchema.index({ event: 1, athlete: 1 }, { unique: true });

const Result = mongoose.model('Result', resultSchema);

export default Result;
