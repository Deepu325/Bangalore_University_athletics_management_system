# Athletics Meet Event Management Module
## 61st Inter-Collegiate Athletic Championship 2025–26

### Overview

A comprehensive, category-based event management system for athletics championships supporting all event types through a standardized 13-stage workflow. Developed by SIMS for Bangalore University.

---

## System Architecture

### Global Components

#### Header (All PDFs & Website)
```
BU Logo (top left)
BANGALORE UNIVERSITY
Directorate of Physical Education & Sports
UCPE Stadium, Jnanabharathi Campus, Bengaluru – 560056
61st Inter-Collegiate Athletic Championship 2025–26
(Developed by SIMS)
```

#### Footer (All Sheets)
```
© 2025 Bangalore University | Athletic Meet Management System
Developed by: Deepu K C | Soundarya Institute of Management and Science (SIMS)
Guided By: Dr. Harish P M & Lt. Suresh Reddy M S, PED, SIMS
Dr. Venkata Chalapathi | Mr. Chidananda | Dr. Manjanna B P
```

---

## 13-Stage Event Workflow

| Stage | Name | Description |
|-------|------|-------------|
| 1 | Event Creation | Initialize event with details |
| 2 | Call Room Generation | Create call room sheets |
| 3 | Call Room Completion | Mark P/A/DIS status |
| 4 | Generate Event Sheets | Prepare official entry forms |
| 5 | Round 1 Scoring | Enter performances, rank |
| 6 | Top Selection | Select Top 8 or Top 16 |
| 7 | Heats Generation | Create heats with lane assignments |
| 8 | Heats Scoring | Enter heat performances |
| 9 | Pre-Final Sheet | Finalists sheet prep |
| 10 | Final Scoring | Final performances, awards |
| 11 | Final Announcement | Display winners |
| 12 | Name Correction | Edit athlete details |
| 13 | Verification & Lock | Sign off & publish |

---

## Event Categories

### 🟧 1. TRACK EVENTS

**Events:** 100m, 200m, 400m, 800m, 1500m, 5000m, 10000m, 100mH/110mH, 400mH, 3000m Steeplechase, 20km Walk

**Call Room Format:**
```
SL NO | CHEST NO | NAME | COLLEGE | REMARKS
```

**Officials Sheet:**
```
SL NO | CHEST NO | NAME | COLLEGE | LANE | PERFORMANCE | REMARKS
Time: HH:MM:SS:ML (e.g., 00:10:45:32)
```

**Scoring Rule:** Lower time = better rank

**Heats Generation:**
- Groups of 8 athletes (or 7,7 if odd)
- IAAF Lane Assignment:
  - Rank 1 → Lane 3
  - Rank 2 → Lane 4
  - Rank 3 → Lane 2
  - Rank 4 → Lane 5
  - Rank 5 → Lane 6
  - Rank 6 → Lane 1
  - Rank 7 → Lane 7
  - Rank 8 → Lane 8
- Avoid same college in same heat

**Awards:** 1st: 5 pts, 2nd: 3 pts, 3rd: 1 pt

---

### 🟩 2. RELAY EVENTS

**Events:** 4×100m, 4×400m, Mixed 4×100m, Mixed 4×400m

**Team Size:** 4 athletes per team

**Call Room Format (Team-Based):**
```
SL NO | CHEST NO | NAME | COLLEGE | REMARKS
(4 rows per team)
```

**Officials Sheet:**
```
SL NO | CHEST NO | NAME | COLLEGE | LANE | TIME
(4 rows per team, LANE only in row 1)
```

**Rules:**
- Lane assigned to TEAM, not individuals
- Time recorded once per team
- Same heats logic as Track (8 teams per heat = 2 lanes per heat theoretically)

**Scoring Rule:** Lower time = better rank

---

### 🟦 3. JUMP EVENTS

**Events:** Long Jump, Triple Jump, High Jump, Pole Vault

**Format:**
```
SL NO | CHEST NO | NAME | COLLEGE | A1 | A2 | A3 | A4 | A5 | A6 | BEST | REMARKS

For High Jump/Pole Vault:
SL NO | CHEST NO | NAME | COLLEGE | 1st | 2nd | 3rd | 4th | ... | BEST
(O = Clearance, X = Fail, – = Pass)
```

**Rules:**
- 6 attempts
- Best attempt decides ranking
- Higher distance = better rank

**Scoring Rule:** Higher distance = better rank

---

### 🟫 4. THROW EVENTS

**Events:** Javelin, Shot Put, Discus, Hammer

**Format:**
```
SL NO | CHEST NO | NAME | COLLEGE | A1 | A2 | A3 | A4 | A5 | A6 | BEST | REMARKS
```

**Rules:**
- 3 attempts (preliminary)
- Top 8 advance → 3 more attempts (final)
- Mark fouls as "F"
- Distance in meters
- Total of 6 attempts tracked (3+3)

**Scoring Rule:** Higher distance = better rank

---

### 🟪 5. COMBINED EVENTS

**Decathlon (Men):**
- Day 1: 100m, LJ, SP, HJ, 400m (5 events)
- Day 2: 110mH, DT, PV, JT, 1500m (5 events)

**Heptathlon (Women):**
- Day 1: 100mH, HJ, SP, 200m (4 events)
- Day 2: LJ, JT, 800m (3 events)

**Format - Day 1:**
```
SL | CHEST | NAME | COLLEGE | EVENT1 | EVENT2 | EVENT3 | EVENT4 | EVENT5 | DAY-1 POINTS
```

**Rules:**
- **Manual point entry only** (no AFI scoring table)
- TOTAL POINTS entered for each day
- Highest total wins

**Scoring Rule:** Higher total points = better rank

---

## Stage-by-Stage Details

### Stage 2: Call Room Generation (Universal)

**Format:**
```
SL NO | CHEST NO | NAME | COLLEGE | REMARKS
```

**Remarks Options:** P (Present), A (Absent), DIS (Disqualified)

**Output:** PDF ready for printing

---

### Stage 4: Generate Event Sheets

Each category generates its specific format with empty PERFORMANCE columns for officials to fill.

**Track:** Lanes pre-assigned, performance empty
**Field:** Attempt columns empty
**Relay:** Lane and time empty
**Combined:** Points empty

---

### Stage 5: Round 1 Scoring

**Input Formats:**
- **Track:** Time (HH:MM:SS:ML)
- **Field:** Distance (decimal meters, e.g., 6.45)
- **Relay:** Team time (HH:MM:SS:ML)
- **Combined:** Total points for the day

**Processing:**
- Automatic ranking
- Calculate best distances
- Handle fouls/invalid attempts

---

### Stage 6: Top Selection

**Options:**
- Top 8
- Top 16

**Sorting:**
- Track/Relay → by time (ascending)
- Field → by distance (descending)
- Combined → by points (descending)

---

### Stage 7: Heats Generation

**Rules:**
- Groups of 8
- If odd athletes, last heats in 7,7 format
- For Track/Relay: Apply IAAF lane rules
- Try to avoid same college in same heat

**Output:** Heat assignments with lanes

---

### Stage 9: Pre-Final Sheet

**Track Format:**
```
LANE | CHEST NO | NAME | COLLEGE | HEATS TIME | FINAL PERFORMANCE (empty)
```

**Field Format:**
```
POSITION | CHEST NO | NAME | COLLEGE | HEATS BEST | FINAL ATTEMPT SLOTS
```

**Combined Format:**
```
POSITION | CHEST NO | NAME | COLLEGE | DAY-1 PTS | DAY-2 PTS | TOTAL
```

---

### Stage 10: Final Scoring

**Processing:**
1. Collect final performances
2. Rank athletes
3. Award points (5-3-1)
4. Calculate championship points
5. Generate results PDF

**Awards:**
- 1st Place: 5 championship points
- 2nd Place: 3 championship points
- 3rd Place: 1 championship point

---

### Stage 11: Final Announcement

**Output:**
- Gold medalist
- Silver medalist
- Bronze medalist
- Complete results

---

### Stage 12: Name Correction

**Editable Fields:**
- Name
- Chest number
- College

**Note:** Must be corrected before final publish

---

### Stage 13: Verification & Lock

**Requirements:**
- Committee verification
- Authorized signatures
- Results locked (cannot edit)
- Event published
- Championship points added to standings

---

## File Structure

```
eventManagement/
│
├── AthleticsMeetEventManager.js
│   └── Main orchestrator for all operations
│
├── eventRoutes.js
│   └── Express.js API endpoints
│
├── eventSchema.js
│   └── MongoDB database schema
│
├── QUICK_START.js
│   └── Usage examples
│
├── README.md
│   └── This file
│
├── eventCategories/
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
├── stages/
│   ├── StageController.js
│   │   └── Stage progression & history
│   └── PDFFormatter.js
│   └── PDF generation with header/footer
│
└── shared/
    ├── constants.js
    │   └── Global constants & configurations
    └── utils.js
        └── Helper functions (ranking, lane assignment, etc.)
```

---

## API Endpoints

### Event Management

```
POST /api/events/create
  Create new event
  Body: { name, distance, date, venue }

GET /api/events
  List all events

GET /api/events/:eventId
  Get event details

GET /api/events/:eventId/summary
  Get detailed event summary
```

### Stage Processing

```
POST /api/events/:eventId/stage/:stageNumber
  Process any stage
  Body: stage-specific data

POST /api/events/:eventId/callroom
  Stage 2: Generate call room

POST /api/events/:eventId/attendance
  Stage 3: Mark attendance

GET /api/events/:eventId/eventsheet
  Stage 4: Get event sheet template

POST /api/events/:eventId/score-round1
  Stage 5: Score round 1

POST /api/events/:eventId/select-top
  Stage 6: Select top athletes

GET /api/events/:eventId/heats
  Stage 7: Generate heats

POST /api/events/:eventId/score-heats
  Stage 8: Score heats

GET /api/events/:eventId/prefinal-sheet
  Stage 9: Pre-final sheet

POST /api/events/:eventId/score-final
  Stage 10: Final scoring

GET /api/events/:eventId/announce
  Stage 11: Announce results

POST /api/events/:eventId/correct
  Stage 12: Correct athlete data

POST /api/events/:eventId/verify-publish
  Stage 13: Verify & publish
```

### Championship Management

```
GET /api/championship/standings
  Get championship standings by college

GET /api/events/:eventId/export
  Export event results as JSON

POST /api/events/:eventId/lock
  Lock event after verification
```

---

## Usage Example

### Track Event (100m)

```javascript
const manager = new AthleticsMeetEventManager();

// Create event
const event = manager.createEvent({
  name: '100m',
  distance: '100',
  date: '2025-11-25',
  venue: 'UCPE Stadium'
});

// Stage 2: Call Room
manager.processStage(event.eventId, 2, {
  athletes: [
    { chestNo: '001', name: 'Runner A', college: 'Christ' },
    { chestNo: '002', name: 'Runner B', college: 'St. Josephs' }
  ]
});

// Stage 3: Mark Attendance
manager.processStage(event.eventId, 3, {
  attendanceData: [
    { chestNo: '001', status: 'P' },
    { chestNo: '002', status: 'P' }
  ]
});

// Stage 5: Score Round 1
manager.processStage(event.eventId, 5, {
  performances: [
    { chestNo: '001', performance: '00:10:45:32' },
    { chestNo: '002', performance: '00:10:50:12' }
  ]
});

// ... continue through stages 6-13
```

### Relay Event (4×100m)

```javascript
// Create relay event
const relay = manager.createEvent({
  name: '4×100m Relay',
  distance: '400',
  date: '2025-11-25'
});

// Teams (4 athletes per team)
manager.processStage(relay.eventId, 2, {
  athletes: [
    // Team 1
    { chestNo: '101', name: 'Runner 1', college: 'Christ' },
    { chestNo: '102', name: 'Runner 2', college: 'Christ' },
    { chestNo: '103', name: 'Runner 3', college: 'Christ' },
    { chestNo: '104', name: 'Runner 4', college: 'Christ' }
  ]
});

// ... proceed through stages
```

---

## Key Features

✅ **5 Event Categories** - Track, Relay, Jump, Throw, Combined

✅ **13-Stage Workflow** - Complete event lifecycle management

✅ **IAAF Compliance** - Lane assignment follows IAAF standards

✅ **Automatic Heats** - Intelligent grouping avoiding college clusters

✅ **Time Tracking** - Precise HH:MM:SS:ML format

✅ **Distance Tracking** - Field events in meters

✅ **Attempt Management** - 6 attempts for field, 3+3 for throws

✅ **Combined Events** - Manual points entry (no AFI tables)

✅ **Championship Points** - Automatic calculation (5-3-1)

✅ **PDF Generation** - All sheets with global header/footer

✅ **Event Locking** - Results cannot be edited after publish

✅ **Audit Trail** - Complete stage history

✅ **Name Correction** - Pre-publish correction workflow

---

## Database Collections

### events
- Event records with all stages and results

### athletes
- Athlete master data with performances

### colleges
- College registry

### championship
- Championship standings by college

### audit_logs
- Complete audit trail of all operations

---

## Time Format

All track and relay events use **HH:MM:SS:ML** format:
- **HH** = Hours (00-23)
- **MM** = Minutes (00-59)
- **SS** = Seconds (00-59)
- **ML** = Milliseconds (00-99)

Example: `00:10:45:32` = 10 minutes, 45 seconds, 32 milliseconds

---

## Distance Format

All field events use decimal meters:
- **Format:** X.XX (e.g., 6.45m)
- **Attempts:** Up to 6 for jumps, 3+3 for throws
- **Best:** Highest valid attempt

---

## Notes

- All PDFs include BU logo and global footer
- Event can only progress sequentially through stages
- Previous stages can be reverted with data restoration
- Championship points are auto-calculated and updated
- Events are locked after final verification
- All corrections must be made before lock

---

## Support

For issues or questions regarding implementation:

**Developer:** Deepu K C
**Institution:** Soundarya Institute of Management and Science (SIMS)
**Guided By:** Dr. Harish P M & Lt. Suresh Reddy M S, PED, SIMS

---

## License

© 2025 Bangalore University | All rights reserved
