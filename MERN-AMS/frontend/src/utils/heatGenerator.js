/**
 * Heat/Set Generation Utility - Stage 4 & 7
 * 
 * Generates heats/sets for track, field, and relay events
 * with college-aware distribution and professional lane mapping
 * 
 * Filters only present athletes and applies IAAF-compliant balancing.
 */

/**
 * Lane mapping for competitive heats (per IAAF standards)
 * Position in heat (seed) maps to lane number
 * Seeds 1-8 map to lanes 3,4,2,5,6,1,7,8 respectively
 * 
 * @type {Array<number>}
 */
const LANE_MAP = [3, 4, 2, 5, 6, 1, 7, 8];

/**
 * Get college identifier from athlete object
 * @param {Object} athlete - Athlete object
 * @returns {string} College code or identifier
 */
function getCollegeKey(athlete) {
  if (!athlete) return 'UNKNOWN';
  
  if (typeof athlete.college === 'object') {
    return athlete.college?.code || athlete.college?._id || 'UNKNOWN';
  }
  return athlete.college || 'UNKNOWN';
}

/**
 * Check if two athletes are from the same college
 * @param {Object} a1 - First athlete
 * @param {Object} a2 - Second athlete
 * @returns {boolean} True if same college
 */
function isSameCollege(a1, a2) {
  return getCollegeKey(a1) === getCollegeKey(a2);
}

/**
 * Generate smart heats for track/relay events (IAAF Standard)
 * 
 * Smart distribution:
 * - Heats of 8 athletes (standard 8 lanes)
 * - Last remaining 7-14 athletes → split into 7-athlete heats
 * - Remaining < 7 → merge with previous heat
 * - Result: Balanced heats like 8,8,8,8,8,8,7,7,7 for 70 athletes
 * 
 * @param {Array} athletes - All athletes registered for the event
 * @param {Object} options - Generation options
 * @param {boolean} options.useCollegeSeparation - Apply college separation logic
 * @param {boolean} options.useLaneMapping - Apply IAAF lane mapping
 * @returns {Array} Array of heats, each containing athletes with heat/lane assignments
 */
export function generateHeats(athletes = [], options = {}) {
  const {
    useCollegeSeparation = true,
    useLaneMapping = true
  } = options;

  // 1. Filter only present athletes
  const present = athletes.filter(a => a.status === 'PRESENT');

  if (present.length === 0) {
    return [];
  }

  // 2. Group athletes by college for smart distribution
  const byCollege = {};
  present.forEach(a => {
    const collegeKey = getCollegeKey(a);
    if (!byCollege[collegeKey]) {
      byCollege[collegeKey] = [];
    }
    byCollege[collegeKey].push(a);
  });

  // 3. Create priority list: colleges sorted by size (descending)
  const collegeLists = Object.values(byCollege).sort((a, b) => b.length - a.length);

  // 4. Distribute athletes into smart heats (IAAF Standard)
  const heats = [];
  let list = useCollegeSeparation ? distributeWithCollegeSeparation(collegeLists) : [...present];

  while (list.length > 0) {
    // SMART LOGIC: If last 7-14 athletes → make 7-per-heat
    if (list.length <= 14 && list.length >= 7) {
      while (list.length > 0) {
        const heatSize = (list.length >= 7) ? 7 : list.length;
        heats.push(list.splice(0, heatSize));
      }
      break;
    }

    // Default: create heat of 8
    if (list.length >= 8) {
      heats.push(list.splice(0, 8));
    } else {
      // If remaining < 7 → merge with previous heat
      if (heats.length > 0) {
        heats[heats.length - 1].push(...list);
      } else {
        heats.push(list);
      }
      break;
    }
  }

  // 5. Assign heat numbers and lane numbers with optional IAAF mapping
  return heats.map((heat, heatIdx) => 
    heat.map((athlete, laneIdx) => ({
      ...athlete,
      heatNo: heatIdx + 1,
      heat: heatIdx + 1,
      seed: laneIdx + 1, // Position in heat (1-8 or 1-7)
      lane: useLaneMapping ? LANE_MAP[laneIdx] : (laneIdx + 1)
    }))
  );
}

/**
 * Distribute athletes with college separation using greedy algorithm
 * @param {Array} collegeLists - Pre-grouped athletes by college
 * @param {number} heatSize - Target heat size (default 8)
 * @returns {Array} Sequentially ordered athletes prioritizing college separation
 */
function distributeWithCollegeSeparation(collegeLists, heatSize = 8) {
  const result = [];
  let currentHeat = [];

  // Greedy approach: cycle through colleges, pick one athlete each time
  let collegeCursor = 0;
  let collegeIdx = 0; // Position within current college list

  while (collegeLists.some(list => list.length > 0)) {
    // Find next college with available athletes
    let attempts = 0;
    while (attempts < collegeLists.length) {
      const collegeList = collegeLists[collegeCursor];
      
      if (collegeList.length > 0) {
        const athlete = collegeList.shift();
        
        // Check if athlete's college already in current heat
        const hasCollegeInHeat = currentHeat.some(a => isSameCollege(a, athlete));
        
        if (!hasCollegeInHeat || currentHeat.length === 0) {
          // Good: no same-college conflict, or heat is empty
          currentHeat.push(athlete);
          
          if (currentHeat.length === heatSize) {
            result.push(...currentHeat);
            currentHeat = [];
          }
          break;
        } else {
          // Conflict: put back and try next college
          collegeList.unshift(athlete);
        }
      }
      
      collegeCursor = (collegeCursor + 1) % collegeLists.length;
      attempts++;
    }

    // If we exhausted all colleges, just push remaining
    if (attempts === collegeLists.length) {
      if (currentHeat.length > 0) {
        result.push(...currentHeat);
        currentHeat = [];
      }
      
      // Flatten any remaining athletes
      for (const list of collegeLists) {
        result.push(...list);
      }
      break;
    }
  }

  // Flush remaining heat
  if (currentHeat.length > 0) {
    result.push(...currentHeat);
  }

  return result;
}

/**
 * Generate sets for field events (jump/throw) with college separation
 * @param {Array} athletes - All athletes registered for the event
 * @param {Number} setSize - Athletes per set (default 12)
 * @returns {Array} Array of sets, each containing athletes
 */
export function generateSets(athletes = [], setSize = 12) {
  // 1. Filter only present athletes
  const present = athletes.filter(a => a.status === 'PRESENT');

  if (present.length === 0) {
    return [];
  }

  // 2. Group athletes by college
  const byCollege = {};
  present.forEach(a => {
    const collegeKey = getCollegeKey(a);
    if (!byCollege[collegeKey]) {
      byCollege[collegeKey] = [];
    }
    byCollege[collegeKey].push(a);
  });

  // 3. Create priority list: colleges sorted by size (descending)
  const collegeLists = Object.values(byCollege).sort((a, b) => b.length - a.length);

  // 4. Calculate number of sets needed
  const numSets = Math.ceil(present.length / setSize);

  // 5. Initialize sets array
  const sets = Array.from({ length: numSets }, () => []);

  // 6. Greedy distribution
  for (const collegeList of collegeLists) {
    while (collegeList.length > 0) {
      const athlete = collegeList.shift();
      let placed = false;

      // Try to place in a set where:
      // a) Same college not already present
      // b) Set has space
      for (let i = 0; i < sets.length; i++) {
        const set = sets[i];
        const hasSameCollege = set.some(h => isSameCollege(h, athlete));

        if (!hasSameCollege && set.length < setSize) {
          set.push(athlete);
          placed = true;
          break;
        }
      }

      // Fallback: place in first set with space
      if (!placed) {
        for (let i = 0; i < sets.length; i++) {
          if (sets[i].length < setSize) {
            sets[i].push(athlete);
            placed = true;
            break;
          }
        }
      }

      // Last resort: push to last set
      if (!placed) {
        sets[sets.length - 1].push(athlete);
      }
    }
  }

  // 7. Remove empty sets and assign set numbers
  return sets
    .filter(s => s.length > 0)
    .map((set, setIdx) =>
      set.map((athlete, idx) => ({
        ...athlete,
        setNo: setIdx + 1,
        order: idx + 1
      }))
    );
}

/**
 * Assign sequential lanes (1-8 or 1-7 based on heat size) to athletes in a heat
 * For 8-athlete heats: lanes 1-8
 * For 7-athlete heats: lanes 1-7
 * 
 * @param {Array} heat - Array of athletes in a heat
 * @returns {Array} Athletes with lane assignments (already done in generateHeats)
 */
export function assignRandomLanes(heat = []) {
  // Lane assignments are already done in generateHeats function
  // This function is kept for backward compatibility
  return heat;
}

/**
 * Get IAAF lane mapping for a seed position
 * @param {number} seed - Position in heat (1-8)
 * @returns {number} Lane number for that seed
 * 
 * @example
 * getLaneForSeed(1) // => 3 (best athlete in lane 3)
 * getLaneForSeed(2) // => 4
 */
export function getLaneForSeed(seed) {
  if (seed < 1 || seed > 8) return seed;
  return LANE_MAP[seed - 1];
}

/**
 * Get seed position for a lane number
 * @param {number} lane - Lane number (1-8)
 * @returns {number} Seed position for that lane
 * 
 * @example
 * getSeedForLane(3) // => 1 (lane 3 is for seed 1)
 * getSeedForLane(4) // => 2
 */
export function getSeedForLane(lane) {
  return LANE_MAP.indexOf(lane) + 1 || lane;
}

const heatGenerator = {
  generateHeats,
  generateSets,
  assignRandomLanes,
  getLaneForSeed,
  getSeedForLane,
  LANE_MAP
};

export default heatGenerator;
