/**
 * Express.js Integration Guide
 * How to integrate Event Management System into your Node.js/Express backend
 */

/**
 * STEP 1: Install in app.js / server.js
 * =====================================
 */

// In your main Express app file:

const express = require('express');
const app = express();

// Import Event Management System
const eventRoutes = require('./eventManagement/eventRoutes');
const AthleticsMeetEventManager = require('./eventManagement');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount event management routes
app.use('/api/events', eventRoutes);

// Optional: Create global event manager instance if needed
global.eventManager = new AthleticsMeetEventManager.AthleticsMeetEventManager();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Athletics Meet Event Management System running on port ${PORT}`);
});

/**
 * STEP 2: API Client Functions (Frontend Integration)
 * ====================================================
 */

// Frontend helper functions to call backend

const EventAPI = {
  // Create new event
  async createEvent(name, distance, date, venue) {
    const response = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, distance, date, venue })
    });
    return response.json();
  },

  // Get all events
  async getEvents() {
    const response = await fetch('/api/events');
    return response.json();
  },

  // Get event details
  async getEvent(eventId) {
    const response = await fetch(`/api/events/${eventId}`);
    return response.json();
  },

  // Stage 2: Generate call room
  async generateCallRoom(eventId, athletes) {
    const response = await fetch(`/api/events/${eventId}/callroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athletes })
    });
    return response.json();
  },

  // Stage 3: Mark attendance
  async markAttendance(eventId, attendanceData) {
    const response = await fetch(`/api/events/${eventId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendanceData })
    });
    return response.json();
  },

  // Stage 5: Score round 1
  async scoreRound1(eventId, performances) {
    const response = await fetch(`/api/events/${eventId}/score-round1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ performances })
    });
    return response.json();
  },

  // Stage 6: Select top athletes
  async selectTop(eventId, topCount = 8) {
    const response = await fetch(`/api/events/${eventId}/select-top`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topCount })
    });
    return response.json();
  },

  // Stage 7: Generate heats
  async generateHeats(eventId) {
    const response = await fetch(`/api/events/${eventId}/heats`);
    return response.json();
  },

  // Stage 10: Score final
  async scoreFinal(eventId, finalPerformances) {
    const response = await fetch(`/api/events/${eventId}/score-final`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finalPerformances })
    });
    return response.json();
  },

  // Stage 13: Verify and publish
  async verifyAndPublish(eventId, committee) {
    const response = await fetch(`/api/events/${eventId}/verify-publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationData: {
          verified: true,
          committee
        }
      })
    });
    return response.json();
  },

  // Get championship standings
  async getChampionshipStandings() {
    const response = await fetch('/api/championship/standings');
    return response.json();
  },

  // Export event results
  async exportResults(eventId) {
    const response = await fetch(`/api/events/${eventId}/export`);
    return response.json();
  }
};

/**
 * STEP 3: Usage in Routes
 * =======================
 */

// Example custom route in your backend

router.post('/my-event-endpoint', async (req, res) => {
  try {
    const { eventName, eventDistance } = req.body;

    // Create event
    const event = await EventAPI.createEvent(
      eventName,
      eventDistance,
      new Date(),
      'UCPE Stadium'
    );

    if (event.success) {
      return res.json({
        success: true,
        eventId: event.eventId,
        message: 'Event created successfully'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * STEP 4: Database Integration (MongoDB)
 * =======================================
 */

// Example Mongoose integration

const mongoose = require('mongoose');
const { eventSchema, collections } = require('./eventManagement/eventSchema');

// Create model
const EventModel = mongoose.model('Event', new mongoose.Schema({
  eventId: { type: String, unique: true, required: true },
  eventName: { type: String, required: true },
  category: String,
  currentStage: { type: Number, min: 1, max: 13 },
  status: String,
  athletes: [{
    chestNo: String,
    name: String,
    college: String,
    status: String,
    performances: Object
  }],
  finalResults: Array,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
}));

// Save event to database
async function saveEvent(eventData) {
  try {
    const event = new EventModel(eventData);
    await event.save();
    return { success: true, eventId: event.eventId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * STEP 5: Middleware for Event Processing
 * ========================================
 */

// Middleware to validate event exists
async function validateEventExists(req, res, next) {
  const { eventId } = req.params;
  
  try {
    const event = await EventModel.findOne({ eventId });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    req.event = event;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Middleware to check stage progression
function validateStageProgression(req, res, next) {
  const { stageNumber } = req.params;
  const currentStage = req.event?.currentStage || 1;

  if (stageNumber < currentStage) {
    return res.status(400).json({
      error: 'Cannot go to previous stage directly'
    });
  }

  if (stageNumber > currentStage + 1) {
    return res.status(400).json({
      error: 'Must process stages sequentially'
    });
  }

  next();
}

/**
 * STEP 6: Example Complete Workflow in React Frontend
 * ====================================================
 */

// React Component Example

const EventManagementComponent = () => {
  const [eventId, setEventId] = useState(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [athletes, setAthletes] = useState([]);

  // Create event
  const handleCreateEvent = async () => {
    const result = await EventAPI.createEvent(
      '100m',
      '100',
      new Date().toISOString(),
      'UCPE Stadium'
    );
    setEventId(result.eventId);
    setCurrentStage(2);
  };

  // Generate call room
  const handleGenerateCallRoom = async () => {
    const result = await EventAPI.generateCallRoom(eventId, athletes);
    console.log('Call room:', result.callRoom);
    // Display PDF: result.pdf
  };

  // Process through stages
  const handleNextStage = async (stageData) => {
    const response = await fetch(`/api/events/${eventId}/stage/${currentStage}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stageData)
    });
    const result = await response.json();
    setCurrentStage(currentStage + 1);
    return result;
  };

  return (
    <div>
      <h2>Athletics Meet Event Management</h2>
      <button onClick={handleCreateEvent}>Create Event</button>
      <button onClick={handleGenerateCallRoom}>Generate Call Room</button>
      {/* UI for each stage */}
    </div>
  );
};

/**
 * STEP 7: Environment Variables
 * =============================
 */

// .env file

MONGODB_URI=mongodb://localhost:27017/athletics_meet
PORT=5000
NODE_ENV=development
LOG_LEVEL=info

/**
 * STEP 8: Error Handling
 * =======================
 */

class EventManagementError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Express error handler
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof EventManagementError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

/**
 * STEP 9: Logging & Audit Trail
 * ==============================
 */

const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'event-management' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log stage progression
function logStageChange(eventId, fromStage, toStage, data) {
  logger.info({
    eventId,
    action: 'stage_progression',
    fromStage,
    toStage,
    timestamp: new Date(),
    dataFields: Object.keys(data)
  });
}

/**
 * STEP 10: Testing
 * ================
 */

// Jest test example

describe('Event Management Integration', () => {
  test('Should create event', async () => {
    const result = await EventAPI.createEvent(
      '100m',
      '100',
      new Date(),
      'UCPE Stadium'
    );

    expect(result.success).toBe(true);
    expect(result.eventId).toBeDefined();
  });

  test('Should generate call room', async () => {
    const result = await EventAPI.generateCallRoom(eventId, [
      { chestNo: '001', name: 'Athlete A', college: 'Christ' }
    ]);

    expect(result.callRoom).toBeDefined();
    expect(result.pdf).toBeDefined();
  });
});

/**
 * Quick Integration Checklist
 * ===========================
 * 
 * ✓ Import eventRoutes in main app.js
 * ✓ Mount routes at /api/events
 * ✓ Setup MongoDB connection
 * ✓ Create EventModel in database
 * ✓ Add middleware for validation
 * ✓ Implement error handling
 * ✓ Setup logging
 * ✓ Create frontend API client
 * ✓ Build UI components for each stage
 * ✓ Test complete workflow
 */

module.exports = {
  EventAPI,
  validateEventExists,
  validateStageProgression,
  logStageChange
};
