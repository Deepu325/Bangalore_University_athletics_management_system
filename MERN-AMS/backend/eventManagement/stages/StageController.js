/**
 * Stage Controller - Manages progression through 13 stages
 * Handles common stage logic across all event categories
 */

const {
  STAGES,
  GLOBAL_HEADER,
  GLOBAL_FOOTER
} = require('../shared/constants');

class StageController {
  constructor(eventManager) {
    this.eventManager = eventManager;
    this.stageHistory = [];
    this.stageData = {};
  }

  /**
   * Progress to next stage with validation
   */
  progressToNextStage(currentStage, data) {
    const nextStage = currentStage + 1;

    if (nextStage > 13) {
      return {
        success: false,
        error: 'Event workflow complete at stage 13'
      };
    }

    // Store stage data
    this.stageData[currentStage] = data;
    this.stageHistory.push({
      stage: currentStage,
      timestamp: new Date(),
      data: data
    });

    return {
      success: true,
      currentStage: nextStage,
      stageName: STAGES[nextStage],
      history: this.stageHistory
    };
  }

  /**
   * Get current stage information
   */
  getCurrentStageInfo(stage) {
    return {
      stageNumber: stage,
      stageName: STAGES[stage],
      description: this.getStageDescription(stage),
      expectedInputs: this.getExpectedInputs(stage)
    };
  }

  /**
   * Stage descriptions
   */
  getStageDescription(stage) {
    const descriptions = {
      1: 'Create event details and setup',
      2: 'Generate call room from entry system',
      3: 'Mark attendance and prepare athletes',
      4: 'Generate sheets for officials to fill',
      5: 'Enter round 1 performances and rank',
      6: 'Select top performers for heats/finals',
      7: 'Generate heat groupings with lane assignments',
      8: 'Enter heat performances',
      9: 'Prepare pre-final sheet with finalists',
      10: 'Enter final performances and rank',
      11: 'Display final results and winners',
      12: 'Make name/chest number corrections',
      13: 'Verify, sign off, lock, and publish'
    };
    return descriptions[stage] || 'Unknown stage';
  }

  /**
   * Expected inputs for each stage
   */
  getExpectedInputs(stage) {
    const inputs = {
      1: ['eventName', 'eventDistance', 'eventDate'],
      2: ['athletes', 'colleges'],
      3: ['attendanceData'],
      4: [], // Auto-generated
      5: ['performances'],
      6: ['topCount'],
      7: [], // Auto-generated
      8: ['heatPerformances'],
      9: [], // Auto-generated
      10: ['finalPerformances'],
      11: [], // Auto-generated
      12: ['corrections'],
      13: ['verificationData', 'committee']
    };
    return inputs[stage] || [];
  }

  /**
   * Validate stage progression
   */
  validateStageProgression(fromStage, toStage) {
    if (toStage !== fromStage + 1) {
      return {
        valid: false,
        error: 'Can only progress to next sequential stage'
      };
    }

    return {
      valid: true
    };
  }

  /**
   * Get stage history
   */
  getStageHistory() {
    return this.stageHistory;
  }

  /**
   * Can go back to previous stage (with data restoration)
   */
  revertToPreviousStage(currentStage) {
    if (currentStage <= 1) {
      return {
        success: false,
        error: 'Cannot revert before stage 1'
      };
    }

    const previousStage = currentStage - 1;
    const previousData = this.stageData[previousStage];

    return {
      success: true,
      revertedToStage: previousStage,
      restoredData: previousData
    };
  }
}

module.exports = StageController;
