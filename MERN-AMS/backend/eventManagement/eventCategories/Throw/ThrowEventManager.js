/**
 * Throw Event Category Implementation
 * Shot Put, Discus, Javelin, Hammer
 * 3 attempts → top 8 → 3 more attempts
 * Distance in meters, foul marked as F
 */

const {
  THROW_EVENTS,
  SCORING,
  THROW_PRELIMINARY,
  THROW_FINAL
} = require('../shared/constants');

const {
  rankByDistance,
  selectTop
} = require('../shared/utils');

class ThrowEventManager {
  constructor(eventName) {
    this.eventName = eventName;
    this.eventType = 'Throw';
    this.currentStage = 1;
    this.athletes = [];
    this.results = [];
    this.finalResults = [];
    this.preliminaryAttempts = THROW_PRELIMINARY; // 3
    this.finalAttempts = THROW_FINAL; // 3
  }

  /**
   * Stage 1: Event Creation
   */
  createEvent(eventData) {
    this.eventName = eventData.name;
    this.eventType = 'Throw';
    this.eventDate = eventData.date;
    this.eventVenue = eventData.venue;
    this.currentStage = 2;

    return {
      success: true,
      message: `Throw event "${this.eventName}" created`,
      eventData: {
        name: this.eventName,
        type: this.eventType,
        preliminaryAttempts: this.preliminaryAttempts,
        finalAttempts: this.finalAttempts
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
   * Stage 4: Generate Event Sheets (Preliminary)
   * SL NO | CHEST NO | NAME | COLLEGE | A1 | A2 | A3 | BEST | REMARKS
   */
  generateEventSheets() {
    const presentAthletes = this.athletes.filter(a => a.status === 'P');
    
    const eventSheet = presentAthletes.map((a, idx) => ({
      slNo: idx + 1,
      chestNo: a.chestNo,
      name: a.name,
      college: a.college,
      a1: '',
      a2: '',
      a3: '',
      best: '',
      remarks: '' // Mark fouls as F
    }));

    this.currentStage = 5;

    return {
      success: true,
      stage: this.currentStage,
      eventName: this.eventName,
      category: 'Throw',
      round: 'Preliminary',
      format: {
        headers: ['SL NO', 'CHEST NO', 'NAME', 'COLLEGE', 'A1', 'A2', 'A3', 'BEST', 'REMARKS'],
        note: 'Enter distances in meters. Mark fouls as "F". Best auto-calculated.'
      },
      eventSheet: eventSheet,
      totalParticipants: presentAthletes.length,
      attempts: this.preliminaryAttempts
    };
  }

  /**
   * Stage 5: Round 1 Scoring (Preliminary)
   */
  scoreRound1(preliminaryData) {
    const scored = this.athletes
      .filter(a => a.status === 'P')
      .map(athlete => {
        const pdata = preliminaryData.find(pd => pd.chestNo === athlete.chestNo);
        
        // Filter out fouls
        const distances = [
          pdata?.a1 !== 'F' ? parseFloat(pdata?.a1) : null,
          pdata?.a2 !== 'F' ? parseFloat(pdata?.a2) : null,
          pdata?.a3 !== 'F' ? parseFloat(pdata?.a3) : null
        ].filter(d => d !== null && !isNaN(d));

        const best = distances.length > 0 ? Math.max(...distances) : 0;

        return {
          ...athlete,
          preliminaryAttempts: {
            a1: pdata?.a1 || '',
            a2: pdata?.a2 || '',
            a3: pdata?.a3 || ''
          },
          preliminaryBest: best,
          performance: best,
          fouls: [pdata?.a1 === 'F', pdata?.a2 === 'F', pdata?.a3 === 'F'].filter(Boolean).length
        };
      });

    this.results = rankByDistance(scored);
    this.currentStage = 6;

    return {
      success: true,
      stage: this.currentStage,
      round: 'Preliminary (3 attempts)',
      results: this.results.map(r => ({
        rank: r.rank,
        chestNo: r.chestNo,
        name: r.name,
        college: r.college,
        best: r.preliminaryBest,
        attempts: r.preliminaryAttempts
      })),
      scoringRule: 'Higher distance = better rank',
      note: 'Top 8 will advance to final round'
    };
  }

  /**
   * Stage 6: Top Selection (Top 8)
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
        preliminaryBest: a.preliminaryBest
      })),
      note: `Top ${topCount} athletes selected for final round`
    };
  }

  /**
   * Stage 7: Heats Generation
   * For throws, this represents final round grouping
   */
  generateHeats() {
    this.heats = [];
    const athletes = this.topAthletes || this.results;

    // Group athletes (typically in reverse order for throwing)
    let currentGroup = [];
    for (let i = athletes.length - 1; i >= 0; i--) {
      currentGroup.push({
        ...athletes[i],
        finalRound: true
      });

      if (currentGroup.length === 8 || currentGroup.length === athletes.length) {
        this.heats.push({
          roundNumber: this.heats.length + 1,
          athletes: currentGroup.map((a, idx) => ({
            ...a,
            order: idx + 1
          }))
        });
        currentGroup = [];
      }
    }

    this.currentStage = 8;

    return {
      success: true,
      stage: this.currentStage,
      totalRounds: this.heats.length,
      heats: this.heats,
      attempts: this.finalAttempts
    };
  }

  /**
   * Stage 8: Heats Scoring (Final Round)
   */
  scoreHeats(finalRoundData) {
    this.heats = this.heats.map(heat => ({
      ...heat,
      athletes: heat.athletes.map(athlete => {
        const fdata = finalRoundData.find(fd => fd.chestNo === athlete.chestNo);
        
        const distances = [
          fdata?.a1 !== 'F' ? parseFloat(fdata?.a1) : null,
          fdata?.a2 !== 'F' ? parseFloat(fdata?.a2) : null,
          fdata?.a3 !== 'F' ? parseFloat(fdata?.a3) : null
        ].filter(d => d !== null && !isNaN(d));

        const finalBest = distances.length > 0 ? Math.max(...distances) : athlete.preliminaryBest;

        return {
          ...athlete,
          finalAttempts: {
            a1: fdata?.a1 || '',
            a2: fdata?.a2 || '',
            a3: fdata?.a3 || ''
          },
          finalBest: finalBest,
          overallBest: Math.max(athlete.preliminaryBest, finalBest)
        };
      })
    }));

    this.currentStage = 9;

    return {
      success: true,
      stage: this.currentStage,
      finalRoundsCompleted: this.heats.length
    };
  }

  /**
   * Stage 9: Pre-Final Sheet
   */
  generatePreFinalSheet() {
    const allAthletes = [];
    this.heats.forEach(heat => {
      allAthletes.push(...heat.athletes);
    });

    // Rank by overall best
    this.finalAthletes = rankByDistance(
      allAthletes.map(a => ({
        ...a,
        performance: a.overallBest
      }))
    );

    this.currentStage = 10;

    return {
      success: true,
      stage: this.currentStage,
      preFinalSheet: this.finalAthletes.map(a => ({
        rank: a.rank,
        chestNo: a.chestNo,
        name: a.name,
        college: a.college,
        overallBest: a.overallBest
      }))
    };
  }

  /**
   * Stage 10: Final Scoring
   */
  scoreFinal() {
    this.finalResults = this.finalAthletes;

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
        distance: a.overallBest,
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
      message: 'Throw event verified, published and locked'
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
      preliminaryAttempts: this.preliminaryAttempts,
      finalAttempts: this.finalAttempts,
      finalResults: this.finalResults.length > 0 ? this.finalResults : 'Pending'
    };
  }
}

module.exports = ThrowEventManager;
