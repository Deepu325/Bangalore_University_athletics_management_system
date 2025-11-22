#!/usr/bin/env node

/**
 * Event Flow Test Runner
 * Executes the comprehensive event flow test suite
 * Run with: node test_event_flow.js
 */

const EventFlowTestSuite = require('./eventManagement/eventFlowTestSuite');

console.clear();

const testSuite = new EventFlowTestSuite();
const results = testSuite.runAllTests();

// Exit with appropriate code
process.exit(results.success ? 0 : 1);
