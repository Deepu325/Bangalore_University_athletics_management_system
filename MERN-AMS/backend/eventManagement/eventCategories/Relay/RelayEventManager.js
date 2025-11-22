/**
 * Relay Event Category Implementation
 * 4×100m, 4×400m, Mixed 4×100m, Mixed 4×400m
 * 1 team = 4 athletes, assigned to 1 lane
 */

const {
  RELAY_EVENTS,
  SCORING,
  RELAY_TEAM_SIZE,
  HEAT_GROUP_SIZE
} = require('../shared/constants');

const {
  formatTime,
  parseTime,
  rankByTime,
  generateRelayHeats,
  selectTop,
  generateCallRoom,
  generateRelaySheet
} = require('../shared/utils');

class RelayEventManager {
  constructor(eventName) {
    this.eventName = eventName;
    this.eventType = 'Relay';
    this.currentStage = 1;
    this.teams = [];
    this.heats = [];
    this.results = [];
    this.finalResults = [];
  }

  /**
   * Stage 1: Event Creation
   */
  createEvent(eventData) {
    this.eventName = eventData.name;
    this.eventType = 'Relay';
    this.eventDistance = eventData.distance;
    this.eventDate = eventData.date;
    this.teamSize = RELAY_TEAM_SIZE; // Always 4
    this.currentStage = 2;

    return {
      success: true,
      message: `Relay event "${this.eventName}" created`,
      eventData: {
        name: this.eventName,
        type: this.eventType,
        distance: this.eventDistance,
        date: this.eventDate,
        teamSize: this.teamSize
      }
    };
  }

  /**
   * Stage 2: Call Room Generation (Team-based)
   * 4 rows per team
   * SL NO | CHEST NO | NAME | COLLEGE | REMARKS
   */
  generateCallRoom(teams) {
    this.teams = teams;
    this.currentStage = 3;

    // Flatten athletes from all teams
    const athletes = [];
    teams.forEach((team, teamIdx) => {
      team.athletes.forEach((athlete, pos) => {
        athletes.push({
          ...athlete,
          teamNumber: teamIdx + 1,
          position: pos + 1, // 1-4 (leg position)
          slNo: athletes.length + 1
        });
      });
    });

    const callRoom = athletes.map(a => ({
      slNo: a.slNo,
      chestNo: a.chestNo,
      name: a.name,
      college: a.college,
      remarks: 'P', // P = Present, A = Absent, DIS = Disqualified
      teamNumber: a.teamNumber,
      legPosition: a.position
    }));

    return {
      success: true,
      stage: this.currentStage,
      callRoom: callRoom,
      totalTeams: this.teams.length,
      totalAthletes: athletes.length,
      format: {
        headers: ['SL NO', 'CHEST NO', 'NAME', 'COLLEGE', 'REMARKS', 'TEAM #', 'LEG POSITION'],
        note: '4 athletes per team (4 legs)'
      }
    };
  }

  /**
   * Stage 3: Call Room Completion
   */
  completeCallRoom(attendanceData) {
    this.teams = this.teams.map(team => ({
      ...team,
      athletes: team.athletes.map(athlete => {
        const attendance = attendanceData.find(a => a.chestNo === athlete.chestNo);
        return {
          ...athlete,
          status: attendance?.status || 'P'
        };
      }),
      status: 'P' // Team status based on all athletes present
    }));

    const presentTeams = this.teams.filter(t => t.athletes.every(a => a.status === 'P'));
    this.currentStage = 4;

    return {
      success: true,
      stage: this.currentStage,
      statistics: {
        totalTeams: this.teams.length,
        presentTeams: presentTeams.length,
        incompleteTeams: this.teams.length - presentTeams.length
      }
    };
  }

  /**
   * Stage 4: Generate Event Sheets (Relay Format)
   * SL NO | CHEST NO | NAME | COLLEGE | LANE | TIME
   * (4 rows per team, LANE only in first row)
   */
  generateEventSheets() {
    const presentTeams = this.teams.filter(t => t.athletes.every(a => a.status === 'P'));
    const eventSheet = generateRelaySheet(presentTeams);
    this.currentStage = 5;

    return {
      success: true,
      stage: this.currentStage,
      eventName: this.eventName,
      category: 'Relay',
      format: {
        headers: ['SL NO', 'CHEST NO', 'NAME', 'COLLEGE', 'LANE', 'TIME'],
        note: 'LANE assigned to team (1st athlete row), TIME recorded once per team'
      },
      eventSheet: eventSheet,
      totalTeams: presentTeams.length
    };
  }

  /**
   * Stage 5: Round 1 Scoring
   * Input: Team times
   */
  scoreRound1(teamPerformances) {
    const scored = this.teams
      .filter(t => t.athletes.every(a => a.status === 'P'))
      .map((team, idx) => {
        const perf = teamPerformances.find(p => p.teamNumber === idx + 1);
        return {
          ...team,
          teamNumber: idx + 1,
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
      results: this.results.map(r => ({
        rank: r.rank,
        teamNumber: r.teamNumber,
        college: r.college,
        performance: r.performance,
        athletes: r.athletes.map(a => a.name).join(', ')
      })),
      scoringRule: 'Lower time = better rank'
    };
  }

  /**
   * Stage 6: Top Selection
   */
  selectTopTeams(topCount = 8) {
    this.topTeams = selectTop(this.results, topCount);
    this.currentStage = 7;

    return {
      success: true,
      stage: this.currentStage,
      topCount: topCount,
      selectedTeams: this.topTeams.map(t => ({
        rank: t.rank,
        college: t.college,
        performance: t.performance
      })),
      note: `Top ${topCount} teams selected`
    };
  }

  /**
   * Stage 7: Heats Generation (Team-based)
   */
  generateHeats() {
    this.heats = [];
    const teams = this.topTeams || this.results;

    let currentHeat = [];
    for (let i = 0; i < teams.length; i++) {
      currentHeat.push(teams[i]);

      // Teams per heat = HEAT_GROUP_SIZE / RELAY_TEAM_SIZE
      if (currentHeat.length === HEAT_GROUP_SIZE / RELAY_TEAM_SIZE || i === teams.length - 1) {
        const heatWithLanes = currentHeat.map((team, idx) => ({
          ...team,
          lane: [3, 4, 2, 5, 6, 1, 7, 8][idx] || idx + 1 // IAAF mapping
        }));

        this.heats.push({
          heatNumber: this.heats.length + 1,
          teams: heatWithLanes
        });

        currentHeat = [];
      }
    }

    this.currentStage = 8;

    return {
      success: true,
      stage: this.currentStage,
      totalHeats: this.heats.length,
      heats: this.heats.map(h => ({
        heatNumber: h.heatNumber,
        teams: h.teams.map(t => ({
          lane: t.lane,
          college: t.college,
          athletes: t.athletes.map(a => a.name).join(', ')
        }))
      }))
    };
  }

  /**
   * Stage 8: Heats Scoring
   */
  scoreHeats(heatPerformances) {
    this.heats = this.heats.map(heat => ({
      ...heat,
      teams: heat.teams.map(team => {
        const perf = heatPerformances.find(p => p.teamNumber === team.teamNumber);
        return {
          ...team,
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
      note: 'Heats scored. Top teams advance to finals.'
    };
  }

  /**
   * Stage 9: Pre-Final Sheet
   */
  generatePreFinalSheet() {
    const finalTeams = [];
    this.heats.forEach(heat => {
      const ranked = heat.teams.sort((a, b) =>
        parseTime(a.heatsPerformance) - parseTime(b.heatsPerformance)
      );
      finalTeams.push(...ranked.slice(0, 1));
    });

    // Top 8 teams
    this.finalTeams = finalTeams
      .sort((a, b) => parseTime(a.heatsPerformance) - parseTime(b.heatsPerformance))
      .slice(0, 8)
      .map((t, idx) => ({
        ...t,
        rank: idx + 1,
        lane: [3, 4, 2, 5, 6, 1, 7, 8][idx] || idx + 1
      }));

    this.currentStage = 10;

    return {
      success: true,
      stage: this.currentStage,
      preFinalSheet: this.finalTeams.map(t => ({
        lane: t.lane,
        college: t.college,
        heatsTime: t.heatsPerformance,
        finalTime: '' // To be filled
      }))
    };
  }

  /**
   * Stage 10: Final Scoring
   */
  scoreFinal(finalPerformances) {
    this.finalResults = this.finalTeams.map(team => {
      const perf = finalPerformances.find(p => p.teamNumber === team.teamNumber);
      return {
        ...team,
        finalPerformance: perf?.performance || team.heatsPerformance
      };
    });

    this.finalResults = rankByTime(this.finalResults);

    // Award points
    this.finalResults = this.finalResults.map(team => ({
      ...team,
      awardPoints: team.rank <= 3 ? SCORING[Object.keys(SCORING)[team.rank - 1]] : 0
    }));

    this.currentStage = 11;

    return {
      success: true,
      stage: this.currentStage,
      finalResults: this.finalResults.map(t => ({
        position: t.rank,
        college: t.college,
        performance: t.finalPerformance,
        points: t.awardPoints,
        athletes: t.athletes.map(a => a.name).join(', ')
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
      const team = this.finalResults.find(t => 
        t.athletes.some(a => a.chestNo === correction.oldChestNo)
      );
      if (team) {
        const athlete = team.athletes.find(a => a.chestNo === correction.oldChestNo);
        if (athlete) {
          athlete.name = correction.name || athlete.name;
          athlete.chestNo = correction.chestNo || athlete.chestNo;
          athlete.college = correction.college || athlete.college;
        }
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
      message: 'Relay event verified, published and locked'
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
      totalTeams: this.teams.length,
      presentTeams: this.teams.filter(t => t.athletes.every(a => a.status === 'P')).length,
      totalHeats: this.heats.length,
      finalResults: this.finalResults.length > 0 ? this.finalResults : 'Pending'
    };
  }
}

module.exports = RelayEventManager;
