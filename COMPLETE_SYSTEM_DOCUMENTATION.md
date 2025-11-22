# BU-AMS Complete System Documentation

## Project Overview
**Bangalore University Athletic Meet Management System** - A full-stack MERN application for managing athletic competitions, athlete registration, event creation, scoring, and team championships.

---

# PART 1: BACKEND SYSTEM

## Core Structure: `MERN-AMS/backend/`

### Server Configuration

#### **server.js** (Main Entry Point)
- **What:** Express server initialization and configuration
- **Why:** Central point that starts the entire backend application
- **Does:**
  - Initializes Express app with CORS, JSON parsing middleware
  - Connects to MongoDB (with fallback to in-memory storage)
  - Mounts all API routes (`/api/colleges`, `/api/athletes`, `/api/events`, `/api/auth`, `/api/results`, `/api/team-scores`)
  - Starts server on port 5002
  - Configures email (Gmail via Nodemailer for OTP)
  - Manages OTP storage and generation
  - Handles global error middleware
  - **Output:** Server runs at `http://localhost:5002`

#### **.env** (Environment Variables)
- **What:** Configuration file for sensitive data
- **Why:** Keeps secrets secure, allows different configs per environment
- **Contains:**
  - `MONGODB_URI` - Database connection string
  - `GMAIL_USER` / `GMAIL_PASSWORD` - Email credentials for OTP
  - `JWT_SECRET` - Secret key for token signing
  - `BCRYPT_SALT_ROUNDS` - Password hashing rounds
  - `PORT` - Server port (5002)

---

## Database Models: `backend/models/`

#### **User.js** (Authentication)
- **What:** User/Login schema
- **Why:** Manages all users (admin, PED, officials) with authentication
- **Fields:**
  - `username` (unique, lowercase) - Login identifier
  - `email` (sparse unique) - Contact/admin email
  - `password` (bcrypt hashed) - Secure password storage
  - `role` (enum: admin/ped/official) - User permission level
  - `mustChangePassword` (boolean) - Forces password change on first login
  - `collegeId` (reference) - Which college PED belongs to
- **Used By:** Auth routes, college creation, login system

#### **College.js** (Institution)
- **What:** College/Institution information
- **Why:** Groups athletes and events by college, manages PED assignments
- **Fields:**
  - `name` (unique) - College name
  - `code` (unique) - College identifier (e.g., COL001)
  - `pedName` - Physical Education Director name
  - `pedPhone` - PED contact number
  - `location` - College location
  - `contact` - Main contact number
- **Used By:** Athlete registration, event management, college management
- **Creates:** Auto-generates PED user when college is created

#### **Athlete.js** (Participant)
- **What:** Athlete/Student information
- **Why:** Tracks individuals participating in events
- **Fields:**
  - `firstName`, `lastName` - Athlete name
  - `gender` (Male/Female) - Gender for category separation
  - `college` (reference) - Which college they're from
  - `registrationNumber` - Student ID
  - `category` - Event category preference
  - `phone` - Contact number
  - `email` - Email address
- **Used By:** Event registration, athlete filtering, results tracking

#### **Event.js** (Competition)
- **What:** Athletic event definition
- **Why:** Defines what events are available (100m, relay, etc.)
- **Fields:**
  - `name` - Event name (100m, 4x400m Relay, etc.)
  - `code` - Event identifier
  - `category` (Track/Relay/Jump/Throw/Combined) - Event type
  - `gender` (Male/Female/Mixed) - Gender category
  - `round` - Heat/Round number
  - `athletes` (array) - Registered athletes
  - `results` (array) - Performance data
  - `createdAt`, `updatedAt` - Timestamps
- **Used By:** Event management, athlete assignment, results recording

#### **Result.js** (Performance Data)
- **What:** Individual athlete performance in an event
- **Why:** Records times, distances, placements
- **Fields:**
  - `eventId` (reference) - Which event
  - `athleteId` (reference) - Which athlete
  - `performance` - Time (seconds) or distance (meters)
  - `position` - Final placement
  - `status` (qualified/disqualified) - Result status
  - `timestamp` - When recorded
- **Used By:** Scoring system, results display, team scoring

---

## API Routes: `backend/routes/`

#### **auth.js** (Authentication Endpoints)
- **What:** Login and authentication routes
- **Why:** Secure user access to the system
- **Endpoints:**
  - `POST /api/auth/ped-login` - PED login with username/password
    - Input: `{username, password}`
    - Returns: JWT token, college info, mustChangePassword flag
  - `POST /api/auth/admin-login` - Admin login
    - Input: `{username, password}`
    - Returns: JWT token, role
  - `POST /api/auth/send-otp` - Generate OTP for email
    - Input: `{email}`
    - Sends: OTP to email (or logs in demo mode)
  - `POST /api/auth/verify-otp` - Verify OTP
    - Input: `{email, otp}`
    - Returns: Authentication token
  - `POST /api/auth/change-password` - Change password
    - Requires: Bearer token in header
    - Input: `{currentPassword, newPassword, confirmPassword}`
    - Does: Updates password, clears mustChangePassword flag
  - `GET /api/auth/verify` - Verify token validity
  - `POST /api/auth/create-test-ped` - Debug: Create test PED user

#### **colleges.js** (Institution Management)
- **What:** College CRUD operations
- **Why:** Manage colleges and auto-create PED users
- **Endpoints:**
  - `GET /api/colleges` - List all colleges
    - Returns: Array of all colleges
  - `POST /api/colleges` - Create college + PED user
    - Input: `{name, code, pedName, pedPhone}`
    - Auto-creates: User with sanitized username, bcrypt password (phone)
    - Returns: College + PED credentials
  - `PUT /api/colleges/:id` - Update college
    - Updates: College details + PED user if needed
  - `DELETE /api/colleges/:id` - Delete college
    - Checks: No athletes/events before deletion
    - Deletes: College + associated PED user

#### **athletes.js** (Athlete Management)
- **What:** Athlete registration and management
- **Why:** Register athletes to college and events
- **Endpoints:**
  - `GET /api/athletes` - List all athletes
  - `GET /api/athletes?college=COL001` - Filter by college
  - `POST /api/athletes` - Register athlete
    - Input: `{firstName, lastName, gender, college, registrationNumber, ...}`
    - Auto-adds: Timestamp
  - `DELETE /api/athletes/:id` - Remove athlete

#### **events.js** (Event Management)
- **What:** Event creation and athlete assignment
- **Why:** Define competitions and manage participation
- **Endpoints:**
  - `GET /api/events` - List all events
  - `POST /api/events` - Create event
    - Input: `{name, code, category, gender, athletes: [...]}`
    - Creates: Event with registered athletes
  - `GET /api/events/:eventId/athletes` - Get athletes in event
  - `PUT /api/events/:eventId` - Update event details
  - `PUT /api/events/:eventId/save-qualifiers` - Mark qualifiers
    - Input: Array of qualified athlete IDs
    - Updates: Athlete status to "qualified"
  - `GET /api/events/:id/generate-sheet` - Generate event sheet for printing

#### **results.js** (Scoring System)
- **What:** Record and manage performance results
- **Why:** Track athlete performances, calculate rankings
- **Endpoints:**
  - `GET /api/results/:eventId` - Get all results for event
  - `PUT /api/results/:eventId/athlete/:athleteId` - Record result
    - Input: `{performance, position, status}`
    - Updates: Result document with performance data
  - `PATCH /api/results/:eventId/athlete/:athleteId` - Partial update
  - `POST /api/results/calculate-team-scores` - Calculate team totals

#### **teamScores.js** (Championship Scoring)
- **What:** Team scoring and rankings
- **Why:** Calculate which college wins the championship
- **Endpoints:**
  - `GET /team-scores?category=Male|Female` - Get team standings
    - Returns: Points per college for category
  - `GET /team-scores/summary` - Get championship summary
    - Returns: Men/Women champions, final rankings
  - `POST /team-scores/recalculate/:category` - Recalculate one category
  - `POST /team-scores/recalculate-all` - Full recalculation
  - **Scoring Logic:**
    - 1st place: 10 points
    - 2nd place: 8 points
    - 3rd place: 6 points
    - 4th place: 4 points
    - 5th place: 2 points

---

## Database Middleware: `backend/middleware/`

#### **authMiddleware.js** (Protected Routes)
- **What:** JWT verification and access control
- **Why:** Protect endpoints from unauthorized access
- **Functions:**
  - `verifyToken()` - Checks Bearer token in header
    - Validates: JWT signature
    - Attaches: User data to request
  - `enforceCollegeAccess()` - PED access control
    - Allows: PED read-only access to their college only
    - Blocks: PED from modifying, accessing other colleges
  - `requireAdmin()` - Admin-only routes
  - `requirePed()` - PED-only routes

---

## Seeding Scripts: `backend/seed*.js`

#### **seed_athletes.js**
- **What:** Populates athlete database
- **Why:** Testing, demo data
- **Creates:** 215+ athletes across multiple colleges
- **Data:** Name, gender, registration number, college assignment
- **Run:** `node seed_athletes.js`

#### **seed_events.js**
- **What:** Creates athletic event definitions
- **Why:** Define available competitions
- **Creates:** 
  - Track events (100m, 400m, 1500m, etc.)
  - Field events (Long Jump, High Jump, etc.)
  - Relay events (4x100m, 4x400m, Mixed Relay)
  - Combined events (Decathlon, Heptathlon)
- **Run:** `node seed_events.js`

#### **seed_test_colleges.js**
- **What:** Creates test colleges
- **Why:** Populate college database for testing
- **Creates:** 30+ colleges with PED assignments
- **Run:** `node seed_test_colleges.js`

#### **seed_data.js**
- **What:** Master seed script
- **Why:** One-command data initialization
- **Runs:** All seed scripts in sequence
- **Run:** `node seed_data.js`

---

## Utilities: `backend/utils/`

#### **sanitizeUsername.js**
- **What:** Converts names to valid usernames
- **Why:** Create usernames from names (e.g., "Dr. Harish P M" → "harish_pm")
- **Process:**
  - Lowercase
  - Remove special characters
  - Replace spaces with underscores
  - Ensure uniqueness by appending numbers if needed

---

# PART 2: FRONTEND SYSTEM

## Core Structure: `MERN-AMS/frontend/`

### Entry Point: `src/index.jsx`
- **What:** React app bootstrap
- **Why:** Initialize React application
- **Does:**
  - Imports all main components
  - Wraps app with Router
  - Renders main App component
  - Mounts to `#root` DOM element
- **Components Imported:**
  - `App.jsx` - Main routing
  - `Footer.jsx` - Page footer
  - CSS styling

---

## Main Application: `src/pages/App.jsx`
- **What:** Main routing and layout
- **Why:** Manage page navigation and authentication state
- **Does:**
  - Manages authentication state
  - Routes between pages based on login status
  - Handles role-based access (admin/PED/official)
  - Provides layout wrapper with header/footer

---

## Authentication Pages: `src/pages/`

### **LoginPage.jsx** (Admin OTP Login)
- **What:** Email + OTP authentication for admins
- **Why:** Secure admin access without password
- **Flow:**
  1. Admin enters email (vscode956@gmail.com)
  2. System generates OTP
  3. OTP sent to email (or logged to console in demo)
  4. Admin enters OTP to verify
  5. Returns JWT token
- **API Calls:**
  - `POST /api/auth/send-otp`
  - `POST /api/auth/verify-otp`
- **State:** Email, OTP, loading, error
- **Backend URL:** `http://localhost:5002`

### **PedLogin.jsx** (PED Username/Password)
- **What:** Direct login for PED users
- **Why:** College admins need quick access
- **Login Credentials:**
  - Username: Sanitized PED name (e.g., harish_pm)
  - Password: PED phone number (default)
- **Flow:**
  1. PED enters username and password
  2. Backend validates credentials (bcrypt compare)
  3. Returns JWT token + mustChangePassword flag
  4. If mustChangePassword=true, prompts password change
- **API Call:** `POST /api/auth/ped-login`
- **State:** Username, password, error, loading
- **Tokens Stored:**
  - localStorage: token, role, username, collegeId

### **ChangePassword.jsx** (Password Change)
- **What:** Force/optional password change
- **Why:** Security compliance, first-login requirement
- **Triggers:**
  - First PED login (mustChangePassword=true)
  - Voluntary password change
- **Validation:**
  - Current password (if not first login)
  - New password match confirmation
  - Minimum 6 characters
- **API Call:** `POST /api/auth/change-password` (Bearer token required)
- **State:** Current/new password, loading, messages

---

## Admin Features: `src/pages/`

### **AdminDashboard.jsx** (Admin Control Center)
- **What:** Main admin interface
- **Why:** Central hub for all administrative functions
- **Sections:**
  - Dashboard overview
  - Manage Colleges
  - Athlete Registration
  - Event Management
  - Results & Scoring
  - Team Championship
- **Tabs/Components:**
  - `ManageColleges` - Create/edit/delete colleges
  - `AthleteRegistration` - Register athletes
  - `EventManagementNew` - Create and manage events
  - `Phase5FinalScoring` - Record results
  - `ChampionshipSummary` - View team scores
- **Access:** Requires admin JWT token
- **Backend URL:** `http://localhost:5002`

### **ManageColleges.jsx** (College CRUD)
- **What:** College creation and management interface
- **Why:** Onboard institutions and auto-create PED users
- **Features:**
  - **Create College:** Form to enter college details
    - College Name (required)
    - College Code (required, unique)
    - PED Name (required)
    - PED Phone (required, 6-15 digits)
  - **Auto-Generated:** PED user with:
    - Username: Sanitized from PED name
    - Password: PED phone number (hashed)
    - Role: "ped"
    - mustChangePassword: true
  - **Display Modal:** Shows credentials to admin
    - Instructions: Default password is phone, must change on first login
  - **Edit College:** Update any field
  - **Delete College:** Prevents deletion if college has athletes/events
  - **Search:** Filter by college name/code/PED name
- **API Calls:**
  - `GET /api/colleges` - Load all colleges
  - `POST /api/colleges` - Create new college
  - `PUT /api/colleges/:id` - Update college
  - `DELETE /api/colleges/:id` - Delete college
- **State:** colleges[], formData, loading, search, modal
- **Error Handling:** Response status checking, user notifications

---

## PED Features: `src/pages/`

### **PEDPanel.jsx** (PED Dashboard)
- **What:** College-specific management interface
- **Why:** Allow PED to manage their college's athletes and events
- **Features:**
  - View assigned college
  - Register athletes to college
  - Create events
  - View results
  - Download reports
- **Filtering:** Only shows their college's data
- **API Calls:**
  - `GET /api/athletes?college=COLLEGEID`
  - `POST /api/athletes` (for their college)
  - `GET /api/events`
  - `GET /api/results`
- **Access:** Requires PED JWT token with collegeId
- **Limitations:** Read-only for most views (no delete/admin functions)

---

## Athlete Management: `src/components/`

### **AthleteRegistration.jsx** (Athlete Registration Form)
- **What:** Bulk athlete registration interface
- **Why:** Quickly register multiple athletes to events
- **Features:**
  - **College Selection:** Dropdown of all colleges
  - **Gender Tabs:** Men/Women/Mixed events
  - **Event Table:** Shows all events for selected gender
  - **Athlete Registration:** Add rows for athlete → event → performance
  - **Bulk Operations:** Add/delete multiple at once
  - **Performance Tracking:** Record times/distances
- **Workflow:**
  1. Select college from dropdown
  2. Choose gender category (Men/Women)
  3. View available events
  4. Enter athlete details per event
  5. Record performance if event completed
  6. Save to database
- **API Calls:**
  - `GET /api/colleges` - Get college list
  - `GET /api/athletes` - Get athletes
  - `POST /api/athletes` - Create athlete
  - `GET /api/events` - Get events
- **Dynamic Fields:**
  - Event-specific performance fields (time for track, distance for field)
  - Auto-formatting of times (mm:ss.ms)
- **State:** selectedCollege, activeTab, athleteRows[], events[], colleges[]
- **Filtering Logic:**
  - Shows only events for selected gender
  - Shows only athletes from selected college
  - Athlete count tracking

---

## Event Management: `src/components/`

### **EventManagementNew.jsx** (Complete Event Manager)
- **What:** Advanced event creation, management, and sheet generation
- **Why:** Professional event coordination and documentation
- **Major Features:**

#### 1. **Event Creation**
   - Create new events with:
     - Event name (100m, 4x400m Relay, etc.)
     - Category (Track/Relay/Jump/Throw/Combined)
     - Gender (Male/Female/Mixed)
     - Round/Heat number
   - Athlete assignment per event
   - Event state management (draft/active/completed)

#### 2. **Heat/Round Management**
   - Organize athletes into heats
   - Track athletes per heat
   - Manage relay teams

#### 3. **Sheet Generation**
   - Generate printable event sheets
   - Include:
     - Event name, date, time
     - Athlete names, numbers, colleges
     - Performance recording areas
     - BU header/footer for branding
   - Export to PDF for printing
   - `GET /api/events/:id/generate-sheet`

#### 4. **Results Recording**
   - Real-time performance input
   - Auto-calculation of rankings
   - Qualifier identification (top 3/8 by performance)
   - Status tracking (qualified/disqualified)

#### 5. **UI States**
   - Event list view
   - Heat creation/editing
   - Performance entry
   - Sheet preview
   - Results summary

- **API Calls:**
  - `POST /api/events` - Create event
  - `GET /api/events` - List events
  - `GET /api/events/:eventId/athletes` - Get participants
  - `PUT /api/results/:eventId/athlete/:athleteId` - Record result
  - `PUT /api/events/:eventId/save-qualifiers` - Save top performers
  - `GET /api/events/:id/generate-sheet` - Get printable sheet

- **State:** appState (events, heats, results, athletes, printing)

- **Utilities Used:**
  - `timeFormatter.js` - Format and validate times
  - `BUHeaderFooter.js` - Generate header/footer for sheets

---

## Results & Scoring: `src/components/`

### **Phase5FinalScoring.jsx** (Scoring Interface)
- **What:** Enter and manage athletic results
- **Why:** Record performances and rank athletes
- **Features:**
  - View all events
  - Enter performance times/distances
  - Auto-rank athletes
  - Mark qualifiers
  - Adjust results if needed
  - Calculate points
- **API Calls:**
  - `GET /api/events` - Get events
  - `PUT /api/results/:eventId/athlete/:athleteId` - Save result
  - `GET /api/results/:eventId` - Load current results
- **Validation:**
  - Time format: mm:ss.ms
  - Distance: decimal meters
  - Position: rank order
- **State:** events[], results{}, loading, editing

### **ChampionshipSummary.jsx** (Team Scores)
- **What:** Display final championship standings
- **Why:** Show which college won
- **Features:**
  - Men's champion and points
  - Women's champion and points
  - Full ranking table
  - Points breakdown per event
  - Refresh/recalculate scores
- **Scoring System:**
  - 1st: 10 pts
  - 2nd: 8 pts
  - 3rd: 6 pts
  - 4th: 4 pts
  - 5th: 2 pts
- **API Calls:**
  - `GET /team-scores/summary` - Get championship data
  - `POST /team-scores/recalculate-all` - Recalculate scores
- **Display:** Table with college names and points
- **State:** summary, loading, error

### **TeamScoresPanel.jsx** (Team Scoring Details)
- **What:** Detailed team score breakdown
- **Why:** See per-college scoring details
- **Features:**
  - Filter by category (Male/Female)
  - Per-college point totals
  - Points per event
  - Historical trends
- **API Calls:**
  - `GET /team-scores?category=Male|Female`
  - `POST /team-scores/recalculate/:category`

---

## UI Components: `src/components/`

### **Header Components**
- **BUHeaderFooter.js** - Generate branded headers/footers for printouts
  - Bangalore University logo
  - Event details
  - Page numbers
  - Dates and times

### **Footer.jsx** (Page Footer)
- **What:** Application footer with branding
- **Current Content:**
  ```
  © simsdkc | Athletics Management System | 
  Delivering Reliable Digital Infrastructure
  ```
- **Styling:** Dark background, purple accents, responsive
- **Used:** Appears on every page

---

## Utilities: `src/utils/`

### **timeFormatter.js** (Time/Performance Handling)
- **What:** Format and validate athletic times
- **Why:** Consistent time representation across app
- **Functions:**
  - `formatTime(seconds)` - Convert seconds to mm:ss.ms
  - `parseTime(timeString)` - Parse mm:ss.ms to seconds
  - `isValidTime(timeString)` - Validate time format
  - `sortByTime(athletes)` - Sort by time (ascending, fastest first)
  - `sortByDistance(athletes)` - Sort by distance (descending, best first)
  - `isTrackEvent(eventCategory)` - Determine if time-based or distance-based
- **Example:**
  - Input: 95.34 seconds → Output: "01:35.34"
  - Input: "01:35.34" → Output: 95.34 seconds

### **sanitizeUsername.js** (Username Generation)
- **What:** Convert full names to valid usernames
- **Why:** Auto-create PED usernames from names
- **Examples:**
  - "Dr. Harish P M" → "harish_pm"
  - "Suresh Reddy M S" → "suresh_reddy_m_s"
- **Process:**
  - Lowercase all
  - Remove special characters
  - Replace spaces with underscores
  - Ensure unique (append numbers if needed)

---

## Configuration Files

### **package.json** (Frontend)
- **What:** Node dependencies and scripts
- **Scripts:**
  - `npm run dev` - Start development server (port 3000)
  - `npm run build` - Build for production
  - `npm test` - Run tests
- **Dependencies:**
  - `react` - UI framework
  - `react-dom` - React rendering
  - `axios` - HTTP client (alternative to fetch)
  - `tailwindcss` - CSS framework
  - `ajv` - JSON validation

### **.env** (Frontend)
- **What:** Environment configuration
- **Variables:**
  - `REACT_APP_API_URL=http://localhost:5002` - Backend URL
  - `SKIP_PREFLIGHT_CHECK=true` - Skip CORS pre-flight check

### **.gitignore**
- **What:** Files to exclude from git
- **Excludes:**
  - `node_modules/` - Dependencies
  - `.env` - Sensitive data
  - `*.log` - Log files
  - `build/`, `dist/` - Build artifacts
  - `.vscode/`, `.idea/` - IDE files

---

# PART 3: HOW EVERYTHING WORKS TOGETHER

## User Journey: New PED Registration

1. **Admin creates college** → `ManageColleges.jsx`
2. **College form submitted** → `POST /api/colleges`
3. **Backend creates:**
   - College document
   - User document (PED) with:
     - Username: Sanitized from PED name
     - Password: Hashed phone number
     - Role: "ped"
4. **Admin sees modal** with PED credentials
5. **PED logs in** → `PedLogin.jsx`
6. **Backend validates** → `POST /api/auth/ped-login`
7. **PED forced to change password** → `ChangePassword.jsx`
8. **PED accesses dashboard** → `PEDPanel.jsx`

## User Journey: Event Registration

1. **PED or Admin** → `AthleteRegistration.jsx`
2. **Select college** → Dropdown from `GET /api/colleges`
3. **Choose gender** → Display relevant events
4. **Enter athlete details** → `POST /api/athletes`
5. **Assign to events** → Event links created
6. **Record performance** → Times/distances stored
7. **Results calculated** → Automatic ranking

## User Journey: Event Management

1. **Admin/PED** → `EventManagementNew.jsx`
2. **Create event** → `POST /api/events`
3. **Assign athletes** → Link athletes to event
4. **Organize heats** → Group athletes
5. **Generate sheet** → `GET /api/events/:id/generate-sheet`
6. **Print and conduct** → Physical meet
7. **Enter results** → `Phase5FinalScoring.jsx`
8. **Record performances** → `PUT /api/results/:eventId/athlete/:athleteId`
9. **View championship** → `ChampionshipSummary.jsx`
10. **Team scores calculated** → Points assigned per college

## Data Flow Architecture

```
Frontend (React)
    ↓ (HTTP Requests)
    ↓
Express Server (5002)
    ↓ (Routes Handler)
    ↓
Controllers (Business Logic)
    ↓
Models (Schema Validation)
    ↓
MongoDB (Data Storage)
    ↑ (Queries)
    ↑
Express Response
    ↑ (JSON)
    ↑
Frontend (Display)
```

## Authentication Flow

```
PED Login Form
    ↓ {username, password}
POST /api/auth/ped-login
    ↓
Verify username exists (User.findOne)
    ↓
Compare password (bcrypt.compare)
    ↓
Generate JWT token
    ↓
Return token + college info
    ↓
Store in localStorage
    ↓
Send Bearer token with future requests
    ↓
Middleware validates token
    ↓
Access granted to protected routes
```

## Error Handling

- **Frontend:** Try-catch blocks, user notifications, console logging
- **Backend:** Express error middleware, HTTP status codes, JSON error messages
- **Database:** Mongoose validation, unique index constraints
- **API Validation:** Input sanitization, bcrypt, JWT verification

---

# PART 4: KEY FEATURES & CAPABILITIES

## ✅ Complete Features

1. **User Authentication**
   - Admin: OTP via email
   - PED: Username/password
   - Token-based (JWT) with expiry
   - Forced password change on first login
   - Role-based access control

2. **College Management**
   - Create/edit/delete colleges
   - Auto-generate PED user on creation
   - Prevent deletion if has athletes/events
   - Search and filter

3. **Athlete Registration**
   - Bulk athlete entry
   - College assignment
   - Event-specific registration
   - Gender categorization
   - Duplicate prevention

4. **Event Management**
   - Create events with categories (Track/Relay/Jump/Throw/Combined)
   - Organize into heats/rounds
   - Assign athletes
   - Generate printable sheets
   - PDF export with branding

5. **Results & Scoring**
   - Record performance times/distances
   - Auto-ranking by performance
   - Qualifier identification
   - Disqualification tracking

6. **Team Championship**
   - Automatic team score calculation
   - Points per college per event
   - Men's/Women's/Mixed categories
   - Championship rankings
   - Score recalculation

7. **Reporting**
   - Event sheets (printable)
   - Results summary
   - Team standings
   - Performance analytics

## 🔒 Security Features

- **Password Security:** bcrypt hashing (10 rounds)
- **Authentication:** JWT tokens with 24-hour expiry
- **Access Control:** Role-based middleware (admin/ped/official)
- **Data Validation:** Input sanitization, schema validation
- **Email Security:** OAuth2 Gmail for OTP
- **CORS:** Protected cross-origin requests

## 📊 Database Structure

- **User:** 1 admin, many PEDs (1 per college), officials
- **College:** 30+ institutions
- **Athlete:** 200+ students across colleges
- **Event:** 40+ events across categories
- **Result:** 1 per athlete-event combination

---

# PART 5: DEPLOYMENT & RUNNING

## Starting the Application

### Backend
```bash
cd MERN-AMS/backend
npm install
node server.js
# Runs on http://localhost:5002
```

### Frontend
```bash
cd MERN-AMS/frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Seeding Test Data
```bash
cd MERN-AMS/backend
npm install

# Individual seeds
node seed_athletes.js
node seed_events.js
node seed_test_colleges.js

# Or combined
node seed_data.js
```

## Test Credentials

- **Test PED User:**
  - Username: `test_ped`
  - Password: `9876543210`
  - College: Unassigned (created manually)

- **Admin OTP:**
  - Email: `vscode956@gmail.com`
  - OTP: Check console/email output

## Environment Setup

1. **Create `.env` in backend:**
   ```
   MONGODB_URI=mongodb://localhost:27017/bu-ams
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASSWORD=your-app-password
   JWT_SECRET=your-secret-key
   BCRYPT_SALT_ROUNDS=10
   PORT=5002
   ```

2. **Create `.env` in frontend:**
   ```
   REACT_APP_API_URL=http://localhost:5002
   SKIP_PREFLIGHT_CHECK=true
   ```

---

This comprehensive documentation covers the entire BU-AMS system architecture, providing complete understanding of what each component does and why it exists!
