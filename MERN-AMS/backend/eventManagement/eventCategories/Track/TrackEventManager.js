/**
 * Track Event Category Implementation
 * Supports: 100m, 200m, 400m, 800m, 1500m, 5000m, 10000m, 100mH, 110mH, 400mH, 3000m SC, 20km Walk
 */

const {
  GLOBAL_HEADER,
  GLOBAL_FOOTER,
  STAGES,
  TRACK_EVENTS,
  IAAF_LANE_ASSIGNMENT,
  SCORING,
  HEAT_GROUP_SIZE
} = require('../shared/constants');

const {
  formatTime,
  parseTime,
  rankByTime,
  assignIAAFLanes,
  generateHeats,
  selectTop,
  generateCallRoom,
  generateTrackSheet
} = require('../shared/utils');

class TrackEventManager {
  constructor(eventName, eventType = 'Track') {
    this.eventName = eventName;
    this.eventType = eventType;
    this.currentStage = 1;
    this.athletes = [];
    this.heats = [];
    this.results = [];
    this.finalResults = [];
  }

  /**
   * Stage 1: Event Creation
   */
  createEvent(eventData) {
    this.eventName = eventData.name;
    this.eventDistance = eventData.distance;
    this.eventType = 'Track';
    this.eventDate = eventData.date;
    this.eventVenue = eventData.venue || 'UCPE Stadium, Jnanabharathi Campus';
    this.currentStage = 2;
    
    return {
      success: true,
      message: `Event "${this.eventName}" created successfully`,
      eventData: {
        name: this.eventName,
        distance: this.eventDistance,
        type: this.eventType,
        date: this.eventDate,
        venue: this.eventVenue,
        stage: this.currentStage
      }
    };
  }

  /**
   * Stage 2: Call Room Generation
   * Input: List of athletes from entry system
   */
  generateCallRoom(athletes) {
    this.athletes = athletes;
    this.currentStage = 3;
    
    const callRoom = generateCallRoom(this.athletes, 'P');
    
    return {
      success: true,
      stage: this.currentStage,
      callRoom: callRoom,
      totalAthletes: this.athletes.length,
      format: {
        headers: ['SL NO', 'CHEST NO', 'NAME', 'COLLEGE', 'REMARKS'],
        remarks: 'P = Present, A = Absent, DIS = Disqualified'
      }
    };
  }

  /**
   * Stage 3: Call Room Completion
   * Mark attendance, absences, disqualifications
   */
  completeCallRoom(attendanceData) {
    this.athletes = this.athletes.map(athlete => {
      const attendance = attendanceData.find(a => a.chestNo === athlete.chestNo);
      return {
        ...athlete,
        status: attendance?.status || 'P'
      };
    });
    
    const presentAthletes = this.athletes.filter(a => a.status === 'P');
    this.currentStage = 4;

    return {
      success: true,
      stage: this.currentStage,
      statistics: {
        total: this.athletes.length,
        present: presentAthletes.length,
        absent: this.athletes.filter(a => a.status === 'A').length,
        disqualified: this.athletes.filter(a => a.status === 'DIS').length
      }
    };
  }

  /**
   * Stage 4: Generate Event Sheets
   * Track Officials Sheet (Round 1)
   * SL NO | CHEST NO | NAME | COLLEGE | LANE | PERFORMANCE | REMARKS
   */
  generateEventSheets() {
    const presentAthletes = this.athletes.filter(a => a.status === 'P');
    const eventSheet = generateTrackSheet(presentAthletes);
    this.currentStage = 5;

    return {
      success: true,
      stage: this.currentStage,
      eventName: this.eventName,
      category: 'Track',
      format: {
        headers: ['SL NO', 'CHEST NO', 'NAME', 'COLLEGE', 'LANE', 'PERFORMANCE', 'REMARKS'],
        timeFormat: 'HH:MM:SS:ML',
        note: 'Performance column to be filled by official timer'
      },
      eventSheet: eventSheet,
      totalParticipants: presentAthletes.length
    };
  }

  /**
   * Stage 5: Round 1 Scoring
   * Input: Performances (times)
   */
  scoreRound1(performances) {
    const scored = this.athletes
      .filter(a => a.status === 'P')
      .map(athlete => {
        const perf = performances.find(p => p.chestNo === athlete.chestNo);
        return {
          ...athlete,
          performance: perf?.performance || '',
          performanceInSeconds: parseTime(perf?.performance || '')
        };
      });

    this.results = rankByTime(scored);
    this.currentStage = 6;

    return {
      success: true,
      stage: this.currentStage,
      round: 'Round 1',
      results: this.results,
      scoringRule: 'Lower time = better rank',
      awardingRule: '1st = 5 pts, 2nd = 3 pts, 3rd = 1 pt'
    };
  }

  /**
   * Stage 6: Top Selection
   * Select Top 8 or Top 16 for heats
   */
  selectTopAthletes(topCount = 8) {
    this.topAthletes = selectTop(this.results, topCount);
    this.currentStage = 7;

    return {
      success: true,
      stage: this.currentStage,
      topCount: topCount,
      selectedAthletes: this.topAthletes,
      note: `Top ${topCount} athletes selected based on Round 1 performance`
    };
  }

  /**
   * Stage 7: Heats Generation
   * IAAF lane assignment: 1→3, 2→4, 3→2, 4→5, 5→6, 6→1, 7→7, 8→8
   */
  generateHeats() {
    this.heats = [];
    const athletes = this.topAthletes || this.results;
    
    // Divide into groups of 8 (or 7,7 if odd)
    let currentHeat = [];
    for (let i = 0; i < athletes.length; i++) {
      currentHeat.push(athletes[i]);

      // Create heat when we have 8 athletes or at the end
      if (currentHeat.length === HEAT_GROUP_SIZE || i === athletes.length - 1) {
        // Assign lanes to athletes in this heat
        const heatWithLanes = assignIAAFLanes(currentHeat.map((a, idx) => ({
          ...a,
          heatPosition: idx + 1
        })));

        this.heats.push({
          heatNumber: this.heats.length + 1,
          athletes: heatWithLanes
        });

        currentHeat = [];
      }
    }

    this.currentStage = 8;

    return {
      success: true,
      stage: this.currentStage,
      totalHeats: this.heats.length,
      heats: this.heats,
      laneAssignment: 'IAAF Standard (Rank 1→Lane 3, etc.)',
      format: {
        headers: ['HEAT', 'LANE', 'CHEST NO', 'NAME', 'COLLEGE', 'RANK']
      }
    };
  }

  /**
   * Stage 8: Heats Scoring
   * Input: Performance times for each heat
   */
  scoreHeats(heatPerformances) {
    this.heats = this.heats.map(heat => ({
      ...heat,
      athletes: heat.athletes.map(athlete => {
        const perf = heatPerformances.find(p => p.chestNo === athlete.chestNo);
        return {
          ...athlete,
          heatsPerformance: perf?.performance || '',
          heatsTimeInSeconds: parseTime(perf?.performance || '')
        };
      })
    }));

    this.currentStage = 9;

    return {
      success: true,
      stage: this.currentStage,
      heatsCompleted: this.heats.length,
      note: 'Heats scored. Top finishers advance to finals.'
    };
  }

  /**
   * Stage 9: Pre-Final Sheet
   * Top 8 with lane mapping and empty performance columns
   */
  generatePreFinalSheet() {
    const heatWinners = [];
    this.heats.forEach(heat => {
      const ranked = heat.athletes.sort((a, b) => 
        parseTime(a.heatsPerformance) - parseTime(b.heatsPerformance)
      );
      heatWinners.push(...ranked.slice(0, 1)); // Top from each heat
    });

    // Get top 8 overall
    const finalAthletes = heatWinners
      .sort((a, b) => parseTime(a.heatsPerformance) - parseTime(b.heatsPerformance))
      .slice(0, 8);

    // Assign lanes
    this.finalAthletes = assignIAAFLanes(finalAthletes.map((a, idx) => ({
      ...a,
      rank: idx + 1
    })));

    this.currentStage = 10;

    return {
      success: true,
      stage: this.currentStage,
      preFinalSheet: this.finalAthletes.map(a => ({
        lane: a.lane,
        chestNo: a.chestNo,
        name: a.name,
        college: a.college,
        heatsTime: a.heatsPerformance,
        finalPerformance: '' // To be filled by officials
      })),
      totalFinalists: this.finalAthletes.length
    };
  }

  /**
   * Stage 10: Final Scoring
   * Rank finalists and award points
   */
  scoreFinal(finalPerformances) {
    this.finalResults = this.finalAthletes.map(athlete => {
      const perf = finalPerformances.find(p => p.chestNo === athlete.chestNo);
      return {
        ...athlete,
        finalPerformance: perf?.performance || athlete.heatsPerformance
      };
    });

    // Rank by final performance
    this.finalResults = rankByTime(this.finalResults);

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
        performance: a.finalPerformance,
        points: a.awardPoints
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
      winners: winners,
      allResults: this.finalResults
    };
  }

  /**
   * Stage 12: Name Correction
   * Allow editing of name, chest number, college
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
      message: 'Athlete data corrected',
      correctedRecords: corrections.length
    };
  }

  /**
   * Stage 13: Verification & Publish/Lock
   */
  publishAndLock(verificationData) {
    const isVerified = verificationData.verified;
    const committee = verificationData.committee;

    this.eventLocked = true;
    this.verified = isVerified;
    this.committee = committee;
    this.publishedDate = new Date();

    return {
      success: true,
      stage: this.currentStage,
      eventLocked: true,
      verified: isVerified,
      committee: committee,
      publishedDate: this.publishedDate,
      finalResults: this.finalResults,
      message: 'Event verified, published and locked'
    };
  }

  /**
   * Get event summary
   */
  getEventSummary() {
    return {
      eventName: this.eventName,
      distance: this.eventDistance,
      eventType: this.eventType,
      currentStage: this.currentStage,
      stageName: STAGES[this.currentStage],
      totalAthletes: this.athletes.length,
      presentAthletes: this.athletes.filter(a => a.status === 'P').length,
      totalHeats: this.heats.length,
      finalResults: this.finalResults.length > 0 ? this.finalResults : 'Pending',
      eventLocked: this.eventLocked || false
    };
  }
}

module.exports = TrackEventManager;
