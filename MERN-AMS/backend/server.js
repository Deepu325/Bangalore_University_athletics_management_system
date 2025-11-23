import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import College from './models/College.js';
import Athlete from './models/Athlete.js';
import Event from './models/Event.js';
import Result from './models/Result.js';
import User from './models/User.js';
import collegeRoutes from './routes/colleges.js';
import athletesRoutes from './routes/athletes.js';
import authRoutes from './routes/auth.js';
import resultRoutes from './routes/results.js';
import teamScoresRoutes from './routes/teamScores.js';
import eventsRoutes from './routes/events.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
// CORS Configuration for Render deployment
app.use(
  cors({
    origin: NODE_ENV === 'production' 
      ? [CLIENT_URL, 'http://localhost:3000']
      : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bu-ams';
let mongoConnected = false;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  mongoConnected = true;
  console.log('✓ MongoDB connected successfully');
  
  // Drop old email index if it exists (to fix E11000 duplicate key errors)
  try {
    const User = mongoose.model('User');
    const indexes = await User.collection.getIndexes();
    if (indexes.email_1 && !indexes.email_1.sparse) {
      await User.collection.dropIndex('email_1');
      console.log('✓ Dropped old non-sparse email index');
      // Create new sparse index
      User.collection.createIndex({ email: 1 }, { sparse: true, unique: true });
      console.log('✓ Created new sparse unique email index');
    }
  } catch (err) {
    console.log('ℹ Index cleanup skipped:', err.message);
  }
})
.catch((err) => {
  mongoConnected = false;
  console.log('⚠ MongoDB connection failed. Using in-memory storage.');
  console.log(`  Error: ${err.message}`);
});

// Check if Gmail credentials are configured
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;
const DEMO_MODE = !GMAIL_USER || !GMAIL_PASSWORD || GMAIL_USER === 'your-email@gmail.com';

console.log(`\n${DEMO_MODE ? '🧪' : '📧'} Email Mode: ${DEMO_MODE ? 'DEMO (Console only)' : 'PRODUCTION (Real Gmail)'}`);

// Email configuration
let transporter = null;

if (!DEMO_MODE) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASSWORD
    }
  });
}

// In-memory OTP storage (expires after 10 minutes)
const otpStorage = new Map();

// Function to generate OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP email
const sendOtpEmail = async (email, otp) => {
  try {
    if (DEMO_MODE) {
      // Demo mode: just log to console
      console.log(`\n${'█'.repeat(50)}`);
      console.log(`📧 OTP EMAIL (DEMO MODE)`);
      console.log(`${'█'.repeat(50)}`);
      console.log(`To: ${email}`);
      console.log(`Subject: BU-AMS Login OTP`);
      console.log(`\nOne-Time Password: ${otp}`);
      console.log(`Valid for: 10 minutes`);
      console.log(`${'█'.repeat(50)}\n`);
      return true;
    }

    // Production mode: send real email
    await transporter.sendMail({
      from: GMAIL_USER,
      to: email,
      subject: 'BU-AMS Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">BU-AMS - Athletic Meet Management System</h2>
          <p>Your One-Time Password (OTP) for login is:</p>
          <h1 style="color: #667eea; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
          <p style="color: #666;">This OTP is valid for 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
    console.log(`✓ OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('✗ Failed to send OTP email:', error.message);
    return false;
  }
};



console.log('✓ Server initialized');
console.log(`${mongoConnected ? '🗄️  Database: MongoDB' : '💾 Database: In-Memory Storage'}`);

// Health Check Routes - For deployment monitoring
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'BU-AMS Backend is running successfully!',
    environment: NODE_ENV,
    database: mongoConnected ? 'Connected to MongoDB' : 'Using In-Memory Storage'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    mongodb: mongoConnected ? 'connected' : 'disconnected'
  });
});

// Routes - Simple in-memory API (no database needed)

// Mount auth routes
app.use('/api/auth', authRoutes);

// Mount college routes with controller
app.use('/api/colleges', collegeRoutes);

// Mount athletes routes
app.use('/api/athletes', athletesRoutes);

// Mount events routes (Stages 4, 6, 7)
app.use('/api/events', eventsRoutes);

// Mount results routes (Stage 5 - Scoring)
app.use('/api/results', resultRoutes);

// Mount team scores routes (Team Championship)
app.use('/team-scores', teamScoresRoutes);

// POST send OTP to email
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  try {
    const otp = generateOtp();
    
    // Store OTP with expiry (10 minutes)
    otpStorage.set(email, {
      otp: otp,
      expiresAt: Date.now() + 600000 // 10 minutes
    });

    // Send OTP via email
    const emailSent = await sendOtpEmail(email, otp);

    if (emailSent) {
      res.json({ 
        message: DEMO_MODE 
          ? 'OTP displayed in backend console (Demo Mode)'
          : 'OTP sent to your email'
      });
    } else {
      res.status(500).json({ message: 'Failed to send OTP email' });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error processing request' });
  }
});

// POST verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP required' });
  }

  const storedData = otpStorage.get(email);

  if (!storedData) {
    return res.status(400).json({ message: 'OTP not found or expired' });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStorage.delete(email);
    return res.status(400).json({ message: 'OTP has expired' });
  }

  if (storedData.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  // OTP verified successfully
  otpStorage.delete(email);
  res.json({ 
    message: 'OTP verified successfully',
    verified: true
  });
});

// GET all colleges - HANDLED BY CONTROLLER ROUTES ABOVE

// POST create college - HANDLED BY CONTROLLER ROUTES ABOVE

// GET all athletes
app.get('/api/athletes', async (req, res) => {
  try {
    const athleteList = await Athlete.find()
      .populate('college', 'name code')
      .populate('event1', 'name category gender')
      .populate('event2', 'name category gender')
      .populate('relay1', 'name category gender')
      .populate('relay2', 'name category gender')
      .populate('mixedRelay', 'name category gender');
    res.json(athleteList);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching athletes' });
  }
});

// POST register athlete
app.post('/api/athletes', async (req, res) => {
  try {
    const newAthlete = new Athlete(req.body);
    const saved = await newAthlete.save();
    await saved.populate('college', 'name code');
    await saved.populate('event1', 'name category gender');
    await saved.populate('event2', 'name category gender');
    await saved.populate('relay1', 'name category gender');
    await saved.populate('relay2', 'name category gender');
    await saved.populate('mixedRelay', 'name category gender');
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: 'Error registering athlete', error: error.message });
  }
});

// DELETE athlete
app.delete('/api/athletes/:id', async (req, res) => {
  try {
    await Athlete.findByIdAndDelete(req.params.id);
    res.json({ message: 'Athlete deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting athlete' });
  }
});

// GET athletes for a specific event (CRITICAL FOR STAGE 4)
app.get('/api/events/:eventId/athletes', async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Find all athletes registered for this event
    const athletes = await Athlete.find({
      $or: [
        { event1: eventId },
        { event2: eventId },
        { relay1: eventId },
        { relay2: eventId },
        { mixedRelay: eventId }
      ]
    })
    .populate('college', 'name code')
    .lean();

    if (!athletes || athletes.length === 0) {
      return res.json({
        success: false,
        message: 'No athletes registered for this event',
        athletes: []
      });
    }

    res.json({
      success: true,
      count: athletes.length,
      athletes: athletes
    });
  } catch (error) {
    console.error('Error fetching event athletes:', error);
    res.status(500).json({ success: false, message: 'Error fetching athletes', error: error.message });
  }
});

// GET all events - HANDLED BY EVENTS ROUTER

// POST create event - HANDLED BY EVENTS ROUTER

// ========================================
// STAGE 4: Generate Event Sheet Helpers
// ========================================

/**
 * Create heats for track events
 * 8 lanes per heat, assigns lane numbers 1-8
 */
function createHeats(athletes) {
  const lanes = 8;
  const heats = [];

  for (let i = 0; i < athletes.length; i += lanes) {
    heats.push(athletes.slice(i, i + lanes));
  }

  return heats.map((heat, index) => {
    return heat.map((ath, laneIndex) => ({
      ...ath,
      heatNo: index + 1,
      lane: laneIndex + 1
    }));
  });
}

/**
 * Create sets for field events
 * 12 athletes per set
 */
function createSets(athletes) {
  const maxSetSize = 12;
  const sets = [];

  for (let i = 0; i < athletes.length; i += maxSetSize) {
    sets.push(athletes.slice(i, i + maxSetSize));
  }

  return sets;
}

// STAGE 4: Generate Event Sheet (Production-Ready)
app.get('/api/events/:id/generate-sheet', async (req, res) => {
  try {
    const eventId = new mongoose.Types.ObjectId(req.params.id);
    console.log(`🎯 Stage 4 - Generating sheets for event: ${eventId}`);

    // Fetch event details
    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ error: 'Event not found' });

    console.log(`📋 Event: ${event.name} (${event.gender}) - Category: ${event.category}`);

    // Fetch athletes registered for this event AND matching gender
    const athletes = await Athlete.find({
      $and: [
        {
          $or: [
            { event1: eventId },
            { event2: eventId },
            { relay1: eventId },
            { relay2: eventId },
            { mixedRelay: eventId }
          ]
        },
        { gender: event.gender }
      ]
    })
      .populate('college', 'name code')
      .sort({ chestNo: 1 })
      .lean();

    console.log(`✓ Found ${athletes.length} athletes`);

    if (athletes.length === 0) {
      return res.json({
        success: true,
        event,
        message: 'No athletes registered for this event',
        athletes: [],
        heats: [],
        sets: []
      });
    }

    // TRACK EVENTS → generate heats
    if (event.category === 'track') {
      const heats = createHeats(athletes);
      return res.json({ 
        success: true, 
        event, 
        heats,
        athletesCount: athletes.length
      });
    }

    // JUMP EVENTS → generate sets
    if (event.category === 'jump') {
      const sets = createSets(athletes);
      return res.json({ 
        success: true, 
        event, 
        sets,
        athletesCount: athletes.length
      });
    }

    // THROW EVENTS → generate sets
    if (event.category === 'throw') {
      const sets = createSets(athletes);
      return res.json({ 
        success: true, 
        event, 
        sets,
        athletesCount: athletes.length
      });
    }

    // RELAY EVENTS → generate heats
    if (event.category === 'relay') {
      const heats = createHeats(athletes);
      return res.json({ 
        success: true, 
        event, 
        heats,
        athletesCount: athletes.length
      });
    }

    // COMBINED EVENTS → return athletes directly
    if (event.category === 'combined') {
      return res.json({ 
        success: true, 
        event, 
        athletes,
        athletesCount: athletes.length
      });
    }

    // Default response
    return res.json({ 
      success: true, 
      event, 
      athletes,
      athletesCount: athletes.length
    });

  } catch (err) {
    console.error('Stage 4 Error:', err);
    return res.status(500).json({ error: 'Server error generating event sheet', details: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BU-AMS API is running', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ BU-AMS Backend Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✓ API Routes:`);
  console.log(`  - POST   /api/auth/send-otp`);
  console.log(`  - POST   /api/auth/verify-otp`);
  console.log(`  - GET    /api/colleges`);
  console.log(`  - POST   /api/colleges`);
  console.log(`  - GET    /api/athletes`);
  console.log(`  - POST   /api/athletes`);
  console.log(`  - DELETE /api/athletes/:id`);
  console.log(`  - GET    /api/events/:eventId/athletes`);
  console.log(`  - GET    /api/events/:id/generate-sheet (Stage 4 - NEW)`);
  console.log(`  - GET    /api/events`);
  console.log(`  - POST   /api/events`);
  console.log(`  - PUT    /api/events/:eventId/save-qualifiers (Stage 6 - Save Qualifiers)`);
  console.log(`  - PUT    /api/results/:eventId/athlete/:athleteId (Stage 5 - Scoring)`);
  console.log(`  - PATCH  /api/results/:eventId/athlete/:athleteId (Stage 5 - Scoring)`);
  console.log(`  - GET    /api/results/:eventId (Stage 5 - Results)`);
  console.log(`  - GET    /team-scores?category=Male|Female (Team Championship)`);
  console.log(`  - GET    /team-scores/summary (Champion Summary)`);
  console.log(`  - POST   /team-scores/recalculate/:category (Recalculate)`);
  console.log(`  - POST   /team-scores/recalculate-all (Full Recalc)`);
  console.log(`\n🎯 Frontend: http://localhost:3000\n`);
});

export default app;
