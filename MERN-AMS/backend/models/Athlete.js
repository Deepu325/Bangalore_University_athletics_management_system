import mongoose from 'mongoose';

const athleteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  uucms: {
    type: String
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  chestNo: {
    type: String
  },
  // Event registrations - athletes can be in multiple events
  event1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  event2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  relay1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  relay2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  mixedRelay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  // Attendance and status tracking
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'],
    default: 'PRESENT'
  },
  remarks: {
    type: String
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Athlete', athleteSchema);
