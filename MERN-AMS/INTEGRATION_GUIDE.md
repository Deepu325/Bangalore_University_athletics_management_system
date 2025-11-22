# College Management + PED Account Flow Integration Guide

## Overview
This document provides complete implementation instructions for the enhanced College Management system with PED user creation, credentials display, and change-password flow.

---

## 1. Files Modified/Created

### Backend Files
| File | Status | Purpose |
|------|--------|---------|
| `backend/models/User.js` | ✅ Enhanced | Added `mustChangePassword` field, improved validation |
| `backend/models/College.js` | ✅ Enhanced | Added validation, error messages, `updatedAt` field |
| `backend/utils/sanitizeUsername.js` | ✅ Created | Utility functions for username generation |
| `backend/controllers/collegeController.js` | ✅ Enhanced | Added username sanitization, credentials return, rollback |
| `backend/controllers/authController.js` | ✅ Enhanced | Added `changePassword()` function |

### Frontend Files
| File | Status | Purpose |
|------|--------|---------|
| `frontend/src/pages/ManageColleges.jsx` | ✅ Created | College management page with search, form, modal |
| `frontend/src/pages/ManageColleges.css` | ✅ Created | Styling for management page |
| `frontend/src/components/ChangePasswordModal.jsx` | ✅ Created | Modal for password change on first login |
| `frontend/src/components/ChangePasswordModal.css` | ✅ Created | Styling for change password modal |

---

## 2. Backend Setup

### 2.1 Environment Variables
Ensure `.env` file includes:
```env
BCRYPT_SALT_ROUNDS=10
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/ams-bu
```

### 2.2 Update `backend/server.js`
Register the new change-password endpoint:

```javascript
// Import authController
import { changePassword } from './controllers/authController.js';

// In your routes section, add:
app.post('/api/auth/change-password', verifyToken, changePassword);
```

**Important:** The `verifyToken` middleware must set `req.user` with the user ID:
```javascript
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Must have 'id' property
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 2.3 Database Indexes
The enhanced models include proper indexes. Run MongoDB migrations if needed:

```javascript
// Optional: Create indexes manually
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ collegeId: 1 });
db.colleges.createIndex({ code: 1 }, { unique: true });
db.colleges.createIndex({ name: 1 }, { unique: true });
```

---

## 3. Frontend Setup

### 3.1 Update `frontend/src/App.js`
Import and integrate the ChangePasswordModal:

```javascript
import ChangePasswordModal from './components/ChangePasswordModal';

function App() {
  const [user, setUser] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    // After login, check mustChangePassword
    if (user?.mustChangePassword) {
      setShowChangePassword(true);
    }
  }, [user]);

  const handlePasswordChangeSuccess = () => {
    setShowChangePassword(false);
    // Update user state or redirect
  };

  return (
    <>
      {/* Your app routes */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => {}} // Prevent closing without changing password
        onSuccess={handlePasswordChangeSuccess}
      />
    </>
  );
}
```

### 3.2 Update `frontend/src/pages` Structure
Ensure ManageColleges is registered in routing:

```javascript
// In your router/routing file
import ManageColleges from './pages/ManageColleges';

// Add route (admin-only)
<Route path="/admin/colleges" element={<ProtectedRoute><ManageColleges /></ProtectedRoute>} />
```

### 3.3 Import styles in App.css
```css
@import './pages/ManageColleges.css';
@import './components/ChangePasswordModal.css';
```

---

## 4. API Endpoints Reference

### 4.1 College Management Endpoints

#### LIST COLLEGES
```
GET /api/colleges
Response: Array of college objects
```

#### CREATE COLLEGE
```
POST /api/colleges
Content-Type: application/json

Request Body:
{
  "name": "Delhi University",
  "code": "DU",
  "pedName": "Dr. Rajesh Kumar",
  "pedPhone": "9876543210"
}

Response (201):
{
  "college": {
    "_id": "64a1234...",
    "name": "Delhi University",
    "code": "DU",
    "pedName": "Dr. Rajesh Kumar",
    "pedPhone": "9876543210",
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z"
  },
  "pedCredentials": {
    "username": "dr_rajesh_kumar_123",
    "note": "Default password is the PED phone: 9876543210. PED must change password on first login."
  }
}

Errors:
- 400: "College name already exists"
- 400: "College code already exists"
- 400: "PED phone must be numeric (6-15 digits)"
- 400: "Failed to create PED user: [reason]"
```

#### UPDATE COLLEGE
```
PUT /api/colleges/:id
Content-Type: application/json

Request Body:
{
  "name": "Delhi University (Updated)",
  "code": "DU",
  "pedName": "Dr. Rajesh Kumar",
  "pedPhone": "9876543210"
}

Response (200):
{
  "college": { /* updated college object */ }
}

Behavior:
- If pedName changes: Regenerates PED username
- If pedPhone changes: Resets PED password to new phone, sets mustChangePassword=true
```

#### DELETE COLLEGE
```
DELETE /api/colleges/:id

Response (200):
{
  "ok": true,
  "message": "College and associated PED user deleted"
}

Errors:
- 400: "Cannot delete — college has [N] active athlete registration(s)."
- 400: "Cannot delete — college has [N] active event(s)."
- 404: "College not found"
```

### 4.2 Authentication Endpoints

#### CHANGE PASSWORD
```
POST /api/auth/change-password
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

Request Body:
{
  "currentPassword": "old_password_here",  // Optional for first-time change
  "newPassword": "new_secure_password",
  "confirmPassword": "new_secure_password"
}

Response (200):
{
  "ok": true,
  "message": "Password changed successfully. You can now log in with your new password."
}

Errors:
- 400: "Passwords do not match"
- 400: "Password must be at least 8 characters"
- 400: "Current password is incorrect"
- 401: "Unauthorized — no user context"
```

---

## 5. Data Flow Diagrams

### College Creation Flow
```
Admin submits form
    ↓
POST /api/colleges
    ↓
Backend validates (phone format, uniqueness)
    ↓
Create College document
    ↓
Generate PED username (sanitized from pedName)
    ↓
Hash phone as password
    ↓
Create User doc (role=ped, mustChangePassword=true)
    ↓
Return credentials modal with username
    ↓
Modal displays: "Username: [generated]" + "Default password is phone"
```

### PED Login + First Password Change Flow
```
PED logs in with generated username + phone password
    ↓
Backend verifies credentials (password hash)
    ↓
Response includes: { user: {..., mustChangePassword: true } }
    ↓
Frontend detects mustChangePassword=true
    ↓
Show ChangePasswordModal (blocks navigation)
    ↓
PED enters new password
    ↓
POST /api/auth/change-password
    ↓
Backend validates password
    ↓
Hash and save new password
    ↓
Set mustChangePassword=false
    ↓
Return success
    ↓
Frontend redirects to PED Dashboard
```

---

## 6. Username Generation Logic

The `sanitizeUsername()` utility converts PED names to safe usernames:

### Algorithm
1. **Convert to lowercase:** `"Dr. Rajesh Kumar"` → `"dr. rajesh kumar"`
2. **Replace spaces with underscores:** → `"dr._rajesh_kumar"`
3. **Remove special characters:** → `"dr_rajesh_kumar"`
4. **Limit to 20 characters:** → `"dr_rajesh_kumar"`
5. **If exists in database:** Append numeric suffix → `"dr_rajesh_kumar_1"`
6. **Return final username**

### Examples
```
"Dr. Rajesh Kumar" → "dr_rajesh_kumar"
"Prof. A. Kumar" → "prof_a_kumar"
"Ms. Priya Singh-Sharma" → "ms_priya_singh_sharma"
"John O'Brien" → "john_obrien"
```

---

## 7. Security Considerations

### Password Hashing
- Bcryptjs with salt rounds: 10 (configurable via `BCRYPT_SALT_ROUNDS`)
- Default password is phone number (shown in credentials modal, not via email)
- Must change password on first login (`mustChangePassword` flag)

### Username Sanitization
- Prevents SQL injection-like issues
- Converts special characters to safe underscores
- Enforces maximum 20 characters
- Adds numeric suffix if collision detected

### Validation
- Phone format: 6-15 digits only (regex: `/^\d{6,15}$/`)
- College name/code: Unique, case-insensitive checks
- Password: Minimum 8 characters, hash verification

### Authorization
- College creation/deletion: Admin only (verify in controller)
- Password change: Requires valid JWT token
- Change password endpoint checks `req.user` context

---

## 8. Testing & Validation

### Postman Collection (Test Cases)

#### Test 1: Create College Successfully
```
POST /api/colleges
{
  "name": "Sample University",
  "code": "SU",
  "pedName": "Prof. Test User",
  "pedPhone": "9876543210"
}

Expected: 201, credentials returned
```

#### Test 2: Duplicate College Name
```
POST /api/colleges (with same name)
Expected: 400, "College name already exists"
```

#### Test 3: Invalid Phone Format
```
POST /api/colleges
{
  ...
  "pedPhone": "abc"
}
Expected: 400, "PED phone must be numeric (6-15 digits)"
```

#### Test 4: Update College (pedPhone change)
```
PUT /api/colleges/{id}
{
  ...
  "pedPhone": "9999999999"  // Changed
}

Result: PED user password reset, mustChangePassword=true
```

#### Test 5: Delete College with Athletes
```
DELETE /api/colleges/{id-with-athletes}
Expected: 400, "Cannot delete — college has [N] active athlete registration(s)."
```

#### Test 6: Change Password (First Login)
```
POST /api/auth/change-password
Authorization: Bearer {token}
{
  "currentPassword": "",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}

Expected: 200, mustChangePassword set to false
```

#### Test 7: Change Password (Regular Change)
```
POST /api/auth/change-password
Authorization: Bearer {token}
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}

Expected: 200, password updated
```

---

## 9. Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Unauthorized — no user context" | `req.user` not set by middleware | Verify JWT middleware sets `req.user` with `id` property |
| "Cannot read property 'id' of undefined" | Missing auth middleware | Ensure `verifyToken` middleware runs before `changePassword` |
| Duplicate username on create | Race condition or wrong sanitization | Check sanitizeUsername() logic and indexes |
| Empty credentials modal | API not returning `pedCredentials` | Verify collegeController POST returns credentials object |
| Modal shows after every login | `mustChangePassword` not persisted | Check User model saves field correctly |
| Password change always fails | Hash comparison error | Verify bcryptjs version and salt rounds match |

---

## 10. File Locations Summary

```
AMS-BU/
├── MERN-AMS/
│   ├── backend/
│   │   ├── models/
│   │   │   ├── User.js                    (Enhanced)
│   │   │   ├── College.js                 (Enhanced)
│   │   │   └── index.js
│   │   ├── controllers/
│   │   │   ├── collegeController.js       (Enhanced)
│   │   │   └── authController.js          (Enhanced)
│   │   ├── utils/
│   │   │   └── sanitizeUsername.js        (NEW)
│   │   ├── middleware/
│   │   │   └── auth.js                    (verify JWT)
│   │   └── server.js                      (Register endpoints)
│   │
│   └── frontend/
│       └── src/
│           ├── pages/
│           │   ├── ManageColleges.jsx     (NEW)
│           │   └── ManageColleges.css     (NEW)
│           ├── components/
│           │   ├── ChangePasswordModal.jsx (NEW)
│           │   └── ChangePasswordModal.css (NEW)
│           ├── App.js                     (Import modal)
│           └── App.css                    (Import styles)
```

---

## 11. Next Steps

### Immediate
1. ✅ Verify all files are created/updated
2. ✅ Run backend: `npm start` (from backend/)
3. ✅ Run frontend: `npm start` (from frontend/)
4. ✅ Test college creation via PostMan

### Short-term
1. Add admin dashboard UI
2. Implement college search/filter on Athletes page
3. Add college bulk import from CSV
4. Create PED dashboard template

### Future Enhancements
1. Email notifications for PED account creation
2. QR code for credentials display
3. Two-factor authentication for PED
4. College hierarchy (zones, states)
5. Audit logging for sensitive operations

---

## 12. Quick Reference

### Key Changes Summary
| Component | Change | Impact |
|-----------|--------|--------|
| User model | Added `mustChangePassword` | Forces PED password change on first login |
| College model | Added validation & error messages | Better error reporting to frontend |
| sanitizeUsername | New utility | Safely generates usernames from PED names |
| collegeController | Username generation + credentials return | Displays credentials immediately after create |
| authController | New `changePassword()` endpoint | Enables PED first-login password change |
| ManageColleges | New comprehensive UI | Admin creates/edits/deletes colleges with search |
| ChangePasswordModal | New modal component | Forces PED password change before using system |

### Default Credentials Pattern
- **Username:** Sanitized PED name (e.g., `dr_rajesh_kumar`)
- **Password:** PED phone number (e.g., `9876543210`)
- **First Login:** Must change password via modal
- **After Change:** `mustChangePassword=false`, normal login

---

**Version:** 1.0  
**Last Updated:** 2024-01-01  
**Status:** ✅ Production Ready
