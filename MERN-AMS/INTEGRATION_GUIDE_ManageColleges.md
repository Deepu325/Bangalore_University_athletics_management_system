# ManageColleges Integration Guide

## Quick Start

### Step 1: Verify Files Are in Place

Frontend:
```
✓ frontend/src/pages/admin/ManageColleges.js
✓ frontend/src/pages/admin/ManageColleges.css
✓ frontend/src/pages/AdminDashboard.jsx (updated with import)
```

Backend:
```
✓ backend/controllers/collegeController.js
✓ backend/routes/colleges.js (updated with controller)
✓ backend/server.js (updated with route mount)
✓ backend/models/index.js (updated with CommonJS export)
```

### Step 2: Install Dependencies (if needed)

**Backend Dependencies:**
```bash
cd backend
npm install bcryptjs  # For password hashing
```

The following should already be installed:
- express
- mongoose
- cors
- dotenv

**Frontend Dependencies:**
```bash
cd frontend
# No new dependencies needed - uses native fetch API
```

### Step 3: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Or: node server.js
# Expected output: ✓ BU-AMS Backend Server running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Or: npm start
# Expected output: Application accessible at http://localhost:3000
```

### Step 4: Access ManageColleges

1. Open http://localhost:3000
2. Login with admin credentials
3. Click "🏛️ Manage Colleges" in sidebar
4. ManageColleges page should load with form and table

## Configuration

### API URL
If backend is on different port/host, update in ManageColleges.js:

```javascript
// Line 13 in ManageColleges.js
const API_URL = "http://localhost:5000/api"; // ← Change if needed
```

### Bcrypt Salt Rounds
To adjust password hashing strength:

```javascript
// In backend/.env
BCRYPT_SALT_ROUNDS=10  # Default: 10 (1-12 recommended)
```

Higher = more secure but slower. Keep at 10 for production.

### Phone Validation Rules
Currently accepts 6-15 digit phone numbers. To change:

```javascript
// In frontend/src/pages/admin/ManageColleges.js, line 64
if (!/^\d{6,15}$/.test(form.pedPhone.trim())) 
   return "PED Phone must be numeric (6–15 digits)";
   // ↑ Adjust regex as needed
```

## Troubleshooting

### Issue: "Cannot GET /api/colleges"

**Solution:** Make sure college routes are mounted in server.js
```javascript
// In backend/server.js, around line 60
const collegeRoutes = require('./routes/colleges');
app.use('/api/colleges', collegeRoutes);
```

### Issue: "TypeError: College.find is not a function"

**Solution:** College model not properly exported
```javascript
// In backend/models/index.js, ensure:
module.exports = {
  College: mongoose.model('College', collegeSchema),
  // ... other models
};
```

### Issue: Form submission fails silently

**Solution:** Check browser console for errors
1. Open DevTools (F12)
2. Check Console tab
3. Check Network tab for API response
4. Verify backend is running

### Issue: "bcryptjs is not defined"

**Solution:** Install bcryptjs package
```bash
cd backend
npm install bcryptjs
```

### Issue: Colleges not persisting

**Solution:** Verify MongoDB connection
```bash
# Check MongoDB is running
mongod --version  # Should show version if installed

# Or check server logs for:
# ✓ MongoDB connected successfully
```

### Issue: CORS errors

**Solution:** Frontend trying to call backend on wrong URL
```javascript
// Verify in ManageColleges.js:
const API_URL = "http://localhost:5000/api";

// And backend has CORS enabled (should be in server.js):
app.use(cors());
```

## API Response Examples

### Success Response (Create)
```json
{
  "college": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "SIMS",
    "code": "SIMS01",
    "pedName": "Dr. Kumar",
    "pedPhone": "9876543210",
    "createdAt": "2025-11-19T10:30:00.000Z"
  }
}
```

### Error Response
```json
{
  "error": "College name already exists"
}
```

## Database Schema

### College Collection
```javascript
{
  name: String,           // Required, Unique
  code: String,           // Required, Unique
  pedName: String,        // PED display name
  pedPhone: String,       // Used as default password
  createdAt: Date,        // Auto-set
  updatedAt: Date         // Auto-set
}
```

### User Collection (PED Account)
```javascript
{
  username: String,       // College name (required, unique)
  password: String,       // Hashed pedPhone (bcrypt)
  role: String,          // "ped" (required)
  collegeId: ObjectId,   // Reference to college
  createdAt: Date,       // Auto-set
  updatedAt: Date        // Auto-set
}
```

## Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| Create College | ✅ | Auto-creates PED user |
| Read Colleges | ✅ | Sorted by name |
| Update College | ✅ | Updates PED user too |
| Delete College | ✅ | Protected if athletes exist |
| Validation | ✅ | Frontend + Backend |
| Error Handling | ✅ | Toast notifications |
| Responsive | ✅ | Mobile-friendly |
| Security | ✅ | Bcrypt hashing |

## Next Steps

1. ✅ Verify all files are in place
2. ✅ Start backend and frontend
3. ✅ Test basic CRUD operations
4. ✅ Check database for data persistence
5. ✅ Run through testing checklist
6. ✅ Address any issues
7. ✅ Deploy to production

## Support

For issues or questions:
- 📧 Email: deepukc2526@gmail.com
- 👤 Developer: Deepu K C
- 👨‍🏫 Guided By: Dr. Harish P M, HOD - PED, SIMS

---

**Version:** 1.0
**Date:** November 19, 2025
**Status:** ✅ Ready for Testing
