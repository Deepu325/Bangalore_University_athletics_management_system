import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { generateHeats, generateSets, assignRandomLanes } from '../utils/heatGenerator';
import { formatTimeInput, formatToDecimal } from '../utils/inputFormatters';
import { getEventAthletes, getCallRoomAthletes, getFinalists, getFinalResults } from '../utils/eventAthleteUtils';
import { getHeaderHTML, getFooterHTML } from './BUHeaderFooter';
import { TimeInput, DecimalInput, IntegerInput } from './ScoreInputs';

// API Base URL Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// ========================================
// PRINT/PDF UTILITY
// ========================================
const printSheet = (content, filename = 'sheet') => {
  const printWindow = window.open('', '', 'width=1200,height=700');
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; background: white; color: #000; }
          .page { 
            page-break-after: always; 
            padding: 15px; 
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          .page:last-child { page-break-after: avoid; }
          .page-header { 
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px;
            font-size: 11px;
          }
          .page-header img { 
            height: 70px; 
            width: auto; 
            object-fit: contain;
            margin-right: 15px;
            flex-shrink: 0;
          }
          .page-header h1 { font-size: 14px; font-weight: bold; margin: 0px 0; }
          .page-header h2 { font-size: 12px; font-weight: bold; margin: 1px 0; }
          .page-header h3 { font-size: 11px; font-weight: bold; margin: 2px 0; }
          .page-header p { font-size: 10px; margin: 1px 0; }
          .page-header p { font-size: 10px; margin: 1px 0; }
          .content { flex: 1; }
          .page-footer { 
            border-top: 1px solid #ccc; 
            padding-top: 6px; 
            padding-bottom: 6px;
            font-size: 9px; 
            text-align: center;
            margin-top: auto;
            background-color: #f9f9f9;
          }
          .page-footer p { margin: 2px 0; font-size: 9px; line-height: 1.4; }
          .page-num { text-align: center; font-size: 9px; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { background-color: #d0d0d0; padding: 6px; text-align: left; font-weight: bold; font-size: 10px; border: 1px solid #000; }
          td { padding: 6px; text-align: left; font-size: 10px; border: 1px solid #000; }
          tr:nth-child(even) { background-color: #f5f5f5; }
          .center { text-align: center; }
          .logo { float: right; font-size: 12px; margin-bottom: 5px; }
          h3 { font-size: 11px; margin: 8px 0 5px 0; }
          @media print { 
            body { padding: 0; } 
            .page { page-break-after: always; }
            .page:last-child { page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

const EventManagementNew = ({ pedCollege, onBackToDashboard }) => {
  // ========================================
  // CONFIGURATION & CONSTANTS
  // ========================================

  // Canonical event names (single source of truth)
  const EVENT_DB = {
    Track: {
      men: [
        '100 Metres', '200 Metres', '400 Metres', '800 Metres', '1500 Metres',
        '5000 Metres', '10,000 Metres', '110 Metres Hurdles', '100 Metres Hurdles',
        '400 Metres Hurdles', '20 km Walk', '3000 Metres Steeple Chase', 'Half Marathon'
      ],
      women: [
        '100 Metres', '200 Metres', '400 Metres', '800 Metres', '1500 Metres',
        '5000 Metres', '10,000 Metres', '100 Metres Hurdles', '110 Metres Hurdles',
        '400 Metres Hurdles', '20 km Walk', '3000 Metres Steeple Chase', 'Half Marathon'
      ]
    },
    Jump: ['High Jump', 'Long Jump', 'Pole Vault', 'Triple Jump'],
    Throw: ['Discus Throw', 'Hammer Throw', 'Javelin Throw', 'Shot Put'],
    Relay: ['4 × 100 Metres Relay', '4 × 400 Metres Relay', '4 × 400 Metres Mixed Relay'],
    Combined: { Men: 'Decathlon', Women: 'Heptathlon' }
  };

  // Combined Event Details
  const COMBINED_EVENTS = {
    Decathlon: {
      day1: ['100m', 'Long Jump', 'Shot Put', 'High Jump', '400m'],
      day2: ['110m Hurdles', 'Discus Throw', 'Pole Vault', 'Javelin Throw', '1500m']
    },
    Heptathlon: {
      day1: ['100m Hurdles', 'High Jump', 'Shot Put', '200m'],
      day2: ['Long Jump', 'Javelin Throw', '800m']
    }
  };

  const LANES = [3, 4, 2, 5, 6, 1, 7, 8];
  const MEDAL_POINTS = { 1: 5, 2: 3, 3: 1 };

  // ========================================
  // DISPLAY FORMATTER HELPER
  // ========================================

  const formatPerformanceForDisplay = (value, eventCategory) => {
    if (!value) return value;
    
    // If already formatted (contains colons or is DNF/DIS), return as-is
    if (value.includes(':') || value === 'DNF' || value === 'DIS') {
      return value;
    }

    // For track events, format as time
    if (eventCategory === 'Track' || eventCategory === 'Relay') {
      return formatTimeInput(value);
    }

    // For field events, format as decimal
    if (eventCategory === 'Jump' || eventCategory === 'Throw') {
      return formatToDecimal(value);
    }

    return value;
  };

  // ========================================
  // BU HEADER & FOOTER FUNCTIONS (DEFINED FIRST)
  // ========================================

  const getBUHeader = () => getHeaderHTML();

  const getBUFooter = (currentPage, totalPages) => getFooterHTML(currentPage, totalPages);

  // ========================================
  // STATE MANAGEMENT
  // ========================================

  const [allEvents, setAllEvents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('athleticsEventsNew') || '[]');
    } catch {
      return [];
    }
  });

  const [currentEventId, setCurrentEventId] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);

  const [appState, setAppState] = useState({
    event: null,
    athletes: [],
    statusFlow: {},
    trackSets: [],
    jumpSheets: [],
    throwSheets: [],
    relaySheets: [],
    combinedSheets: [],
    heats: {},
    round1Results: [],
    finalResults: [],
    remarks: {},
    statuses: {},
    nameCorrections: {},
    topSelection: 8,
    topAthletes: [],
    oddGroup: [],
    evenGroup: [],
    heatsResults: [],
    finalists: []
  });

  // Separate state for combined event total values to prevent parent re-render on each keystroke
  const [combinedTotalValues, setCombinedTotalValues] = useState({});

  // State for heats scoring input
  const [heatsScores, setHeatsScores] = useState({});

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  const timeToMs = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 3) {
      return parts[0] * 60000 + parts[1] * 1000 + parts[2];
    }
    if (parts.length === 4) {
      return parts[0] * 3600000 + parts[1] * 60000 + parts[2] * 1000 + parts[3];
    }
    return 0;
  };

  const generateEventId = () => `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // ========================================
  // CORE ALGORITHMS
  // ========================================

  // ========================================
  // HEAT/SET GENERATION FUNCTIONS
  // ========================================

  const assignLanes = (athletes) => {
    return athletes.map((athlete, index) => ({
      ...athlete,
      lane: LANES[index % LANES.length]
    }));
  };

  const rankByPerformance = (list, type) => {
    const normal = [];
    const dnf = [];
    const dis = [];

    list.forEach(a => {
      const p = (a.performance || '').toUpperCase();
      if (p === 'DIS') dis.push(a);
      else if (p === 'DNF') dnf.push(a);
      else normal.push(a);
    });

    // Sort normal athletes
    if (type === 'track' || type === 'relay') {
      normal.sort((a, b) => timeToMs(a.performance) - timeToMs(b.performance));
    } else if (type === 'combined') {
      normal.sort((a, b) => (parseFloat(b.performance) || 0) - (parseFloat(a.performance) || 0));
    } else {
      // field events: larger is better
      normal.sort((a, b) => (parseFloat(b.performance) || 0) - (parseFloat(a.performance) || 0));
    }

    const ranked = [...normal, ...dnf, ...dis];

    ranked.forEach((a, i) => {
      a.rank = i + 1;
      a.points = MEDAL_POINTS[a.rank] || 0;
    });

    return ranked;
  };

  // ========================================
  // PHASE 4: HEATS SCORING & FINALISTS
  // ========================================

  // Convert IAAF seed (1-8) to lane number
  const IAAF_LANE_MAP = [3, 4, 2, 5, 6, 1, 7, 8];
  
  const seedToLane = (seed) => {
    if (seed >= 1 && seed <= 8) {
      return IAAF_LANE_MAP[seed - 1];
    }
    return seed;
  };

  // Extract finalists from heats results and apply lane mapping
  const extractFinalists = async () => {
    try {
      if (!Array.isArray(appState.heatsResults) || appState.heatsResults.length === 0) {
        alert('❌ No heats results to process');
        return false;
      }

      // Flatten all heat results and sort by performance
      const allHeatsAthlete = [];
      appState.heatsResults.forEach(heat => {
        if (Array.isArray(heat.athletes)) {
          heat.athletes.forEach(athlete => {
            allHeatsAthlete.push({
              ...athlete,
              heatNo: heat.heatNo
            });
          });
        }
      });

      // Sort by performance (time or distance)
      const isTimeEvent = appState.event?.category === 'Track' || appState.event?.category === 'Relay';
      if (isTimeEvent) {
        allHeatsAthlete.sort((a, b) => timeToMs(a.performance) - timeToMs(b.performance));
      } else {
        allHeatsAthlete.sort((a, b) => parseFloat(b.performance || 0) - parseFloat(a.performance || 0));
      }

      // Take top 8 and assign IAAF lanes
      const top8 = allHeatsAthlete.slice(0, 8).map((athlete, idx) => ({
        athleteId: athlete.athleteId,
        bibNumber: athlete.bibNumber,
        name: athlete.name,
        college: athlete.college,
        lane: seedToLane(idx + 1),  // IAAF lane assignment
        seed: idx + 1
      }));

      // Update appState with finalists
      setAppState(prev => ({
        ...prev,
        finalists: top8,
        heatsResults: appState.heatsResults
      }));

      // Save to backend
      const response = await axios.post(
        `${API_BASE_URL}/api/events/${appState.event._id}/final-sheet`,
        {
          finalists: top8,
          stage: 'pre-final-generated'
        }
      );

      console.log('✅ Finalists saved:', response.data);
      return true;
    } catch (err) {
      console.error('❌ Error extracting finalists:', err);
      alert('Error saving finalists: ' + (err.response?.data?.message || err.message));
      return false;
    }
  };

  // Save heats results to backend
  const saveHeatsResults = async () => {
    try {
      if (!Array.isArray(appState.heatsResults) || appState.heatsResults.length === 0) {
        alert('❌ No heats to save');
        return false;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/events/${appState.event._id}/heats-results`,
        { heatsResults: appState.heatsResults }
      );

      console.log('✅ Heats results saved:', response.data);
      return true;
    } catch (err) {
      console.error('❌ Error saving heats results:', err);
      alert('Error saving heats: ' + (err.response?.data?.message || err.message));
      return false;
    }
  };

  // ========================================
  // PERSISTENCE
  // ========================================

  const saveEventState = () => {
    if (!currentEventId) return;

    const eventIndex = allEvents.findIndex(e => e.id === currentEventId);
    const eventData = {
      id: currentEventId,
      ...appState,
      lastModified: new Date().toISOString()
    };

    let updatedEvents;
    if (eventIndex >= 0) {
      updatedEvents = [...allEvents];
      updatedEvents[eventIndex] = eventData;
    } else {
      updatedEvents = [...allEvents, eventData];
    }

    setAllEvents(updatedEvents);
    localStorage.setItem('athleticsEventsNew', JSON.stringify(updatedEvents));
  };

  const loadEventState = (eventId) => {
    const eventData = allEvents.find(e => e.id === eventId);
    if (!eventData) return false;

    setCurrentEventId(eventId);
    setAppState({
      event: eventData.event || null,
      athletes: eventData.athletes || [],
      statusFlow: eventData.statusFlow || {},
      trackSets: eventData.trackSets || [],
      jumpSheets: eventData.jumpSheets || [],
      throwSheets: eventData.throwSheets || [],
      relaySheets: eventData.relaySheets || [],
      combinedSheets: eventData.combinedSheets || [],
      heats: eventData.heats || {},
      round1Results: eventData.round1Results || [],
      finalResults: eventData.finalResults || [],
      remarks: eventData.remarks || {},
      statuses: eventData.statuses || {},
      nameCorrections: eventData.nameCorrections || {}
    });
    return true;
  };

  // ========================================
  // STAGE HANDLERS
  // ========================================

  // STAGE 1: Create Event - actually just SELECT and LOAD an existing backend event
  const handleCreateEvent = async (eventData) => {
    try {
      console.log('📋 Form submitted - selecting event:', eventData);
      
      // Map form gender (Men/Women) to backend gender (Male/Female)
      const genderMap = { 'Men': 'Male', 'Women': 'Female' };
      const backendGender = genderMap[eventData.gender] || eventData.gender;
      const backendCategory = eventData.category.toLowerCase(); // Convert to lowercase!
      
      console.log('🔍 Searching backend for:', { name: eventData.eventName, category: backendCategory, gender: backendGender });
      
      // Step 1: Fetch ALL backend events
      let eventsResponse;
      try {
        eventsResponse = await fetch(`${API_BASE_URL}/api/events`);
        if (!eventsResponse.ok) {
          throw new Error(`HTTP ${eventsResponse.status}`);
        }
      } catch (error) {
        console.error('❌ Failed to fetch events from backend:', error);
        alert(`Backend connection failed: ${error.message}\nMake sure backend is running on port 5002`);
        return;
      }
      
      const allBackendEvents = await eventsResponse.json();
      
      // Ensure it's an array
      if (!Array.isArray(allBackendEvents)) {
        console.error('❌ Backend returned invalid data:', allBackendEvents);
        alert('Backend returned invalid data. Expected array of events.');
        return;
      }
      
      console.log('📦 Backend has', allBackendEvents.length, 'events');
      
      // Step 2: Find the event matching form selection
      const matchedEvent = allBackendEvents.find(e => {
        const nameMatch = e.name === eventData.eventName;
        const categoryMatch = e.category === backendCategory;
        const genderMatch = e.gender === backendGender;
        console.log(`  Checking: ${e.name} | ${e.category} | ${e.gender} → name:${nameMatch} cat:${categoryMatch} gender:${genderMatch}`);
        return nameMatch && categoryMatch && genderMatch;
      });
      
      if (!matchedEvent) {
        console.error('❌ Event NOT found in backend DB');
        console.error('   Searched for:', { name: eventData.eventName, category: backendCategory, gender: backendGender });
        console.error('   Available events:', allBackendEvents.map(e => `${e.name}|${e.category}|${e.gender}`));
        alert(`Event "${eventData.eventName}" (${eventData.gender}) not found. Check if it exists in database.`);
        return;
      }
      
      console.log('✅ Found backend event with ID:', matchedEvent._id);
      
      // Step 3: Fetch athletes registered for this event
      const athleteResponse = await fetch(`${API_BASE_URL}/api/events/${matchedEvent._id}/athletes`);
      const athleteData = await athleteResponse.json();
      
      const realAthletes = (athleteData.athletes || []).map(a => ({
        ...a,
        status: "PRESENT",
        remarks: ""
      }));
      console.log(`✅ Event has ${realAthletes.length} registered athletes`);

      // Step 4: Update app state with backend event
      const newEvent = {
        id: generateEventId(),
        eventData: { ...eventData, _id: matchedEvent._id, backendId: matchedEvent._id },
        athletes: realAthletes,
        statusFlow: { created: true },
        currentStage: 2
      };

      setCurrentEventId(newEvent.id);
      setAppState(prev => ({
        ...prev,
        event: { ...eventData, _id: matchedEvent._id, backendId: matchedEvent._id, category: matchedEvent.category },
        athletes: realAthletes,
        statusFlow: { created: true }
      }));
      
      console.log('✅ Event loaded successfully, moving to Stage 2');
      setCurrentStage(2);
    } catch (error) {
      console.error('❌ Error in handleCreateEvent:', error);
      alert('Error: ' + error.message);
    }
  };

  // STAGE 2: Generate Call Room Sheet
  const generateCallRoomSheet = () => {
    setAppState(prev => ({
      ...prev,
      statusFlow: { ...prev.statusFlow, callRoomGenerated: true }
    }));
    setCurrentStage(3);
  };

  // Delete Event Handler
  const handleDeleteEvent = () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    // Remove event from allEvents
    const updatedEvents = allEvents.filter(e => e.id !== currentEventId);
    setAllEvents(updatedEvents);
    localStorage.setItem('athleticsEventsNew', JSON.stringify(updatedEvents));

    alert('Event deleted successfully');
    if (onBackToDashboard) {
      onBackToDashboard();
    }
  };

  // STAGE 3: Complete Call Room (Mark Attendance)
  const handleMarkAttendance = (athleteId, status, remarks = '') => {
    setAppState(prev => {
      const updatedAthletes = prev.athletes.map(a =>
        a._id === athleteId || a.id === athleteId ? { ...a, status, remarks } : a
      );
      return { ...prev, athletes: updatedAthletes };
    });
  };

  const completeCallRoom = () => {
    setAppState(prev => ({
      ...prev,
      statusFlow: { ...prev.statusFlow, callRoomCompleted: true }
    }));
    setCurrentStage(4);
  };

  // STAGE 4: Generate Event Sheets
  const generateEventSheets = async () => {
    try {
      const eventId = appState.event._id;
      console.log('🎯 Generating sheets for event:', eventId, appState.event);
      
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/generate-sheet`);
      const data = await response.json();

      console.log('📊 API Response:', data);

      if (!response.ok || !data.success) {
        const errorMsg = data.error || data.message || data.details || 'Unknown error';
        console.error('❌ Error:', errorMsg);
        alert('Error generating sheets: ' + errorMsg);
        return;
      }

      const eventCategory = appState.event.category?.toLowerCase();
      console.log('📊 Event category:', eventCategory, '| Data keys:', Object.keys(data));

      // Get athletes using universal utility (handles all schema versions)
      const allAthletes = getEventAthletes(appState.event);
      const presentAthletes = allAthletes.filter(a => a.status === 'PRESENT');
      
      console.log('📊 Total athletes available:', allAthletes.length, '| Present:', presentAthletes.length);

      // Apply college-aware distribution to all sheets
      if (eventCategory === 'track' && data.heats) {
        console.log('✓ Track event - applying college-aware distribution');
        const heats = generateHeats(presentAthletes, 8);
        const heatsWithLanes = heats.map(heat => assignRandomLanes(heat));
        setAppState(prev => ({
          ...prev,
          trackSets: heatsWithLanes,
          statusFlow: { ...prev.statusFlow, sheetsGenerated: true }
        }));
      } else if (eventCategory === 'jump' && data.sets) {
        console.log('✓ Jump event - applying college-aware distribution');
        const sets = generateSets(presentAthletes, 12);
        setAppState(prev => ({
          ...prev,
          jumpSheets: sets,
          statusFlow: { ...prev.statusFlow, sheetsGenerated: true }
        }));
      } else if (eventCategory === 'throw' && data.sets) {
        console.log('✓ Throw event - applying college-aware distribution');
        const sets = generateSets(presentAthletes, 12);
        setAppState(prev => ({
          ...prev,
          throwSheets: sets,
          statusFlow: { ...prev.statusFlow, sheetsGenerated: true }
        }));
      } else if (eventCategory === 'relay' && data.heats) {
        console.log('✓ Relay event - applying college-aware distribution');
        const heats = generateHeats(presentAthletes, 8);
        const heatsWithLanes = heats.map(heat => assignRandomLanes(heat));
        setAppState(prev => ({
          ...prev,
          relaySheets: heatsWithLanes,
          statusFlow: { ...prev.statusFlow, sheetsGenerated: true }
        }));
      } else if (eventCategory === 'combined' && data.athletes) {
        console.log('✓ Combined event - filtering present athletes');
        setAppState(prev => ({
          ...prev,
          combinedSheets: [presentAthletes],
          statusFlow: { ...prev.statusFlow, sheetsGenerated: true }
        }));
        return;
      } else {
        console.error('❌ No matching event data:', { eventCategory, has_heats: !!data.heats, has_sets: !!data.sets, has_athletes: !!data.athletes });
        alert(`Error: No data available for category "${eventCategory}". Athletes available: ${allAthletes.length}`);
        return;
      }

      console.log('✓ Sheets generated with college-aware distribution - stay on Stage 4 for printing');
    } catch (error) {
      console.error('Error fetching event sheets:', error);
      alert('Error generating sheets: ' + error.message);
    }
  };

  // STAGE 5: Round 1 Scoring
  // Use keyed state: scores[athleteId] instead of shared state
  const [scores, setScores] = useState({});
  
  // Track status (OK/DNF/DIS) for each athlete
  const [scoreStatus, setScoreStatus] = useState({});

  // Update status and auto-clear/zero score when DNF/DIS selected
  const updateStatus = (athleteId, status) => {
    setScoreStatus(prev => ({ ...prev, [athleteId]: status }));

    // Auto-clear score if DNF or DIS
    if (status === "DNF" || status === "DIS") {
      setScores(prev => ({
        ...prev,
        [athleteId]: appState.event?.category?.toLowerCase() === 'track' ? "00:00:00:00" : "0"
      }));
    }
  };

  const completeRound1 = () => {
    if (appState.event.category === 'Relay') {
      // For Relay, rank teams (not individual athletes)
      const rankedTeams = rankByPerformance(
        appState.relaySheets.flat(),
        'track'
      );
      
      setAppState(prev => ({
        ...prev,
        round1Results: rankedTeams,
        statusFlow: { ...prev.statusFlow, round1Scored: true }
      }));
    } else {
      const ranked = rankByPerformance(
        appState.athletes.filter(a => a.status === 'PRESENT'),
        appState.event.category === 'Track' ? 'track' : 
        appState.event.category === 'Combined' ? 'combined' : 'field'
      );

      setAppState(prev => ({
        ...prev,
        round1Results: ranked,
        statusFlow: { ...prev.statusFlow, round1Scored: true }
      }));
    }
    setCurrentStage(6);
  };

  // STAGE 6: Top Selection with Top 8 or Top 16 option
  const saveQualifiers = async (selected, count) => {
    try {
      const eventId = appState.event?._id || appState.event?.id;
      await axios.put(
        `${API_BASE_URL}/api/events/${eventId}/save-qualifiers`,
        { qualified: selected, count }
      );

      setAppState(prev => ({
        ...prev,
        round2Qualified: selected,
        qualifierCount: count
      }));
      
      console.log(`✅ Saved ${count} qualified athletes to database`);
    } catch (err) {
      console.error('❌ Error saving qualifiers:', err);
    }
  };

  // Save top selection (Top 8 or Top 16) to database
  const saveTopSelection = async (topCount, selectedIds) => {
    try {
      const eventId = appState.event?._id || appState.event?.id;
      const response = await axios.post(
        `${API_BASE_URL}/api/events/${eventId}/top-selection`,
        { selectedCount: topCount, selectedAthleteIds: selectedIds }
      );

      console.log(`✅ Saved Top ${topCount} selection to database`, response.data);
      return response.data;
    } catch (err) {
      console.error(`❌ Error saving Top ${topCount} selection:`, err);
      return null;
    }
  };

  const selectTopAthletes = (topCount) => {
    console.log(`🎯 Selecting top ${topCount} athletes`);
    
    // Get top N athletes sorted by performance
    const topAthletes = appState.round1Results.slice(0, topCount);
    console.log(`Selected athletes: ${topAthletes.length}`, topAthletes);

    // Extract athlete IDs
    const selectedIds = topAthletes.map(a => a._id || a.id);

    if (topCount === 16) {
      // Split into odd (Group A) and even (Group B) serial numbers
      const oddGroup = topAthletes.filter((a, index) => (index + 1) % 2 !== 0);
      const evenGroup = topAthletes.filter((a, index) => (index + 1) % 2 === 0);
      
      console.log('📌 Odd Group (SL: 1,3,5,7,9,11,13,15):', oddGroup);
      console.log('📌 Even Group (SL: 2,4,6,8,10,12,14,16):', evenGroup);
      
      setAppState(prev => ({
        ...prev,
        topSelection: 16,
        topAthletes: topAthletes,
        oddGroup: oddGroup,
        evenGroup: evenGroup,
        statusFlow: { ...prev.statusFlow, topSelected: true }
      }));

      // Save both to old endpoint and new endpoint
      saveQualifiers(topAthletes, 16);
      saveTopSelection(16, selectedIds);
    } else {
      // Top 8 - no grouping needed
      console.log('📌 Top 8 selected (no grouping)');
      setAppState(prev => ({
        ...prev,
        topSelection: 8,
        topAthletes: topAthletes,
        oddGroup: [],
        evenGroup: [],
        statusFlow: { ...prev.statusFlow, topSelected: true }
      }));

      // Save both to old endpoint and new endpoint
      saveQualifiers(topAthletes, 8);
      saveTopSelection(8, selectedIds);
    }
  };

  // STAGE 7: Generate Heats
  const generateHeatSheets = () => {
    // Use round2Qualified from database (saved from Stage 6), fallback to topAthletes
    const athletesToUse = appState.event?.round2Qualified?.length > 0 
      ? appState.event.round2Qualified 
      : appState.topAthletes.length > 0 
        ? appState.topAthletes 
        : appState.round1Results;

    if (!athletesToUse.length) {
      console.error('❌ No athletes available for heat generation');
      return;
    }

    console.log(`🏃 Generating heats with ${athletesToUse.length} qualified athletes`);
    
    if (appState.event?.category?.toLowerCase() === 'track' || appState.event?.category?.toLowerCase() === 'relay') {
      if (appState.event?.category?.toLowerCase() === 'relay') {
        // For Relay: split teams (not athletes) into heats
        const heat1Teams = [];
        const heat2Teams = [];
        athletesToUse.forEach((team, idx) => {
          if ((idx + 1) % 2 === 1) {
            heat1Teams.push(team);
          } else {
            heat2Teams.push(team);
          }
        });

        // Assign lanes to each heat
        const heat1WithLanes = assignLanes(heat1Teams);
        const heat2WithLanes = assignLanes(heat2Teams);

        setAppState(prev => ({
          ...prev,
          heats: { heat1: heat1WithLanes, heat2: heat2WithLanes },
          statusFlow: { ...prev.statusFlow, heatsGenerated: true }
        }));
      } else {
        // For Track: split individual athletes into heats
        const heat1 = [];
        const heat2 = [];
        athletesToUse.forEach((athlete, idx) => {
          if ((idx + 1) % 2 === 1) {
            heat1.push(athlete);
          } else {
            heat2.push(athlete);
          }
        });

        const heat1WithLanes = assignLanes(heat1);
        const heat2WithLanes = assignLanes(heat2);

        setAppState(prev => ({
          ...prev,
          heats: { heat1: heat1WithLanes, heat2: heat2WithLanes },
          statusFlow: { ...prev.statusFlow, heatsGenerated: true }
        }));
      }
    }
    setCurrentStage(8);
  };

  // STAGE 8: Pre-Final Sheet
  const generatePreFinalSheet = () => {
    setAppState(prev => ({
      ...prev,
      statusFlow: { ...prev.statusFlow, preFinalGenerated: true }
    }));
    setCurrentStage(9);
  };

  // STAGE 9: Final Scoring
  // Use keyed state for final scoring too
  const [finalScores, setFinalScores] = useState({});

  const completeFinalScoring = () => {
    const finalRanked = rankByPerformance(
      appState.round1Results,
      appState.event.category === 'Track' || appState.event.category === 'Relay' ? 'track' :
      appState.event.category === 'Combined' ? 'combined' : 'field'
    );

    const withPoints = finalRanked.map(a => ({
      ...a,
      points: MEDAL_POINTS[a.rank] || 0
    }));

    setAppState(prev => ({
      ...prev,
      finalResults: withPoints,
      statusFlow: { ...prev.statusFlow, finalScored: true }
    }));
    setCurrentStage(10);
  };

  // STAGE 10: Final Announcement
  const publishFinalResults = () => {
    setAppState(prev => ({
      ...prev,
      statusFlow: { ...prev.statusFlow, finalAnnouncementGenerated: true }
    }));
    setCurrentStage(11);
  };

  // STAGE 11: Name Correction
  const updateAthleteName = (athleteId, updates) => {
    setAppState(prev => ({
      ...prev,
      finalResults: prev.finalResults.map(a =>
        a.id === athleteId ? { ...a, ...updates } : a
      )
    }));
  };

  const completeNameCorrection = () => {
    setAppState(prev => ({
      ...prev,
      statusFlow: { ...prev.statusFlow, nameCorrected: true }
    }));
    setCurrentStage(12);
  };

  // STAGE 12: Verification
  const verifyEvent = () => {
    const checklist = {
      callRoomCompleted: appState.statusFlow.callRoomCompleted,
      sheetsGenerated: appState.statusFlow.sheetsGenerated,
      round1Scored: appState.statusFlow.round1Scored,
      heatsGenerated: appState.statusFlow.heatsGenerated,
      preFinalGenerated: appState.statusFlow.preFinalGenerated,
      finalScored: appState.statusFlow.finalScored,
      nameCorrected: appState.statusFlow.nameCorrected
    };

    const allComplete = Object.values(checklist).every(v => v === true);
    if (!allComplete) {
      alert('Not all stages are complete. Please verify the checklist.');
      return false;
    }

    setAppState(prev => ({
      ...prev,
      statusFlow: { ...prev.statusFlow, verified: true }
    }));
    return true;
  };

  // STAGE 13: Publish & Lock
  const publishAndLock = () => {
    if (!verifyEvent()) return;

    setAppState(prev => ({
      ...prev,
      statusFlow: {
        ...prev.statusFlow,
        published: true,
        lockedAt: new Date().toISOString()
      }
    }));
    alert('Event published and locked successfully!');
  };

  // STAGE 14: Combined Events Final Scoring (Simplified)
  const handleCombinedTotalPoints = (athleteId, value) => {
    // Update local combined total values state
    setCombinedTotalValues(prev => ({ ...prev, [athleteId]: value }));
    
    // Sync to combinedSheets asynchronously (non-blocking)
    setTimeout(() => {
      setAppState(prev => ({
        ...prev,
        combinedSheets: prev.combinedSheets.map(sheet =>
          sheet.map(a =>
            a.id === athleteId ? { ...a, totalPoints: parseInt(value) || 0 } : a
          )
        )
      }));
    }, 50);
  };

  const completeCombinedScoring = () => {
    if (appState.combinedSheets.length === 0) {
      alert('No athletes found');
      return;
    }

    // Get all athletes and rank them by total points (highest first)
    const athletes = appState.combinedSheets[0];
    
    // Validate all have total points
    if (athletes.some(a => !a.totalPoints)) {
      alert('All athletes must have total points entered');
      return;
    }

    // Sort by total points descending and assign ranks
    const ranked = athletes
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .map((a, idx) => ({
        ...a,
        rank: idx + 1,
        points: MEDAL_POINTS[idx + 1] || 0
      }));

    setAppState(prev => ({
      ...prev,
      finalResults: ranked,
      statusFlow: { ...prev.statusFlow, finalScored: true }
    }));
    setCurrentStage(15);
  };

  // ========================================
  // RENDER UI
  // ========================================

  // ========================================
  // SAFE DEBOUNCED AUTOSAVE (No re-rendering)
  // ========================================
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const timer = setTimeout(() => {
      saveEventState();
    }, 800); // Waits 0.8 sec of no typing/changes before saving

    return () => clearTimeout(timer);
  }, [appState]);

  // Load event data when entering Stage 7 to get round2Qualified from database
  useEffect(() => {
    if (currentStage === 7 && appState.event?._id) {
      const loadQualifiers = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/events/${appState.event._id}`);
          const eventData = response.data;
          
          if (eventData.round2Qualified?.length > 0) {
            console.log(`✅ Loaded ${eventData.round2Qualified.length} qualified athletes from database`);
            setAppState(prev => ({
              ...prev,
              event: eventData,
              round2Qualified: eventData.round2Qualified
            }));
          }
        } catch (err) {
          console.error('Error loading qualifiers:', err);
        }
      };
      
      loadQualifiers();
    }
  }, [currentStage, appState.event?._id]);

  // Dashboard View
  if (currentStage === 0 || !appState.event) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Event Management Dashboard</h2>

        {/* Create New Event */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border-2 border-dashed border-blue-400 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
            <CreateEventForm onSubmit={handleCreateEvent} eventDB={EVENT_DB} />
          </div>

          {/* Event History */}
          <div className="border p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allEvents.length === 0 ? (
                <p className="text-gray-500">No events yet. Create one to get started!</p>
              ) : (
                allEvents.map(evt => (
                  <div key={evt.id} className="flex items-center gap-2 p-3 bg-gray-100 hover:bg-blue-100 rounded transition">
                    <button
                      onClick={() => {
                        loadEventState(evt.id);
                        setCurrentStage(1);
                      }}
                      className="flex-1 text-left"
                    >
                      <p className="font-semibold">{evt.event?.eventName}</p>
                      <p className="text-sm text-gray-600">{evt.event?.category} | {evt.event?.gender}</p>
                      <p className="text-xs text-gray-500">{evt.lastModified}</p>
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                          return;
                        }
                        const updatedEvents = allEvents.filter(e => e.id !== evt.id);
                        setAllEvents(updatedEvents);
                        localStorage.setItem('athleticsEventsNew', JSON.stringify(updatedEvents));
                      }}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition text-sm font-semibold"
                      title="Delete event"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage-based rendering
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <StageNavigation
        currentStage={currentStage}
        event={appState.event}
        onNavigate={(stage) => {
          saveEventState();
          setCurrentStage(stage);
        }}
      />

      <div className="mt-6">
        {currentStage === 1 && <Stage1EventCreation />}
        {currentStage === 2 && <Stage2CallRoomGeneration />}
        {currentStage === 3 && <Stage3CallRoomCompletion />}
        {currentStage === 4 && <Stage4SheetGeneration />}
        {currentStage === 5 && <Stage5Round1Scoring />}
        {currentStage === 6 && <Stage6TopSelection />}
        {currentStage === 7 && <Stage7HeatsGeneration />}
        {currentStage === 7.5 && <Stage7HeatsScoring />}
        {currentStage === 8 && <Stage8PreFinalSheet />}
        {currentStage === 9 && <Stage9FinalScoring />}
        {currentStage === 10 && <Stage10FinalAnnouncement />}
        {currentStage === 11 && <Stage11NameCorrection />}
        {currentStage === 12 && <Stage12Verification />}
        {currentStage === 13 && <Stage13PublishLock />}
        {currentStage === 14 && <Stage14CombinedFinalScoring />}
        {currentStage === 15 && <Stage15CombinedFinalAnnouncement />}
        {currentStage === 16 && <Stage16CombinedVerification />}
      </div>
    </div>
  );

  // ========================================
  // STAGE COMPONENTS
  // ========================================

  function Stage1EventCreation() {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Stage 1: Event Creation</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onBackToDashboard && onBackToDashboard()}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm font-semibold"
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={handleDeleteEvent}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-semibold"
              title="Delete this event permanently"
            >
              🗑️ Delete Event
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <p><strong>Category:</strong> {appState.event?.category}</p>
          <p><strong>Gender:</strong> {appState.event?.gender}</p>
          <p><strong>Event:</strong> {appState.event?.eventName}</p>
          <p><strong>Date:</strong> {appState.event?.date}</p>
          <p><strong>Time:</strong> {appState.event?.time}</p>
          <p><strong>Venue:</strong> {appState.event?.venue}</p>
          <p><strong>Athletes:</strong> {getEventAthletes(appState.event).length}</p>
        </div>
        <div className="mt-6 flex gap-4">
          <button
            onClick={generateCallRoomSheet}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            ✓ Proceed to Stage 2
          </button>
        </div>
      </div>
    );
  }

  function Stage2CallRoomGeneration() {
    const content = `
      <div class="page">
        ${getBUHeader()}
        <div class="content">
          <h3>Call Room Sheet</h3>
          <p><strong>${appState.event?.eventName}</strong> | <strong>${appState.event?.gender}</strong></p>
          <p><strong>Date:</strong> ${appState.event?.date} | <strong>Time:</strong> ${appState.event?.time} | <strong>Venue:</strong> ${appState.event?.venue}</p>
          <table>
            <thead>
              <tr>
                <th class="center" style="width: 8%;">SL NO</th>
                <th class="center" style="width: 12%;">CHEST NO</th>
                <th style="width: 25%;">NAME</th>
                <th style="width: 20%;">COLLEGE</th>
                <th style="width: 25%;">REMARKS</th>
                <th class="center" style="width: 10%;">DIS</th>
              </tr>
            </thead>
            <tbody>
              ${appState.athletes.map((a, idx) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td class="center">${a.chestNo}</td>
                  <td>${a.name}</td>
                  <td>${typeof a.college === 'object' ? a.college?.name : a.college}</td>
                  <td></td>
                  <td class="center"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${getBUFooter(1, 1)}
      </div>
    `;

    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 2: Call Room Sheet Generation</h3>
        <p className="mb-4 text-gray-700">Call Room Sheet has been generated with {getEventAthletes(appState.event).length} athletes.</p>
        
        <button
          onClick={() => printSheet(content, 'CallRoom_Sheet')}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 mb-6"
        >
          🖨️ Print / PDF
        </button>

        <table className="w-full border-collapse border border-gray-400 mb-6">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-center">SL NO</th>
              <th className="p-2 text-center">CHEST NO</th>
              <th className="p-2">NAME</th>
              <th className="p-2">COLLEGE</th>
              <th className="p-2">REMARKS</th>
            </tr>
          </thead>
          <tbody>
            {appState.athletes.map((a, idx) => (
              <tr key={a._id || a.id} className="border-b">
                <td className="p-2 text-center">{idx + 1}</td>
                <td className="p-2 text-center">{a.chestNo}</td>
                <td className="p-2">{a.name}</td>
                <td className="p-2">{typeof a.college === 'object' ? a.college?.name : a.college}</td>
                <td className="p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex gap-4">
          <button
            onClick={() => setCurrentStage(3)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            ✓ Proceed to Stage 3
          </button>
        </div>
      </div>
    );
  }

  function Stage3CallRoomCompletion() {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 3: Call Room Completion</h3>
        <p className="mb-4 text-gray-700">Mark attendance: PRESENT, ABSENT, or DISQUALIFIED</p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-center">SL NO</th>
                <th className="p-2 text-center">CHEST NO</th>
                <th className="p-2">NAME</th>
                <th className="p-2">COLLEGE</th>
                <th className="p-2">STATUS</th>
                <th className="p-2">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {appState.athletes.map((a, idx) => (
                <tr key={a._id || a.id} className="border-b">
                  <td className="p-2 text-center">{idx + 1}</td>
                  <td className="p-2 text-center">{a.chestNo}</td>
                  <td className="p-2">{a.name}</td>
                  <td className="p-2">{typeof a.college === 'object' ? a.college?.name : a.college}</td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2">
                    <select
                      value={a.status || 'PRESENT'}
                      onChange={(e) => handleMarkAttendance(a._id || a.id, e.target.value, a.remarks)}
                      className="p-1 border rounded"
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="ABSENT">ABSENT</option>
                      <option value="DISQUALIFIED">DISQUALIFIED</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={a.remarks}
                      onChange={(e) => handleMarkAttendance(a._id || a.id, a.status, e.target.value)}
                      className="p-1 border rounded w-full"
                      placeholder="Notes..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 p-4 rounded mb-6">
          <p><strong>Summary:</strong> PRESENT: {appState.athletes.filter(a => a.status === 'PRESENT').length} | ABSENT: {appState.athletes.filter(a => a.status === 'ABSENT').length} | DIS: {appState.athletes.filter(a => a.status === 'DISQUALIFIED').length}</p>
        </div>

        <button
          onClick={completeCallRoom}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          ✓ Proceed to Stage 4
        </button>
      </div>
    );
  }

  function Stage4SheetGeneration() {
    const printTrackSheets = () => {
      let content = '';
      appState.trackSets.forEach((set, setIdx) => {
        const presentAthletes = set.filter(a => a.status === 'PRESENT');
        const heatNum = presentAthletes[0]?.heat || setIdx + 1;
        content += `
          <div class="page">
            ${getBUHeader()}
            <div class="content">
              <h3>Track Event - Heat ${heatNum} of ${appState.trackSets.length}</h3>
              <p><strong>${appState.event?.eventName}</strong> | <strong>${appState.event?.gender}</strong></p>
              <p><strong>Date:</strong> ${appState.event?.date} | <strong>Venue:</strong> ${appState.event?.venue}</p>
              <table>
                <thead>
                  <tr>
                    <th class="center" style="width: 8%;">SL NO</th>
                    <th class="center" style="width: 12%;">CHEST NO</th>
                    <th style="width: 20%;">NAME</th>
                    <th style="width: 18%;">COLLEGE</th>
                    <th class="center" style="width: 8%;">LANE</th>
                    <th style="width: 34%;">TIMINGS</th>
                  </tr>
                </thead>
                <tbody>
                  ${presentAthletes.map((athlete, idx) => `
                    <tr>
                      <td class="center">${idx + 1}</td>
                      <td class="center">${athlete.chestNo}</td>
                      <td>${athlete.name}</td>
                      <td>${athlete.college?.name || athlete.college}</td>
                      <td class="center"><strong>${athlete.lane}</strong></td>
                      <td></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ${getBUFooter(heatNum, appState.trackSets.length)}
          </div>
        `;
      });
      printSheet(content, 'Track_Event_Sheets');
    };

    const printRelaySheets = () => {
      let content = '';
      appState.relaySheets.forEach((heat, heatIdx) => {
        const presentAthletes = heat.filter(a => a.status === 'PRESENT');
        const heatNum = presentAthletes[0]?.heat || heatIdx + 1;
        content += `
          <div class="page">
            ${getBUHeader()}
            <div class="content">
              <h3>Relay Event - Heat ${heatNum} of ${appState.relaySheets.length}</h3>
              <p><strong>${appState.event?.eventName}</strong> | <strong>${appState.event?.gender}</strong></p>
              <p><strong>Date:</strong> ${appState.event?.date} | <strong>Venue:</strong> ${appState.event?.venue}</p>
              <table>
                <thead>
                  <tr>
                    <th class="center" style="width: 8%;">SL NO</th>
                    <th class="center" style="width: 12%;">CHEST NO</th>
                    <th style="width: 20%;">NAME</th>
                    <th style="width: 18%;">COLLEGE</th>
                    <th class="center" style="width: 8%;">LANE</th>
                    <th style="width: 34%;">TIMINGS</th>
                  </tr>
                </thead>
                <tbody>
                  ${presentAthletes.map((athlete, idx) => `
                    <tr>
                      <td class="center">${idx + 1}</td>
                      <td class="center">${athlete.chestNo}</td>
                      <td>${athlete.name}</td>
                      <td>${athlete.college?.name || athlete.college}</td>
                      <td class="center"><strong>${athlete.lane}</strong></td>
                      <td></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ${getBUFooter(heatNum, appState.relaySheets.length)}
          </div>
        `;
      });
      printSheet(content, 'Relay_Event_Sheets');
    };

    const printJumpThrowSheets = (sheets, eventType) => {
      let content = '';
      const sheetArray = eventType === 'Jump' ? appState.jumpSheets : appState.throwSheets;
      sheetArray.forEach((sheet, pageIdx) => {
        const presentAthletes = sheet.filter(a => a.status === 'PRESENT');
        content += `
          <div class="page">
            ${getBUHeader()}
            <div class="content">
              <h3>${eventType} Event - Set ${pageIdx + 1} of ${sheetArray.length}</h3>
              <p><strong>${appState.event?.eventName}</strong> | <strong>${appState.event?.gender}</strong></p>
              <table>
                <thead>
                  <tr>
                    <th class="center" style="width: 8%;">SL NO</th>
                    <th class="center" style="width: 12%;">CHEST NO</th>
                    <th style="width: 18%;">NAME</th>
                    <th style="width: 14%;">COLLEGE</th>
                    <th class="center" style="width: 6%;">A1</th>
                    <th class="center" style="width: 6%;">A2</th>
                    <th class="center" style="width: 6%;">A3</th>
                    <th class="center" style="width: 6%;">A4</th>
                    <th class="center" style="width: 6%;">A5</th>
                    <th class="center" style="width: 6%;">A6</th>
                    <th class="center" style="width: 6%;">BEST</th>
                    <th class="center" style="width: 8%;">POS</th>
                  </tr>
                </thead>
                <tbody>
                  ${presentAthletes.map((athlete, idx) => `
                    <tr>
                      <td class="center">${idx + 1}</td>
                      <td class="center">${athlete.chestNo}</td>
                      <td>${athlete.name}</td>
                      <td>${athlete.college?.name || athlete.college}</td>
                      <td class="center"></td>
                      <td class="center"></td>
                      <td class="center"></td>
                      <td class="center"></td>
                      <td class="center"></td>
                      <td class="center"></td>
                      <td class="center"></td>
                      <td class="center"></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ${getBUFooter(pageIdx + 1, sheetArray.length)}
          </div>
        `;
      });
      printSheet(content, `${eventType}_Event_Sheets`);
    };

    const printCombinedSheets = () => {
      let content = '';
      const sheet = (appState.combinedSheets[0] || []).filter(a => a.status === 'PRESENT');
      const eventName = appState.event?.eventName; // "Decathlon" or "Heptathlon"
      const combinedDetails = COMBINED_EVENTS[eventName];
      
      if (!combinedDetails) return;

      // DAY 1 SHEET
      const day1Events = combinedDetails.day1;
      content += `
        <div class="page" style="@page { size: A4 landscape; }">
          ${getBUHeader()}
          <div class="content">
            <h3>${eventName.toUpperCase()} (${appState.event?.gender}) – DAY 1 PERFORMANCE SHEET</h3>
            <p><strong>Date:</strong> ${appState.event?.date} | <strong>Venue:</strong> ${appState.event?.venue}</p>
            <p><strong>Day 1 Events:</strong> ${day1Events.join(' | ')}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="border-bottom: 2px solid #000;">
                  <th style="width: 5%; border: 1px solid #000; padding: 5px; text-align: center;">Sl No</th>
                  <th style="width: 8%; border: 1px solid #000; padding: 5px; text-align: center;">Chest No</th>
                  <th style="width: 20%; border: 1px solid #000; padding: 5px;">Name of Athlete</th>
                  <th style="width: 15%; border: 1px solid #000; padding: 5px;">College</th>
                  ${day1Events.map(evt => `
                    <th colspan="2" style="width: 12%; border: 1px solid #000; padding: 5px; text-align: center; font-size: 11px;">${evt}</th>
                  `).join('')}
                </tr>
                <tr style="border-bottom: 1px solid #999;">
                  <th colspan="4" style="border: none; padding: 0;"></th>
                  ${day1Events.map(() => `
                    <th style="width: 6%; border: 1px solid #000; padding: 3px; text-align: center; font-size: 10px;">Score</th>
                    <th style="width: 6%; border: 1px solid #000; padding: 3px; text-align: center; font-size: 10px;">Pts</th>
                  `).join('')}
                </tr>
              </thead>
              <tbody>
                ${sheet.map((athlete, idx) => `
                  <tr style="border-bottom: 1px solid #ddd;">
                    <td style="width: 5%; border: 1px solid #000; padding: 5px; text-align: center;">${idx + 1}</td>
                    <td style="width: 8%; border: 1px solid #000; padding: 5px; text-align: center;">${athlete.bibNumber}</td>
                    <td style="width: 20%; border: 1px solid #000; padding: 5px;">${athlete.name}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 5px;">${typeof athlete.college === "object" ? athlete.college?.name : athlete.college}</td>
                    ${day1Events.map(() => `
                      <td style="width: 6%; border: 1px solid #000; padding: 5px; height: 25px; text-align: center;"></td>
                      <td style="width: 6%; border: 1px solid #000; padding: 5px; height: 25px; text-align: center;"></td>
                    `).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 30px; display: flex; justify-content: space-between;">
              <div><p style="margin: 0;">Chief Judge: ________________________</p></div>
              <div><p style="margin: 0;">Recorder: ________________________</p></div>
            </div>
          </div>
          ${getBUFooter(1, 2)}
        </div>
      `;

      // DAY 2 SHEET
      const day2Events = combinedDetails.day2;
      
      content += `
        <div class="page" style="@page { size: A4 landscape; }">
          ${getBUHeader()}
          <div class="content">
            <h3>${eventName.toUpperCase()} (${appState.event?.gender}) – DAY 2 PERFORMANCE SHEET</h3>
            <p><strong>Date:</strong> ${appState.event?.date} | <strong>Venue:</strong> ${appState.event?.venue}</p>
            <p><strong>Day 2 Events:</strong> ${day2Events.join(' | ')}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="border-bottom: 2px solid #000;">
                  <th style="width: 5%; border: 1px solid #000; padding: 5px; text-align: center;">Sl No</th>
                  <th style="width: 8%; border: 1px solid #000; padding: 5px; text-align: center;">Chest No</th>
                  <th style="width: 15%; border: 1px solid #000; padding: 5px;">Name of Athlete</th>
                  <th style="width: 12%; border: 1px solid #000; padding: 5px;">College</th>
                  ${eventName === 'Heptathlon' ? `<th style="width: 8%; border: 1px solid #000; padding: 5px; text-align: center; font-size: 10px;">Day 1 Pts</th>` : ''}
                  ${day2Events.map(evt => `
                    <th colspan="2" style="width: 10%; border: 1px solid #000; padding: 5px; text-align: center; font-size: 11px;">${evt}</th>
                  `).join('')}
                  <th style="width: 8%; border: 1px solid #000; padding: 5px; text-align: center; font-size: 11px;">Total Pts</th>
                  <th style="width: 6%; border: 1px solid #000; padding: 5px; text-align: center; font-size: 11px;">Rank</th>
                </tr>
                <tr style="border-bottom: 1px solid #999;">
                  <th colspan="${4 + (eventName === 'Heptathlon' ? 1 : 0)}" style="border: none; padding: 0;"></th>
                  ${day2Events.map(() => `
                    <th style="width: 5%; border: 1px solid #000; padding: 3px; text-align: center; font-size: 10px;">Score</th>
                    <th style="width: 5%; border: 1px solid #000; padding: 3px; text-align: center; font-size: 10px;">Pts</th>
                  `).join('')}
                  <th colspan="2" style="border: none; padding: 0;"></th>
                </tr>
              </thead>
              <tbody>
                ${sheet.map((athlete, idx) => `
                  <tr style="border-bottom: 1px solid #ddd;">
                    <td style="width: 5%; border: 1px solid #000; padding: 5px; text-align: center;">${idx + 1}</td>
                    <td style="width: 8%; border: 1px solid #000; padding: 5px; text-align: center;">${athlete.bibNumber}</td>
                    <td style="width: 15%; border: 1px solid #000; padding: 5px;">${athlete.name}</td>
                    <td style="width: 12%; border: 1px solid #000; padding: 5px;">${typeof athlete.college === "object" ? athlete.college?.name : athlete.college}</td>
                    ${eventName === 'Heptathlon' ? `<td style="width: 8%; border: 1px solid #000; padding: 5px; height: 25px; text-align: center;"></td>` : ''}
                    ${day2Events.map(() => `
                      <td style="width: 5%; border: 1px solid #000; padding: 5px; height: 25px; text-align: center;"></td>
                      <td style="width: 5%; border: 1px solid #000; padding: 5px; height: 25px; text-align: center;"></td>
                    `).join('')}
                    <td style="width: 8%; border: 1px solid #000; padding: 5px; height: 25px; text-align: center;"></td>
                    <td style="width: 6%; border: 1px solid #000; padding: 5px; height: 25px; text-align: center;"></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top: 30px; display: flex; justify-content: space-between;">
              <div><p style="margin: 0;">Chief Judge: ________________________</p></div>
              <div><p style="margin: 0;">Recorder: ________________________</p></div>
            </div>
          </div>
          ${getBUFooter(2, 2)}
        </div>
      `;

      printSheet(content, `${eventName}_Performance_Sheets`);
    };

    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 4: Generate Event Sheets</h3>
        <p className="mb-4 text-gray-700">Sheets will be generated based on event category.</p>

        <div className="bg-yellow-50 p-4 rounded mb-6">
          <p><strong>Category:</strong> {appState.event?.category}</p>
          {(appState.event?.category === 'Track' || appState.event?.category === 'track') && <p className="mt-2">✅ Track sets of 8 generated with random lane assignments</p>}
          {(appState.event?.category === 'Jump' || appState.event?.category === 'jump') && <p className="mt-2">Jump sheets with 15 per page will be generated</p>}
          {(appState.event?.category === 'Throw' || appState.event?.category === 'throw') && <p className="mt-2">Throw sheets with 15 per page will be generated</p>}
          {(appState.event?.category === 'Relay' || appState.event?.category === 'relay') && <p className="mt-2">✅ Relay teams (4 per team) generated with random lane assignments</p>}
          {(appState.event?.category === 'Combined' || appState.event?.category === 'combined') && <p className="mt-2">Combined event sheet (total points only) will be generated</p>}
        </div>

        {appState.trackSets.length === 0 && appState.jumpSheets.length === 0 && appState.throwSheets.length === 0 && appState.relaySheets.length === 0 && appState.combinedSheets.length === 0 ? (
          <button
            onClick={generateEventSheets}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 mb-4"
          >
            📋 Generate Sheets
          </button>
        ) : (
          <div>
            {(appState.event?.category === 'Track' || appState.event?.category === 'track') && (
              <>
                <div className="bg-blue-50 p-4 rounded mb-6">
                  <h4 className="font-semibold mb-2">Generated Track Heats Preview:</h4>
                  {appState.trackSets.map((heat, idx) => (
                    <div key={idx} className="mb-3">
                      <p className="font-semibold">Heat {heat[0]?.heat || idx + 1} ({heat.filter(a => a.status === 'PRESENT').length} athletes)</p>
                      <div className="overflow-x-auto">
                        <table className="text-sm border-collapse border border-gray-300 w-full">
                          <thead>
                            <tr className="bg-gray-200">
                              <th className="border p-1">SL NO</th>
                              <th className="border p-1">CHEST NO</th>
                              <th className="border p-1">NAME</th>
                              <th className="border p-1">COLLEGE</th>
                              <th className="border p-1">LANE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {heat.filter(a => a.status === 'PRESENT').map((athlete, aidx) => (
                              <tr key={athlete._id || athlete.id || `${athlete.bibNumber}-${aidx}`} className="border-b">
                                <td className="border p-1 text-center">{aidx + 1}</td>
                                <td className="border p-1 text-center">{athlete.chestNo}</td>
                                <td className="border p-1">{athlete.name}</td>
                                <td className="border p-1">{athlete.college?.name || athlete.college}</td>
                                <td className="border p-1 text-center">{athlete.lane}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={printTrackSheets}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 mb-4"
                >
                  🖨️ Print Track Heats ({appState.trackSets.length} heats)
                </button>
              </>
            )}
            {(appState.event?.category === 'Relay' || appState.event?.category === 'relay') && (
              <>
                <div className="bg-blue-50 p-4 rounded mb-6">
                  <h4 className="font-semibold mb-2">Generated Relay Heats Preview:</h4>
                  {appState.relaySheets.map((heat, heatIdx) => (
                    <div key={heatIdx} className="mb-6">
                      <p className="font-semibold text-lg border-b pb-2">Heat {heat[0]?.heat || heatIdx + 1} ({heat.filter(a => a.status === 'PRESENT').length} teams)</p>
                      {heat.filter(a => a.status === 'PRESENT').map((athlete, idx) => (
                        <div key={idx} className="mb-3">
                          <p className="font-semibold text-sm">Team {idx + 1} - Lane {athlete.lane}</p>
                          <div className="overflow-x-auto">
                            <table className="text-xs border-collapse border border-gray-300 w-full">
                              <thead>
                                <tr className="bg-gray-200">
                                  <th className="border p-1">Bib</th>
                                  <th className="border p-1">Name</th>
                                  <th className="border p-1">College</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[athlete].map((team, aidx) => (
                                  <tr key={athlete._id || athlete.id || `${athlete.bibNumber}-${aidx}`} className="border-b">
                                    <td className="border p-1 text-center">{team.chestNo}</td>
                                    <td className="border p-1">{team.name}</td>
                                    <td className="border p-1">{team.college?.name || team.college}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <button
                  onClick={printRelaySheets}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 mb-4"
                >
                  🖨️ Print Relay Heats ({appState.relaySheets.length} heats)
                </button>
              </>
            )}
            {(appState.event?.category === 'Jump' || appState.event?.category === 'jump') && (
              <>
                <div className="bg-blue-50 p-4 rounded mb-6">
                  <h4 className="font-semibold mb-2">Generated Jump Sets Preview ({appState.jumpSheets.length} sets):</h4>
                  {appState.jumpSheets.slice(0, 1).map((sheet, idx) => (
                    <div key={idx} className="mb-3">
                      <p className="font-semibold">Set {idx + 1} ({sheet.filter(a => a.status === 'PRESENT').length} athletes)</p>
                      <div className="overflow-x-auto">
                        <table className="text-sm border-collapse border border-gray-300 w-full">
                          <thead>
                            <tr className="bg-gray-200">
                              <th className="border p-1">SL NO</th>
                              <th className="border p-1">CHEST NO</th>
                              <th className="border p-1">NAME</th>
                              <th className="border p-1">COLLEGE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sheet.filter(a => a.status === 'PRESENT').map((athlete, aidx) => (
                              <tr key={aidx} className="border-b">
                                <td className="border p-1 text-center">{aidx + 1}</td>
                                <td className="border p-1 text-center">{athlete.chestNo}</td>
                                <td className="border p-1">{athlete.name}</td>
                                <td className="border p-1">{athlete.college?.name || athlete.college}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => printJumpThrowSheets(appState.jumpSheets, 'Jump')}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 mb-4"
                >
                  🖨️ Print Jump Sets ({appState.jumpSheets.length} sets)
                </button>
              </>
            )}
            {(appState.event?.category === 'Throw' || appState.event?.category === 'throw') && (
              <>
                <div className="bg-blue-50 p-4 rounded mb-6">
                  <h4 className="font-semibold mb-2">Generated Throw Sets Preview ({appState.throwSheets.length} sets):</h4>
                  {appState.throwSheets.slice(0, 1).map((sheet, idx) => (
                    <div key={idx} className="mb-3">
                      <p className="font-semibold">Set {idx + 1} ({sheet.filter(a => a.status === 'PRESENT').length} athletes)</p>
                      <div className="overflow-x-auto">
                        <table className="text-sm border-collapse border border-gray-300 w-full">
                          <thead>
                            <tr className="bg-gray-200">
                              <th className="border p-1">SL NO</th>
                              <th className="border p-1">CHEST NO</th>
                              <th className="border p-1">NAME</th>
                              <th className="border p-1">COLLEGE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sheet.filter(a => a.status === 'PRESENT').map((athlete, aidx) => (
                              <tr key={athlete._id || athlete.id || `${athlete.bibNumber}-${aidx}`} className="border-b">
                                <td className="border p-1 text-center">{aidx + 1}</td>
                                <td className="border p-1 text-center">{athlete.chestNo}</td>
                                <td className="border p-1">{athlete.name}</td>
                                <td className="border p-1">{athlete.college?.name || athlete.college}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => printJumpThrowSheets(appState.throwSheets, 'Throw')}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 mb-4"
                >
                  🖨️ Print Throw Sets ({appState.throwSheets.length} sets)
                </button>
              </>
            )}
            {(appState.event?.category === 'Combined' || appState.event?.category === 'combined') && (
              <>
                <div className="bg-blue-50 p-4 rounded mb-6">
                  <h4 className="font-semibold mb-2">Generated Combined Event Preview ({appState.combinedSheets[0]?.filter(a => a.status === 'PRESENT').length} athletes):</h4>
                  <div className="overflow-x-auto">
                    <table className="text-sm border-collapse border border-gray-300 w-full">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="border p-1">SL NO</th>
                          <th className="border p-1">CHEST NO</th>
                          <th className="border p-1">NAME</th>
                          <th className="border p-1">COLLEGE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appState.combinedSheets[0]?.filter(a => a.status === 'PRESENT').map((athlete, aidx) => (
                          <tr key={athlete._id || athlete.id || `${athlete.bibNumber}-${aidx}`} className="border-b">
                            <td className="border p-1 text-center">{aidx + 1}</td>
                            <td className="border p-1 text-center">{athlete.bibNumber}</td>
                            <td className="border p-1">{athlete.name}</td>
                            <td className="border p-1">{typeof athlete.college === 'object' ? athlete.college?.name : athlete.college}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <button
                  onClick={printCombinedSheets}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 mb-4"
                >
                  🖨️ Print Combined Sheet
                </button>
              </>
            )}
            <button
              onClick={() => setCurrentStage(5)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 ml-4 mb-4"
            >
              ✓ Proceed to Stage 5
            </button>
          </div>
        )}
      </div>
    );
  }

  function Stage5Round1Scoring() {
    const inputRefsMap = React.useRef({});

    // Get sorted athlete list based on event type
    const getAthletesList = () => {
      if (appState.event?.category === 'Relay') {
        return appState.relaySheets.flat();
      } else {
        return appState.athletes.filter(a => a.status === 'PRESENT');
      }
    };

    // Handle Tab key to move to next performance input (or stay within column)
    const handleTabNavigation = (e, athleteId, fieldType = 'performance') => {
      if (e.key !== 'Tab') return;
      
      e.preventDefault();

      const athletes = getAthletesList();
      const currentIdx = athletes.findIndex(a => {
        const aid = a._id || a.id;
        return aid === athleteId;
      });

      if (currentIdx === -1) return;

      // Move to next athlete's performance input
      const nextIdx = e.shiftKey ? currentIdx - 1 : currentIdx + 1;

      if (nextIdx >= 0 && nextIdx < athletes.length) {
        const nextAthlete = athletes[nextIdx];
        const nextAid = nextAthlete._id || nextAthlete.id;
        const refKey = `perf-${nextAid}`;

        if (inputRefsMap.current[refKey]) {
          inputRefsMap.current[refKey].focus();
          inputRefsMap.current[refKey].select?.();
        }
      }
    };

    const setInputRef = (key) => (el) => {
      inputRefsMap.current[key] = el;
    };

    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 5: Round 1 Scoring</h3>
        {appState.event?.category === 'Combined' ? (
          <p className="mb-4 text-gray-700">Enter TOTAL POINTS only for {appState.event?.eventName}.</p>
        ) : (
          <p className="mb-4 text-gray-700">Enter performances for all present athletes. Press TAB to move to next athlete (same column). Use Status dropdown for DNF/DIS.</p>
        )}

        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-center">SL NO</th>
                <th className="p-2 text-center">CHEST NO</th>
                <th className="p-2">NAME</th>
                <th className="p-2">COLLEGE</th>
                {(appState.event?.category?.toLowerCase() === 'track' || appState.event?.category?.toLowerCase() === 'relay') && (
                  <th className="p-2 text-center">LANE</th>
                )}
                {appState.event?.category?.toLowerCase() === 'combined' ? (
                  <th className="p-2 text-center">TOTAL POINTS</th>
                ) : (
                  <th className="p-2 text-center">PERFORMANCE</th>
                )}
                <th className="p-2 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {appState.event?.category === 'Relay' ? (
                // For Relay: display teams with 4 athlete rows each
                appState.relaySheets.flat().map((team, teamIdx) => (
                  team.athletes?.map((athlete, athleteIdx) => {
                    const aid = athlete._id || athlete.id;
                    const isDisabled = scoreStatus[aid] === "DNF" || scoreStatus[aid] === "DIS";
                    return (
                      <tr key={aid} className="border-b">
                        <td className="p-2 text-center">
                          {athleteIdx === 0 ? team.slNo : ''}
                        </td>
                        <td className="p-2 text-center">{athlete.bibNumber}</td>
                        <td className="p-2">{athlete.name}</td>
                        <td className="p-2">{typeof athlete.college === 'object' ? athlete.college?.name : athlete.college}</td>
                        {appState.event?.category?.toLowerCase() === 'relay' && (
                          <td className="p-2 text-center font-semibold">
                            {athleteIdx === 0 ? team.lane : ''}
                          </td>
                        )}
                        <td className="p-2 text-center">
                          <TimeInput
                            ref={setInputRef(`perf-${aid}`)}
                            athleteId={aid}
                            disabled={isDisabled}
                            defaultValue={formatTimeInput(scores[aid] ?? athlete.performance ?? "")}
                            onCommit={(id, val) => setScores(prev => ({ ...prev, [id]: val }))}
                            onKeyDown={(e, id) => handleTabNavigation(e, id, 'performance')}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <select
                            value={scoreStatus[aid] || "OK"}
                            onChange={(e) => updateStatus(aid, e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                            style={{
                              minWidth: "90px",
                              backgroundColor: 
                                scoreStatus[aid] === "DIS" ? "#fee2e2" :
                                scoreStatus[aid] === "DNF" ? "#fef3c7" :
                                "white"
                            }}
                          >
                            <option value="OK">✓ OK</option>
                            <option value="DNF">⚠ DNF</option>
                            <option value="DIS">✗ DIS</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                ))
              ) : (
                // For Track/Jump/Throw/Combined: display individual athletes
                appState.athletes.filter(a => a.status === 'PRESENT').map((a, idx) => {
                  const aid = a._id || a.id;
                  const isDisabled = scoreStatus[aid] === "DNF" || scoreStatus[aid] === "DIS";
                  return (
                    <tr key={aid} className="border-b">
                      <td className="p-2 text-center">{idx + 1}</td>
                      <td className="p-2 text-center">{a.bibNumber}</td>
                      <td className="p-2">{a.name}</td>
                      <td className="p-2">{typeof a.college === 'object' ? a.college?.name : a.college}</td>
                      {(appState.event?.category?.toLowerCase() === 'track' || appState.event?.category?.toLowerCase() === 'relay') && (
                        <td className="p-2 text-center font-semibold">{a.lane || "-"}</td>
                      )}
                      <td className="p-2 text-center">
                        {(appState.event?.category?.toLowerCase() === 'track' || appState.event?.category?.toLowerCase() === 'relay') ? (
                          // Time input: hh:mm:ss:ms format
                          <TimeInput
                            ref={setInputRef(`perf-${aid}`)}
                            athleteId={aid}
                            disabled={isDisabled}
                            defaultValue={formatTimeInput(scores[aid] ?? a.performance ?? "")}
                            onCommit={(id, val) => setScores(prev => ({ ...prev, [id]: val }))}
                            onKeyDown={(e, id) => handleTabNavigation(e, id, 'performance')}
                          />
                        ) : appState.event?.category?.toLowerCase() === 'combined' ? (
                          // Combined: integer points
                          <IntegerInput
                            ref={setInputRef(`perf-${aid}`)}
                            athleteId={aid}
                            disabled={isDisabled}
                            defaultValue={scores[aid] ?? a.performance ?? ""}
                            onCommit={(id, val) => setScores(prev => ({ ...prev, [id]: val }))}
                            onKeyDown={(e, id) => handleTabNavigation(e, id, 'performance')}
                          />
                        ) : (
                          // Field event: decimal with 2 places
                          <DecimalInput
                            ref={setInputRef(`perf-${aid}`)}
                            athleteId={aid}
                            disabled={isDisabled}
                            defaultValue={formatToDecimal(scores[aid] ?? a.performance ?? "")}
                            onCommit={(id, val) => setScores(prev => ({ ...prev, [id]: val }))}
                            onKeyDown={(e, id) => handleTabNavigation(e, id, 'performance')}
                          />
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={scoreStatus[aid] || "OK"}
                          onChange={(e) => updateStatus(aid, e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                          style={{
                            minWidth: "90px",
                            backgroundColor: 
                              scoreStatus[aid] === "DIS" ? "#fee2e2" :
                              scoreStatus[aid] === "DNF" ? "#fef3c7" :
                              "white"
                          }}
                        >
                          <option value="OK">✓ OK</option>
                          <option value="DNF">⚠ DNF</option>
                          <option value="DIS">✗ DIS</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={completeRound1}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          ✓ Rank & Proceed to Stage 6
        </button>
      </div>
    );
  }

  function Stage6TopSelection() {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 6: Select Top Athletes</h3>
        <p className="mb-4 text-gray-700">Choose to qualify Top 8 or Top 16 athletes for next round.</p>

        {/* Selection Dropdown */}
        <div className="bg-blue-50 p-6 rounded mb-6 border-2 border-blue-200">
          <label className="block text-lg font-semibold text-gray-800 mb-4">Select Number of Qualifiers:</label>
          <div className="flex gap-4">
            <button
              onClick={() => selectTopAthletes(8)}
              className="bg-green-600 text-white px-8 py-3 rounded hover:bg-green-700 font-semibold text-lg"
            >
              ✓ Top 8 Athletes
            </button>
            <button
              onClick={() => selectTopAthletes(16)}
              className="bg-purple-600 text-white px-8 py-3 rounded hover:bg-purple-700 font-semibold text-lg"
            >
              ✓ Top 16 Athletes (with Groups)
            </button>
          </div>
        </div>

        {/* All Round 1 Results for Reference */}
        <div className="bg-gray-50 p-4 rounded mb-6">
          <h4 className="font-semibold mb-3">All Round 1 Results (Ranked):</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-gray-300">
                  <th className="p-2 text-center">RANK</th>
                  <th className="p-2 text-center">CHEST NO</th>
                  <th className="p-2">NAME</th>
                  <th className="p-2">COLLEGE</th>
                  <th className="p-2">PERFORMANCE</th>
                </tr>
              </thead>
              <tbody>
                {appState.round1Results.map((a, idx) => (
                  <tr key={a.id} className={`border-b ${idx < 8 ? 'bg-green-50' : idx < 16 ? 'bg-purple-50' : ''}`}>
                    <td className="p-2 text-center font-semibold">{a.rank || idx + 1}</td>
                    <td className="p-2 text-center">{a.bibNumber}</td>
                    <td className="p-2">{a.name}</td>
                    <td className="p-2">{typeof a.college === 'object' ? a.college?.name : a.college}</td>
                    <td className="p-2">{a.performance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <p>🟢 Green = Top 8 | 🟣 Purple = 9-16</p>
          </div>
        </div>

        {/* Display Groups if Top 16 is Selected */}
        {appState.topSelection === 16 && appState.oddGroup.length > 0 && (
          <div className="space-y-6">
            {/* Odd Group */}
            <div className="bg-blue-50 p-6 rounded border-2 border-blue-300">
              <h3 className="text-lg font-bold mb-4 text-blue-900">📌 Group A - ODD Serial Numbers (1, 3, 5, 7, 9, 11, 13, 15)</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-blue-200">
                      <th className="p-2 text-center">SL NO</th>
                      <th className="p-2 text-center">CHEST NO</th>
                      <th className="p-2">NAME</th>
                      <th className="p-2">COLLEGE</th>
                      <th className="p-2">PERFORMANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appState.oddGroup.map((a, idx) => (
                      <tr key={a.id} className="border-b">
                        <td className="p-2 text-center font-bold">{idx * 2 + 1}</td>
                        <td className="p-2 text-center">{a.bibNumber}</td>
                        <td className="p-2">{a.name}</td>
                        <td className="p-2">{typeof a.college === 'object' ? a.college?.name : a.college}</td>
                        <td className="p-2">{a.performance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Even Group */}
            <div className="bg-purple-50 p-6 rounded border-2 border-purple-300">
              <h3 className="text-lg font-bold mb-4 text-purple-900">📌 Group B - EVEN Serial Numbers (2, 4, 6, 8, 10, 12, 14, 16)</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-purple-200">
                      <th className="p-2 text-center">SL NO</th>
                      <th className="p-2 text-center">CHEST NO</th>
                      <th className="p-2">NAME</th>
                      <th className="p-2">COLLEGE</th>
                      <th className="p-2">PERFORMANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appState.evenGroup.map((a, idx) => (
                      <tr key={a.id} className="border-b">
                        <td className="p-2 text-center font-bold">{(idx + 1) * 2}</td>
                        <td className="p-2 text-center">{a.bibNumber}</td>
                        <td className="p-2">{a.name}</td>
                        <td className="p-2">{typeof a.college === 'object' ? a.college?.name : a.college}</td>
                        <td className="p-2">{a.performance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={() => {
                console.log('Proceeding with Top 16:', { oddGroup: appState.oddGroup, evenGroup: appState.evenGroup });
                setCurrentStage(7);
              }}
              className="w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-bold text-lg"
            >
              ✓ Proceed to Stage 7 with Top 16
            </button>
          </div>
        )}

        {/* Proceed Button for Top 8 */}
        {appState.topSelection === 8 && appState.topAthletes.length > 0 && (
          <button
            onClick={() => {
              console.log('Proceeding with Top 8:', appState.topAthletes);
              setCurrentStage(7);
            }}
            className="w-full bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 font-bold text-lg"
          >
            ✓ Proceed to Stage 7 with Top 8
          </button>
        )}
      </div>
    );
  }

  function Stage7HeatsGeneration() {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 7: Heats Generation</h3>
        {appState.event?.category === 'Track' || appState.event?.category === 'Relay' ? (
          <div>
            <p className="mb-4 text-gray-700">Heats generated with lane assignments.</p>
            {appState.event?.category === 'Relay' ? (
              // For Relay: display teams with 4 athlete rows each
              <>
                {appState.heats.heat1 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Heat 1</h4>
                    <table className="w-full border-collapse border border-gray-400">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="p-2 text-center">SL NO</th>
                          <th className="p-2 text-center">CHEST NO</th>
                          <th className="p-2">NAME</th>
                          <th className="p-2">COLLEGE</th>
                          <th className="p-2 text-center">LANE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appState.heats.heat1?.map((team) => (
                          team.athletes?.map((athlete, athleteIdx) => (
                            <tr key={`${team.slNo}-${athlete.bibNumber}`} className="border-b">
                              <td className="p-2 text-center">
                                {athleteIdx === 0 ? team.slNo : ''}
                              </td>
                              <td className="p-2 text-center">{athlete.bibNumber}</td>
                              <td className="p-2">{athlete.name}</td>
                              <td className="p-2">{typeof athlete.college === 'object' ? athlete.college?.name : athlete.college}</td>
                              <td className="p-2 text-center font-semibold">
                                {athleteIdx === 0 ? team.lane : ''}
                              </td>
                            </tr>
                          ))
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {appState.heats.heat2 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Heat 2</h4>
                    <table className="w-full border-collapse border border-gray-400">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="p-2 text-center">SL NO</th>
                          <th className="p-2 text-center">CHEST NO</th>
                          <th className="p-2">NAME</th>
                          <th className="p-2">COLLEGE</th>
                          <th className="p-2 text-center">LANE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appState.heats.heat2?.map((team) => (
                          team.athletes?.map((athlete, athleteIdx) => (
                            <tr key={`${team.slNo}-${athlete.bibNumber}`} className="border-b">
                              <td className="p-2 text-center">
                                {athleteIdx === 0 ? team.slNo : ''}
                              </td>
                              <td className="p-2 text-center">{athlete.bibNumber}</td>
                              <td className="p-2">{athlete.name}</td>
                              <td className="p-2">{typeof athlete.college === "object" ? athlete.college?.name : athlete.college}</td>
                              <td className="p-2 text-center font-semibold">
                                {athleteIdx === 0 ? team.lane : ''}
                              </td>
                            </tr>
                          ))
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              // For Track: display individual athletes
              <>
                {appState.heats.heat1 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Heat 1</h4>
                    <table className="w-full border-collapse border border-gray-400">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="p-2 text-center">LANE</th>
                          <th className="p-2 text-center">CHEST NO</th>
                          <th className="p-2">NAME</th>
                          <th className="p-2">COLLEGE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appState.heats.heat1.map((a) => (
                          <tr key={a.id} className="border-b">
                            <td className="p-2 text-center font-semibold">{a.lane}</td>
                            <td className="p-2 text-center">{a.bibNumber}</td>
                            <td className="p-2">{a.name}</td>
                            <td className="p-2">{typeof a.college === "object" ? a.college?.name : a.college}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {appState.heats.heat2 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Heat 2</h4>
                    <table className="w-full border-collapse border border-gray-400">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="p-2 text-center">LANE</th>
                          <th className="p-2 text-center">CHEST NO</th>
                          <th className="p-2">NAME</th>
                          <th className="p-2">COLLEGE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appState.heats.heat2.map((a) => (
                          <tr key={a.id} className="border-b">
                            <td className="p-2 text-center font-semibold">{a.lane}</td>
                            <td className="p-2 text-center">{a.bibNumber}</td>
                            <td className="p-2">{a.name}</td>
                            <td className="p-2">{typeof a.college === "object" ? a.college?.name : a.college}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="text-gray-600">No heats for {appState.event?.category} events.</p>
        )}

        <button
          onClick={generateHeatSheets}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 mt-6"
        >
          ✓ Proceed to Stage 7.5: Heats Scoring
        </button>
      </div>
    );
  }

  function Stage7HeatsScoring() {
    const [currentHeatIdx, setCurrentHeatIdx] = useState(0);
    const inputRefsMap = React.useRef({});

    const setInputRef = (key) => (el) => {
      inputRefsMap.current[key] = el;
    };

    const handleTabNavigation = (e, athleteId) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();

      const currentHeatAthletes = Object.keys(heatsScores)
        .filter(k => k.startsWith(`heat${currentHeatIdx}_`))
        .map(k => k.replace(`heat${currentHeatIdx}_`, ''));

      const currentIdx = currentHeatAthletes.indexOf(athleteId);
      if (currentIdx === -1) return;

      const nextIdx = e.shiftKey ? currentIdx - 1 : currentIdx + 1;

      if (nextIdx >= 0 && nextIdx < currentHeatAthletes.length) {
        const nextAthlete = currentHeatAthletes[nextIdx];
        const nextRef = inputRefsMap.current[`perf-${currentHeatIdx}_${nextAthlete}`];
        if (nextRef) {
          nextRef.focus();
        }
      }
    };

    const getCurrentHeatAthletes = () => {
      if (appState.event?.category === 'Relay' && appState.heats.heat1?.[0]?.athletes) {
        return currentHeatIdx === 0 ? appState.heats.heat1 : appState.heats.heat2;
      } else {
        return currentHeatIdx === 0 ? appState.heats.heat1 : appState.heats.heat2;
      }
    };

    const updatePerformance = (athleteId, performance) => {
      const key = `heat${currentHeatIdx}_${athleteId}`;
      setHeatsScores(prev => ({
        ...prev,
        [key]: performance
      }));
    };

    const saveCurrentHeat = async () => {
      const currentHeat = getCurrentHeatAthletes();
      if (!currentHeat) {
        alert('❌ No heat data found');
        return;
      }

      const heatResults = currentHeat.map((athlete, idx) => {
        const key = `heat${currentHeatIdx}_${athlete._id || athlete.id}`;
        const performance = heatsScores[key] || '';

        if (!performance || performance.trim() === '') {
          alert(`⚠️ Athlete ${athlete.name} has no performance. Please fill all fields.`);
          return null;
        }

        return {
          athleteId: athlete._id || athlete.id,
          bibNumber: athlete.bibNumber,
          name: athlete.name,
          college: athlete.college,
          lane: athlete.lane,
          performance: performance
        };
      });

      if (heatResults.includes(null)) return;

      const updatedHeatsResults = [...appState.heatsResults];
      updatedHeatsResults[currentHeatIdx] = {
        heatNo: currentHeatIdx + 1,
        athletes: heatResults
      };

      setAppState(prev => ({
        ...prev,
        heatsResults: updatedHeatsResults
      }));

      alert(`✅ Heat ${currentHeatIdx + 1} saved!`);
    };

    const saveAllHeats = async () => {
      // Validate all heats have performances
      if (!appState.heatsResults || appState.heatsResults.length === 0) {
        alert('❌ No heats scored yet');
        return;
      }

      const success = await saveHeatsResults();
      if (!success) return;

      // Extract finalists
      const finalistSuccess = await extractFinalists();
      if (!finalistSuccess) return;

      alert('✅ All heats scored and finalists extracted! Proceeding to Stage 8...');
      setCurrentStage(8);
    };

    const currentHeat = getCurrentHeatAthletes();
    const totalHeats = (appState.heats.heat1 ? 1 : 0) + (appState.heats.heat2 ? 1 : 0);

    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 7.5: Heats Scoring</h3>
        <p className="mb-4 text-gray-700">Score each heat. Press TAB to move to the next athlete in the same heat.</p>

        {/* Heat Navigation */}
        <div className="mb-6 flex gap-2">
          {appState.heats.heat1 && (
            <button
              onClick={() => setCurrentHeatIdx(0)}
              className={`px-4 py-2 rounded ${currentHeatIdx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
            >
              Heat 1
            </button>
          )}
          {appState.heats.heat2 && (
            <button
              onClick={() => setCurrentHeatIdx(1)}
              className={`px-4 py-2 rounded ${currentHeatIdx === 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
            >
              Heat 2
            </button>
          )}
        </div>

        {/* Current Heat Scoring Table */}
        {currentHeat && (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-center">SL</th>
                  <th className="p-2 text-center">CHEST NO</th>
                  <th className="p-2">NAME</th>
                  <th className="p-2">COLLEGE</th>
                  <th className="p-2 text-center">LANE</th>
                  <th className="p-2">Performance (Time/Distance)</th>
                </tr>
              </thead>
              <tbody>
                {currentHeat.map((athlete, idx) => {
                  const athleteKey = athlete._id || athlete.id;
                  const perfKey = `heat${currentHeatIdx}_${athleteKey}`;
                  const performance = heatsScores[perfKey] || '';

                  return (
                    <tr key={athleteKey} className="border-b">
                      <td className="p-2 text-center font-semibold">{idx + 1}</td>
                      <td className="p-2 text-center">{athlete.bibNumber}</td>
                      <td className="p-2">{athlete.name}</td>
                      <td className="p-2">{typeof athlete.college === 'object' ? athlete.college?.name : athlete.college}</td>
                      <td className="p-2 text-center font-semibold">{athlete.lane || '-'}</td>
                      <td className="p-2">
                        <input
                          ref={setInputRef(`perf-${currentHeatIdx}_${athleteKey}`)}
                          type="text"
                          value={performance}
                          onChange={(e) => updatePerformance(athleteKey, e.target.value)}
                          onKeyDown={(e) => handleTabNavigation(e, athleteKey)}
                          placeholder="00:00:00:00 or 00.00"
                          className="w-full px-2 py-1 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={saveCurrentHeat}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-semibold"
          >
            💾 Save Heat {currentHeatIdx + 1}
          </button>
          <button
            onClick={saveAllHeats}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold"
          >
            ✓ Proceed to Stage 8 (Extract Finalists & Pre-Final)
          </button>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm font-semibold">📊 Heats Summary:</p>
          <p className="text-sm">Total Heats: {totalHeats}</p>
          <p className="text-sm">Current Heat: {currentHeatIdx + 1}</p>
          <p className="text-sm">Athletes in Heat: {currentHeat?.length || 0}</p>
        </div>
      </div>
    );
  }

  function Stage8PreFinalSheet() {
    const printPreFinalSheet = () => {
      // Use finalists if available (from heats), otherwise use round1Results
      const displayData = appState.finalists?.length > 0 ? appState.finalists : appState.round1Results;

      const tbody = displayData.map((finalist, idx) => `
        <tr>
          <td class="center">${idx + 1}</td>
          <td class="center">${finalist.bibNumber}</td>
          <td>${finalist.name}</td>
          <td>${typeof finalist.college === "object" ? finalist.college?.name : finalist.college}</td>
          <td class="center"><strong>${finalist.lane || '-'}</strong></td>
          <td></td>
        </tr>
      `).join('');
      
      const content = `
        <div class="page">
          ${getBUHeader()}
          <div class="content">
            <h3>Pre-Final Sheet - ${appState.event?.eventName}</h3>
            <p><strong>Gender:</strong> ${appState.event?.gender} | <strong>Date:</strong> ${appState.event?.date} | <strong>Venue:</strong> ${appState.event?.venue}</p>
            <table>
              <thead>
                <tr>
                  <th class="center" style="width: 8%;">SL NO</th>
                  <th class="center" style="width: 12%;">CHEST NO</th>
                  <th style="width: 22%;">NAME</th>
                  <th style="width: 18%;">COLLEGE</th>
                  <th class="center" style="width: 8%;">LANE</th>
                  <th style="width: 32%;">TIMING</th>
                </tr>
              </thead>
              <tbody>
                ${tbody}
              </tbody>
            </table>
          </div>
          ${getBUFooter(1, 1)}
        </div>
      `;
      printSheet(content, 'Pre_Final_Sheet');
    };

    const displayData = appState.finalists?.length > 0 ? appState.finalists : appState.round1Results;

    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 8: Pre-Final Sheet (Top 8 with Lanes)</h3>
        <p className="mb-4 text-gray-700">
          {appState.finalists?.length > 0 
            ? '✅ Top 8 finalists extracted from heats with IAAF lane assignments.' 
            : 'No finalists yet. Please complete heats scoring first.'}
        </p>

        <button
          onClick={printPreFinalSheet}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 mb-6"
        >
          🖨️ Print / PDF Pre-Final Sheet
        </button>

        <div className="mb-6 bg-blue-50 p-4 rounded border border-blue-200">
          <h4 className="font-semibold mb-2">📋 Finalists for Finals:</h4>
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-center">SEED</th>
                <th className="p-2 text-center">LANE</th>
                <th className="p-2 text-center">CHEST NO</th>
                <th className="p-2">NAME</th>
                <th className="p-2">COLLEGE</th>
              </tr>
            </thead>
            <tbody>
              {displayData.slice(0, 8).map((finalist, idx) => (
                <tr key={finalist._id || finalist.id || `finalist-${idx}`} className="border-b">
                  <td className="p-2 text-center font-bold">{finalist.seed || idx + 1}</td>
                  <td className="p-2 text-center font-bold text-lg">{finalist.lane || seedToLane(idx + 1)}</td>
                  <td className="p-2 text-center">{finalist.bibNumber}</td>
                  <td className="p-2">{finalist.name}</td>
                  <td className="p-2">{typeof finalist.college === 'object' ? finalist.college?.name : finalist.college}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          <strong>IAAF Lane Allocation:</strong> Seed 1→Lane 3, Seed 2→Lane 4, Seed 3→Lane 2, Seed 4→Lane 5, 
          Seed 5→Lane 6, Seed 6→Lane 1, Seed 7→Lane 7, Seed 8→Lane 8
        </p>

        <button
          onClick={generatePreFinalSheet}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          ✓ Proceed to Stage 9: Final Scoring
        </button>
      </div>
    );
  }

  function Stage9FinalScoring() {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 9: Final Scoring</h3>
        <p className="mb-4 text-gray-700">Enter final performances for all finalists.</p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-center">{appState.event?.category === 'Relay' ? 'SL NO' : 'RANK'}</th>
                <th className="p-2 text-center">CHEST NO</th>
                <th className="p-2">NAME</th>
                <th className="p-2">COLLEGE</th>
                <th className="p-2">FINAL PERFORMANCE</th>
              </tr>
            </thead>
            <tbody>
              {appState.event?.category === 'Relay' ? (
                // For Relay: display teams with 4 athlete rows each
                appState.round1Results?.map((team) => (
                  team.athletes?.map((athlete, athleteIdx) => (
                    <tr key={athlete._id || athlete.id} className="border-b">
                      <td className="p-2 text-center">
                        {athleteIdx === 0 ? team.rank || team.slNo : ''}
                      </td>
                      <td className="p-2 text-center">{athlete.bibNumber}</td>
                      <td className="p-2">{athlete.name}</td>
                      <td className="p-2">{typeof athlete.college === "object" ? athlete.college?.name : athlete.college}</td>
                      <td className="p-2">
                        {athleteIdx === 0 ? (
                          <TimeInput
                            athleteId={team._id || team.id}
                            defaultValue={formatTimeInput(finalScores[team._id || team.id] ?? team.performance ?? "")}
                            onCommit={(id, val) => setFinalScores(prev => ({ ...prev, [id]: val }))}
                          />
                        ) : (
                          ''
                        )}
                      </td>
                    </tr>
                  ))
                ))
              ) : (
                // For Track/Jump/Throw: display individual athletes with stable keys
                appState.round1Results.map((a) => (
                  <tr key={a._id || a.id} className="border-b">
                    <td className="p-2 text-center">{a.rank}</td>
                    <td className="p-2 text-center">{a.bibNumber}</td>
                    <td className="p-2">{a.name}</td>
                    <td className="p-2">{typeof a.college === "object" ? a.college?.name : a.college}</td>
                    <td className="p-2">
                      {(appState.event?.category?.toLowerCase() === 'track' || appState.event?.category?.toLowerCase() === 'relay') ? (
                        // Time input: hh:mm:ss:ms format
                        <TimeInput
                          athleteId={a._id || a.id}
                          defaultValue={formatTimeInput(finalScores[a._id || a.id] ?? a.performance ?? "")}
                          onCommit={(id, val) => setFinalScores(prev => ({ ...prev, [id]: val }))}
                        />
                      ) : (
                        // Decimal input for field events: X.XX format
                        <DecimalInput
                          athleteId={a._id || a.id}
                          defaultValue={formatToDecimal(finalScores[a._id || a.id] ?? a.performance ?? "")}
                          onCommit={(id, val) => setFinalScores(prev => ({ ...prev, [id]: val }))}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <button
          onClick={completeFinalScoring}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          ✓ Rank Final & Proceed to Stage 10
        </button>
      </div>
    );
  }

  function Stage10FinalAnnouncement() {
    const printFinalAnnouncement = () => {
      let tbody = '';
      
      if (appState.event?.category === 'Relay' && Array.isArray(appState.finalResults) && appState.finalResults[0]?.athletes) {
        // For Relay: display teams with 4 athlete rows
        tbody = appState.finalResults.map((team) => {
          let medalEmoji = '';
          if (team.rank === 1) medalEmoji = '🥇';
          else if (team.rank === 2) medalEmoji = '🥈';
          else if (team.rank === 3) medalEmoji = '🥉';
          
          return team.athletes?.map((athlete, athleteIdx) => `
            <tr>
              <td class="center">${athleteIdx === 0 ? `<strong>${medalEmoji} ${team.rank}</strong>` : ''}</td>
              <td class="center">${athlete.bibNumber}</td>
              <td>${athlete.name}</td>
              <td>${typeof athlete.college === "object" ? athlete.college?.name : athlete.college}</td>
              <td class="center">${athleteIdx === 0 ? team.performance : ''}</td>
              <td class="center"><strong>${athleteIdx === 0 ? team.points : ''}</strong></td>
            </tr>
          `).join('');
        }).join('');
      } else {
        // For Track/Jump/Throw: display individual athletes
        tbody = appState.finalResults.map((a) => {
          let medalEmoji = '';
          if (a.rank === 1) medalEmoji = '🥇';
          else if (a.rank === 2) medalEmoji = '🥈';
          else if (a.rank === 3) medalEmoji = '🥉';
          
          return `
            <tr>
              <td class="center"><strong>${medalEmoji} ${a.rank}</strong></td>
              <td class="center">${a.bibNumber}</td>
              <td>${a.name}</td>
              <td>${typeof a.college === "object" ? a.college?.name : a.college}</td>
              <td class="center">${a.performance}</td>
              <td class="center"><strong>${a.points}</strong></td>
            </tr>
          `;
        }).join('');
      }
      
      const content = `
        <div class="page">
          ${getBUHeader()}
          <div class="content">
            <h3>Final Results - ${appState.event?.eventName}</h3>
            <p><strong>Gender:</strong> ${appState.event?.gender} | <strong>Date:</strong> ${appState.event?.date}</p>
            <table>
              <thead>
                <tr>
                  <th class="center" style="width: 10%;">POS</th>
                  <th class="center" style="width: 12%;">CHEST NO</th>
                  <th style="width: 22%;">NAME</th>
                  <th style="width: 20%;">COLLEGE</th>
                  <th style="width: 20%;">PERFORMANCE</th>
                  <th class="center" style="width: 16%;">MEDAL POINTS</th>
                </tr>
              </thead>
              <tbody>
                ${tbody}
              </tbody>
            </table>
          </div>
          ${getBUFooter(1, 1)}
        </div>
      `;
      printSheet(content, 'Final_Results_Announcement');
    };

    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 10: Final Announcement</h3>
        <p className="mb-4 text-gray-700">Final rankings with medal points (5-3-1).</p>

        <button
          onClick={printFinalAnnouncement}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 mb-6"
        >
          🖨️ Print / PDF Final Results
        </button>

        <table className="w-full border-collapse border border-gray-400 mb-6">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-center">POSITION</th>
              <th className="p-2 text-center">CHEST NO</th>
              <th className="p-2">NAME</th>
              <th className="p-2">COLLEGE</th>
              <th className="p-2">PERFORMANCE</th>
              <th className="p-2 text-center">POINTS</th>
            </tr>
          </thead>
          <tbody>
            {appState.finalResults.map((a, idx) => {
              let medal = '';
              if (a.rank === 1) medal = '🥇';
              else if (a.rank === 2) medal = '🥈';
              else if (a.rank === 3) medal = '🥉';
              
              return (
                <tr key={a._id || a.id || `final-${idx}`} className="border-b">
                  <td className="p-2 text-center font-semibold">{medal} {a.rank}</td>
                  <td className="p-2 text-center">{a.bibNumber}</td>
                  <td className="p-2">{a.name}</td>
                  <td className="p-2">{typeof a.college === "object" ? a.college?.name : a.college}</td>
                  <td className="p-2">{a.performance}</td>
                  <td className="p-2 text-center font-semibold">{a.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button
          onClick={publishFinalResults}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          ✓ Proceed to Stage 11
        </button>
      </div>
    );
  }

  function Stage11NameCorrection() {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 11: Name Correction</h3>
        <p className="mb-4 text-gray-700">Verify and correct athlete details if needed.</p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-center">RANK</th>
                <th className="p-2">NAME</th>
                <th className="p-2">COLLEGE</th>
                <th className="p-2 text-center">CHEST NO</th>
                <th className="p-2">PERFORMANCE</th>
                <th className="p-2 text-center">POINTS</th>
              </tr>
            </thead>
            <tbody>
              {appState.finalResults.map((a) => (
                <tr key={a.id} className="border-b">
                  <td className="p-2 text-center">{a.rank}</td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={a.name}
                      onChange={(e) => updateAthleteName(a.id, { name: e.target.value })}
                      className="p-1 border rounded w-full"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={typeof a.college === "object" ? a.college?.name : a.college}
                      onChange={(e) => updateAthleteName(a.id, { college: e.target.value })}
                      className="p-1 border rounded w-full"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      value={a.bibNumber}
                      onChange={(e) => updateAthleteName(a.id, { bibNumber: parseInt(e.target.value) })}
                      className="p-1 border rounded w-20 text-center"
                    />
                  </td>
                  <td className="p-2">{a.performance}</td>
                  <td className="p-2 text-center">{a.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={completeNameCorrection}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          ✓ Proceed to Stage 12
        </button>
      </div>
    );
  }

  function Stage12Verification() {
    const checklist = [
      { name: 'Call Room Completed', status: appState.statusFlow.callRoomCompleted },
      { name: 'Sheets Generated', status: appState.statusFlow.sheetsGenerated },
      { name: 'Round 1 Scored', status: appState.statusFlow.round1Scored },
      { name: 'Heats Generated', status: appState.statusFlow.heatsGenerated },
      { name: 'Pre-Final Generated', status: appState.statusFlow.preFinalGenerated },
      { name: 'Final Scored', status: appState.statusFlow.finalScored },
      { name: 'Name Correction Done', status: appState.statusFlow.nameCorrected }
    ];

    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 12: Verification</h3>
        <p className="mb-4 text-gray-700">Verify all stages are complete before publishing.</p>

        <div className="space-y-3 mb-6">
          {checklist.map((item, idx) => (
            <div key={idx} className={`p-3 rounded flex items-center ${item.status ? 'bg-green-50' : 'bg-red-50'}`}>
              <span className="text-2xl mr-3">{item.status ? '✅' : '❌'}</span>
              <span className="font-semibold">{item.name}</span>
            </div>
          ))}
        </div>

        {checklist.every(c => c.status) ? (
          <button
            onClick={() => setCurrentStage(13)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            ✓ Verification Complete - Proceed to Stage 13
          </button>
        ) : (
          <div className="bg-yellow-100 p-4 rounded text-yellow-800">
            ⚠️ Not all stages are complete. Please complete all stages before publishing.
          </div>
        )}
      </div>
    );
  }

  function Stage13PublishLock() {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 13: Publish & Lock</h3>
        <p className="mb-4 text-gray-700">Once published, the event cannot be edited.</p>

        <div className="bg-red-50 p-6 rounded mb-6 border-2 border-red-300">
          <p className="text-red-800 font-semibold">⚠️ WARNING</p>
          <p className="text-red-700 mt-2">Publishing will LOCK the event permanently. This action CANNOT be undone.</p>
        </div>

        <div className="bg-blue-50 p-4 rounded mb-6">
          <h4 className="font-semibold mb-2">Final Results Summary:</h4>
          <p>Total Finalists: {appState.finalResults.length}</p>
          {appState.finalResults.length > 0 && (
            <div>
              <p className="mt-2 font-semibold">🥇 Winner: {appState.finalResults[0].name} ({appState.finalResults[0].college})</p>
              {appState.finalResults[1] && <p className="font-semibold">🥈 2nd: {appState.finalResults[1].name}</p>}
              {appState.finalResults[2] && <p className="font-semibold">🥉 3rd: {appState.finalResults[2].name}</p>}
            </div>
          )}
        </div>

        <button
          onClick={publishAndLock}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-semibold"
        >
          🔒 PUBLISH & LOCK EVENT
        </button>
      </div>
    );
  }

  function Stage14CombinedFinalScoring() {
    const athletes = appState.combinedSheets[0] || [];
    
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 14: Combined Events - Final Scoring</h3>
        <p className="mb-4 text-gray-700">
          {appState.event?.eventName} ({appState.event?.gender}) - Enter TOTAL POINTS only
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-center">SL NO</th>
                <th className="p-2 text-center">CHEST NO</th>
                <th className="p-2">NAME</th>
                <th className="p-2">COLLEGE</th>
                <th className="p-2 text-center">TOTAL POINTS</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((a, idx) => (
                <tr key={a.id} className="border-b">
                  <td className="p-2 text-center">{idx + 1}</td>
                  <td className="p-2 text-center">{a.bibNumber}</td>
                  <td className="p-2">{a.name}</td>
                  <td className="p-2">{typeof a.college === "object" ? a.college?.name : a.college}</td>
                  <td className="p-2">
                    <IntegerInput
                      athleteId={a.id}
                      defaultValue={combinedTotalValues[a.id] ?? a.totalPoints ?? ""}
                      onCommit={(id, val) => handleCombinedTotalPoints(id, val)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={completeCombinedScoring}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          ✓ Complete Scoring & Auto-Rank
        </button>
      </div>
    );
  }

  function Stage15CombinedFinalAnnouncement() {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 15: Combined Events - Final Results</h3>
        
        <div className="bg-blue-50 p-6 rounded mb-6">
          <h4 className="font-semibold mb-4 text-lg">
            🏆 {appState.event?.eventName} - Final Rankings
          </h4>
          
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-center">RANK</th>
                  <th className="p-2 text-center">CHEST NO</th>
                  <th className="p-2">NAME</th>
                  <th className="p-2">COLLEGE</th>
                  <th className="p-2 text-center">TOTAL POINTS</th>
                  <th className="p-2 text-center">POINTS</th>
                </tr>
              </thead>
              <tbody>
                {appState.finalResults.map((a) => (
                  <tr key={a.id} className="border-b">
                    <td className="p-2 text-center font-bold">{a.rank === 1 ? '🥇' : a.rank === 2 ? '🥈' : a.rank === 3 ? '🥉' : `#${a.rank}`}</td>
                    <td className="p-2 text-center">{a.bibNumber}</td>
                    <td className="p-2">{a.name}</td>
                    <td className="p-2">{typeof a.college === "object" ? a.college?.name : a.college}</td>
                    <td className="p-2 text-center font-semibold">{a.totalPoints}</td>
                    <td className="p-2 text-center">{a.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-4">
            <button
              onClick={() => {
                const content = `
                  <div class="page">
                    ${getBUHeader()}
                    <div class="content">
                      <h3>${appState.event?.eventName} (${appState.event?.gender}) – FINAL POINTS SHEET</h3>
                      <p><strong>Date:</strong> ${appState.event?.date} | <strong>Venue:</strong> ${appState.event?.venue}</p>
                      <table>
                        <thead>
                          <tr>
                            <th class="center" style="width: 8%;">RANK</th>
                            <th class="center" style="width: 12%;">CHEST NO</th>
                            <th style="width: 25%;">Athlete Name</th>
                            <th style="width: 20%;">COLLEGE</th>
                            <th class="center" style="width: 18%;">Total Points</th>
                            <th class="center" style="width: 10%;">POINTS</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${appState.finalResults.map((a) => `
                            <tr>
                              <td class="center">${a.rank}</td>
                              <td class="center">${a.bibNumber}</td>
                              <td>${a.name}</td>
                              <td>${typeof a.college === "object" ? a.college?.name : a.college}</td>
                              <td class="center">${a.totalPoints}</td>
                              <td class="center">${a.points}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                    ${getBUFooter(1, 1)}
                  </div>
                `;
                printSheet(content, `${appState.event?.eventName}_Final_Results`);
              }}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
            >
              🖨️ Print Final Results Sheet
            </button>
            
            <button
              onClick={() => {
                setAppState(prev => ({
                  ...prev,
                  statusFlow: { ...prev.statusFlow, finalAnnouncementGenerated: true }
                }));
                setCurrentStage(16);
              }}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              ✓ Proceed to Verification
            </button>
          </div>
        </div>
      </div>
    );
  }

  function Stage16CombinedVerification() {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">Stage 16: Verification & Lock</h3>
        <p className="mb-4 text-gray-700">Once published, the event results cannot be edited.</p>

        <div className="bg-red-50 p-6 rounded mb-6 border-2 border-red-300">
          <p className="text-red-800 font-semibold">⚠️ WARNING</p>
          <p className="text-red-700 mt-2">Publishing will LOCK the event permanently. This action CANNOT be undone.</p>
        </div>

        <div className="bg-blue-50 p-4 rounded mb-6">
          <h4 className="font-semibold mb-2">Final Results Summary:</h4>
          <p>Total Athletes: {appState.finalResults.length}</p>
          {appState.finalResults.length > 0 && (
            <div>
              <p className="mt-2 font-semibold">🥇 Winner: {appState.finalResults[0].name} ({appState.finalResults[0].totalPoints} pts)</p>
              {appState.finalResults[1] && <p className="font-semibold">🥈 2nd: {appState.finalResults[1].name} ({appState.finalResults[1].totalPoints} pts)</p>}
              {appState.finalResults[2] && <p className="font-semibold">🥉 3rd: {appState.finalResults[2].name} ({appState.finalResults[2].totalPoints} pts)</p>}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setAppState(prev => ({
              ...prev,
              statusFlow: {
                ...prev.statusFlow,
                verified: true,
                published: true,
                lockedAt: new Date().toISOString()
              }
            }));
            alert('Event published and locked successfully!');
          }}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-semibold"
        >
          🔒 PUBLISH & LOCK EVENT
        </button>
      </div>
    );
  }
};

// ========================================
// HELPER COMPONENTS
// ========================================

function CreateEventForm({ onSubmit, eventDB }) {
  const [formData, setFormData] = useState({
    category: '',
    gender: '',
    eventName: '',
    date: '',
    time: '',
    venue: '',
    numAthletes: 15
  });

  const getEvents = () => {
    if (!formData.category) return [];
    if (formData.category === 'Track') {
      return formData.gender === 'Men' ? eventDB.Track.men : eventDB.Track.women;
    }
    if (formData.category === 'Jump') return eventDB.Jump;
    if (formData.category === 'Throw') return eventDB.Throw;
    if (formData.category === 'Relay') return eventDB.Relay;
    if (formData.category === 'Combined') {
      return formData.gender === 'Men' ? [eventDB.Combined.Men] : [eventDB.Combined.Women];
    }
    return [];
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-semibold mb-1">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value, eventName: '' })}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Select --</option>
          <option value="Track">Track</option>
          <option value="Jump">Jump</option>
          <option value="Throw">Throw</option>
          <option value="Relay">Relay</option>
          <option value="Combined">Combined</option>
        </select>
      </div>

      {formData.category && (
        <div>
          <label className="block font-semibold mb-1">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value, eventName: '' })}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select --</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            {formData.category === 'Relay' && <option value="Mixed">Mixed</option>}
          </select>
        </div>
      )}

      {formData.gender && (
        <div>
          <label className="block font-semibold mb-1">Event</label>
          <select
            value={formData.eventName}
            onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select --</option>
            {getEvents().map((evt, idx) => (
              <option key={idx} value={evt}>{evt}</option>
            ))}
          </select>
        </div>
      )}

      {formData.eventName && (
        <>
          <div>
            <label className="block font-semibold mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Venue</label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            onClick={() => onSubmit(formData)}
            className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 font-semibold"
          >
            ✓ Create Event
          </button>
        </>
      )}
    </div>
  );
}

function StageNavigation({ currentStage, event, onNavigate }) {
  const stages = [
    'Event Creation', 'Call Room Gen', 'Call Room Complete', 'Generate Sheets',
    'Round 1 Scoring', 'Top Selection', 'Heats Generation', 'Pre-Final Sheet',
    'Final Scoring', 'Final Announcement', 'Name Correction', 'Verification', 'Publish & Lock'
  ];

  return (
    <div className="bg-gray-100 p-4 rounded">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{event?.eventName}</h2>
        <span className="text-sm text-gray-600">{event?.category} | {event?.gender}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stages.map((stage, idx) => (
          <button
            key={idx}
            onClick={() => onNavigate(idx + 1)}
            className={`px-3 py-1 rounded whitespace-nowrap text-sm font-semibold transition ${
              currentStage === idx + 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {idx + 1}. {stage}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EventManagementNew;


