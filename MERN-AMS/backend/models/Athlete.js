import mongoose from 'mongoose';

const athleteSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  uucms: {
    type: String,
    trim: true
  },
  chestNo: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  
  // College Association (REQUIRED - ObjectId not string)
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  
  // Gender (MUST be "Male" or "Female" - not "M"/"F")
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true,
    index: true
  },
  
  // Event Registrations (MULTIPLE fields, not array)
  // Athletes can participate in up to 5 events
  event1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  event2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  relay1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  relay2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  mixedRelay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  
  // Status & Tracking
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'DISQUALIFIED'],
    default: 'PRESENT',
    index: true
  },
  remarks: {
    type: String,
    default: ''
  },
  
  // Timestamps
  registrationDate: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  strict: true  // Only accept defined fields
});

// Virtual for getting all events as array
athleteSchema.virtual('events').get(function() {
  return [this.event1, this.event2, this.relay1, this.relay2, this.mixedRelay]
    .filter(eventId => eventId !== null && eventId !== undefined);
});

// Pre-save validation
athleteSchema.pre('save', async function(next) {
  try {
    // Ensure college exists
    if (!this.college) {
      throw new Error('College is required');
    }
    
    // Ensure gender is proper case
    if (this.gender === 'M') this.gender = 'Male';
    if (this.gender === 'F') this.gender = 'Female';
    
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model('Athlete', athleteSchema);
