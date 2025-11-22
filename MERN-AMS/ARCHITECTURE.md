# Architecture & Component Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                             │
├─────────────────────────────────────────────────────────────┤
│  Port 3000: http://localhost:3000                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           React Frontend Application                 │  │
│  │                                                      │  │
│  │  ┌────────────────┬────────────────────────────┐    │  │
│  │  │  Landing Page  │  Admin Dashboard           │    │  │
│  │  │  (Home - 1st)  │  (Protected Routes)        │    │  │
│  │  │                │                            │    │  │
│  │  │  • Hero        │  • Sidebar Menu            │    │  │
│  │  │  • Events      │  • Overview                │    │  │
│  │  │  • MERN Info   │  • Colleges                │    │  │
│  │  │  • Login Btn   │  • Athlete Registration ⭐ │    │  │
│  │  │                │  • Events                  │    │  │
│  │  │                │  • Results                 │    │  │
│  │  └────────────────┴────────────────────────────┘    │  │
│  │                                                      │  │
│  │  ⭐ Athlete Registration Component:                  │  │
│  │    (Nested inside Admin Dashboard)                  │  │
│  │    - College Selector                              │  │
│  │    - Gender Tabs (Men/Women)                        │  │
│  │    - Athlete Add Form                              │  │
│  │    - Athletes Table (CRUD)                         │  │
│  │    - Event Assignment (Track, Jump, Throw, Relay) │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓ HTTP/CORS ↓                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS API SERVER                       │
├─────────────────────────────────────────────────────────────┤
│  Port 5000: http://localhost:5000                          │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Express.js Routes                         │  │
│  │                                                      │  │
│  │  ┌──────────────┬──────────────┬───────────────┐   │  │
│  │  │  Colleges    │  Athletes    │  Events       │   │  │
│  │  │              │              │               │   │  │
│  │  │ POST /api/   │ POST /api/   │ POST /api/    │   │  │
│  │  │ colleges     │ athletes     │ events        │   │  │
│  │  │              │              │               │   │  │
│  │  │ GET /api/    │ GET /api/    │ GET /api/     │   │  │
│  │  │ colleges/:id │ athletes/... │ events/:id    │   │  │
│  │  │              │              │               │   │  │
│  │  │ PATCH/DELETE │ PATCH/DELETE │ PATCH/DELETE  │   │  │
│  │  └──────────────┴──────────────┴───────────────┘   │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓ Mongoose ↓                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  MONGODB DATABASE                          │
├─────────────────────────────────────────────────────────────┤
│  Database: bu-ams                                           │
│                                                             │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐ │
│  │  colleges    │  athletes    │  events      │  users   │ │
│  │              │              │              │          │ │
│  │ _id: ObjectId│ _id: ObjectId│ _id: ObjectId│ _id: OID │ │
│  │ code: String │ name: String │ name: String │ role: St │ │
│  │ name: String │ gender: Enum │ gender: Enum │ email: S │ │
│  │ pedName: Str │ chestNo: Str │ category: En │ password │ │
│  │ phone: String│ collegeId: ⛓ │ date: Date   │ collegId │ │
│  │              │ event1: Str  │ venue: String│          │ │
│  │              │ event2: Str  │              │          │ │
│  │              │ relay1: Str  │              │          │ │
│  │              │ relay2: Str  │              │          │ │
│  │              │ mixedRelay:  │              │          │ │
│  └──────────────┴──────────────┴──────────────┴──────────┘ │
│                                                             │
│  ⛓ = Foreign Key Reference to colleges collection        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
├── LandingPage (Route: /)
│   ├── Navigation Header
│   ├── Hero Section
│   ├── Event Categories
│   ├── MERN Stack Features
│   └── Footer
│
└── AdminDashboard (Route: /admin)
    ├── Header (Navigation)
    ├── Sidebar Menu
    │   ├── Dashboard Overview
    │   ├── Manage Colleges
    │   ├── Athlete Registration ⭐
    │   ├── Event Management
    │   └── Results & Scoring
    │
    └── Main Content Area
        └── AthleteRegistration Component ⭐
            ├── College Selector
            ├── Gender Tabs
            ├── Add Athlete Form
            │   ├── Name Input
            │   ├── UUCMS Input
            │   ├── Event 1 Select
            │   ├── Event 2 Select
            │   ├── Relay 1 Select
            │   ├── Relay 2 Select
            │   └── Submit Button
            └── Athletes Table
                ├── Chest No
                ├── Name
                ├── Events
                └── Actions (Edit/Delete)
```

## Data Flow Diagram

```
User Interface (React)
        ↓
    Form Input
        ↓
   State Update
        ↓
   Validation
        ↓
   HTTP Request (Axios)
        ↓
   Express Route Handler
        ↓
   Mongoose Model Operation
        ↓
   MongoDB Query
        ↓
   Data Retrieved/Updated
        ↓
   Response to Frontend
        ↓
   Update Component State
        ↓
   Re-render UI
        ↓
   Display to User
```

## File Dependencies

```
frontend/
├── public/index.html
│   └── loads React & Tailwind
│
└── src/
    ├── index.jsx
    │   └── mounts App component
    │
    ├── pages/
    │   ├── LandingPage.jsx
    │   │   └── imports: CSS, React hooks
    │   │
    │   └── AdminDashboard.jsx
    │       ├── imports: AthleteRegistration
    │       ├── imports: useState hook
    │       └── manages admin state
    │
    └── components/
        └── AthleteRegistration.jsx
            ├── imports: useState hook
            ├── local state management
            ├── form handling
            └── data display

backend/
├── server.js
│   ├── imports: express, mongoose, cors
│   ├── imports: route handlers
│   └── connects to MongoDB
│
├── models/index.js
│   └── defines schemas
│
└── routes/
    ├── colleges.js
    │   ├── GET /api/colleges
    │   ├── POST /api/colleges
    │   ├── PATCH /api/colleges/:id
    │   └── DELETE /api/colleges/:id
    │
    ├── athletes.js
    │   ├── GET /api/athletes
    │   ├── GET /api/athletes/college/:collegeId
    │   ├── POST /api/athletes
    │   ├── PATCH /api/athletes/:id
    │   └── DELETE /api/athletes/:id
    │
    └── events.js
        ├── GET /api/events
        ├── POST /api/events
        ├── PATCH /api/events/:id
        └── DELETE /api/events/:id
```

## Technology Stack Mapping

```
┌─────────────────────────────────────────────┐
│          Frontend Rendering                 │
├─────────────────────────────────────────────┤
│  React.js (UI Library)                      │
│  └─ JSX (Component Syntax)                  │
│     └─ Hooks (useState, useEffect)          │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│          Styling & Layout                   │
├─────────────────────────────────────────────┤
│  Tailwind CSS (Utility-first CSS)           │
│  └─ Responsive Grid & Flexbox              │
│     └─ Custom Components                    │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│          HTTP Communication                 │
├─────────────────────────────────────────────┤
│  Axios (HTTP Client)                        │
│  └─ JSON Serialization                      │
│     └─ CORS Headers                         │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│          Backend Server                     │
├─────────────────────────────────────────────┤
│  Express.js (Web Framework)                 │
│  └─ Routing (RESTful APIs)                  │
│     └─ Middleware (CORS, JSON Parse)        │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│          Data Modeling & Validation         │
├─────────────────────────────────────────────┤
│  Mongoose (ODM for MongoDB)                 │
│  └─ Schema Definition                       │
│     └─ Model Methods                        │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│          Database Storage                   │
├─────────────────────────────────────────────┤
│  MongoDB (NoSQL Database)                   │
│  └─ Collections (colleges, athletes, etc)   │
│     └─ Documents (JSON-like records)        │
└─────────────────────────────────────────────┘
```

---

**This architecture ensures:**
- ✅ Separation of concerns
- ✅ Scalability
- ✅ Maintainability
- ✅ Easy testing
- ✅ Production readiness
