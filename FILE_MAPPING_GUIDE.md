# File Mapping Guide - BU-AMS System

## Overview of Related Files by Feature

---

## 1. 🔗 Athlete/Event Linking

### Backend Files:
- **`routes/athletes.js`** - API endpoints for athlete management
- **`routes/events.js`** - API endpoints for event management
- **`controllers/athleteController.js`** (if exists) - Athlete business logic
- **`models/Athlete.js`** - Athlete schema with college/event references
- **`models/Event.js`** - Event schema with athlete references
- **`seed_athletes.js`** - Script to seed athletes with college associations
- **`seed_events.js`** - Script to seed events

### Frontend Files:
- **`src/pages/AthleteRegistration.jsx`** - UI for registering athletes to events
- **`src/components/EventManagementNew.jsx`** - Event creation and athlete assignment
- **`src/pages/PEDPanel.jsx`** - PED panel for managing college athletes and events

---

## 2. 📅 Event Creation

### Backend Files:
- **`routes/events.js`** - POST/PUT endpoints for event creation/update
  - `POST /api/events` - Create new event
  - `PUT /api/events/:eventId` - Update event
  
- **`models/Event.js`** - Event schema defining event structure
  - Event name, category (Track, Relay, Jump, Throw, Combined)
  - Event code, category, gender
  - Athletes participation tracking

- **`seed_events.js`** - Preloaded event data script

### Frontend Files:
- **`src/components/EventManagementNew.jsx`** - Main event creation UI
- **`src/pages/AdminDashboard.jsx`** - Admin panel with event management
- **`src/pages/PEDPanel.jsx`** - PED can create/manage their college events

---

## 3. 🔐 PED Login

### Backend Files:
- **`routes/auth.js`** - Authentication endpoints
  - `POST /api/auth/ped-login` - PED login with username/password
  - `POST /api/auth/send-otp` - OTP generation
  - `POST /api/auth/verify-otp` - OTP verification
  - `POST /api/auth/change-password` - Password change

- **`models/User.js`** - User schema with roles (admin, ped, official)
  - username, password (bcrypt hashed)
  - role, mustChangePassword flag
  - collegeId reference

- **`controllers/collegeController.js`** - Auto-creates PED user when college is created
  - `createCollege()` - Creates college + auto-creates PED user with sanitized username

### Frontend Files:
- **`src/pages/PedLogin.jsx`** - PED login form
  - Username: sanitized PED name (e.g., harish_pm)
  - Password: PED phone number (default on first login)
  - Prompts for password change on first login

- **`src/pages/ChangePassword.jsx`** - Password change form
  - Current password verification
  - New password setup

---

## 4. 🏛️ Panel Creation

### Backend Files:
- **`routes/colleges.js`** - College endpoints
  - `POST /api/colleges` - Create college (creates college + PED user)
  - `GET /api/colleges` - List all colleges
  - `PUT /api/colleges/:id` - Update college
  - `DELETE /api/colleges/:id` - Delete college

- **`controllers/collegeController.js`** - College management
  - `createCollege()` - Creates college and auto-generates PED user
  - `listColleges()` - Returns all colleges
  - `updateCollege()` - Updates college details
  - `deleteCollege()` - Deletes college and associated PED user

- **`seed_test_colleges.js`** - Seeds test college data

### Frontend Files:
- **`src/pages/ManageColleges.jsx`** - Admin panel to create/manage colleges
  - Create new college
  - Edit college details
  - Delete college
  - Auto-generates PED user credentials

- **`src/pages/AdminDashboard.jsx`** - Main admin dashboard with college management

---

## 5. 🎯 Event Manager Integration

### Backend Files:
- **`routes/events.js`** - Event CRUD operations
  - `GET /api/events` - List events
  - `POST /api/events` - Create event
  - `GET /api/events/:eventId/athletes` - Get athletes for event
  - `PUT /api/events/:eventId/save-qualifiers` - Save qualifying athletes

- **`routes/results.js`** - Event results/scoring
  - `GET /api/results/:eventId` - Get event results
  - `PUT /api/results/:eventId/athlete/:athleteId` - Update athlete score

- **`models/Event.js`** - Event structure
- **`models/Result.js`** - Result/performance tracking

### Frontend Files:
- **`src/components/EventManagementNew.jsx`** - Core event manager
  - Create events
  - Assign athletes to events
  - Generate event sheets
  - Track event results

- **`src/components/Phase5FinalScoring.jsx`** - Scoring interface
  - Record performance times/distances
  - Rank athletes

- **`src/pages/AdminDashboard.jsx`** - Admin access to all events

- **`src/pages/PEDPanel.jsx`** - PED-specific event management
  - Create events for their college
  - Register athletes
  - View results

---

## File Structure Summary

```
MERN-AMS/
├── backend/
│   ├── controllers/
│   │   ├── collegeController.js        ← College + PED user creation
│   │   └── authController.js           ← Authentication
│   ├── routes/
│   │   ├── auth.js                     ← Login, OTP, password change
│   │   ├── colleges.js                 ← College CRUD
│   │   ├── athletes.js                 ← Athlete CRUD
│   │   ├── events.js                   ← Event CRUD & management
│   │   ├── results.js                  ← Results/scoring
│   │   └── teamScores.js               ← Team scoring
│   ├── models/
│   │   ├── User.js                     ← User/PED schema
│   │   ├── College.js                  ← College schema
│   │   ├── Athlete.js                  ← Athlete schema
│   │   ├── Event.js                    ← Event schema
│   │   └── Result.js                   ← Result schema
│   └── seed_*.js                       ← Data seeding scripts
│
├── frontend/
│   ├── src/pages/
│   │   ├── PedLogin.jsx                ← PED login form
│   │   ├── ChangePassword.jsx          ← Password change
│   │   ├── ManageColleges.jsx          ← College management
│   │   ├── PEDPanel.jsx                ← PED dashboard
│   │   └── AdminDashboard.jsx          ← Admin dashboard
│   └── src/components/
│       ├── EventManagementNew.jsx      ← Event creation & management
│       ├── Phase5FinalScoring.jsx      ← Scoring interface
│       ├── AthleteRegistration.jsx     ← Athlete registration
│       └── Footer.jsx                  ← Footer branding
```

---

## Key Integration Points

### College → PED User Creation
```
ManageColleges.jsx (Frontend)
    ↓
POST /api/colleges
    ↓
collegeController.createCollege()
    ↓
Creates: College + User (PED) with sanitized username & hashed password
```

### PED Login Flow
```
PedLogin.jsx (Frontend)
    ↓
POST /api/auth/ped-login
    ↓
auth.js route handler
    ↓
Verify username + bcrypt password
    ↓
Generate JWT token
    ↓
Return token + mustChangePassword flag
```

### Event Creation & Athlete Assignment
```
EventManagementNew.jsx (Frontend)
    ↓
POST /api/events + Athlete linking
    ↓
events.js routes
    ↓
Event created + Athletes assigned
```

---

## Running Seed Scripts

To populate test data:
```bash
cd MERN-AMS/backend

# Seed colleges
node seed_test_colleges.js

# Seed athletes
node seed_athletes.js

# Seed events
node seed_events.js
```

---

## API Endpoints Quick Reference

### Authentication
- `POST /api/auth/ped-login` - PED login
- `POST /api/auth/send-otp` - Send OTP for admin
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/change-password` - Change password

### Colleges
- `GET /api/colleges` - List all colleges
- `POST /api/colleges` - Create college (creates PED user)
- `PUT /api/colleges/:id` - Update college
- `DELETE /api/colleges/:id` - Delete college

### Athletes
- `GET /api/athletes` - List athletes
- `POST /api/athletes` - Register athlete
- `DELETE /api/athletes/:id` - Delete athlete

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:eventId/athletes` - Get event athletes
- `PUT /api/events/:eventId/save-qualifiers` - Save qualifiers

### Results
- `GET /api/results/:eventId` - Get results
- `PUT /api/results/:eventId/athlete/:athleteId` - Update score
