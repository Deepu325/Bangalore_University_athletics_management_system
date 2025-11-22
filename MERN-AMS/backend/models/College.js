import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'College code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'College name is required'],
    unique: true,
    trim: true,
    index: true
  },
  pedName: {
    type: String,
    required: [true, 'PED name is required'],
    trim: true
  },
  pedPhone: {
    type: String,
    required: [true, 'PED phone is required'],
    trim: true,
    match: [/^\d{6,15}$/, 'PED phone must be numeric (6-15 digits)']
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  contact: {
    type: String,
    trim: true,
    default: ''
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
  strict: true
});

// Compound unique indexes
collegeSchema.index({ code: 1 }, { unique: true });
collegeSchema.index({ name: 1 }, { unique: true });

export default mongoose.model('College', collegeSchema);

