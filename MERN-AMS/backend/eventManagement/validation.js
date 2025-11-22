/**
 * Data Validation Schema & Rules
 * Validates athlete data, performances, and event details
 */

const ValidationRules = {
  /**
   * Athlete Data Validation
   */
  athlete: {
    chestNo: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 10,
      pattern: /^[A-Z0-9]{1,10}$/,
      message: 'Chest number must be 1-10 alphanumeric characters'
    },
    name: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-'\.]{2,100}$/,
      message: 'Name must be 2-100 characters, letters/spaces/hyphens only'
    },
    college: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 100,
      message: 'College name required'
    },
    status: {
      type: 'string',
      required: true,
      enum: ['P', 'A', 'DIS'],
      message: 'Status must be P (Present), A (Absent), or DIS (Disqualified)'
    }
  },

  /**
   * Performance Data Validation
   */
  performance: {
    track: {
      format: 'HH:MM:SS:ML',
      type: 'time',
      pattern: /^([0-2][0-9]):([0-5][0-9]):([0-5][0-9]):([0-9]{2})$/,
      example: '00:10:45:32',
      message: 'Track time must be HH:MM:SS:ML format'
    },
    field: {
      format: 'decimal meters',
      type: 'number',
      minValue: 0.01,
      maxValue: 999.99,
      pattern: /^\d+(\.\d{1,2})?$/,
      example: '6.45',
      message: 'Distance must be decimal format (e.g., 6.45)'
    },
    combined: {
      format: 'integer points',
      type: 'integer',
      minValue: 0,
      maxValue: 99999,
      message: 'Points must be integer value'
    }
  },

  /**
   * Event Data Validation
   */
  event: {
    name: {
      type: 'string',
      required: true,
      minLength: 3,
      maxLength: 100,
      message: 'Event name required'
    },
    distance: {
      type: 'string',
      maxLength: 20,
      message: 'Event distance'
    },
    date: {
      type: 'date',
      required: true,
      message: 'Event date must be valid date'
    },
    venue: {
      type: 'string',
      maxLength: 200,
      message: 'Venue name'
    }
  },

  /**
   * Attendance Validation
   */
  attendance: {
    chestNo: {
      type: 'string',
      required: true,
      message: 'Chest number required'
    },
    status: {
      type: 'string',
      required: true,
      enum: ['P', 'A', 'DIS'],
      message: 'Status must be P, A, or DIS'
    }
  },

  /**
   * Heat/Lane Validation
   */
  heat: {
    heatNumber: {
      type: 'integer',
      required: true,
      minValue: 1,
      maxValue: 999,
      message: 'Invalid heat number'
    },
    lane: {
      type: 'integer',
      required: false,
      minValue: 1,
      maxValue: 10,
      message: 'Lane must be 1-10'
    },
    athletes: {
      type: 'array',
      minLength: 1,
      maxLength: 8,
      message: 'Heat must have 1-8 athletes'
    }
  },

  /**
   * Ranking & Awards Validation
   */
  result: {
    rank: {
      type: 'integer',
      required: true,
      minValue: 1,
      maxValue: 999,
      message: 'Rank must be positive integer'
    },
    performance: {
      type: 'string',
      required: true,
      message: 'Performance data required'
    },
    awardPoints: {
      type: 'integer',
      required: true,
      minValue: 0,
      enum: [5, 3, 1, 0],
      message: 'Award points must be 5, 3, 1, or 0'
    }
  }
};

/**
 * Validation Functions
 */
const Validators = {
  /**
   * Validate athlete data
   */
  validateAthlete(athlete) {
    const errors = [];

    // Check required fields
    if (!athlete.chestNo) {
      errors.push('Chest number is required');
    } else if (!ValidationRules.athlete.chestNo.pattern.test(athlete.chestNo)) {
      errors.push(ValidationRules.athlete.chestNo.message);
    }

    if (!athlete.name) {
      errors.push('Name is required');
    } else if (!ValidationRules.athlete.name.pattern.test(athlete.name)) {
      errors.push(ValidationRules.athlete.name.message);
    }

    if (!athlete.college) {
      errors.push('College is required');
    }

    if (athlete.status && !ValidationRules.athlete.status.enum.includes(athlete.status)) {
      errors.push(ValidationRules.athlete.status.message);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate track performance (time)
   */
  validateTrackPerformance(performance) {
    const pattern = ValidationRules.performance.track.pattern;
    const valid = pattern.test(performance);

    return {
      valid,
      error: valid ? null : ValidationRules.performance.track.message,
      format: ValidationRules.performance.track.example
    };
  },

  /**
   * Validate field performance (distance)
   */
  validateFieldPerformance(performance) {
    const num = parseFloat(performance);
    const pattern = ValidationRules.performance.field.pattern;
    const valid = pattern.test(performance) && 
                  num >= ValidationRules.performance.field.minValue &&
                  num <= ValidationRules.performance.field.maxValue;

    return {
      valid,
      error: valid ? null : ValidationRules.performance.field.message,
      format: ValidationRules.performance.field.example
    };
  },

  /**
   * Validate combined event points
   */
  validateCombinedPoints(points) {
    const num = parseInt(points);
    const valid = Number.isInteger(num) &&
                  num >= ValidationRules.performance.combined.minValue &&
                  num <= ValidationRules.performance.combined.maxValue;

    return {
      valid,
      error: valid ? null : ValidationRules.performance.combined.message
    };
  },

  /**
   * Validate event data
   */
  validateEvent(event) {
    const errors = [];

    if (!event.name || event.name.length < ValidationRules.event.name.minLength) {
      errors.push(ValidationRules.event.name.message);
    }

    if (!event.date || !(event.date instanceof Date)) {
      errors.push(ValidationRules.event.date.message);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Validate multiple athletes
   */
  validateAthletes(athletes) {
    const results = athletes.map(athlete => ({
      chestNo: athlete.chestNo,
      valid: this.validateAthlete(athlete).valid,
      errors: this.validateAthlete(athlete).errors
    }));

    const allValid = results.every(r => r.valid);

    return {
      valid: allValid,
      totalAthletes: athletes.length,
      validAthletes: results.filter(r => r.valid).length,
      invalidAthletes: results.filter(r => !r.valid),
      results
    };
  },

  /**
   * Validate performance data
   */
  validatePerformances(performances, category) {
    const results = [];

    performances.forEach(perf => {
      let validation;

      if (category === 'Track' || category === 'Relay') {
        validation = this.validateTrackPerformance(perf.performance);
      } else if (['Jump', 'Throw'].includes(category)) {
        validation = this.validateFieldPerformance(perf.performance);
      } else if (category === 'Combined') {
        validation = this.validateCombinedPoints(perf.performance);
      }

      results.push({
        chestNo: perf.chestNo,
        performance: perf.performance,
        ...validation
      });
    });

    const allValid = results.every(r => r.valid);

    return {
      valid: allValid,
      totalPerformances: performances.length,
      validPerformances: results.filter(r => r.valid).length,
      invalidPerformances: results.filter(r => !r.valid),
      results
    };
  }
};

/**
 * Sanitization Functions
 */
const Sanitizers = {
  /**
   * Sanitize athlete data
   */
  sanitizeAthlete(athlete) {
    return {
      chestNo: athlete.chestNo?.trim().toUpperCase() || '',
      name: athlete.name?.trim() || '',
      college: athlete.college?.trim() || '',
      status: athlete.status?.toUpperCase() || 'P'
    };
  },

  /**
   * Sanitize performance time
   */
  sanitizeTime(time) {
    // Remove spaces, ensure format HH:MM:SS:ML
    return time?.trim().replace(/\s/g, '') || '00:00:00:00';
  },

  /**
   * Sanitize distance
   */
  sanitizeDistance(distance) {
    const num = parseFloat(distance);
    return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
  },

  /**
   * Sanitize points
   */
  sanitizePoints(points) {
    const num = parseInt(points);
    return isNaN(num) ? 0 : num;
  }
};

/**
 * Error Messages
 */
const ErrorMessages = {
  INVALID_CHEST_NO: 'Invalid chest number format',
  INVALID_NAME: 'Invalid athlete name',
  INVALID_COLLEGE: 'Invalid college name',
  INVALID_STATUS: 'Invalid attendance status (must be P, A, or DIS)',
  INVALID_TIME: 'Invalid time format (must be HH:MM:SS:ML)',
  INVALID_DISTANCE: 'Invalid distance format (must be decimal meters)',
  INVALID_POINTS: 'Invalid points format (must be integer)',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  INVALID_HEAT_SIZE: 'Heat must have 1-8 athletes',
  INVALID_RANK: 'Invalid rank number',
  EVENT_NOT_FOUND: 'Event not found',
  STAGE_INVALID: 'Invalid stage number (must be 1-13)',
  STAGE_LOCKED: 'Event is locked and cannot be modified'
};

module.exports = {
  ValidationRules,
  Validators,
  Sanitizers,
  ErrorMessages
};
