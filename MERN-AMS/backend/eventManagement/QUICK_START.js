/**
 * Event Management System - Quick Start Guide
 * Athletics Meet Event Management Module (Category-Based)
 * 61st Inter-Collegiate Athletic Championship 2025–26
 */

/**
 * SYSTEM OVERVIEW
 * ===============
 * 
 * This system manages the complete lifecycle of athletic events through 13 stages:
 * 
 * 1.  Event Creation          - Set up event details
 * 2.  Call Room Generation    - Create call room sheets
 * 3.  Call Room Completion    - Mark attendance
 * 4.  Generate Event Sheets   - Prepare official sheets for data entry
 * 5.  Round 1 Scoring         - Enter performances and rank athletes
 * 6.  Top Selection           - Select top 8/16 for heats/finals
 * 7.  Heats Generation        - Create heat groupings with lane assignments
 * 8.  Heats Scoring           - Enter heat performances
 * 9.  Pre-Final Sheet         - Prepare finalists sheet
 * 10. Final Scoring           - Enter final performances and award points
 * 11. Final Announcement      - Display results
 * 12. Name Correction         - Make data corrections
 * 13. Verification & Lock     - Verify, sign, publish, lock event
 */

/**
 * QUICK START EXAMPLE
 * ===================
 */

const AthleticsMeetEventManager = require('./AthleticsMeetEventManager');

// Initialize system
const athleticsManager = new AthleticsMeetEventManager();

// Example 1: Create a Track Event (100m)
console.log('\n=== TRACK EVENT EXAMPLE (100m) ===\n');

const trackEvent = athleticsManager.createEvent({
  name: '100m',
  distance: '100',
  date: '2025-11-25',
  venue: 'UCPE Stadium'
});

const trackEventId = trackEvent.eventId;
console.log('Event created:', trackEventId);

// Stage 2: Generate Call Room
const callRoom = athleticsManager.processStage(trackEventId, 2, {
  athletes: [
    { chestNo: '001', name: 'Athlete A', college: 'Christ University' },
    { chestNo: '002', name: 'Athlete B', college: 'St. Josephs' },
    { chestNo: '003', name: 'Athlete C', college: 'RV University' },
    // ... more athletes
  ]
});

console.log('Call room generated with', callRoom.callRoom.length, 'athletes');
console.log('PDF generated:', !!callRoom.pdf);

// Stage 3: Complete Call Room (Mark Attendance)
const attendance = athleticsManager.processStage(trackEventId, 3, {
  attendanceData: [
    { chestNo: '001', status: 'P' }, // Present
    { chestNo: '002', status: 'P' },
    { chestNo: '003', status: 'P' }
  ]
});

console.log('Attendance marked:', attendance.statistics);

// Stage 4: Generate Event Sheets
const eventSheet = athleticsManager.processStage(trackEventId, 4, {});

console.log('Event sheet generated for', eventSheet.totalParticipants, 'participants');
console.log('Format:', eventSheet.format.headers.join(' | '));

// Stage 5: Score Round 1
const round1 = athleticsManager.processStage(trackEventId, 5, {
  performances: [
    { chestNo: '001', performance: '00:10:45:32' }, // HH:MM:SS:ML
    { chestNo: '002', performance: '00:10:50:12' },
    { chestNo: '003', performance: '00:10:48:90' }
  ]
});

console.log('Round 1 results:');
round1.results.forEach(r => {
  console.log(`  ${r.rank}. ${r.name} (${r.college}) - ${r.performance}`);
});

// Stage 6: Select Top Athletes (Top 8 / Top 16)
const topSelection = athleticsManager.processStage(trackEventId, 6, {
  topCount: 8
});

console.log('Top', topSelection.topCount, 'athletes selected');

// Stage 7: Generate Heats
const heats = athleticsManager.processStage(trackEventId, 7, {});

console.log('Heats generated:', heats.totalHeats);
heats.heats.forEach(heat => {
  console.log(`  Heat ${heat.heatNumber}: ${heat.athletes.length} athletes`);
});

// Stage 8: Score Heats
const heatsResult = athleticsManager.processStage(trackEventId, 8, {
  heatPerformances: [
    { chestNo: '001', performance: '00:10:42:10' },
    { chestNo: '002', performance: '00:10:52:05' }
  ]
});

console.log('Heats scored:', heatsResult.heatsCompleted, 'heats completed');

// Stage 9: Pre-Final Sheet
const preFinale = athleticsManager.processStage(trackEventId, 9, {});

console.log('Top finalists:', preFinale.preFinalSheet.length);

// Stage 10: Final Scoring
const finalResult = athleticsManager.processStage(trackEventId, 10, {
  finalPerformances: [
    { chestNo: '001', performance: '00:10:41:23' }
  ]
});

console.log('Final results:');
finalResult.finalResults.forEach(r => {
  console.log(`  ${r.position}. ${r.name} - ${r.performance} (${r.points} pts)`);
});

// Stage 11: Announce Results
const announced = athleticsManager.processStage(trackEventId, 11, {});

console.log('Results announced');

// Stage 12: Name Correction
const corrected = athleticsManager.processStage(trackEventId, 12, {
  corrections: [
    { oldChestNo: '001', chestNo: '001', name: 'Updated Name', college: 'Christ' }
  ]
});

console.log('Data corrections applied:', corrected.correctedRecords, 'records');

// Stage 13: Verify & Publish
const published = athleticsManager.processStage(trackEventId, 13, {
  verificationData: {
    verified: true,
    committee: ['Dr. Harish P M', 'Lt. Suresh Reddy M S']
  }
});

console.log('Event locked and published');
console.log('Championship points:', published.championshipPoints);

// Get championship standings
const standings = athleticsManager.getChampionshipStandings();
console.log('\nChampionship Standings:');
standings.forEach(s => {
  console.log(`  ${s.rank}. ${s.college} - ${s.points} points`);
});

/**
 * Example 2: Relay Event (4×100m)
 */
console.log('\n=== RELAY EVENT EXAMPLE (4×100m) ===\n');

const relayEvent = athleticsManager.createEvent({
  name: '4×100m Relay',
  distance: '400',
  date: '2025-11-25'
});

const relayEventId = relayEvent.eventId;

// Relay teams (4 athletes per team)
const relayTeams = [
  {
    college: 'Christ University',
    athletes: [
      { chestNo: '101', name: 'Runner 1' },
      { chestNo: '102', name: 'Runner 2' },
      { chestNo: '103', name: 'Runner 3' },
      { chestNo: '104', name: 'Runner 4' }
    ]
  }
];

const relayCallRoom = athleticsManager.processStage(relayEventId, 2, {
  athletes: relayTeams.flatMap(t => t.athletes.map((a, idx) => ({
    ...a,
    college: t.college
  })))
});

console.log('Relay teams registered:', relayCallRoom.totalTeams);

/**
 * Example 3: Jump Event (Long Jump)
 */
console.log('\n=== JUMP EVENT EXAMPLE (Long Jump) ===\n');

const jumpEvent = athleticsManager.createEvent({
  name: 'Long Jump',
  distance: 'LJ',
  date: '2025-11-25'
});

const jumpEventId = jumpEvent.eventId;

// Generate jump call room
const jumpCallRoom = athleticsManager.processStage(jumpEventId, 2, {
  athletes: [
    { chestNo: '201', name: 'Jumper A', college: 'Christ' },
    { chestNo: '202', name: 'Jumper B', college: 'St. Josephs' }
  ]
});

console.log('Jump event athletes:', jumpCallRoom.totalAthletes);

// Stage 5: Score with attempts
const jumpRound1 = athleticsManager.processStage(jumpEventId, 5, {
  attemptData: [
    {
      chestNo: '201',
      a1: '6.45', a2: '6.52', a3: '6.48',
      a4: '6.60', a5: '6.58', a6: '6.55'
    }
  ]
});

console.log('Best jump:', jumpRound1.results[0].best, 'meters');

/**
 * Example 4: Combined Event (Decathlon)
 */
console.log('\n=== COMBINED EVENT EXAMPLE (Decathlon) ===\n');

const decEvent = athleticsManager.createEvent({
  name: 'Decathlon (Men)',
  date: '2025-11-25'
});

const decEventId = decEvent.eventId;

// Day 1 scoring
const decDay1 = athleticsManager.processStage(decEventId, 2, {
  athletes: [
    { chestNo: '301', name: 'Decathlete A', college: 'Christ' }
  ]
});

console.log('Decathlon registered');

// Stage 5: Day 1 points (100m + LJ + SP + HJ + 400m)
const decDay1Scores = athleticsManager.processStage(decEventId, 5, {
  day1Data: [
    { chestNo: '301', day1Points: 2850 } // Example points
  ]
});

console.log('Day 1 points:', decDay1Scores.results[0].day1Points);

/**
 * API Integration Example
 * =======================
 * 
 * When integrated with Express.js backend:
 * 
 * POST /api/events/create
 * Body: { name: "100m", distance: "100", date: "2025-11-25" }
 * 
 * POST /api/events/{eventId}/stage/2
 * Body: { athletes: [...] }
 * 
 * GET /api/events/{eventId}/summary
 * 
 * POST /api/events/{eventId}/score-final
 * Body: { finalPerformances: [...] }
 * 
 * GET /api/championship/standings
 */

/**
 * Directory Structure
 * ===================
 * 
 * eventManagement/
 * ├── AthleticsMeetEventManager.js (Main system)
 * ├── eventRoutes.js (API endpoints)
 * ├── eventSchema.js (Database schema)
 * ├── eventCategories/
 * │   ├── Track/
 * │   │   └── TrackEventManager.js
 * │   ├── Relay/
 * │   │   └── RelayEventManager.js
 * │   ├── Jump/
 * │   │   └── JumpEventManager.js
 * │   ├── Throw/
 * │   │   └── ThrowEventManager.js
 * │   └── Combined/
 * │       └── CombinedEventManager.js
 * ├── stages/
 * │   ├── StageController.js
 * │   └── PDFFormatter.js
 * └── shared/
 *     ├── constants.js (Global constants)
 *     └── utils.js (Utility functions)
 */

/**
 * Key Features
 * ============
 * 
 * ✓ 5 Event Categories (Track, Relay, Jump, Throw, Combined)
 * ✓ 13-Stage Event Lifecycle Management
 * ✓ IAAF Lane Assignment for Track/Relay
 * ✓ Automatic Heats Generation (avoid college clustering)
 * ✓ Time Tracking (HH:MM:SS:ML format)
 * ✓ Distance Tracking (field events in meters)
 * ✓ Combined Events (Decathlon/Heptathlon - manual points)
 * ✓ Automatic Championship Point Calculation (5-3-1)
 * ✓ PDF Generation for all sheets
 * ✓ Global Header/Footer on all PDFs
 * ✓ Event Locking & Publishing
 * ✓ Name Correction Workflow
 * ✓ Comprehensive Audit Trail
 */

module.exports = {
  AthleticsMeetEventManager
};
