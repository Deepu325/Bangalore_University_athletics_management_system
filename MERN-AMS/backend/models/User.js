import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    minlength: 3
  },
  email: {
    type: String,
    sparse: true,
    unique: true,
    trim: true,
    lowercase: true,
    default: null
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'ped', 'official'],
    required: true,
    index: true
  },
  // Flag to require password change on first login
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  // Reference to college (for PED users)
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    default: null,
    index: true
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

// Compound indexes
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { sparse: true, unique: true });
userSchema.index({ role: 1, collegeId: 1 });

export default mongoose.model('User', userSchema);

