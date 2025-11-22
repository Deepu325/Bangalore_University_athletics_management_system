/**
 * Utility Functions for Event Management
 */

const { IAAF_LANE_ASSIGNMENT, HEAT_GROUP_SIZE, RELAY_TEAM_SIZE } = require('./constants');

/**
 * Format time to HH:MM:SS:ML
 */
function formatTime(seconds) {
  if (!seconds) return '00:00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ml = Math.floor((seconds % 1) * 100);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(ml).padStart(2, '0')}`;
}

/**
 * Parse time string HH:MM:SS:ML to seconds
 */
function parseTime(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const secs = parseInt(parts[2]) || 0;
  const ml = parseInt(parts[3]) || 0;
  
  return hours * 3600 + minutes * 60 + secs + ml / 100;
}

/**
 * Rank athletes based on track time (lower is better)
 */
function rankByTime(athletes) {
  return athletes
    .map(a => ({ ...a, timeInSeconds: parseTime(a.performance) }))
    .sort((a, b) => a.timeInSeconds - b.timeInSeconds)
    .map((a, index) => ({ ...a, rank: index + 1 }));
}

/**
 * Rank athletes based on field distance (higher is better)
 */
function rankByDistance(athletes) {
  return athletes
    .map(a => ({ ...a, distance: parseFloat(a.performance) || 0 }))
    .sort((a, b) => b.distance - a.distance)
    .map((a, index) => ({ ...a, rank: index + 1 }));
}

/**
 * Rank athletes based on combined event points (higher is better)
 */
function rankByPoints(athletes) {
  return athletes
    .map(a => ({ ...a, points: parseFloat(a.performance) || 0 }))
    .sort((a, b) => b.points - a.points)
    .map((a, index) => ({ ...a, rank: index + 1 }));
}

/**
 * Assign IAAF lanes based on performance rank
 */
function assignIAAFLanes(rankedAthletes) {
  return rankedAthletes.map(athlete => ({
    ...athlete,
    lane: IAAF_LANE_ASSIGNMENT[athlete.rank] || athlete.rank
  }));
}

/**
 * Generate heats by dividing athletes into groups of 8 (or 7,7 if odd)
 * Avoid same college in same heat
 */
function generateHeats(athletes) {
  const heats = [];
  let currentHeat = [];
  const collegeCount = {};

  // Sort athletes to avoid college clustering
  const sortedAthletes = [...athletes].sort(() => Math.random() - 0.5);

  for (const athlete of sortedAthletes) {
    if (currentHeat.length === HEAT_GROUP_SIZE) {
      heats.push(currentHeat);
      currentHeat = [];
      collegeCount = {};
    }
    currentHeat.push(athlete);
    collegeCount[athlete.college] = (collegeCount[athlete.college] || 0) + 1;
  }

  if (currentHeat.length > 0) {
    heats.push(currentHeat);
  }

  // Assign heat numbers and lanes
  return heats.map((heat, heatIdx) =>
    assignIAAFLanes(
      heat.map((athlete, idx) => ({
        ...athlete,
        heatNumber: heatIdx + 1,
        heatPosition: idx + 1
      }))
    )
  ).flat();
}

/**
 * Generate relay heats (team-based)
 * 1 team = 4 athletes, assigned to 1 lane
 */
function generateRelayHeats(teams) {
  const heats = [];
  let currentHeat = [];

  const sortedTeams = [...teams].sort(() => Math.random() - 0.5);

  for (const team of sortedTeams) {
    if (currentHeat.length === HEAT_GROUP_SIZE / RELAY_TEAM_SIZE) {
      heats.push(currentHeat);
      currentHeat = [];
    }
    currentHeat.push(team);
  }

  if (currentHeat.length > 0) {
    heats.push(currentHeat);
  }

  // Assign lanes to teams
  return heats.map((heat, heatIdx) =>
    heat.map((team, idx) => ({
      ...team,
      heatNumber: heatIdx + 1,
      lane: IAAF_LANE_ASSIGNMENT[idx + 1] || idx + 1
    }))
  ).flat();
}

/**
 * Calculate championship points
 */
function calculateChampionshipPoints(result) {
  const points = {};
  
  result.forEach(athlete => {
    const college = athlete.college;
    const awardPoints = athlete.awardPoints || 0;
    points[college] = (points[college] || 0) + awardPoints;
  });

  return points;
}

/**
 * Generate Call Room format (universal)
 * SL NO | CHEST NO | NAME | COLLEGE | REMARKS
 */
function generateCallRoom(athletes, status = 'P') {
  return athletes.map((a, idx) => ({
    slNo: idx + 1,
    chestNo: a.chestNo,
    name: a.name,
    college: a.college,
    remarks: status // P = Present, A = Absent, DIS = Disqualified
  }));
}

/**
 * Generate Track Officials Sheet
 * SL NO | CHEST NO | NAME | COLLEGE | LANE | PERFORMANCE | REMARKS
 */
function generateTrackSheet(athletes) {
  return athletes.map((a, idx) => ({
    slNo: idx + 1,
    chestNo: a.chestNo,
    name: a.name,
    college: a.college,
    lane: a.lane || '',
    performance: a.performance || '',
    remarks: a.remarks || ''
  }));
}

/**
 * Generate Field (Jump/Throw) Officials Sheet
 * Multiple attempts columns
 */
function generateFieldSheet(athletes, attemptCount = 6) {
  return athletes.map((a, idx) => {
    const row = {
      slNo: idx + 1,
      chestNo: a.chestNo,
      name: a.name,
      college: a.college
    };
    
    for (let i = 1; i <= attemptCount; i++) {
      row[`a${i}`] = a[`attempt${i}`] || '';
    }
    row.best = a.best || '';
    row.remarks = a.remarks || '';
    
    return row;
  });
}

/**
 * Generate Relay Officials Sheet (team-based)
 */
function generateRelaySheet(teams) {
  const athletes = [];
  
  teams.forEach((team, idx) => {
    team.athletes.forEach((athlete, pos) => {
      athletes.push({
        slNo: athletes.length + 1,
        chestNo: athlete.chestNo,
        name: athlete.name,
        college: athlete.college,
        lane: pos === 0 ? team.lane : '',
        time: pos === 0 ? team.performance || '' : '',
        teamNumber: idx + 1,
        position: pos + 1,
        remarks: pos === 0 ? team.remarks || '' : ''
      });
    });
  });

  return athletes;
}

/**
 * Select top N athletes
 */
function selectTop(athletes, topCount = 8) {
  return athletes
    .sort((a, b) => {
      // Sort by rank (lower rank is better)
      return (a.rank || Infinity) - (b.rank || Infinity);
    })
    .slice(0, topCount);
}

/**
 * Verify athlete data
 */
function verifyAthleteData(athlete) {
  const errors = [];
  if (!athlete.chestNo) errors.push('Chest number missing');
  if (!athlete.name) errors.push('Name missing');
  if (!athlete.college) errors.push('College missing');
  return errors;
}

/**
 * Generate PDF Header
 */
function generatePDFHeader(header) {
  return `
BANGALORE UNIVERSITY
Directorate of Physical Education & Sports
UCPE Stadium, Jnanabharathi Campus, Bengaluru – 560056
61st Inter-Collegiate Athletic Championship 2025–26
(Developed by SIMS)
`.trim();
}

/**
 * Generate PDF Footer
 */
function generatePDFFooter(footer) {
  return `
© 2025 Bangalore University | Athletic Meet Management System
Developed by: Deepu K C | Soundarya Institute of Management and Science (SIMS)
Guided By: Dr. Harish P M & Lt. Suresh Reddy M S, PED, SIMS
Dr. Venkata Chalapathi | Mr. Chidananda | Dr. Manjanna B P
`.trim();
}

module.exports = {
  formatTime,
  parseTime,
  rankByTime,
  rankByDistance,
  rankByPoints,
  assignIAAFLanes,
  generateHeats,
  generateRelayHeats,
  calculateChampionshipPoints,
  generateCallRoom,
  generateTrackSheet,
  generateFieldSheet,
  generateRelaySheet,
  selectTop,
  verifyAthleteData,
  generatePDFHeader,
  generatePDFFooter
};
