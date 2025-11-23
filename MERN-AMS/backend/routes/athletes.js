import express from 'express';
import { Athlete, College } from '../models/index.js';
import { verifyToken, enforceCollegeAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all athletes for a college
router.get('/college/:collegeId', verifyToken, enforceCollegeAccess, async (req, res) => {
  try {
    // PED can only access their own college
    const collegeId = req.user.role === 'ped' ? req.user.collegeId : req.params.collegeId;
    
    const athletes = await Athlete.find({ college: collegeId })
      .populate('college', 'name code')
      .populate('event1', 'name category gender')
      .populate('event2', 'name category gender')
      .populate('relay1', 'name category gender')
      .populate('relay2', 'name category gender')
      .populate('mixedRelay', 'name category gender');
    res.json(athletes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all athletes (for PED, returns only their college athletes)
router.get('/', verifyToken, enforceCollegeAccess, async (req, res) => {
  try {
    let query = {};
    
    // PED users can only see their college's athletes
    if (req.user.role === 'ped') {
      query.college = req.user.collegeId;
    }
    
    const athletes = await Athlete.find(query)
      .populate('college', 'name code')
      .populate('event1', 'name category gender')
      .populate('event2', 'name category gender')
      .populate('relay1', 'name category gender')
      .populate('relay2', 'name category gender')
      .populate('mixedRelay', 'name category gender');
    res.json(athletes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get athlete by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id)
      .populate('college', 'name code')
      .populate('event1', 'name category gender')
      .populate('event2', 'name category gender')
      .populate('relay1', 'name category gender')
      .populate('relay2', 'name category gender')
      .populate('mixedRelay', 'name category gender');
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });
    
    // PED can only access their college's athletes
    if (req.user.role === 'ped' && athlete.college.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(athlete);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create athlete
router.post('/', verifyToken, async (req, res) => {
  try {
    // PED can only create athletes for their college
    if (req.user.role === 'ped') {
      req.body.college = req.user.collegeId;
    }
    
    const athlete = new Athlete(req.body);
    const newAthlete = await athlete.save();
    await newAthlete.populate('college');
    res.status(201).json(newAthlete);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update athlete
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });
    
    // PED can only update their college's athletes
    if (req.user.role === 'ped' && athlete.college.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Prevent PED from changing college
    if (req.user.role === 'ped' && req.body.college) {
      delete req.body.college;
    }
    
    Object.assign(athlete, req.body);
    const updatedAthlete = await athlete.save();
    await updatedAthlete.populate('college');
    
    // Sync events if event registrations changed
    if (req.body.event1 || req.body.event2 || req.body.relay1 || req.body.relay2 || req.body.mixedRelay) {
      const { attachAthletesToEvent } = await import('../utils/attachAthletesToEvent.js');
      
      // Get all event IDs this athlete belongs to
      const eventIds = [
        updatedAthlete.event1,
        updatedAthlete.event2,
        updatedAthlete.relay1,
        updatedAthlete.relay2,
        updatedAthlete.mixedRelay
      ].filter(Boolean);
      
      // Sync each event's participant list
      for (const eventId of eventIds) {
        await attachAthletesToEvent(eventId);
      }
    }
    
    res.json(updatedAthlete);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete athlete
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const athlete = await Athlete.findById(req.params.id);
    if (!athlete) return res.status(404).json({ message: 'Athlete not found' });
    
    // PED can only delete their college's athletes
    if (req.user.role === 'ped' && athlete.college.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await Athlete.findByIdAndDelete(req.params.id);
    res.json({ message: 'Athlete deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
