/**
 * Combined Event Category Implementation
 * Decathlon (Men): 100m, LJ, SP, HJ, 400m (Day 1) + 110H, DT, PV, JT, 1500m (Day 2)
 * Heptathlon (Women): 100mH, HJ, SP, 200m (Day 1) + LJ, JT, 800m (Day 2)
 *
 * Rules:
 * - Only TOTAL POINTS entered manually
 * - No AFI scoring
 * - Highest total wins
 */

const {
  COMBINED_EVENTS,
  SCORING,
  DECATHLON_EVENTS,
  HEPTATHLON_EVENTS
} = require('../shared/constants');

const {
  rankByPoints,
  selectTop
} = require('../shared/utils');

class CombinedEventManager {
  constructor(eventName) {
    this.eventName = eventName;
    this.eventType = 'Combined';
    this.currentStage = 1;
    this.athletes = [];
    this.results = [];
    this.finalResults = [];

    // Determine event structure
    if (eventName.toLowerCase().includes('decathlon')) {
      this.eventStructure = 'Decathlon';
      this.events = DECATHLON_EVENTS;
      this.day1Events = 5;
      this.day2Events = 5;
    } else if (eventName.toLowerCase().includes('heptathlon')) {
      this.eventStructure = 'Heptathlon';
      this.events = HEPTATHLON_EVENTS;
      this.day1Events = 4;
      this.day2Events = 3;
    }
  }

  /**
   * Stage 1: Event Creation
   */
  createEvent(eventData) {
    this.eventName = eventData.name;
    this.eventType = 'Combined';
    this.eventDate = eventData.date;
    this.eventVenue = eventData.venue;
    this.currentStage = 2;

    return {
      success: true,
      message: `Combined event "${this.eventName}" created`,
      eventData: {
        name: this.eventName,
        type: this.eventType,
        structure: this.eventStructure,
        totalEvents: this.events.length,
        day1Events: this.day1Events,
        day2Events: this.day2Events,
        events: this.events
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
      totalAthletes: athletes.length,
      structure: this.eventStructure
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
   * Stage 4: Generate Event Sheets (Day 1)
   * Decathlon Day 1: SL | CHEST | NAME | COLLEGE | 100m | LJ | SP | HJ | 400m | DAY-1 POINTS
   * Heptathlon Day 1: SL | CHEST | NAME | COLLEGE | 100mH | HJ | SP | 200m | DAY-1 POINTS
   */
  generateEventSheets(day = 1) {
    const presentAthletes = this.athletes.filter(a => a.status === 'P');
    
    if (this.eventStructure === 'Decathlon') {
      if (day === 1) {
        var eventSheet = presentAthletes.map((a, idx) => ({
          slNo: idx + 1,
          chestNo: a.chestNo,
          name: a.name,
          college: a.college,
          event100m: '',
          eventLJ: '',
          eventSP: '',
          eventHJ: '',
          event400m: '',
          day1Points: ''
        }));
      } else {
        var eventSheet = presentAthletes.map((a, idx) => ({
          slNo: idx + 1,
          chestNo: a.chestNo,
          name: a.name,
          college: a.college,
          event110H: '',
          eventDT: '',
          eventPV: '',
          eventJT: '',
          event1500m: '',
          day2Points: ''
        }));
      }
    } else if (this.eventStructure === 'Heptathlon') {
      if (day === 1) {
        var eventSheet = presentAthletes.map((a, idx) => ({
          slNo: idx + 1,
          chestNo: a.chestNo,
          name: a.name,
          college: a.college,
          event100mH: '',
          eventHJ: '',
          eventSP: '',
          event200m: '',
          day1Points: ''
        }));
      } else {
        var eventSheet = presentAthletes.map((a, idx) => ({
          slNo: idx + 1,
          chestNo: a.chestNo,
          name: a.name,
          college: a.college,
          eventLJ: '',
          eventJT: '',
          event800m: '',
          day2Points: ''
        }));
      }
    }

    if (day === 1) {
      this.day1Sheet = eventSheet;
    } else {
      this.day2Sheet = eventSheet;
    }

    return {
      success: true,
      stage: this.currentStage,
      eventName: this.eventName,
      category: 'Combined',
      day: day,
      structure: this.eventStructure,
      format: {
        note: 'Enter TOTAL POINTS for the day. Manual point entry only.',
        totalEvents: day === 1 ? this.day1Events : this.day2Events
      },
      eventSheet: eventSheet,
      totalParticipants: presentAthletes.length
    };
  }

  /**
   * Stage 5: Round 1 Scoring (Day 1)
   */
  scoreRound1(day1Data) {
    const scored = this.athletes
      .filter(a => a.status === 'P')
      .map(athlete => {
        const ddata = day1Data.find(dd => dd.chestNo === athlete.chestNo);
        return {
          ...athlete,
          day1Points: parseFloat(ddata?.day1Points) || 0,
          day1Events: ddata?.events || {}
        };
      });

    this.day1Results = scored;
    this.currentStage = 6;

    return {
      success: true,
      stage: this.currentStage,
      day: 1,
      round: `Day 1 Scoring (${this.eventStructure})`,
      results: scored.map(r => ({
        chestNo: r.chestNo,
        name: r.name,
        college: r.college,
        day1Points: r.day1Points
      })),
      note: 'Day 1 points recorded'
    };
  }

  /**
   * Stage 6: Top Selection (optional for combined)
   * Usually all qualified athletes continue to Day 2
   */
  selectTopAthletes(topCount = 'all') {
    if (topCount === 'all') {
      this.topAthletes = this.day1Results;
    } else {
      this.topAthletes = selectTop(this.day1Results, topCount);
    }

    this.currentStage = 7;

    return {
      success: true,
      stage: this.currentStage,
      topCount: topCount === 'all' ? this.day1Results.length : topCount,
      selectedAthletes: this.topAthletes.map(a => ({
        chestNo: a.chestNo,
        name: a.name,
        day1Points: a.day1Points
      })),
      note: `${this.topAthletes.length} athletes continue to Day 2`
    };
  }

  /**
   * Stage 7: Heats Generation
   * For combined events, this is grouping for Day 2
   */
  generateHeats() {
    // Group athletes for Day 2 competition
    this.heats = [];
    const athletes = this.topAthletes || this.day1Results;

    let currentGroup = [];
    for (let i = 0; i < athletes.length; i++) {
      currentGroup.push(athletes[i]);

      if (currentGroup.length === 8 || i === athletes.length - 1) {
        this.heats.push({
          group: this.heats.length + 1,
          athletes: currentGroup.map((a, idx) => ({
            ...a,
            groupPosition: idx + 1
          }))
        });
        currentGroup = [];
      }
    }

    this.currentStage = 8;

    return {
      success: true,
      stage: this.currentStage,
      totalGroups: this.heats.length,
      note: 'Day 2 competition groups formed'
    };
  }

  /**
   * Stage 8: Heats Scoring (Day 2)
   */
  scoreHeats(day2Data) {
    this.heats = this.heats.map(heat => ({
      ...heat,
      athletes: heat.athletes.map(athlete => {
        const ddata = day2Data.find(dd => dd.chestNo === athlete.chestNo);
        return {
          ...athlete,
          day2Points: parseFloat(ddata?.day2Points) || 0,
          day2Events: ddata?.events || {}
        };
      })
    }));

    this.currentStage = 9;

    return {
      success: true,
      stage: this.currentStage,
      note: 'Day 2 scores recorded'
    };
  }

  /**
   * Stage 9: Pre-Final Sheet (Cumulative)
   */
  generatePreFinalSheet() {
    // Combine Day 1 and Day 2 totals
    const allAthletes = [];

    this.heats.forEach(heat => {
      heat.athletes.forEach(athlete => {
        const day1Result = this.day1Results.find(d => d.chestNo === athlete.chestNo);
        allAthletes.push({
          ...athlete,
          day1Points: day1Result?.day1Points || 0,
          day2Points: athlete.day2Points || 0,
          totalPoints: (day1Result?.day1Points || 0) + (athlete.day2Points || 0)
        });
      });
    });

    this.finalAthletes = rankByPoints(allAthletes.map(a => ({
      ...a,
      performance: a.totalPoints
    })));

    this.currentStage = 10;

    return {
      success: true,
      stage: this.currentStage,
      preFinalSheet: this.finalAthletes.map(a => ({
        chestNo: a.chestNo,
        name: a.name,
        college: a.college,
        day1Points: a.day1Points,
        day2Points: a.day2Points,
        totalPoints: a.totalPoints
      }))
    };
  }

  /**
   * Stage 10: Final Scoring
   */
  scoreFinal() {
    this.finalResults = this.finalAthletes.map(athlete => ({
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
        day1Points: a.day1Points,
        day2Points: a.day2Points,
        totalPoints: a.totalPoints,
        awardPoints: a.awardPoints
      })),
      scoringRule: '1st = 5 pts, 2nd = 3 pts, 3rd = 1 pt'
    };
  }

  /**
   * Stage 11: Final Announcement
   */
  announceResults() {
    this.currentStage = 12;

    const winners = {
      gold: this.finalResults.find(r => r.rank === 1),
      silver: this.finalResults.find(r => r.rank === 2),
      bronze: this.finalResults.find(r => r.rank === 3)
    };

    return {
      success: true,
      stage: this.currentStage,
      event: this.eventName,
      structure: this.eventStructure,
      winners: winners,
      allResults: this.finalResults
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
      message: 'Combined event verified, published and locked'
    };
  }

  /**
   * Get event summary
   */
  getEventSummary() {
    return {
      eventName: this.eventName,
      eventType: this.eventType,
      structure: this.eventStructure,
      currentStage: this.currentStage,
      totalAthletes: this.athletes.length,
      presentAthletes: this.athletes.filter(a => a.status === 'P').length,
      totalEvents: this.events.length,
      day1Events: this.day1Events,
      day2Events: this.day2Events,
      finalResults: this.finalResults.length > 0 ? this.finalResults : 'Pending'
    };
  }
}

module.exports = CombinedEventManager;
