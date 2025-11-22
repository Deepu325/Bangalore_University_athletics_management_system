/**
 * Jump Event Category Implementation
 * Long Jump, Triple Jump, High Jump, Pole Vault
 * 6 attempts, best attempt decides ranking
 */

const {
  JUMP_EVENTS,
  SCORING,
  FIELD_ATTEMPTS
} = require('../shared/constants');

const {
  rankByDistance,
  selectTop,
  generateFieldSheet
} = require('../shared/utils');

class JumpEventManager {
  constructor(eventName) {
    this.eventName = eventName;
    this.eventType = 'Jump';
    this.currentStage = 1;
    this.athletes = [];
    this.heats = [];
    this.results = [];
    this.finalResults = [];
    this.attemptCount = FIELD_ATTEMPTS; // 6 attempts
  }

  /**
   * Stage 1: Event Creation
   */
  createEvent(eventData) {
    this.eventName = eventData.name;
    this.eventType = 'Jump';
    this.eventDate = eventData.date;
    this.eventVenue = eventData.venue;
    this.currentStage = 2;

    return {
      success: true,
      message: `Jump event "${this.eventName}" created`,
      eventData: {
        name: this.eventName,
        type: this.eventType,
        date: this.eventDate,
        attempts: this.attemptCount
      }
    };
  }

  /**
   * Stage 2: Call Room Generation
   */
  generateCallRoom(athletes) {
    this.athletes = athletes;
    this.currentStage = 3;

    const callRoom = athletes.map((a, idx) => ({
      slNo: idx + 1,
      chestNo: a.chestNo,
      name: a.name,
      college: a.college,
      remarks: 'P'
    }));

    return {
      success: true,
      stage: this.currentStage,
      callRoom: callRoom,
      totalAthletes: athletes.length
    };
  }

  /**
   * Stage 3: Call Room Completion
   */
  completeCallRoom(attendanceData) {
    this.athletes = this.athletes.map(athlete => {
      const attendance = attendanceData.find(a => a.chestNo === athlete.chestNo);
      return {
        ...athlete,
        status: attendance?.status || 'P'
      };
    });

    this.currentStage = 4;

    return {
      success: true,
      stage: this.currentStage,
      presentAthletes: this.athletes.filter(a => a.status === 'P').length
    };
  }

  /**
   * Stage 4: Generate Event Sheets
   * SL NO | CHEST NO | NAME | COLLEGE | A1 | A2 | A3 | A4 | A5 | A6 | BEST | REMARKS
   */
  generateEventSheets() {
    const presentAthletes = this.athletes.filter(a => a.status === 'P');
    const eventSheet = generateFieldSheet(presentAthletes, this.attemptCount);
    this.currentStage = 5;

    return {
      success: true,
      stage: this.currentStage,
      eventName: this.eventName,
      category: 'Jump',
      format: {
        headers: ['SL NO', 'CHEST NO', 'NAME', 'COLLEGE', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'BEST', 'REMARKS'],
        note: 'Enter distances in meters (e.g., 6.45)',
        attempts: this.attemptCount
      },
      eventSheet: eventSheet,
      totalParticipants: presentAthletes.length
    };
  }

  /**
   * Stage 5: Round 1 Scoring
   * Process all attempts and calculate best
   */
  scoreRound1(attemptData) {
    const scored = this.athletes
      .filter(a => a.status === 'P')
      .map(athlete => {
        const attempts = attemptData.find(ad => ad.chestNo === athlete.chestNo);
        const distances = [
          parseFloat(attempts?.a1) || null,
          parseFloat(attempts?.a2) || null,
          parseFloat(attempts?.a3) || null,
          parseFloat(attempts?.a4) || null,
          parseFloat(attempts?.a5) || null,
          parseFloat(attempts?.a6) || null
        ].filter(d => d !== null);

        const best = Math.max(...distances, 0) || 0;

        return {
          ...athlete,
          attempts: distances,
          performance: best,
          a1: attempts?.a1 || '',
          a2: attempts?.a2 || '',
          a3: attempts?.a3 || '',
          a4: attempts?.a4 || '',
          a5: attempts?.a5 || '',
          a6: attempts?.a6 || ''
        };
      });

    this.results = rankByDistance(scored);
    this.currentStage = 6;

    return {
      success: true,
      stage: this.currentStage,
      round: 'Round 1',
      results: this.results.map(r => ({
        rank: r.rank,
        chestNo: r.chestNo,
        name: r.name,
        college: r.college,
        best: r.performance,
        attempts: r.attempts
      })),
      scoringRule: 'Higher distance = better rank'
    };
  }

  /**
   * Stage 6: Top Selection
   */
  selectTopAthletes(topCount = 8) {
    this.topAthletes = selectTop(this.results, topCount);
    this.currentStage = 7;

    return {
      success: true,
      stage: this.currentStage,
      topCount: topCount,
      selectedAthletes: this.topAthletes.map(a => ({
        chestNo: a.chestNo,
        name: a.name,
        college: a.college,
        distance: a.performance
      })),
      note: `Top ${topCount} athletes selected`
    };
  }

  /**
   * Stage 7: Heats Generation
   * For field events, not traditional heats but qualifying rounds
   */
  generateHeats() {
    this.heats = [];
    const athletes = this.topAthletes || this.results;

    // Group athletes (typically 8 per group for field events)
    let currentGroup = [];
    for (let i = 0; i < athletes.length; i++) {
      currentGroup.push(athletes[i]);

      if (currentGroup.length === 8 || i === athletes.length - 1) {
        this.heats.push({
          heatNumber: this.heats.length + 1,
          athletes: currentGroup.map((a, idx) => ({
            ...a,
            heatPosition: idx + 1
          }))
        });
        currentGroup = [];
      }
    }

    this.currentStage = 8;

    return {
      success: true,
      stage: this.currentStage,
      totalHeats: this.heats.length,
      heats: this.heats
    };
  }

  /**
   * Stage 8: Heats Scoring
   */
  scoreHeats(heatAttempts) {
    this.heats = this.heats.map(heat => ({
      ...heat,
      athletes: heat.athletes.map(athlete => {
        const attempts = heatAttempts.find(ha => ha.chestNo === athlete.chestNo);
        const distances = [
          parseFloat(attempts?.a1) || null,
          parseFloat(attempts?.a2) || null,
          parseFloat(attempts?.a3) || null,
          parseFloat(attempts?.a4) || null,
          parseFloat(attempts?.a5) || null,
          parseFloat(attempts?.a6) || null
        ].filter(d => d !== null);

        const best = Math.max(...distances, 0) || athlete.performance;

        return {
          ...athlete,
          heatsAttempts: distances,
          heatsBest: best
        };
      })
    }));

    this.currentStage = 9;

    return {
      success: true,
      stage: this.currentStage,
      heatsCompleted: this.heats.length
    };
  }

  /**
   * Stage 9: Pre-Final Sheet
   */
  generatePreFinalSheet() {
    const finalAthletes = [];
    this.heats.forEach(heat => {
      const ranked = heat.athletes.sort((a, b) => b.heatsBest - a.heatsBest);
      finalAthletes.push(...ranked.slice(0, 1));
    });

    // Top 8
    this.finalAthletes = finalAthletes
      .sort((a, b) => b.heatsBest - a.heatsBest)
      .slice(0, 8)
      .map((a, idx) => ({
        ...a,
        rank: idx + 1
      }));

    this.currentStage = 10;

    return {
      success: true,
      stage: this.currentStage,
      preFinalSheet: this.finalAthletes.map(a => ({
        chestNo: a.chestNo,
        name: a.name,
        college: a.college,
        heatsBest: a.heatsBest,
        finalAttempts: '___  ___  ___  ___  ___  ___'
      }))
    };
  }

  /**
   * Stage 10: Final Scoring
   */
  scoreFinal(finalAttempts) {
    this.finalResults = this.finalAthletes.map(athlete => {
      const attempts = finalAttempts.find(fa => fa.chestNo === athlete.chestNo);
      const distances = [
        parseFloat(attempts?.a1) || null,
        parseFloat(attempts?.a2) || null,
        parseFloat(attempts?.a3) || null,
        parseFloat(attempts?.a4) || null,
        parseFloat(attempts?.a5) || null,
        parseFloat(attempts?.a6) || null
      ].filter(d => d !== null);

      const best = Math.max(...distances, 0) || athlete.heatsBest;

      return {
        ...athlete,
        finalPerformance: best
      };
    });

    this.finalResults = rankByDistance(this.finalResults);

    // Award points
    this.finalResults = this.finalResults.map(athlete => ({
      ...athlete,
      awardPoints: athlete.rank <= 3 ? SCORING[Object.keys(SCORING)[athlete.rank - 1]] : 0
    }));

    this.currentStage = 11;

    return {
      success: true,
      stage: this.currentStage,
      finalResults: this.finalResults.map(a => ({
        position: a.rank,
        chestNo: a.chestNo,
        name: a.name,
        college: a.college,
        distance: a.finalPerformance,
        points: a.awardPoints
      }))
    };
  }

  /**
   * Stage 11: Final Announcement
   */
  announceResults() {
    this.currentStage = 12;

    return {
      success: true,
      stage: this.currentStage,
      event: this.eventName,
      results: this.finalResults
    };
  }

  /**
   * Stage 12: Name Correction
   */
  correctAthleteData(corrections) {
    corrections.forEach(correction => {
      const athlete = this.finalResults.find(a => a.chestNo === correction.oldChestNo);
      if (athlete) {
        athlete.name = correction.name || athlete.name;
        athlete.chestNo = correction.chestNo || athlete.chestNo;
        athlete.college = correction.college || athlete.college;
      }
    });

    this.currentStage = 13;

    return {
      success: true,
      stage: this.currentStage,
      message: 'Athlete data corrected'
    };
  }

  /**
   * Stage 13: Verification & Publish/Lock
   */
  publishAndLock(verificationData) {
    this.eventLocked = true;
    this.verified = verificationData.verified;
    this.committee = verificationData.committee;
    this.publishedDate = new Date();

    return {
      success: true,
      stage: this.currentStage,
      eventLocked: true,
      verified: this.verified,
      committee: this.committee,
      finalResults: this.finalResults,
      message: 'Jump event verified, published and locked'
    };
  }

  /**
   * Get event summary
   */
  getEventSummary() {
    return {
      eventName: this.eventName,
      eventType: this.eventType,
      currentStage: this.currentStage,
      totalAthletes: this.athletes.length,
      presentAthletes: this.athletes.filter(a => a.status === 'P').length,
      attempts: this.attemptCount,
      finalResults: this.finalResults.length > 0 ? this.finalResults : 'Pending'
    };
  }
}

module.exports = JumpEventManager;
