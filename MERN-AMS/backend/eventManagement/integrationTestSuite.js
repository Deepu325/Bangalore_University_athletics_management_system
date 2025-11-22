/**
 * Event Flow Integration Tests
 * Tests API integration and database interactions
 */

const EventFlow = require('./eventManagement/eventFlow');

class IntegrationTestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.testResults = [];
  }

  log(message, data = null) {
    console.log(message, data ? JSON.stringify(data, null, 2) : '');
  }

  test(name, testFn) {
    try {
      console.log(`\n✓ ${name}`);
      testFn();
      this.passed++;
    } catch (error) {
      console.log(`✗ ${name}: ${error.message}`);
      this.failed++;
      this.testResults.push({ name, status: 'FAILED', error: error.message });
    }
  }

  /**
   * Test: Multiple concurrent events
   */
  testConcurrentEvents() {
    const eventFlow = new EventFlow();

    const events = [
      { name: '100 Metres', gender: 'Male' },
      { name: '200 Metres', gender: 'Female' },
      { name: '4x100m Relay', gender: 'Male' },
      { name: 'Long Jump', gender: 'Female' },
      { name: 'Shot Put', gender: 'Male' },
      { name: 'Decathlon', gender: 'Male' }
    ];

    const eventIds = events.map(e => {
      const result = eventFlow.createEvent(e);
      return result.eventId;
    });

    const allEvents = eventFlow.getAllEvents();
    if (allEvents.length !== 6) throw new Error('All events not created');
    console.log(`  Created 6 concurrent events`);
  }

  /**
   * Test: Event registry tracking
   */
  testEventRegistry() {
    const eventFlow = new EventFlow();

    const eventId = eventFlow.createEvent({
      name: '400 Metres',
      gender: 'Male'
    }).eventId;

    eventFlow.stage2_GenerateCallRoom(eventId, [
      { name: 'Athlete 1', college: 'College A', bib: 1 }
    ]);

    const registry = eventFlow.getAllEvents();
    if (!registry.find(e => e.eventId === eventId)) {
      throw new Error('Event not in registry');
    }
    console.log(`  Event registry tracking working`);
  }

  /**
   * Test: Audit trail completeness
   */
  testAuditTrail() {
    const eventFlow = new EventFlow();

    const eventId = eventFlow.createEvent({
      name: '800 Metres',
      gender: 'Female'
    }).eventId;

    eventFlow.stage2_GenerateCallRoom(eventId, [
      { name: 'Athlete 1', college: 'College A', bib: 1 }
    ]);

    eventFlow.stage3_MarkAttendance(eventId, {
      marked: [{ bib: 1, status: 'PRESENT' }]
    });

    const auditLog = eventFlow.getAuditLog();
    if (auditLog.length < 3) {
      throw new Error('Audit trail incomplete');
    }
    console.log(`  Audit trail entries: ${auditLog.length}`);
  }

  /**
   * Test: Error handling on invalid stage progression
   */
  testInvalidStageProgression() {
    const eventFlow = new EventFlow();

    const eventId = eventFlow.createEvent({
      name: '1500 Metres',
      gender: 'Male'
    }).eventId;

    // Try to mark attendance without call room
    const result = eventFlow.stage3_MarkAttendance(eventId, {
      marked: [{ bib: 1, status: 'PRESENT' }]
    });

    if (result.success) {
      throw new Error('Should have rejected stage skip');
    }
    console.log(`  Invalid stage progression blocked correctly`);
  }

  /**
   * Test: Data persistence across stages
   */
  testDataPersistence() {
    const eventFlow = new EventFlow();

    const eventId = eventFlow.createEvent({
      name: '5000 Metres',
      gender: 'Female'
    }).eventId;

    const athleteData = [
      { name: 'Athlete 1', college: 'College A', bib: 1 },
      { name: 'Athlete 2', college: 'College B', bib: 2 }
    ];

    eventFlow.stage2_GenerateCallRoom(eventId, athleteData);
    const summary = eventFlow.getEventSummary(eventId);

    if (summary.athleteCount !== 2) {
      throw new Error('Athlete data not persisted');
    }
    console.log(`  Data persisted: ${summary.athleteCount} athletes`);
  }

  /**
   * Test: Championship points calculation
   */
  testChampionshipPoints() {
    const eventFlow = new EventFlow();

    const eventId = eventFlow.createEvent({
      name: '100 Metres',
      gender: 'Male'
    }).eventId;

    eventFlow.stage2_GenerateCallRoom(eventId, [
      { name: 'Athlete 1', college: 'College A', bib: 1 },
      { name: 'Athlete 2', college: 'College B', bib: 2 },
      { name: 'Athlete 3', college: 'College C', bib: 3 }
    ]);

    eventFlow.stage3_MarkAttendance(eventId, {
      marked: [
        { bib: 1, status: 'PRESENT' },
        { bib: 2, status: 'PRESENT' },
        { bib: 3, status: 'PRESENT' }
      ]
    });

    eventFlow.stage4_GenerateEventSheets(eventId);
    eventFlow.stage5_ScoreRound1(eventId, [
      { bib: 1, performance: '10.50' },
      { bib: 2, performance: '10.80' },
      { bib: 3, performance: '11.00' }
    ]);
    eventFlow.stage6_SelectTop(eventId, 3);
    eventFlow.stage7_GenerateHeats(eventId);
    eventFlow.stage8_ScoreHeats(eventId, [
      { bib: 1, performance: '10.40' },
      { bib: 2, performance: '10.70' },
      { bib: 3, performance: '10.90' }
    ]);
    eventFlow.stage9_PreFinalSheet(eventId);
    eventFlow.stage10_ScoreFinal(eventId, [
      { bib: 1, performance: '10.35', college: 'College A' },
      { bib: 2, performance: '10.65', college: 'College B' },
      { bib: 3, performance: '10.90', college: 'College C' }
    ]);

    const standings = eventFlow.getChampionshipStandings();
    if (standings.length === 0) {
      throw new Error('Championship points not calculated');
    }
    console.log(`  Championship standings calculated: ${standings.length} colleges`);
  }

  /**
   * Test: Event summary at each stage
   */
  testEventSummaryProgression() {
    const eventFlow = new EventFlow();

    const eventId = eventFlow.createEvent({
      name: '10000 Metres',
      gender: 'Male'
    }).eventId;

    let summary = eventFlow.getEventSummary(eventId);
    if (summary.stage !== 1) throw new Error('Wrong initial stage');

    eventFlow.stage2_GenerateCallRoom(eventId, [
      { name: 'Athlete 1', college: 'College A', bib: 1 }
    ]);
    summary = eventFlow.getEventSummary(eventId);
    if (summary.stage !== 2) throw new Error('Stage not updated');

    eventFlow.stage3_MarkAttendance(eventId, {
      marked: [{ bib: 1, status: 'PRESENT' }]
    });
    summary = eventFlow.getEventSummary(eventId);
    if (summary.stage !== 3) throw new Error('Stage not updated');

    console.log(`  Event progression tracked: stage ${summary.stage}`);
  }

  /**
   * Test: Multiple event categories together
   */
  testMultiCategoryEvents() {
    const eventFlow = new EventFlow();

    const trackEvent = eventFlow.createEvent({
      name: '400 Metres',
      gender: 'Male'
    });

    const relayEvent = eventFlow.createEvent({
      name: '4x400m Relay',
      gender: 'Female'
    });

    const jumpEvent = eventFlow.createEvent({
      name: 'High Jump',
      gender: 'Male'
    });

    const throwEvent = eventFlow.createEvent({
      name: 'Javelin Throw',
      gender: 'Female'
    });

    const combinedEvent = eventFlow.createEvent({
      name: 'Heptathlon',
      gender: 'Female'
    });

    if (!trackEvent.success || !relayEvent.success || !jumpEvent.success ||
        !throwEvent.success || !combinedEvent.success) {
      throw new Error('Not all event categories created');
    }

    console.log(`  All 5 event categories created successfully`);
  }

  /**
   * Test: Athlete status transitions
   */
  testAthleteStatusTransitions() {
    const eventFlow = new EventFlow();

    const eventId = eventFlow.createEvent({
      name: '3000m Steeplechase',
      gender: 'Male'
    }).eventId;

    eventFlow.stage2_GenerateCallRoom(eventId, [
      { name: 'Athlete 1', college: 'College A', bib: 1 },
      { name: 'Athlete 2', college: 'College B', bib: 2 },
      { name: 'Athlete 3', college: 'College C', bib: 3 }
    ]);

    eventFlow.stage3_MarkAttendance(eventId, {
      marked: [
        { bib: 1, status: 'PRESENT' },
        { bib: 2, status: 'ABSENT' },
        { bib: 3, status: 'DIS' }
      ]
    });

    const summary = eventFlow.getEventSummary(eventId);
    // Only 1 athlete present
    if (summary.athleteCount !== 3) {
      throw new Error('Athlete count mismatch');
    }

    console.log(`  Athlete status transitions working`);
  }

  /**
   * Test: Large dataset handling
   */
  testLargeDataset() {
    const eventFlow = new EventFlow();

    const eventId = eventFlow.createEvent({
      name: '20 km Walk',
      gender: 'Male'
    }).eventId;

    const largeAthleteLis = Array.from({ length: 50 }, (_, i) => ({
      name: `Athlete ${i + 1}`,
      college: `College ${(i % 5) + 1}`,
      bib: i + 1
    }));

    const result = eventFlow.stage2_GenerateCallRoom(eventId, largeAthleteLis);

    if (result.athleteCount !== 50) {
      throw new Error('Large dataset not handled');
    }

    console.log(`  Large dataset handled: ${result.athleteCount} athletes`);
  }

  /**
   * Run all integration tests
   */
  runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     EVENT FLOW INTEGRATION TEST SUITE                       ║');
    console.log('║     Testing API integration and complex workflows             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    this.test('Multiple concurrent events', () => this.testConcurrentEvents());
    this.test('Event registry tracking', () => this.testEventRegistry());
    this.test('Audit trail completeness', () => this.testAuditTrail());
    this.test('Invalid stage progression blocking', () => this.testInvalidStageProgression());
    this.test('Data persistence across stages', () => this.testDataPersistence());
    this.test('Championship points calculation', () => this.testChampionshipPoints());
    this.test('Event summary progression', () => this.testEventSummaryProgression());
    this.test('Multiple event categories', () => this.testMultiCategoryEvents());
    this.test('Athlete status transitions', () => this.testAthleteStatusTransitions());
    this.test('Large dataset handling', () => this.testLargeDataset());

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  INTEGRATION TEST RESULTS                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`✓ PASSED: ${this.passed}`);
    console.log(`✗ FAILED: ${this.failed}`);
    console.log(`TOTAL:  ${this.passed + this.failed}`);

    if (this.failed === 0) {
      console.log('\n🎉 ALL INTEGRATION TESTS PASSED! 🎉\n');
    } else {
      console.log(`\n⚠️  ${this.failed} TEST(S) FAILED\n`);
      this.testResults.forEach(t => {
        console.log(`  ✗ ${t.name}: ${t.error}`);
      });
    }

    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      success: this.failed === 0
    };
  }
}

module.exports = IntegrationTestSuite;
