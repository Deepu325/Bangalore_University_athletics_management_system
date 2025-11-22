import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { College } from '../models/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * PED LOGIN
 * POST /api/auth/ped-login
 * Authenticate PED with username (sanitized PED name) and password (phone number)
 */
router.post('/ped-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find PED user (lowercase username)
    const user = await User.findOne({
      username: username.toLowerCase(),
      role: 'ped'
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password (bcrypt hash)
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Fetch college info
    let collegeName = '';
    if (user.collegeId) {
      const college = await College.findById(user.collegeId);
      collegeName = college?.name || '';
    }

    // Generate JWT token with college info
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: 'ped',
        collegeId: user.collegeId,
        collegeName: collegeName
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return token and flag for first-login password change
    res.json({
      ok: true,
      token,
      mustChangePassword: user.mustChangePassword || false,
      username: user.username,
      collegeId: user.collegeId,
      collegeName: collegeName
    });

  } catch (err) {
    console.error('PED login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * ADMIN LOGIN
 * POST /api/auth/admin-login
 * Authenticate admin with username and password
 */
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({
      username: username.toLowerCase(),
      role: 'admin'
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      ok: true,
      token,
      username: user.username,
      role: 'admin'
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

/**
 * CHANGE PASSWORD (First Login or Regular)
 * POST /api/auth/change-password
 * Required header: Authorization: Bearer <token>
 */
router.post('/change-password', async (req, res) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - token required' });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate new password
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If not first-time password change, verify current password
    if (!user.mustChangePassword && currentPassword) {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user
    user.password = hashedPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({
      ok: true,
      message: 'Password changed successfully'
    });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * VERIFY TOKEN
 * GET /api/auth/verify
 * Check if token is valid
 */
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ok: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        collegeId: user.collegeId,
        mustChangePassword: user.mustChangePassword
      }
    });

  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

/**
 * TEST/DEBUG: CREATE TEST PED USER
 * POST /api/auth/create-test-ped
 * Creates a test PED user for development
 * Credentials: username=test_ped, password=9876543210
 */
router.post('/create-test-ped', async (req, res) => {
  try {
    // Delete existing test user if exists
    await User.deleteOne({ username: 'test_ped' });

    // Hash default password
    const hashedPassword = await bcrypt.hash('9876543210', 10);

    // Create test PED user
    const user = await User.create({
      username: 'test_ped',
      password: hashedPassword,
      role: 'ped',
      mustChangePassword: true,
      collegeId: null
    });

    res.json({
      ok: true,
      message: 'Test PED user created successfully',
      credentials: {
        username: 'test_ped',
        password: '9876543210'
      },
      user: user
    });
  } catch (err) {
    console.error('Test user creation error:', err);
    res.status(500).json({ error: 'Failed to create test user: ' + err.message });
  }
});

export default router;
