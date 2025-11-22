import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

const BCRYPT_SALT = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

/**
 * CHANGE PASSWORD
 * POST /api/auth/change-password
 * Allows users to change password. If mustChangePassword=true, currentPassword is optional.
 * Sets mustChangePassword=false on success.
 * 
 * Request body: { currentPassword, newPassword, confirmPassword }
 * Response: { ok: true, message: 'Password changed successfully' }
 */
async function changePassword(req, res, next) {
  try {
    // req.user should be set by auth middleware (JWT verification)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized — no user context' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation required' });
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Validate password strength (min 8 chars, optional: mix of chars/numbers)
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Prevent password reuse (optional but recommended)
    if (currentPassword && currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Fetch user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If not forced password change, verify current password
    if (!user.mustChangePassword && currentPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    } else if (!user.mustChangePassword && !currentPassword) {
      // Regular password change requires current password
      return res.status(400).json({ error: 'Current password required for regular password changes' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT);

    // Update user
    user.password = hashedPassword;
    user.mustChangePassword = false;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      ok: true,
      message: 'Password changed successfully. You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Change password error:', err);
    next(err);
  }
}

export { changePassword };
