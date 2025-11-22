import React, { useState, useEffect } from 'react';

// Print/PDF utility function
const printSheet = (content, filename = 'sheet') => {
  const printWindow = window.open('', '', 'width=1000,height=600');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .page-break { page-break-after: always; }
          .header { text-align: center; font-weight: bold; margin-bottom: 10px; }
          @media print { body { margin: 0; } }
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
  }, 250);
};

const EventManagement = ({ pedCollege }) => {
  // ========================================
  // DATA MODELS & STATE
  // ========================================

  const eventDatabase = {
    categories: ["Track", "Jump", "Throw", "Combined", "Relay"],
    genders: ["Men", "Women"],
    events: {
      Track: {
        common: [
          "100 Metres", "200 Metres", "400 Metres", "800 Metres", "1500 Metres",
          "5000 Metres", "10,000 Metres", "400 Metres Hurdles", "20 km Walk",
          "3000 Metres Steeple Chase", "4 × 100 Metres Relay", "4 × 400 Metres Relay",
          "4 × 400 Metres Mixed Relay", "Half Marathon"
        ],
        menOnly: ["110 Metres Hurdles"],
        womenOnly: ["100 Metres Hurdles"]
      },
      Jump: ["High Jump", "Long Jump", "Pole Vault", "Triple Jump"],
      Throw: ["Discus Throw", "Hammer Throw", "Javelin Throw", "Shot Put"],
      Combined: { Men: "Decathlon", Women: "Heptathlon" },
      Relay: ["4 × 100 Metres Relay", "4 × 400 Metres Relay", "4 × 400 Metres Mixed Relay"]
    }
  };

  const stages = [
    { id: 0, name: 'Dashboard', key: 'dashboard' },
    { id: 1, name: 'Event Creation', key: 'created' },
    { id: 2, name: 'Call Room Gen', key: 'callRoomGenerated' },
    { id: 3, name: 'Call Room Complete', key: 'callRoomCompleted' },
    { id: 4, name: 'Track Sets', key: 'trackSetsGenerated' },
    { id: 5, name: 'Field/Jump Sheets', key: 'fieldJumpSheetsGenerated' },
    { id: 6, name: 'Round 1 Scoring', key: 'round1Scored' },
    { id: 7, name: 'Heats Generation', key: 'heatsGenerated' },
    { id: 8, name: 'Heats Scoring', key: 'heatsScored' },
    { id: 9, name: 'Pre-Final Sheet', key: 'preFinalGenerated' },
    { id: 10, name: 'Final Scoring', key: 'finalScored' },
    { id: 11, name: 'Final Announcement', key: 'finalAnnouncementGenerated' },
    { id: 12, name: 'Name Correction', key: 'nameCorrected' },
    { id: 13, name: 'Verification', key: 'verified' },
    { id: 14, name: 'Publish & Lock', key: 'published' }
  ];

  // Main state management
  const [allEvents, setAllEvents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('athleticsEvents') || '[]');
    } catch {
      return [];
    }
  });

  const [currentEventId, setCurrentEventId] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);
  
  const [appState, setAppState] = useState({
    event: null,
    athletes: [],
    statusFlow: {
      created: false, callRoomGenerated: false, callRoomCompleted: false,
      trackSetsGenerated: false, fieldJumpSheetsGenerated: false,
      round1Scored: false, heatsGenerated: false, heatsScored: false,
      preFinalGenerated: false, finalScored: false,
      finalAnnouncementGenerated: false, nameCorrected: false,
      verified: false, published: false, lockedAt: null
    },
    currentStage: 0,
    trackSets: [], heats: [], round1Results: [], finalResults: [],
    fieldSheets: [], combinedResults: []
  });

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  const timeToMs = (timeStr) => {
    const parts = timeStr.split(':');
    if (parts.length === 4) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      const ms = parseInt(parts[3]) || 0;
      return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + ms;
    }
    return 0;
  };

  const generateBibNumber = () => Math.floor(1000 + Math.random() * 9000);

  const generateEventId = () => 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  const generateOfficialHeader = () => (
    <div className="print-header text-center border-b-4 border-gray-800 pb-4 mb-6">
      <h1 className="text-2xl font-bold">BANGALORE UNIVERSITY</h1>
      <h2 className="text-lg font-semibold mt-2">Directorate of Physical Education & Sports</h2>
      <p className="text-sm text-gray-600">UCPE Stadium, Jnanabharathi Campus, Bengaluru – 560056</p>
      <p className="text-lg font-bold mt-2">61st Inter-Collegiate Athletic Championship 2025–26</p>
      <p className="text-xs italic text-gray-500 mt-1">(Developed by Soundarya Institute of Management and Science)</p>
    </div>
  );

  const generateOfficialFooter = () => (
    <div className="print-footer text-center border-t-2 border-gray-800 pt-4 mt-8 text-xs">
      <p className="font-bold">© 2025 Bangalore University | Athletic Meet Management System</p>
      <p><strong>Developed & Maintained by:</strong> Deepu K C | SIMS</p>
      <p><strong>Guided By:</strong> Dr. Harish P M, HOD - PED, SIMS</p>
      <p><strong>For Details:</strong> deepukc2526@gmail.com</p>
    </div>
  );

  // ========================================
  // ALGORITHMS
  // ========================================

  const balancedSetAllocator = (athletes, setSize = 8) => {
    const presentAthletes = athletes.filter(a => a.status === 'PRESENT');
    const total = presentAthletes.length;
    const numSets = Math.ceil(total / setSize);
    const baseSize = Math.floor(total / numSets);
    const remainder = total % numSets;

    const sets = [];
    let currentIndex = 0;

    for (let i = 0; i < numSets; i++) {
      const currentSetSize = i < remainder ? baseSize + 1 : baseSize;
      sets.push(presentAthletes.slice(currentIndex, currentIndex + currentSetSize));
      currentIndex += currentSetSize;
    }

    return sets;
  };

  const assignLanes = (athletes) => {
    const laneOrder = [3, 4, 2, 5, 6, 1, 7, 8];
    return athletes.map((athlete, index) => ({
      ...athlete,
      lane: laneOrder[index % 8] || (index % 8) + 1
    }));
  };

  const generateHeats = (topAthletes) => {
    const heat1 = [];
    const heat2 = [];

    topAthletes.forEach((athlete, index) => {
      const rank = index + 1;
      if (rank % 2 === 1) {
        heat1.push(athlete);
      } else {
        heat2.push(athlete);
      }
    });

    return {
      heat1: assignLanes(heat1),
      heat2: assignLanes(heat2)
    };
  };

  const rankByPerformance = (athletes, eventType) => {
    const sorted = [...athletes].sort((a, b) => {
      if (eventType === 'track' || eventType === 'relay') {
        return timeToMs(a.performance) - timeToMs(b.performance);
      } else {
        return parseFloat(b.performance) - parseFloat(a.performance);
      }
    });

    return sorted.map((athlete, index) => ({
      ...athlete,
      rank: index + 1
    }));
  };

  const calculatePoints = (rank) => {
    if (rank === 1) return 5;
    if (rank === 2) return 3;
    if (rank === 3) return 1;
    return 0;
  };

  // ========================================
  // EVENT MANAGEMENT
  // ========================================

  const saveEventState = () => {
    if (!currentEventId) return;

    const eventIndex = allEvents.findIndex(e => e.id === currentEventId);
    const eventData = {
      id: currentEventId,
      event: appState.event,
      athletes: appState.athletes,
      statusFlow: appState.statusFlow,
      trackSets: appState.trackSets,
      heats: appState.heats,
      round1Results: appState.round1Results,
      finalResults: appState.finalResults,
      fieldSheets: appState.fieldSheets,
      combinedResults: appState.combinedResults,
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
    localStorage.setItem('athleticsEvents', JSON.stringify(updatedEvents));
  };

  const loadEventState = (eventId) => {
    const eventData = allEvents.find(e => e.id === eventId);
    if (!eventData) return false;

    setCurrentEventId(eventId);
    setAppState({
      event: eventData.event,
      athletes: eventData.athletes,
      statusFlow: eventData.statusFlow,
      trackSets: eventData.trackSets || [],
      heats: eventData.heats || [],
      round1Results: eventData.round1Results || [],
      finalResults: eventData.finalResults || [],
      fieldSheets: eventData.fieldSheets || [],
      combinedResults: eventData.combinedResults || []
    });

    return true;
  };

  const createNewEvent = () => {
    const newId = generateEventId();
    setCurrentEventId(newId);
    setAppState({
      event: null,
      athletes: [],
      statusFlow: {
        created: false, callRoomGenerated: false, callRoomCompleted: false,
        trackSetsGenerated: false, fieldJumpSheetsGenerated: false,
        round1Scored: false, heatsGenerated: false, heatsScored: false,
        preFinalGenerated: false, finalScored: false,
        finalAnnouncementGenerated: false, nameCorrected: false,
        verified: false, published: false, lockedAt: null
      },
      currentStage: 1,
      trackSets: [], heats: [], round1Results: [], finalResults: [],
      fieldSheets: [], combinedResults: []
    });
    setCurrentStage(1);
  };

  const navigateToStage = (stageId) => {
    if (appState.statusFlow.published && stageId !== 13) {
      alert('Event is published and locked. Cannot navigate to this stage.');
      return;
    }

    saveEventState();
    setCurrentStage(stageId);
  };

  const backToDashboard = () => {
    saveEventState();
    setCurrentStage(0);
  };

  // ========================================
  // RENDER DASHBOARD
  // ========================================

  const renderDashboard = () => {
    const calculateProgress = (statusFlow) => {
      const totalStages = 13;
      let completed = 0;
      Object.keys(statusFlow).forEach(key => {
        if (key !== 'lockedAt' && statusFlow[key] === true) completed++;
      });
      return { completed, total: totalStages, percentage: Math.round((completed / totalStages) * 100) };
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Event Dashboard</h2>
            <p className="text-gray-600">Manage all athletics events</p>
          </div>

          {allEvents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-xl text-gray-500 mb-4">No events created yet</p>
              <button
                onClick={createNewEvent}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
              >
                Create Your First Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allEvents.map(eventData => {
                const progress = calculateProgress(eventData.statusFlow);
                const isPublished = eventData.statusFlow.published;

                return (
                  <div
                    key={eventData.id}
                    className={`border-4 rounded-lg p-6 bg-white shadow-lg ${
                      isPublished ? 'border-green-500' : 'border-gray-300'
                    }`}
                  >
                    <h3 className="text-xl font-bold text-blue-600 mb-2">
                      {eventData.event?.name || 'Untitled Event'}
                    </h3>
                    <div className="flex gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {eventData.event?.category || 'N/A'}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        {eventData.event?.gender || 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      📅 {eventData.event?.date || 'N/A'} | 📍 {eventData.event?.venue || 'N/A'}
                    </p>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold">Progress: {progress.completed} / {progress.total}</span>
                        <span className="font-semibold">{progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="border-t pt-4 flex gap-2">
                      <button
                        onClick={() => {
                          if (loadEventState(eventData.id)) {
                            // Find the next incomplete stage or last completed stage + 1
                            const statusFlow = eventData.statusFlow;
                            let nextStage = 1;
                            
                            const stages = [
                              'created', 'callRoomGenerated', 'callRoomCompleted',
                              'trackSetsGenerated', 'fieldJumpSheetsGenerated',
                              'round1Scored', 'heatsGenerated', 'heatsScored',
                              'preFinalGenerated', 'finalScored',
                              'finalAnnouncementGenerated', 'nameCorrected', 'verified'
                            ];
                            
                            for (let i = 0; i < stages.length; i++) {
                              if (statusFlow[stages[i]]) {
                                nextStage = i + 2; // Move to next stage
                              } else {
                                nextStage = i + 1; // Go to incomplete stage
                                break;
                              }
                            }
                            
                            if (statusFlow.published) {
                              nextStage = 14; // Go to publish view if already published
                            }
                            
                            setCurrentStage(nextStage);
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                      >
                        {isPublished ? '👁️ View' : '▶️ Resume'}
                      </button>
                      {!isPublished && (
                        <button
                          onClick={() => {
                            const updatedEvents = allEvents.filter(e => e.id !== eventData.id);
                            setAllEvents(updatedEvents);
                            localStorage.setItem('athleticsEvents', JSON.stringify(updatedEvents));
                          }}
                          className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ========================================
  // RENDER STAGES
  // ========================================

  // ========================================
  // STAGE 2: CALL ROOM GENERATION
  // ========================================

  const Stage2_CallRoomGeneration = () => {
    const [callRoomGenerated, setCallRoomGenerated] = useState(false);

    const generateCallRoomSheet = () => {
      const isRelay = appState.event.type === 'relay';
      const athletes = appState.athletes;

      let rows = [];
      if (isRelay) {
        for (let i = 0; i < athletes.length; i += 4) {
          const team = athletes.slice(i, i + 4);
          const teamNum = Math.floor(i / 4) + 1;
          team.forEach((athlete, teamIndex) => {
            rows.push({
              slNo: teamIndex === 0 ? teamNum : '',
              bibNumber: athlete.bibNumber,
              name: athlete.name,
              phone: athlete.phone,
              college: teamIndex === 0 ? athlete.college : '',
              remarks: ''
            });
          });
        }
      } else {
        rows = athletes.map((athlete, index) => ({
          slNo: index + 1,
          bibNumber: athlete.bibNumber,
          name: athlete.name,
          phone: athlete.phone,
          college: athlete.college,
          remarks: ''
        }));
      }

      setAppState(prev => ({
        ...prev,
        statusFlow: { ...prev.statusFlow, callRoomGenerated: true }
      }));
      setCallRoomGenerated(true);
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 2: Call Room Sheet Generation</h2>
          <div className="mb-4 flex gap-2">
            <button
              onClick={generateCallRoomSheet}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Generate Call Room Sheet
            </button>
            {callRoomGenerated && (
              <button
                onClick={() => {
                  const header = `<div class="header">${appState.event?.name || 'Event'} - Call Room Sheet</div>`;
                  const tableHtml = document.querySelector('.call-room-table').outerHTML;
                  printSheet(header + tableHtml, 'call-room-sheet');
                }}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
              >
                🖨️ Print / PDF
              </button>
            )}
          </div>

          {callRoomGenerated && (
            <div className="border-2 border-gray-300 p-6">
              {generateOfficialHeader()}
              <h3 className="text-xl font-bold text-center mb-4">CALL ROOM SHEET</h3>
              <p className="text-center mb-2">Event: {appState.event?.name}</p>
              <p className="text-center mb-4">Date: {appState.event?.date} | Time: {appState.event?.time}</p>

              <table className="w-full border-collapse border-2 border-gray-800 mb-6 call-room-table">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-800 p-2">SL NO</th>
                    <th className="border border-gray-800 p-2">CHEST NO</th>
                    <th className="border border-gray-800 p-2">NAME</th>
                    <th className="border border-gray-800 p-2">COLLEGE</th>
                    <th className="border border-gray-800 p-2">REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {appState.athletes.map((athlete, index) => (
                    <tr key={athlete.id}>
                      <td className="border border-gray-800 p-2">{index + 1}</td>
                      <td className="border border-gray-800 p-2">{athlete.bibNumber}</td>
                      <td className="border border-gray-800 p-2">{athlete.name}</td>
                      <td className="border border-gray-800 p-2">{athlete.college}</td>
                      <td className="border border-gray-800 p-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {generateOfficialFooter()}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => navigateToStage(1)}
              className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700"
            >
              ← Back
            </button>
            <button
              onClick={() => navigateToStage(3)}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 3: CALL ROOM COMPLETION
  // ========================================

  const Stage3_CallRoomCompletion = () => {
    const [statuses, setStatuses] = useState({});
    const [remarks, setRemarks] = useState({});

    useEffect(() => {
      const initialStatuses = {};
      const initialRemarks = {};
      appState.athletes.forEach(a => {
        initialStatuses[a.id] = a.status || 'PRESENT';
        initialRemarks[a.id] = a.remarks || '';
      });
      setStatuses(initialStatuses);
      setRemarks(initialRemarks);
    }, [appState.athletes]);

    const handleCompleteCallRoom = () => {
      const updatedAthletes = appState.athletes.map(athlete => ({
        ...athlete,
        status: statuses[athlete.id],
        remarks: remarks[athlete.id]
      }));

      setAppState(prev => ({
        ...prev,
        athletes: updatedAthletes,
        statusFlow: { ...prev.statusFlow, callRoomCompleted: true }
      }));

      alert('Call Room completed!');
      navigateToStage(4);
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 3: Call Room Completion</h2>
          <p className="mb-4">Mark attendance and add remarks for each athlete:</p>

          <div className="mb-4 flex gap-2">
            <button
              onClick={handleCompleteCallRoom}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              Complete Call Room
            </button>
            <button
              onClick={() => {
                const tableHtml = document.querySelector('.stage3-table').outerHTML;
                const header = `<div class="header">${appState.event?.name || 'Event'} - Call Room Attendance & Remarks</div>`;
                printSheet(header + tableHtml, 'call-room-attendance');
              }}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              🖨️ Print / PDF
            </button>
          </div>

          <table className="w-full border-collapse border-2 border-gray-800 stage3-table">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-800 p-2">Sl No</th>
                <th className="border border-gray-800 p-2">Bib #</th>
                <th className="border border-gray-800 p-2">Name</th>
                <th className="border border-gray-800 p-2">College</th>
                <th className="border border-gray-800 p-2">Status</th>
                <th className="border border-gray-800 p-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {appState.athletes.map((athlete, index) => (
                <tr key={athlete.id}>
                  <td className="border border-gray-800 p-2">{index + 1}</td>
                  <td className="border border-gray-800 p-2">{athlete.bibNumber}</td>
                  <td className="border border-gray-800 p-2">{athlete.name}</td>
                  <td className="border border-gray-800 p-2">{athlete.college}</td>
                  <td className="border border-gray-800 p-2">
                    <select
                      value={statuses[athlete.id] || 'PRESENT'}
                      onChange={(e) => setStatuses({ ...statuses, [athlete.id]: e.target.value })}
                      className="px-2 py-1 border-2 border-gray-300 rounded w-full"
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="ABSENT">ABSENT</option>
                      <option value="DISQUALIFIED">DISQUALIFIED</option>
                    </select>
                  </td>
                  <td className="border border-gray-800 p-2">
                    <input
                      type="text"
                      value={remarks[athlete.id] || ''}
                      onChange={(e) => setRemarks({ ...remarks, [athlete.id]: e.target.value })}
                      placeholder="Add remarks..."
                      className="px-2 py-1 border border-gray-300 rounded w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => navigateToStage(2)}
              className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700"
            >
              ← Back
            </button>
            <button
              onClick={() => navigateToStage(4)}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 1: EVENT CREATION
  // ========================================

  const Stage1_EventCreation = () => {
    const [formData, setFormData] = useState({
      category: '',
      gender: '',
      eventName: '',
      date: '',
      time: '',
      venue: '',
      maxPerCollege: 5,
      numAthletes: 25
    });

    const [availableEvents, setAvailableEvents] = useState([]);

    const updateEventDropdown = (category, gender) => {
      let events = [];

      if (category === 'Track') {
        events = [...eventDatabase.events.Track.common];
        if (gender === 'Men') {
          events.push(...eventDatabase.events.Track.menOnly);
        } else if (gender === 'Women') {
          events.push(...eventDatabase.events.Track.womenOnly);
        }
      } else if (category === 'Jump') {
        events = eventDatabase.events.Jump;
      } else if (category === 'Throw') {
        events = eventDatabase.events.Throw;
      } else if (category === 'Combined') {
        if (gender === 'Men') {
          events = [eventDatabase.events.Combined.Men];
        } else if (gender === 'Women') {
          events = [eventDatabase.events.Combined.Women];
        }
      } else if (category === 'Relay') {
        events = eventDatabase.events.Relay;
      }

      setAvailableEvents(events);
    };

    const handleSubmit = (e) => {
      e.preventDefault();

      // Use only the PED's college if available
      const colleges = pedCollege ? [pedCollege.name] : ['St. Xavier College', 'Christ University', 'Mount Carmel', 'Jyoti Nivas', 'MES College', 'St. Joseph College'];
      const sampleNames = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh', 'Anjali Nair', 'Karthik Rao', 'Divya Menon', 'Arjun Iyer', 'Lakshmi Krishnan'];

      const newAthletes = [];
      for (let i = 0; i < formData.numAthletes; i++) {
        newAthletes.push({
          id: i + 1,
          bibNumber: generateBibNumber(),
          name: sampleNames[i % sampleNames.length] + ' ' + (i + 1),
          phone: '98' + String(Math.floor(10000000 + Math.random() * 90000000)),
          college: colleges[i % colleges.length],
          status: null,
          performance: null,
          rank: null
        });
      }

      setAppState(prev => ({
        ...prev,
        event: {
          name: formData.eventName,
          type: formData.category.toLowerCase(),
          gender: formData.gender,
          category: formData.category,
          date: formData.date,
          time: formData.time,
          venue: formData.venue,
          maxPerCollege: formData.maxPerCollege
        },
        athletes: newAthletes,
        statusFlow: { ...prev.statusFlow, created: true }
      }));

      alert(`Event created with ${formData.numAthletes} athletes!`);
      navigateToStage(2);
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 1: Event Creation</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  setFormData({ ...formData, category: cat, eventName: '' });
                  updateEventDropdown(cat, formData.gender);
                }}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              >
                <option value="">-- Select Category --</option>
                {eventDatabase.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-2">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => {
                  const gen = e.target.value;
                  setFormData({ ...formData, gender: gen });
                  updateEventDropdown(formData.category, gen);
                }}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              >
                <option value="">-- Select Gender --</option>
                {eventDatabase.genders.map(gen => (
                  <option key={gen} value={gen}>{gen}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-2">Event *</label>
              <select
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                disabled={availableEvents.length === 0}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg disabled:bg-gray-100"
              >
                <option value="">-- Select Event --</option>
                {availableEvents.map(evt => (
                  <option key={evt} value={evt}>{evt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-2">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Time *</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Venue *</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g., Kanteerava Stadium"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Number of Sample Athletes</label>
              <input
                type="number"
                value={formData.numAthletes}
                onChange={(e) => setFormData({ ...formData, numAthletes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                min="1"
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Create Event & Generate Athletes
            </button>
          </form>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 4: TRACK OFFICIALS SHEETS
  // ========================================

  const Stage4_TrackSets = () => {
    const [setsGenerated, setSetsGenerated] = useState(false);

    const generateTrackSets = () => {
      const sets = balancedSetAllocator(appState.athletes, 8);
      const trackedSets = sets.map((set, setIndex) => 
        assignLanes(set).map((athlete, index) => ({
          ...athlete,
          setNumber: setIndex + 1,
          slNo: index + 1
        }))
      );
      
      setAppState(prev => ({
        ...prev,
        trackSets: trackedSets,
        statusFlow: { ...prev.statusFlow, trackSetsGenerated: true }
      }));
      setSetsGenerated(true);
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 4: Track Officials Sheets</h2>
          <div className="mb-4 flex gap-2">
            <button
              onClick={generateTrackSets}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Generate Track Sets
            </button>
            {setsGenerated && (
              <button
                onClick={() => {
                  const allTables = document.querySelectorAll('.stage4-table');
                  let content = `<div class="header">${appState.event?.name || 'Event'} - Track Sets</div>`;
                  allTables.forEach((table, idx) => {
                    if (idx > 0) content += '<div style="page-break-after: always;"></div>';
                    content += table.outerHTML;
                  });
                  printSheet(content, 'track-sets');
                }}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
              >
                🖨️ Print All Sets / PDF
              </button>
            )}
          </div>

          {setsGenerated && (
            <div className="space-y-6">
              {appState.trackSets.map((set, setIndex) => (
                <div key={setIndex} className="border-2 border-gray-300 p-4">
                  <h3 className="text-lg font-bold mb-4">Set {setIndex + 1}</h3>
                  <table className="w-full border-collapse border-2 border-gray-800 stage4-table">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-800 p-2">Sl No</th>
                        <th className="border border-gray-800 p-2">Bib #</th>
                        <th className="border border-gray-800 p-2">Name</th>
                        <th className="border border-gray-800 p-2">College</th>
                        <th className="border border-gray-800 p-2">Lane</th>
                        <th className="border border-gray-800 p-2">Timing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {set.map((athlete, index) => (
                        <tr key={athlete.id}>
                          <td className="border border-gray-800 p-2">{index + 1}</td>
                          <td className="border border-gray-800 p-2">{athlete.bibNumber}</td>
                          <td className="border border-gray-800 p-2">{athlete.name}</td>
                          <td className="border border-gray-800 p-2">{athlete.college}</td>
                          <td className="border border-gray-800 p-2">{athlete.lane}</td>
                          <td className="border border-gray-800 p-2"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button onClick={() => navigateToStage(3)} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700">← Back</button>
            <button onClick={() => navigateToStage(5)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Next →</button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 5: FIELD/JUMP SHEETS
  // ========================================

  const Stage5_FieldJumpSheets = () => {
    const generateFieldJumpSheets = () => {
      const presentAthletes = appState.athletes.filter(a => a.status === 'PRESENT');
      const pages = [];
      for (let i = 0; i < presentAthletes.length; i += 15) {
        pages.push(presentAthletes.slice(i, i + 15));
      }
      
      setAppState(prev => ({
        ...prev,
        fieldSheets: pages,
        statusFlow: { ...prev.statusFlow, fieldJumpSheetsGenerated: true }
      }));
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 5: Field/Jump/Combined Events Sheets</h2>
          <div className="mb-4 flex gap-2">
            <button 
              onClick={generateFieldJumpSheets} 
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Generate Field/Jump Sheets
            </button>
            {appState.fieldSheets.length > 0 && (
              <button
                onClick={() => {
                  const allTables = document.querySelectorAll('.stage5-table');
                  let content = `<div class="header">${appState.event?.name || 'Event'} - Field/Jump Sheets</div>`;
                  allTables.forEach((table, idx) => {
                    if (idx > 0) content += '<div style="page-break-after: always;"></div>';
                    content += table.outerHTML;
                  });
                  printSheet(content, 'field-jump-sheets');
                }}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
              >
                🖨️ Print All Pages / PDF
              </button>
            )}
          </div>

          {appState.fieldSheets.length > 0 && (
            <div className="space-y-6">
              {appState.fieldSheets.map((page, pageIndex) => (
                <div key={pageIndex} className="border-2 border-gray-300 p-4">
                  <h3 className="text-lg font-bold mb-4">Page {pageIndex + 1}</h3>
                  <table className="w-full border-collapse border-2 border-gray-800 stage5-table">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-800 p-2">Sl No</th>
                        <th className="border border-gray-800 p-2">Bib #</th>
                        <th className="border border-gray-800 p-2">Name</th>
                        <th className="border border-gray-800 p-2">College</th>
                        <th className="border border-gray-800 p-2">Attempt 1</th>
                        <th className="border border-gray-800 p-2">Attempt 2</th>
                        <th className="border border-gray-800 p-2">Attempt 3</th>
                        <th className="border border-gray-800 p-2">Best</th>
                      </tr>
                    </thead>
                    <tbody>
                      {page.map((athlete, index) => (
                        <tr key={athlete.id}>
                          <td className="border border-gray-800 p-2">{index + 1}</td>
                          <td className="border border-gray-800 p-2">{athlete.bibNumber}</td>
                          <td className="border border-gray-800 p-2">{athlete.name}</td>
                          <td className="border border-gray-800 p-2">{athlete.college}</td>
                          <td className="border border-gray-800 p-2"></td>
                          <td className="border border-gray-800 p-2"></td>
                          <td className="border border-gray-800 p-2"></td>
                          <td className="border border-gray-800 p-2"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button onClick={() => navigateToStage(4)} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700">← Back</button>
            <button onClick={() => navigateToStage(6)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Next →</button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 6: ROUND 1 SCORING
  // ========================================

  const Stage6_Round1Scoring = () => {
    const [performances, setPerformances] = useState({});
    const presentAthletes = appState.athletes.filter(a => a.status === 'PRESENT');

    const scoreRound1 = () => {
      const athletesWithPerf = presentAthletes.map(a => ({
        ...a,
        performance: performances[a.id] || ''
      })).filter(a => a.performance);

      const ranked = rankByPerformance(athletesWithPerf, appState.event?.type || 'track');
      
      setAppState(prev => ({
        ...prev,
        athletes: prev.athletes.map(a => ranked.find(r => r.id === a.id) || a),
        round1Results: ranked,
        statusFlow: { ...prev.statusFlow, round1Scored: true }
      }));
      
      alert('Round 1 scored successfully!');
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 6: Round 1 Scoring</h2>
          <div className="mb-4 flex gap-2">
            <button 
              onClick={scoreRound1} 
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              Calculate Rankings
            </button>
            <button
              onClick={() => {
                const tableHtml = document.querySelector('.stage6-table').outerHTML;
                const header = `<div class="header">${appState.event?.name || 'Event'} - Round 1 Results</div>`;
                printSheet(header + tableHtml, 'round1-results');
              }}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              🖨️ Print Results / PDF
            </button>
          </div>

          <table className="w-full border-collapse border-2 border-gray-800 stage6-table">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-800 p-2">Sl No</th>
                <th className="border border-gray-800 p-2">Name</th>
                <th className="border border-gray-800 p-2">College</th>
                <th className="border border-gray-800 p-2">Performance</th>
                <th className="border border-gray-800 p-2">Rank</th>
              </tr>
            </thead>
            <tbody>
              {presentAthletes.map((athlete, index) => (
                <tr key={athlete.id}>
                  <td className="border border-gray-800 p-2">{index + 1}</td>
                  <td className="border border-gray-800 p-2">{athlete.name}</td>
                  <td className="border border-gray-800 p-2">{athlete.college}</td>
                  <td className="border border-gray-800 p-2">
                    <input
                      type="text"
                      value={performances[athlete.id] || ''}
                      onChange={(e) => setPerformances({ ...performances, [athlete.id]: e.target.value })}
                      placeholder="Enter performance"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="border border-gray-800 p-2">{athlete.rank || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex gap-2">
            <button onClick={() => navigateToStage(5)} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700">← Back</button>
            <button onClick={() => navigateToStage(7)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Next →</button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 7: HEATS GENERATION
  // ========================================

  const Stage7_HeatsGeneration = () => {
    const [heatsGenerated, setHeatsGenerated] = useState(false);

    const generateHeatsFromRound1 = () => {
      if (appState.round1Results.length === 0) {
        alert('Please complete Round 1 scoring first');
        return;
      }

      const topAthletes = appState.round1Results.slice(0, 16);
      const heatsData = generateHeats(topAthletes);
      
      setAppState(prev => ({
        ...prev,
        heats: [heatsData.heat1, heatsData.heat2],
        statusFlow: { ...prev.statusFlow, heatsGenerated: true }
      }));
      setHeatsGenerated(true);
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 7: Heats Generation</h2>
          <div className="mb-4 flex gap-2">
            <button 
              onClick={generateHeatsFromRound1} 
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Generate Heats
            </button>
            {heatsGenerated && (
              <button
                onClick={() => {
                  const allTables = document.querySelectorAll('.stage7-table');
                  let content = `<div class="header">${appState.event?.name || 'Event'} - Heats</div>`;
                  allTables.forEach((table, idx) => {
                    if (idx > 0) content += '<div style="page-break-after: always;"></div>';
                    content += table.outerHTML;
                  });
                  printSheet(content, 'heats');
                }}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
              >
                🖨️ Print All Heats / PDF
              </button>
            )}
          </div>

          {heatsGenerated && (
            <div className="space-y-6">
              {appState.heats.map((heat, heatIndex) => (
                <div key={heatIndex} className="border-2 border-gray-300 p-4">
                  <h3 className="text-lg font-bold mb-4">Heat {heatIndex + 1}</h3>
                  <table className="w-full border-collapse border-2 border-gray-800 stage7-table">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-800 p-2">Sl No</th>
                        <th className="border border-gray-800 p-2">Name</th>
                        <th className="border border-gray-800 p-2">College</th>
                        <th className="border border-gray-800 p-2">Lane</th>
                        <th className="border border-gray-800 p-2">Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heat.map((athlete, index) => (
                        <tr key={athlete.id}>
                          <td className="border border-gray-800 p-2">{index + 1}</td>
                          <td className="border border-gray-800 p-2">{athlete.name}</td>
                          <td className="border border-gray-800 p-2">{athlete.college}</td>
                          <td className="border border-gray-800 p-2">{athlete.lane}</td>
                          <td className="border border-gray-800 p-2">{athlete.rank}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button onClick={() => navigateToStage(6)} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700">← Back</button>
            <button onClick={() => navigateToStage(8)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Next →</button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 8: HEATS SCORING
  // ========================================

  const Stage8_HeatsScoring = () => {
    const [heatPerformances, setHeatPerformances] = useState({});

    const scoreHeats = () => {
      const updatedHeats = appState.heats.map(heat =>
        heat.map(athlete => ({
          ...athlete,
          heatPerformance: heatPerformances[athlete.id] || athlete.performance
        }))
      );

      setAppState(prev => ({
        ...prev,
        heats: updatedHeats,
        statusFlow: { ...prev.statusFlow, heatsScored: true }
      }));
      alert('Heats scored successfully!');
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 8: Heats Scoring</h2>
          <div className="mb-4 flex gap-2">
            <button 
              onClick={scoreHeats} 
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              Calculate Heat Rankings
            </button>
            <button
              onClick={() => {
                const allTables = document.querySelectorAll('.stage8-table');
                let content = `<div class="header">${appState.event?.name || 'Event'} - Heats Scoring</div>`;
                allTables.forEach((table, idx) => {
                  if (idx > 0) content += '<div style="page-break-after: always;"></div>';
                  content += table.outerHTML;
                });
                printSheet(content, 'heats-scoring');
              }}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              🖨️ Print All / PDF
            </button>
          </div>

          {appState.heats.map((heat, heatIndex) => (
            <div key={heatIndex} className="mb-6">
              <h3 className="text-lg font-bold mb-3">Heat {heatIndex + 1}</h3>
              <table className="w-full border-collapse border-2 border-gray-800 stage8-table">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-800 p-2">Sl No</th>
                    <th className="border border-gray-800 p-2">Name</th>
                    <th className="border border-gray-800 p-2">College</th>
                    <th className="border border-gray-800 p-2">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {heat.map((athlete, index) => (
                    <tr key={athlete.id}>
                      <td className="border border-gray-800 p-2">{index + 1}</td>
                      <td className="border border-gray-800 p-2">{athlete.name}</td>
                      <td className="border border-gray-800 p-2">{athlete.college}</td>
                      <td className="border border-gray-800 p-2">
                        <input
                          type="text"
                          value={heatPerformances[athlete.id] || ''}
                          onChange={(e) => setHeatPerformances({ ...heatPerformances, [athlete.id]: e.target.value })}
                          placeholder="Performance"
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div className="mt-6 flex gap-2">
            <button onClick={() => navigateToStage(7)} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700">← Back</button>
            <button onClick={() => navigateToStage(9)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Next →</button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 9: PRE-FINAL SHEET
  // ========================================

  const Stage9_PreFinalSheet = () => {
    const generatePreFinalSheet = () => {
      setAppState(prev => ({
        ...prev,
        statusFlow: { ...prev.statusFlow, preFinalGenerated: true }
      }));
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 9: Pre-Final Sheet</h2>
          <div className="mb-4 flex gap-2">
            <button 
              onClick={generatePreFinalSheet} 
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Generate Pre-Final Sheet
            </button>
            {appState.statusFlow.preFinalGenerated && (
              <button
                onClick={() => {
                  const tableHtml = document.querySelector('.stage9-table').outerHTML;
                  const header = `<div class="header">${appState.event?.name || 'Event'} - Pre-Final Sheet</div>`;
                  printSheet(header + tableHtml, 'pre-final-sheet');
                }}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
              >
                🖨️ Print / PDF
              </button>
            )}
          </div>

          {appState.statusFlow.preFinalGenerated && (
            <div className="border-2 border-gray-300 p-4">
              <h3 className="text-lg font-bold mb-4">Pre-Final Athletes</h3>
              <table className="w-full border-collapse border-2 border-gray-800 stage9-table">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-800 p-2">Sl No</th>
                    <th className="border border-gray-800 p-2">Name</th>
                    <th className="border border-gray-800 p-2">College</th>
                    <th className="border border-gray-800 p-2">Performance</th>
                    <th className="border border-gray-800 p-2">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {appState.round1Results.slice(0, 16).map((athlete, index) => (
                    <tr key={athlete.id}>
                      <td className="border border-gray-800 p-2">{index + 1}</td>
                      <td className="border border-gray-800 p-2">{athlete.name}</td>
                      <td className="border border-gray-800 p-2">{athlete.college}</td>
                      <td className="border border-gray-800 p-2">{athlete.performance}</td>
                      <td className="border border-gray-800 p-2">{athlete.rank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button onClick={() => navigateToStage(8)} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700">← Back</button>
            <button onClick={() => navigateToStage(10)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Next →</button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 10: FINAL SCORING
  // ========================================

  const Stage10_FinalScoring = () => {
    const [finalPerformances, setFinalPerformances] = useState({});
    const topAthletes = appState.heats.flat();

    const scoreFinal = () => {
      const athletesWithPerf = topAthletes.map(a => ({
        ...a,
        finalPerformance: finalPerformances[a.id] || a.performance
      })).filter(a => a.finalPerformance);

      const ranked = rankByPerformance(athletesWithPerf, appState.event?.type || 'track');
      const withPoints = ranked.map(a => ({
        ...a,
        finalRank: a.rank,
        points: calculatePoints(a.rank)
      }));

      setAppState(prev => ({
        ...prev,
        finalResults: withPoints,
        statusFlow: { ...prev.statusFlow, finalScored: true }
      }));
      alert('Final round scored successfully!');
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 10: Final Scoring</h2>
          <div className="mb-4 flex gap-2">
            <button 
              onClick={scoreFinal} 
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              Calculate Final Rankings & Points
            </button>
            <button
              onClick={() => {
                const tableHtml = document.querySelector('.stage10-table').outerHTML;
                const header = `<div class="header">${appState.event?.name || 'Event'} - Final Results</div>`;
                printSheet(header + tableHtml, 'final-results');
              }}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              🖨️ Print / PDF
            </button>
          </div>

          <table className="w-full border-collapse border-2 border-gray-800 stage10-table">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-800 p-2">Sl No</th>
                <th className="border border-gray-800 p-2">Name</th>
                <th className="border border-gray-800 p-2">College</th>
                <th className="border border-gray-800 p-2">Final Performance</th>
                <th className="border border-gray-800 p-2">Rank</th>
                <th className="border border-gray-800 p-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {topAthletes.map((athlete, index) => (
                <tr key={athlete.id}>
                  <td className="border border-gray-800 p-2">{index + 1}</td>
                  <td className="border border-gray-800 p-2">{athlete.name}</td>
                  <td className="border border-gray-800 p-2">{athlete.college}</td>
                  <td className="border border-gray-800 p-2">
                    <input
                      type="text"
                      value={finalPerformances[athlete.id] || ''}
                      onChange={(e) => setFinalPerformances({ ...finalPerformances, [athlete.id]: e.target.value })}
                      placeholder="Performance"
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="border border-gray-800 p-2">{athlete.finalRank || '-'}</td>
                  <td className="border border-gray-800 p-2">{athlete.points || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex gap-2">
            <button onClick={() => navigateToStage(9)} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700">← Back</button>
            <button onClick={() => navigateToStage(11)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Next →</button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 11: FINAL ANNOUNCEMENT
  // ========================================

  const Stage11_FinalAnnouncement = () => {
    const generateAnnouncement = () => {
      setAppState(prev => ({
        ...prev,
        statusFlow: { ...prev.statusFlow, finalAnnouncementGenerated: true }
      }));
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 11: Final Announcement Sheet</h2>
          <div className="mb-4 flex gap-2">
            <button 
              onClick={generateAnnouncement} 
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Generate Announcement
            </button>
            {appState.statusFlow.finalAnnouncementGenerated && (
              <button
                onClick={() => {
                  const tableHtml = document.querySelector('.stage11-table').outerHTML;
                  const header = `<div class="header">${appState.event?.name || 'Event'} - Final Announcement</div>`;
                  printSheet(header + tableHtml, 'final-announcement');
                }}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
              >
                🖨️ Print / PDF
              </button>
            )}
          </div>

          {appState.statusFlow.finalAnnouncementGenerated && (
            <div className="border-2 border-gray-300 p-4">
              <h3 className="text-xl font-bold text-center mb-6">🏆 FINAL RESULTS 🏆</h3>
              <table className="w-full border-collapse border-2 border-gray-800 stage11-table">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <th className="border border-gray-800 p-2">Position</th>
                    <th className="border border-gray-800 p-2">Name</th>
                    <th className="border border-gray-800 p-2">College</th>
                    <th className="border border-gray-800 p-2">Performance</th>
                    <th className="border border-gray-800 p-2">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {appState.finalResults.map((athlete) => {
                    let rowBg = '';
                    if (athlete.finalRank === 1) rowBg = 'bg-yellow-100';
                    else if (athlete.finalRank === 2) rowBg = 'bg-gray-100';
                    else if (athlete.finalRank === 3) rowBg = 'bg-orange-100';
                    
                    return (
                      <tr key={athlete.id} className={rowBg}>
                        <td className="border border-gray-800 p-2 font-bold">{athlete.finalRank} {athlete.finalRank === 1 ? '🥇' : athlete.finalRank === 2 ? '🥈' : athlete.finalRank === 3 ? '🥉' : ''}</td>
                        <td className="border border-gray-800 p-2">{athlete.name}</td>
                        <td className="border border-gray-800 p-2">{athlete.college}</td>
                        <td className="border border-gray-800 p-2">{athlete.finalPerformance || athlete.performance}</td>
                        <td className="border border-gray-800 p-2 font-bold">{athlete.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button onClick={() => navigateToStage(10)} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700">← Back</button>
            <button onClick={() => navigateToStage(12)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Next →</button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 12: NAME CORRECTION
  // ========================================

  const Stage12_NameCorrection = () => {
    const [corrections, setCorrections] = useState({});

    const saveCorrections = () => {
      const correctedResults = appState.finalResults.map(a => ({
        ...a,
        name: corrections[a.id] || a.name
      }));

      setAppState(prev => ({
        ...prev,
        finalResults: correctedResults,
        statusFlow: { ...prev.statusFlow, nameCorrected: true }
      }));
      alert('Name corrections saved!');
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 12: Name Correction</h2>
          <div className="mb-4 flex gap-2">
            <button 
              onClick={saveCorrections} 
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              Save Corrections
            </button>
            <button
              onClick={() => {
                const tableHtml = document.querySelector('.stage12-table').outerHTML;
                const header = `<div class="header">${appState.event?.name || 'Event'} - Final Results (Corrected)</div>`;
                printSheet(header + tableHtml, 'corrected-results');
              }}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
            >
              🖨️ Print / PDF
            </button>
          </div>

          <table className="w-full border-collapse border-2 border-gray-800 stage12-table">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-800 p-2">Position</th>
                <th className="border border-gray-800 p-2">Name</th>
                <th className="border border-gray-800 p-2">College</th>
                <th className="border border-gray-800 p-2">Edit Name</th>
              </tr>
            </thead>
            <tbody>
              {appState.finalResults.map((athlete) => (
                <tr key={athlete.id}>
                  <td className="border border-gray-800 p-2">{athlete.finalRank}</td>
                  <td className="border border-gray-800 p-2">{athlete.name}</td>
                  <td className="border border-gray-800 p-2">{athlete.college}</td>
                  <td className="border border-gray-800 p-2">
                    <input
                      type="text"
                      defaultValue={athlete.name}
                      onChange={(e) => setCorrections({ ...corrections, [athlete.id]: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex gap-2">
            <button onClick={() => navigateToStage(11)} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700">← Back</button>
            <button onClick={() => navigateToStage(13)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Next →</button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 13: VERIFICATION
  // ========================================

  const Stage13_Verification = () => {
    const verifyEvent = () => {
      setAppState(prev => ({
        ...prev,
        statusFlow: { ...prev.statusFlow, verified: true }
      }));
      alert('Event verified successfully!');
      navigateToStage(14);
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 13: Verification</h2>
          
          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input type="checkbox" disabled checked className="w-5 h-5" />
                <span>Event Created</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" disabled checked={appState.statusFlow.callRoomCompleted} className="w-5 h-5" />
                <span>Call Room Completed</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" disabled checked={appState.statusFlow.round1Scored} className="w-5 h-5" />
                <span>Round 1 Scored</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" disabled checked={appState.statusFlow.finalScored} className="w-5 h-5" />
                <span>Final Scored</span>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" disabled checked={appState.statusFlow.nameCorrected} className="w-5 h-5" />
                <span>Name Corrections Done</span>
              </div>
            </div>
          </div>

          <button onClick={verifyEvent} className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 mb-4">
            ✓ Verify Event
          </button>

          <div className="mt-6 flex gap-2">
            <button onClick={() => navigateToStage(12)} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700">← Back</button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // STAGE 14: PUBLISH & LOCK
  // ========================================

  const Stage14_PublishLock = () => {
    const publishEvent = () => {
      if (!window.confirm('Are you sure you want to publish and lock this event? This action cannot be undone.')) {
        return;
      }

      setAppState(prev => ({
        ...prev,
        statusFlow: {
          ...prev.statusFlow,
          published: true,
          lockedAt: new Date().toLocaleString()
        }
      }));
      alert('Event published and locked successfully!');
      saveEventState();
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Stage 14: Publish & Lock</h2>

          {!appState.statusFlow.published ? (
            <>
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
                <p className="font-bold">⚠️ Warning</p>
                <p>Publishing will lock the event. No further edits will be allowed.</p>
              </div>
              <button onClick={publishEvent} className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">
                🔒 Publish & Lock Event
              </button>
            </>
          ) : (
            <div className="bg-green-100 border-l-4 border-green-500 p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">✅ EVENT PUBLISHED</h3>
              <div className="space-y-2">
                <p><strong>Event:</strong> {appState.event?.name}</p>
                <p><strong>Published:</strong> YES</p>
                <p><strong>Locked At:</strong> {appState.statusFlow.lockedAt}</p>
                <p><strong>Total Athletes:</strong> {appState.finalResults.length}</p>
              </div>
            </div>
          )}

          {appState.finalResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-4">Final Rankings Summary</h3>
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => {
                    const tableHtml = document.querySelector('.stage14-table').outerHTML;
                    const header = `<div class="header">${appState.event?.name || 'Event'} - Final Published Results</div>`;
                    printSheet(header + tableHtml, 'published-results');
                  }}
                  className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                >
                  🖨️ Print Results / PDF
                </button>
              </div>
              <table className="w-full border-collapse border-2 border-gray-800 stage14-table">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-800 p-2">Position</th>
                    <th className="border border-gray-800 p-2">Name</th>
                    <th className="border border-gray-800 p-2">College</th>
                    <th className="border border-gray-800 p-2">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {appState.finalResults.slice(0, 10).map((athlete) => (
                    <tr key={athlete.id}>
                      <td className="border border-gray-800 p-2 font-bold">{athlete.finalRank}</td>
                      <td className="border border-gray-800 p-2">{athlete.name}</td>
                      <td className="border border-gray-800 p-2">{athlete.college}</td>
                      <td className="border border-gray-800 p-2">{athlete.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {appState.statusFlow.published && (
            <div className="mt-6 flex gap-2">
              <button onClick={backToDashboard} className="px-6 py-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700">
                ← Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ========================================
  // RENDER STAGE CONTENT
  // ========================================

  const renderStageContent = () => {
    switch (currentStage) {
      case 0:
        return renderDashboard();
      case 1:
        return <Stage1_EventCreation />;
      case 2:
        return <Stage2_CallRoomGeneration />;
      case 3:
        return <Stage3_CallRoomCompletion />;
      case 4:
        return <Stage4_TrackSets />;
      case 5:
        return <Stage5_FieldJumpSheets />;
      case 6:
        return <Stage6_Round1Scoring />;
      case 7:
        return <Stage7_HeatsGeneration />;
      case 8:
        return <Stage8_HeatsScoring />;
      case 9:
        return <Stage9_PreFinalSheet />;
      case 10:
        return <Stage10_FinalScoring />;
      case 11:
        return <Stage11_FinalAnnouncement />;
      case 12:
        return <Stage12_NameCorrection />;
      case 13:
        return <Stage13_Verification />;
      case 14:
        return <Stage14_PublishLock />;
      default:
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Stage {currentStage}</h2>
              <p className="text-gray-600 text-lg">Invalid stage</p>
            </div>
          </div>
        );
    }
  };

  // ========================================
  // MAIN RENDER
  // ========================================

  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem('athleticsEvents') || '[]');
    setAllEvents(storedEvents);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {currentStage > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">🏃 Athletics Meet Event Management</h1>
              <p className="mt-2">Complete Event Management System</p>
            </div>
            <button
              onClick={backToDashboard}
              className="px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {renderStageContent()}
    </div>
  );
};

export default EventManagement;
