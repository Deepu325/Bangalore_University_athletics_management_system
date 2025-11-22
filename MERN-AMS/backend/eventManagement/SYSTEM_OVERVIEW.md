/**
 * SYSTEM ARCHITECTURE OVERVIEW
 * Athletics Meet Event Management Module
 */

/**
 * DIRECTORY STRUCTURE
 * ===================
 */

const STRUCTURE = `
eventManagement/
│
├── 📄 Core Files
│   ├── index.js                    ← Start here for imports
│   ├── AthleticsMeetEventManager.js ← Main orchestrator
│   ├── config.js                    ← System configuration
│   ├── validation.js                ← Data validation rules
│   ├── eventSchema.js               ← Database schema
│   └── eventRoutes.js               ← Express.js routes
│
├── 📂 eventCategories/            ← 5 Event Managers
│   ├── Track/
│   │   └── TrackEventManager.js
│   ├── Relay/
│   │   └── RelayEventManager.js
│   ├── Jump/
│   │   └── JumpEventManager.js
│   ├── Throw/
│   │   └── ThrowEventManager.js
│   └── Combined/
│       └── CombinedEventManager.js
│
├── 📂 stages/                     ← Workflow Management
│   ├── StageController.js         ← 13-stage progression
│   └── PDFFormatter.js            ← PDF generation
│
├── 📂 shared/                     ← Shared Utilities
│   ├── constants.js               ← Global constants
│   └── utils.js                   ← Helper functions
│
└── 📚 Documentation
    ├── README.md                   ← Full documentation
    ├── QUICK_START.js              ← Usage examples
    ├── INTEGRATION_GUIDE.js        ← Backend integration
    ├── BUILD_COMPLETE.md           ← Build summary
    ├── DEPLOYMENT_CHECKLIST.js     ← Deployment guide
    └── IMPLEMENTATION_COMPLETE.md  ← Final summary
`;

/**
 * EVENT CATEGORIES MAP
 * ====================
 */

const EVENT_CATEGORIES = `
┌─────────────────────────────────────────────────────────────────────────┐
│                      EVENT MANAGEMENT SYSTEM                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐
│   TRACK     │  │    RELAY     │  │   JUMP   │  │   THROW    │  │COMBINED  │
├─────────────┤  ├──────────────┤  ├──────────┤  ├────────────┤  ├──────────┤
│ 100m        │  │ 4×100m       │  │ Long J   │  │ Shot Put   │  │Decathlon │
│ 200m        │  │ 4×400m       │  │ Triple J │  │ Discus     │  │Heptathlon│
│ 400m        │  │ Mixed 4×100m │  │ High J   │  │ Javelin    │  │          │
│ 800m        │  │ Mixed 4×400m │  │ Pole V   │  │ Hammer     │  │ 10 events│
│ 1500m       │  │              │  │          │  │            │  │ or 7     │
│ 5000m       │  │ Heats: 8pts/h│  │Attempts: │  │ Attempts:  │  │          │
│ 10000m      │  │ Lane→Team    │  │   6      │  │  3+3 best 8│  │Manual pts│
│ 100mH       │  │ Time: once   │  │ Distance │  │ Distance   │  │ only     │
│ 110mH       │  │              │  │ in meters│  │ in meters  │  │          │
│ 400mH       │  │              │  │          │  │            │  │          │
│ 3000m SC    │  │              │  │          │  │            │  │          │
│ 20km Walk   │  │              │  │          │  │            │  │          │
│             │  │              │  │          │  │            │  │          │
│ Time: HH:MM │  │ Time: HH:MM  │  │ Best     │  │ Best       │  │ Highest  │
│ :SS:ML      │  │ :SS:ML       │  │ distance │  │ distance   │  │ points   │
│             │  │ (once/team)  │  │ = rank   │  │ = rank     │  │ = rank   │
│             │  │              │  │          │  │            │  │          │
│ Score:      │  │ Score:       │  │ Score:   │  │ Score:     │  │ Score:   │
│ Time ↓      │  │ Time ↓       │  │ Dist ↑   │  │ Dist ↑     │  │Points ↑  │
└─────────────┘  └──────────────┘  └──────────┘  └────────────┘  └──────────┘
`;

/**
 * 13-STAGE WORKFLOW
 * =================
 */

const STAGE_WORKFLOW = `
STAGE PROGRESSION (Sequential)
═══════════════════════════════════════════════════════════════════════════

1️⃣  EVENT CREATION → Create event, set details
                  ↓
2️⃣  CALL ROOM     → Generate athlete sheets
                  ↓
3️⃣  ATTENDANCE    → Mark P/A/DIS status
                  ↓
4️⃣  EVENT SHEETS  → Prepare official forms
                  ↓
5️⃣  ROUND 1       → Enter performances, rank
                  ↓
6️⃣  TOP SELECT    → Choose top 8 or 16
                  ↓
7️⃣  HEATS GEN     → Create heats with lanes
                  ↓
8️⃣  HEATS SCORE   → Enter heat performances
                  ↓
9️⃣  PRE-FINAL     → Finalists sheet prep
                  ↓
🔟 FINAL SCORE   → Final performances + awards
                  ↓
1️⃣1️⃣ ANNOUNCE    → Display results
                  ↓
1️⃣2️⃣ CORRECT     → Fix athlete details
                  ↓
1️⃣3️⃣ VERIFY&LOCK → Sign off & publish
`;

/**
 * DATA FLOW DIAGRAM
 * =================
 */

const DATA_FLOW = `
┌────────────────┐
│  ENTRY SYSTEM  │ ← Athletes, colleges from master database
└────────┬───────┘
         │
         ↓
┌────────────────────────────────────────────────┐
│    ATHLETICS MEET EVENT MANAGER                │
│  (AthleticsMeetEventManager.js)                │
└────────┬───────────────────────────────────────┘
         │
    ┌────┴─────────────────────────┬──────────────┬─────────────┐
    │                               │              │             │
    ↓                               ↓              ↓             ↓
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  TRACK  │  │ RELAY    │  │  JUMP    │  │ THROW    │  │COMBINED  │
│Manager  │  │Manager   │  │ Manager  │  │ Manager  │  │ Manager  │
└────┬────┘  └─────┬────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │             │
     └─────────────┴─────────────┴─────────────┴─────────────┘
                        │
                        ↓
          ┌─────────────────────────────┐
          │  STAGE CONTROLLER           │
          │  (13-stage workflow)        │
          └──────────┬──────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ↓                     ↓
    ┌──────────────┐    ┌──────────────┐
    │ PDF Formatter│    │ Validation   │
    │  (PDFs)      │    │  (Rules)     │
    └──────────────┘    └──────────────┘
          │                     │
          └──────────┬──────────┘
                     ↓
          ┌────────────────────┐
          │  API ENDPOINTS     │
          │  (eventRoutes.js)  │
          └─────────┬──────────┘
                    │
          ┌─────────┴────────────┐
          │                      │
          ↓                      ↓
    ┌───────────┐         ┌──────────┐
    │  MongoDB  │         │ Frontend │
    │ Database  │         │   UI     │
    └───────────┘         └──────────┘
          │
          ↓
    ┌──────────────────┐
    │ Championship     │
    │ Standings        │
    └──────────────────┘
`;

/**
 * API ENDPOINT MAP
 * ================
 */

const API_MAP = `
┌─────────────────────────────────────────────────────────────┐
│            API ENDPOINTS (25+)                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ EVENT MANAGEMENT                                            │
│ ├─ POST   /api/events/create                               │
│ ├─ GET    /api/events                                      │
│ ├─ GET    /api/events/:eventId                             │
│ └─ GET    /api/events/:eventId/summary                     │
│                                                              │
│ STAGE PROCESSING                                            │
│ ├─ POST   /api/events/:eventId/stage/:stageNumber          │
│ ├─ POST   /api/events/:eventId/callroom                    │
│ ├─ POST   /api/events/:eventId/attendance                  │
│ ├─ GET    /api/events/:eventId/eventsheet                  │
│ ├─ POST   /api/events/:eventId/score-round1                │
│ ├─ POST   /api/events/:eventId/select-top                  │
│ ├─ GET    /api/events/:eventId/heats                       │
│ ├─ POST   /api/events/:eventId/score-heats                 │
│ ├─ GET    /api/events/:eventId/prefinal-sheet              │
│ ├─ POST   /api/events/:eventId/score-final                 │
│ ├─ GET    /api/events/:eventId/announce                    │
│ ├─ POST   /api/events/:eventId/correct                     │
│ └─ POST   /api/events/:eventId/verify-publish              │
│                                                              │
│ RESULTS & STANDINGS                                         │
│ ├─ GET    /api/championship/standings                      │
│ ├─ GET    /api/events/:eventId/export                      │
│ └─ POST   /api/events/:eventId/lock                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
`;

/**
 * SCORING SYSTEM
 * ==============
 */

const SCORING = `
CHAMPIONSHIP POINTS
═══════════════════════════════════════════════════════════════

1st Place:  🥇 5 points
2nd Place:  🥈 3 points
3rd Place:  🥉 1 point

APPLIED TO: Every event in every category

CALCULATED: After every event final
DISPLAYED:  Championship standings by college
`;

/**
 * FORMAT SPECIFICATIONS
 * =====================
 */

const FORMATS = `
TIME FORMAT (Track & Relay)
═══════════════════════════
Format:    HH:MM:SS:ML
Example:   00:10:45:32
Precision: Milliseconds
Where:
  HH = Hours (00-23)
  MM = Minutes (00-59)
  SS = Seconds (00-59)
  ML = Milliseconds (00-99)

DISTANCE FORMAT (Jump & Throw)
══════════════════════════════
Format:    X.XX (decimal)
Example:   6.45
Unit:      Meters
Precision: 2 decimal places

POINTS FORMAT (Combined Events)
════════════════════════════════
Format:    Integer
Example:   2850
Manual:    Entry only (no AFI table)

ATTEMPT TRACKING (Field Events)
════════════════════════════════
Jumps:     6 attempts (A1-A6)
Throws:    3 preliminary + 3 final
Format:    Distance or foul marker (F)
Best:      Highest valid attempt
`;

/**
 * HEAT GENERATION LOGIC
 * =====================
 */

const HEAT_LOGIC = `
HEAT GENERATION RULES
═════════════════════════════════════════════════════════════

1. GROUP SIZE
   Standard: 8 athletes per heat
   If odd:   Last heat(s) in 7,7 format
   
2. LANE ASSIGNMENT (IAAF)
   Rank 1 → Lane 3
   Rank 2 → Lane 4
   Rank 3 → Lane 2
   Rank 4 → Lane 5
   Rank 5 → Lane 6
   Rank 6 → Lane 1
   Rank 7 → Lane 7
   Rank 8 → Lane 8

3. COLLEGE AVOIDANCE
   Avoid: Same college in same heat
   Method: Randomized shuffling
   
4. FOR RELAY
   Teams: 8 athletes = 2 teams per heat
   Lane: Assigned to entire team
   Baton: Passed between 4 athletes
`;

/**
 * VALIDATION HIERARCHY
 * ====================
 */

const VALIDATION = `
INPUT VALIDATION LAYERS
═══════════════════════════════════════════════════════════

LAYER 1: Data Type Validation
├─ String fields
├─ Number fields
├─ Date fields
└─ Enum fields

LAYER 2: Format Validation
├─ Time: HH:MM:SS:ML
├─ Distance: X.XX meters
├─ Points: Integer
└─ Chest No: 1-10 alphanumeric

LAYER 3: Business Rules
├─ Athlete present for event
├─ Performance within reasonable range
├─ Rank consistency
├─ Championship points accuracy
└─ Event stage progression

LAYER 4: Data Integrity
├─ No duplicates
├─ Referential integrity
├─ Data persistence
└─ Audit trail
`;

/**
 * MODULE DEPENDENCIES
 * ===================
 */

const DEPENDENCIES = `
DEPENDENCY GRAPH
═════════════════════════════════════════════════════════════

EventManagers
  ├─ TrackEventManager
  ├─ RelayEventManager
  ├─ JumpEventManager
  ├─ ThrowEventManager
  └─ CombinedEventManager
        │
        └─→ shared/utils.js
             ├─ rankByTime()
             ├─ rankByDistance()
             ├─ rankByPoints()
             ├─ assignIAAFLanes()
             ├─ generateHeats()
             ├─ calculateChampionshipPoints()
             └─ format/parse functions

        └─→ shared/constants.js
             ├─ STAGES
             ├─ CATEGORIES
             ├─ EVENT_LISTS
             ├─ IAAF_LANES
             ├─ SCORING rules
             └─ Format specs

AthleticsMeetEventManager
  ├─ All EventManagers
  ├─ StageController
  ├─ PDFFormatter
  └─ validation.js

eventRoutes
  └─ AthleticsMeetEventManager

Frontend
  └─ eventRoutes (API calls)
`;

/**
 * PDF GENERATION FLOW
 * ===================
 */

const PDF_FLOW = `
PDF GENERATION PIPELINE
═════════════════════════════════════════════════════════════

Input Data
    ↓
PDFFormatter.generateXXXPDF()
    ├─ generateHeader()
    │  ├─ BU Logo
    │  ├─ University Name
    │  ├─ Event Details
    │  └─ Championship Info
    │
    ├─ formatTable()
    │  ├─ Format headers
    │  ├─ Format rows
    │  └─ Align columns
    │
    └─ generateFooter()
       ├─ Copyright
       ├─ Developer name
       ├─ Institution
       ├─ Guided by
       └─ Committee

Output: PDF-ready text format
    ↓
Express Response
    ↓
Frontend Download/Display
`;

/**
 * CHAMPIONSHIP CALCULATION
 * =========================
 */

const CHAMPIONSHIP = `
CHAMPIONSHIP STANDINGS CALCULATION
═══════════════════════════════════════════════════════════════

Per Event:
  1st Place → 5 points to college
  2nd Place → 3 points to college
  3rd Place → 1 point to college

Cumulative:
  Points += event points for each event
  Ranking = Sort by total points DESC

Example:
  Event 1: Christ (5), St. Josephs (3), RV (1)
  Event 2: Christ (3), RV (5), St. Josephs (1)
  
  Standings:
    1. Christ:      5+3 = 8 points
    2. RV:          1+5 = 6 points
    3. St. Josephs: 3+1 = 4 points

Final: College with highest total points wins!
`;

module.exports = {
  STRUCTURE,
  EVENT_CATEGORIES,
  STAGE_WORKFLOW,
  DATA_FLOW,
  API_MAP,
  SCORING,
  FORMATS,
  HEAT_LOGIC,
  VALIDATION,
  DEPENDENCIES,
  PDF_FLOW,
  CHAMPIONSHIP
};
