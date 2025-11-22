/**
 * Universal utility to get athletes from an event
 * Handles all Phase 1-5 schema variations
 * 
 * Priority order:
 * 1. round1Results (new Phase 5 standard)
 * 2. callRoom.present (old schema - Phase 2/3)
 * 3. athletes (legacy field)
 * 4. Empty array (fallback)
 */

export function getEventAthletes(event) {
  if (!event) return [];
  
  // Phase 5: round1Results is the primary source
  if (event.round1Results && Array.isArray(event.round1Results) && event.round1Results.length > 0) {
    return event.round1Results;
  }
  
  // Phase 2-3: callRoom.present (marking attendance)
  if (event.callRoom?.present && Array.isArray(event.callRoom.present) && event.callRoom.present.length > 0) {
    return event.callRoom.present;
  }
  
  // Legacy: athletes field (Phase 1)
  if (event.athletes && Array.isArray(event.athletes) && event.athletes.length > 0) {
    return event.athletes;
  }
  
  // Participants array (from MongoDB populate)
  if (event.participants && Array.isArray(event.participants) && event.participants.length > 0) {
    return event.participants;
  }
  
  // Fallback: empty array
  return [];
}

/**
 * Get call room present athletes (specifically for Stage 2-3)
 */
export function getCallRoomAthletes(event) {
  return event?.callRoom?.present || [];
}

/**
 * Get heats athletes (for Stage 7-7.5)
 */
export function getHeatsAthletes(event) {
  if (!event?.heats || event.heats.length === 0) return [];
  
  const allAthletes = [];
  event.heats.forEach(heat => {
    if (heat.athletes && Array.isArray(heat.athletes)) {
      allAthletes.push(...heat.athletes);
    }
  });
  return allAthletes;
}

/**
 * Get finalists (for Stage 8 - Pre-final Sheet)
 */
export function getFinalists(event) {
  return event?.finalists || event?.finalResults || [];
}

/**
 * Get final results (for Stage 9-13)
 */
export function getFinalResults(event) {
  return event?.finalResults || [];
}

/**
 * Get top selection athletes (for Stage 6)
 */
export function getTopSelectionAthletes(event) {
  return event?.topSelection?.selectedIds || [];
}

/**
 * Count athletes by stage
 */
export function countAthletesByStage(event, stage) {
  switch(stage) {
    case 2: // Call Room
    case 3: // Call Room Complete
      return getCallRoomAthletes(event).length;
    
    case 4: // Generate Sheets
    case 5: // Round 1 Scoring
      return getEventAthletes(event).length;
    
    case 6: // Top Selection
      return getTopSelectionAthletes(event).length;
    
    case 7: // Heats Generation
    case 7.5: // Heats Scoring
      return getHeatsAthletes(event).length;
    
    case 8: // Pre-final Sheet
      return getFinalists(event).length;
    
    case 9: // Final Scoring
    case 10: // Final Announcement
      return getFinalResults(event).length;
    
    default:
      return getEventAthletes(event).length;
  }
}

/**
 * Get athlete by ID from event
 */
export function findAthleteInEvent(event, athleteId) {
  const athletes = getEventAthletes(event);
  return athletes.find(a => 
    a._id === athleteId || 
    a.id === athleteId || 
    a.athleteId === athleteId
  );
}

/**
 * Validate event has enough athletes
 */
export function validateEventAthletes(event, minRequired = 1) {
  const athletes = getEventAthletes(event);
  return {
    valid: athletes.length >= minRequired,
    count: athletes.length,
    athletes
  };
}
