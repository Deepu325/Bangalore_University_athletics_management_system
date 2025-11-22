import bcrypt from 'bcryptjs';
import { College, User, Athlete, Event } from '../models/index.js';
import { sanitizeUsername, generateUniqueUsername } from '../utils/sanitizeUsername.js';

const BCRYPT_SALT = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * LIST COLLEGES
 * GET /api/colleges
 * Returns all colleges sorted by name
 */
async function listColleges(req, res, next) {
  try {
    const cols = await College.find().sort({ name: 1 }).lean();
    res.json(cols);
  } catch (err) {
    next(err);
  }
}

/**
 * CREATE COLLEGE
 * POST /api/colleges
 * Creates college + auto-creates PED user with sanitized username and phone as default password
 * 
 * Request body: { name, code, pedName, pedPhone }
 * Response: { college, pedCredentials: { username, note } }
 */
async function createCollege(req, res, next) {
  try {
    const { name, code, pedName, pedPhone } = req.body;
    
    // Validate required fields
    if (!name || !code || !pedName || !pedPhone) {
      return res.status(400).json({ error: "All fields (name, code, pedName, pedPhone) are required" });
    }

    // Validate phone format
    const phoneRegex = /^\d{6,15}$/;
    if (!phoneRegex.test(String(pedPhone).trim())) {
      return res.status(400).json({ error: "PED phone must be numeric (6-15 digits)" });
    }

    // Check uniqueness for college name
    const existsName = await College.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existsName) {
      return res.status(400).json({ error: "College name already exists" });
    }
    
    // Check uniqueness for college code
    const existsCode = await College.findOne({ code: { $regex: `^${code}$`, $options: 'i' } });
    if (existsCode) {
      return res.status(400).json({ error: "College code already exists" });
    }

    // Create college document
    const college = await College.create({ 
      name: name.trim(), 
      code: code.trim().toUpperCase(), 
      pedName: pedName.trim(), 
      pedPhone: String(pedPhone).trim()
    });

    // Generate PED user
    const sanitizedName = sanitizeUsername(pedName);
    const pedUsername = await generateUniqueUsername(sanitizedName, User);
    
    // Hash default password (pedPhone)
    const hashedPassword = await bcrypt.hash(String(pedPhone).trim(), BCRYPT_SALT);
    
    // Create PED user with mustChangePassword=true
    try {
      await User.create({
        username: pedUsername,
        password: hashedPassword,
        role: "ped",
        mustChangePassword: true,
        collegeId: college._id
      });
    } catch (userErr) {
      // Rollback college if user creation fails
      await College.findByIdAndDelete(college._id);
      console.error('PED user creation failed:', userErr.message);
      return res.status(400).json({ 
        error: `Failed to create PED user: ${userErr.message}` 
      });
    }

    res.status(201).json({
      college,
      pedCredentials: {
        username: pedUsername,
        note: `Default password is the PED phone: ${pedPhone}. PED must change password on first login.`
      }
    });
  } catch (err) {
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    next(err);
  }
}

/**
 * UPDATE COLLEGE
 * PUT /api/colleges/:id
 * Updates college + updates PED user (username if pedName changed, password if pedPhone changed)
 * 
 * Request body: { name, code, pedName, pedPhone }
 * Response: { college, updatedFields: [...] }
 */
async function updateCollege(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, pedName, pedPhone } = req.body;
    
    // Validate required fields
    if (!name || !code || !pedName || !pedPhone) {
      return res.status(400).json({ error: "All fields (name, code, pedName, pedPhone) are required" });
    }

    // Validate phone format
    const phoneRegex = /^\d{6,15}$/;
    if (!phoneRegex.test(String(pedPhone).trim())) {
      return res.status(400).json({ error: "PED phone must be numeric (6-15 digits)" });
    }

    // Fetch college
    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ error: "College not found" });
    }

    // Check uniqueness for name (if changed)
    if (name.trim() !== college.name) {
      const exists = await College.findOne({ 
        name: { $regex: `^${name}$`, $options: 'i' },
        _id: { $ne: id }
      });
      if (exists) {
        return res.status(400).json({ error: "College name already in use" });
      }
    }

    // Check uniqueness for code (if changed)
    if (code.trim() !== college.code) {
      const exists = await College.findOne({ 
        code: { $regex: `^${code}$`, $options: 'i' },
        _id: { $ne: id }
      });
      if (exists) {
        return res.status(400).json({ error: "College code already in use" });
      }
    }

    // Update college
    college.name = name.trim();
    college.code = code.trim().toUpperCase();
    college.pedName = pedName.trim();
    college.pedPhone = String(pedPhone).trim();
    college.updatedAt = new Date();
    await college.save();

    // Update PED user
    const user = await User.findOne({ collegeId: college._id, role: "ped" });
    if (user) {
      const updatedFields = [];
      
      // Update username if pedName changed
      if (pedName.trim() !== college.pedName) {
        const newSanitizedName = sanitizeUsername(pedName);
        const newUsername = await generateUniqueUsername(newSanitizedName, User);
        user.username = newUsername;
        updatedFields.push('username');
      }
      
      // Reset password if pedPhone changed
      if (String(pedPhone).trim() !== college.pedPhone) {
        const hashedPassword = await bcrypt.hash(String(pedPhone).trim(), BCRYPT_SALT);
        user.password = hashedPassword;
        user.mustChangePassword = true;
        updatedFields.push('password');
      }
      
      user.updatedAt = new Date();
      await user.save();
    } else {
      // If user missing, create it
      const sanitizedName = sanitizeUsername(pedName);
      const pedUsername = await generateUniqueUsername(sanitizedName, User);
      const hashedPassword = await bcrypt.hash(String(pedPhone).trim(), BCRYPT_SALT);
      
      await User.create({
        username: pedUsername,
        password: hashedPassword,
        role: "ped",
        mustChangePassword: true,
        collegeId: college._id
      });
    }

    res.json({ college });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join('; ') });
    }
    next(err);
  }
}

/**
 * DELETE COLLEGE
 * DELETE /api/colleges/:id
 * Only allowed if college has no athletes or events
 * Also deletes associated PED user
 * 
 * Response: { ok: true }
 */
async function deleteCollege(req, res, next) {
  try {
    const { id } = req.params;

    // Find college
    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({ error: "College not found" });
    }

    // Check if college has athletes
    const athleteCount = await Athlete.countDocuments({ collegeId: id });
    if (athleteCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete — college has ${athleteCount} active athlete registration(s).` 
      });
    }

    // Check if college has events
    const eventCount = await Event.countDocuments({ collegeId: id });
    if (eventCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete — college has ${eventCount} active event(s).` 
      });
    }

    // Delete PED user
    await User.deleteOne({ collegeId: id, role: "ped" });

    // Delete college
    await College.findByIdAndDelete(id);

    res.json({ ok: true, message: "College and associated PED user deleted" });
  } catch (err) {
    next(err);
  }
}

export {
  listColleges,
  createCollege,
  updateCollege,
  deleteCollege,
};

