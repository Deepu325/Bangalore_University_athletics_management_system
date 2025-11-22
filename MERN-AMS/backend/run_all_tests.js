#!/usr/bin/env node

/**
 * Complete Test Suite Runner
 * Runs all tests: Unit Tests + Integration Tests
 * Run with: node run_all_tests.js
 */

const EventFlowTestSuite = require('./eventManagement/eventFlowTestSuite');
const IntegrationTestSuite = require('./eventManagement/integrationTestSuite');

console.clear();

const unitResults = (() => {
  const suite = new EventFlowTestSuite();
  return suite.runAllTests();
})();

console.log('\n\n');

const integrationResults = (() => {
  const suite = new IntegrationTestSuite();
  return suite.runAllTests();
})();

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    COMPLETE TEST SUMMARY                   ║');
console.log('╚════════════════════════════════════════════════════════════╝');

const totalPassed = unitResults.passed + integrationResults.passed;
const totalFailed = unitResults.failed + integrationResults.failed;
const totalTests = unitResults.total + integrationResults.total;

console.log('\n📊 UNIT TESTS:');
console.log(`   ✓ Passed: ${unitResults.passed}`);
console.log(`   ✗ Failed: ${unitResults.failed}`);
console.log(`   Total:  ${unitResults.total}`);

console.log('\n📊 INTEGRATION TESTS:');
console.log(`   ✓ Passed: ${integrationResults.passed}`);
console.log(`   ✗ Failed: ${integrationResults.failed}`);
console.log(`   Total:  ${integrationResults.total}`);

console.log('\n📊 OVERALL RESULTS:');
console.log(`   ✓ Passed: ${totalPassed}`);
console.log(`   ✗ Failed: ${totalFailed}`);
console.log(`   Total:  ${totalTests}`);

const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0;
console.log(`   Success Rate: ${successRate}%`);

if (totalFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! EVENT FLOW IS PRODUCTION READY! 🎉\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${totalFailed} TEST(S) FAILED - REVIEW REQUIRED\n`);
  process.exit(1);
}
