import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token and attach user to request
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Enforce college-based access for PED users
 * PED users can only access their own college's data
 * PED users are in READ-ONLY mode
 */
export const enforceCollegeAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // PED users must have collegeId in token
  if (req.user.role === 'ped' && !req.user.collegeId) {
    return res.status(403).json({ error: 'PED user must be assigned to a college' });
  }

  // PED users are READ-ONLY (no POST, PUT, DELETE)
  if (req.user.role === 'ped' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({ error: 'PED users have read-only access' });
  }

  // If request includes a collegeId parameter, verify PED can access it
  if (req.user.role === 'ped') {
    const requestedCollegeId = req.params.collegeId || req.body?.collegeId || req.query?.collegeId;
    
    if (requestedCollegeId && requestedCollegeId !== req.user.collegeId.toString()) {
      return res.status(403).json({ error: 'Access denied: You can only access your assigned college' });
    }
  }

  next();
};

/**
 * Require admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Require PED role
 */
export const requirePed = (req, res, next) => {
  if (!req.user || req.user.role !== 'ped') {
    return res.status(403).json({ error: 'PED access required' });
  }
  next();
};

export default {
  verifyToken,
  enforceCollegeAccess,
  requireAdmin,
  requirePed
};
