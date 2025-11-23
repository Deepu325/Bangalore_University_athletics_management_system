/**
 * Helper to attach athletes to an event based on their event registrations
 * Solves: "Events Created But Showing 0 Athletes"
 * 
 * When an event is created, this function searches for all athletes
 * registered in that event (event1, event2, relay1, relay2, mixedRelay)
 * and updates the event's participants array.
 */

import Athlete from '../models/Athlete.js';
import Event from '../models/Event.js';

/**
 * Attach all registered athletes to an event
 * @param {String} eventId - MongoDB ObjectId of the event
 * @returns {Object} - Result with count of attached athletes
 */
export async function attachAthletesToEvent(eventId) {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    // Convert to string for comparison if needed
    const eventIdStr = eventId.toString();

    // Find all athletes registered in this event
    // Need to query without population first to get raw ObjectIds
    const athletes = await Athlete.find({
      $or: [
        { event1: eventId },
        { event2: eventId },
        { relay1: eventId },
        { relay2: eventId },
        { mixedRelay: eventId }
      ]
    }).select('_id event1 event2 relay1 relay2 mixedRelay').lean();

    console.log(`[attachAthletesToEvent] Event: ${eventIdStr}, Found ${athletes.length} athletes`);

    // Extract athlete IDs
    const athleteIds = athletes.map(a => a._id);

    // Update event with participants
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { participants: athleteIds },
      { new: true }
    );

    return {
      success: true,
      eventId,
      attachedCount: athleteIds.length,
      participants: athleteIds,
      updatedEvent
    };
  } catch (err) {
    console.error('Error attaching athletes to event:', err.message);
    return {
      success: false,
      error: err.message,
      eventId
    };
  }
}

/**
 * Attach athletes to ALL events
 * Useful for bulk operations after seeding
 * @returns {Array} - Results for each event
 */
export async function attachAthletesToAllEvents() {
  try {
    const events = await Event.find();
    const results = [];

    for (const event of events) {
      const result = await attachAthletesToEvent(event._id);
      results.push(result);
    }

    return {
      success: true,
      totalEvents: events.length,
      results
    };
  } catch (err) {
    console.error('Error attaching athletes to all events:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Update event participants after event is updated
 * Call this whenever an event is modified
 * @param {String} eventId - Event to update
 */
export async function syncEventParticipants(eventId) {
  return attachAthletesToEvent(eventId);
}

export default {
  attachAthletesToEvent,
  attachAthletesToAllEvents,
  syncEventParticipants
};
