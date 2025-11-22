import College from '../models/College.js';
import User from '../models/User.js';
import Athlete from '../models/Athlete.js';
import Event from '../models/Event.js';
import bcrypt from 'bcryptjs';
import { sanitizeUsername } from '../utils/sanitizeUsername.js';

const BCRYPT_SALT = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * LIST COLLEGES
 * GET /api/colleges
 * Returns all colleges sorted by name
 */
export async function listColleges(req, res) {
  try {
    const colleges = await College.find().sort({ name: 1 });
    res.json({
      ok: true,
      count: colleges.length,
      colleges
    });
  } catch (err) {
    console.error('List colleges error:', err);
    res.status(500).json({ error: 'Failed to list colleges', details: err.message });
  }
}

/**
 * CREATE COLLEGE
 * POST /api/colleges
 * Creates college + auto-creates PED user with sanitized username and phone as default password
 * 
 * Request body: { name, code, pedName, pedPhone }
 * Response: { college, pedCredentials: { username, defaultPassword, mustChangePassword } }
 */
export async function createCollege(req, res) {
  try {
    const { name, code, pedName, pedPhone } = req.body;
    
    // Validate required fields
    if (!name || !code || !pedName || !pedPhone) {
      return res.status(400).json({
        error: 'All fields required',
        required: ['name', 'code', 'pedName', 'pedPhone']
      });
    }

    // Validate phone format
    const phoneRegex = /^\d{6,15}$/;
    if (!phoneRegex.test(String(pedPhone).trim())) {
      return res.status(400).json({ error: 'PED phone must be numeric (6-15 digits)' });
    }

    // Check uniqueness for college name
    const existingName = await College.findOne({ name });
    if (existingName) {
      return res.status(409).json({ error: 'College name already exists' });
    }
    
    // Check uniqueness for college code
    const existingCode = await College.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(409).json({ error: 'College code already exists' });
    }

    // Create college document
    const college = await College.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      pedName: pedName.trim(),
      pedPhone: String(pedPhone).trim()
    });

    // Generate PED user
    const pedUsername = sanitizeUsername(pedName);
    
    // Check if username already exists, append number if needed
    let finalUsername = pedUsername;
    let counter = 1;
    while (await User.findOne({ username: finalUsername })) {
      finalUsername = `${pedUsername}${counter}`;
      counter++;
    }
    
    // Hash default password (pedPhone)
    const hashedPassword = await bcrypt.hash(String(pedPhone).trim(), BCRYPT_SALT);
    
    // Create PED user with mustChangePassword=true
    await User.create({
      username: finalUsername,
      password: hashedPassword,
      role: 'ped',
      mustChangePassword: true,
      collegeId: college._id
    });

    res.status(201).json({
      ok: true,
      message: 'College created and PED user generated',
      college,
      pedCredentials: {
        username: finalUsername,
        defaultPassword: pedPhone,
        mustChangePassword: true,
        note: 'PED must login with username and phone as password, then change password on first login'
      }
    });
  } catch (err) {
    console.error('Create college error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    res.status(500).json({ error: 'Failed to create college', details: err.message });
  }
}

/**
 * UPDATE COLLEGE
 * PUT /api/colleges/:id
 * Updates college + updates/creates PED user
 * 
 * Request body: { name, code, pedName, pedPhone }
 */
export async function updateCollege(req, res) {
  try {
    const { id } = req.params;
    const { name, code, pedName, pedPhone } = req.body;
    
    // Validate required fields
    if (!name || !code || !pedName || !pedPhone) {
      return res.status(400).json({
        error: 'All fields required',
        required: ['name', 'code', 'pedName', 'pedPhone']
      });
    }

    // Validate phone format
    const phoneRegex = /^\d{6,15}$/;
    if (!phoneRegex.test(String(pedPhone).trim())) {
      return res.status(400).json({ error: 'PED phone must be numeric (6-15 digits)' });
    }

    // Fetch college
    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    // Check uniqueness for name (if changed)
    if (name.trim() !== college.name) {
      const exists = await College.findOne({ name: name.trim(), _id: { $ne: id } });
      if (exists) {
        return res.status(409).json({ error: 'College name already in use' });
      }
    }

    // Check uniqueness for code (if changed)
    if (code.trim().toUpperCase() !== college.code) {
      const exists = await College.findOne({ code: code.trim().toUpperCase(), _id: { $ne: id } });
      if (exists) {
        return res.status(409).json({ error: 'College code already in use' });
      }
    }

    // Update college
    college.name = name.trim();
    college.code = code.trim().toUpperCase();
    college.pedName = pedName.trim();
    college.pedPhone = String(pedPhone).trim();
    await college.save();

    // Update or create PED user
    let user = await User.findOne({ collegeId: college._id, role: 'ped' });
    
    if (user) {
      // Update existing user
      const newUsername = sanitizeUsername(pedName);
      user.username = newUsername;
      user.password = await bcrypt.hash(String(pedPhone).trim(), BCRYPT_SALT);
      user.mustChangePassword = true;
      await user.save();
    } else {
      // Create new PED user if missing
      const newUsername = sanitizeUsername(pedName);
      const hashedPassword = await bcrypt.hash(String(pedPhone).trim(), BCRYPT_SALT);
      
      await User.create({
        username: newUsername,
        password: hashedPassword,
        role: 'ped',
        mustChangePassword: true,
        collegeId: college._id
      });
    }

    res.json({
      ok: true,
      message: 'College updated successfully',
      college
    });
  } catch (err) {
    console.error('Update college error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    res.status(500).json({ error: 'Failed to update college', details: err.message });
  }
}

/**
 * DELETE COLLEGE
 * DELETE /api/colleges/:id
 * Only allowed if college has no athletes or event participants
 * Also deletes associated PED user
 */
export async function deleteCollege(req, res) {
  try {
    const { id } = req.params;

    // Find college
    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    // Check if college has athletes
    const athleteCount = await Athlete.countDocuments({ college: id });
    if (athleteCount > 0) {
      return res.status(409).json({
        error: `Cannot delete — college has ${athleteCount} athlete(s). Remove them first.`
      });
    }

    // Check if college has event participants
    const eventsWithParticipants = await Event.countDocuments({
      participants: { $exists: true, $ne: [] }
    });
    if (eventsWithParticipants > 0) {
      return res.status(409).json({
        error: 'Cannot delete — athletes still participate in events. Clear events first.'
      });
    }

    // Delete PED user
    await User.deleteOne({ collegeId: id, role: 'ped' });

    // Delete college
    await College.findByIdAndDelete(id);

    res.json({
      ok: true,
      message: 'College and PED user deleted successfully'
    });
  } catch (err) {
    console.error('Delete college error:', err);
    res.status(500).json({ error: 'Failed to delete college', details: err.message });
  }
}

export default {
  listColleges,
  createCollege,
  updateCollege,
  deleteCollege
};

