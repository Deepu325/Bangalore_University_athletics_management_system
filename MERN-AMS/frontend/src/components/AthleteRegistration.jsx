import React, { useState, useEffect } from 'react';

// API base URL from env or default to localhost:5002 (current backend port)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

export default function AthleteRegistration({ showToast, pedCollege }) {
  const [selectedCollege, setSelectedCollege] = useState(pedCollege?.id || '');
  const [activeTab, setActiveTab] = useState('men');
  const [athleteRows, setAthleteRows] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch colleges from MongoDB via API
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/colleges`);
        if (response.ok) {
          const data = await response.json();
          // API returns { ok, count, colleges } - extract the colleges array
          setColleges(data.colleges || data || []);
        }
      } catch (error) {
        console.error('Error fetching colleges:', error);
        setColleges([]);
      }
    };
    fetchColleges();
  }, []);

  // Fetch athletes from MongoDB via API
  useEffect(() => {
    const fetchAthletes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/athletes`);
        if (response.ok) {
          const data = await response.json();
          console.log('✓ Fetched athletes:', data?.length, 'records');
          if (data?.length > 0) console.log('Sample athlete:', data[0]);
          setAthletes(data || []);
        } else {
          console.error('API error:', response.status);
          setAthletes([]);
        }
      } catch (error) {
        console.error('Error fetching athletes:', error);
        setAthletes([]);
      }
    };
    fetchAthletes();
  }, []);

  // Events
  const trackEvents = [
    '100m', '200m', '400m', '800m', '1500m', '5000m', '10000m',
    '400m Hurdles', '20km Walk', '3000m Steeplechase', 'Half Marathon'
  ];
  const menTrackEvents = ['110m Hurdles'];
  const womenTrackEvents = ['100m Hurdles'];
  const jumpingEvents = ['High Jump', 'Long Jump', 'Pole Vault', 'Triple Jump'];
  const throwingEvents = ['Discus Throw', 'Hammer Throw', 'Javelin Throw', 'Shot Put'];
  const menCombinedEvents = ['Decathlon'];
  const womenCombinedEvents = ['Heptathlon'];
  const relayEvents = ['4x100m Relay', '4x400m Relay'];
  const mixedRelayEvents = ['4x400m Mixed Relay'];

  const getMenEvents = () => [
    ...trackEvents, ...menTrackEvents, ...jumpingEvents, ...throwingEvents, ...menCombinedEvents
  ];
  
  const getWomenEvents = () => [
    ...trackEvents, ...womenTrackEvents, ...jumpingEvents, ...throwingEvents, ...womenCombinedEvents
  ];

  const allEvents = activeTab === 'men' ? getMenEvents() : getWomenEvents();
  const college = colleges.find(c => c._id == selectedCollege);
  
  // Filter athletes by selected college - handle both populated objects and string IDs
  const collegeAthletes = athletes.filter(a => {
    const athleteCollegeId = a.college?._id || a.college || a.collegeId?._id || a.collegeId;
    const match = athleteCollegeId == selectedCollege;
    return match;
  });
  
  console.log('📊 Filtering:', { 
    selectedCollege, 
    totalAthletes: athletes.length, 
    collegeAthletes: collegeAthletes.length 
  });
  
  const maleAthletes = collegeAthletes.filter(a => a.gender === 'Male');
  const femaleAthletes = collegeAthletes.filter(a => a.gender === 'Female');

  useEffect(() => {
    if (selectedCollege && athleteRows.length === 0) {
      addAthleteRow();
    }
  }, [selectedCollege]);

  const getEventAthleteCount = (eventName, gender) => {
    if (!selectedCollege || !eventName) return 0;
    const genderType = gender === 'men' ? 'Male' : 'Female';
    
    const dbCount = athletes.filter(a => {
      const athleteCollegeId = a.college?._id || a.college || a.collegeId?._id || a.collegeId;
      return athleteCollegeId == selectedCollege && 
        a.gender === genderType &&
        (a.event1 === eventName || a.event2 === eventName);
    }).length;
    
    const formCount = athleteRows.filter(row => 
      (row.event1 === eventName || row.event2 === eventName)
    ).length;
    
    return dbCount + formCount;
  };

  const getRelayTeamCount = (relayEvent) => {
    if (!selectedCollege || !relayEvent) return 0;
    const gender = activeTab === 'men' ? 'Male' : 'Female';
    
    const dbCount = athletes.filter(a => {
      const athleteCollegeId = a.college?._id || a.college || a.collegeId?._id || a.collegeId;
      return athleteCollegeId == selectedCollege && 
        a.gender === gender &&
        (a.relay1 === relayEvent || a.relay2 === relayEvent);
    }).length;
    
    const formCount = athleteRows.filter(row =>
      (row.relay1 === relayEvent || row.relay2 === relayEvent)
    ).length;
    
    return dbCount + formCount;
  };

  const getMixedRelayCount = () => {
    if (!selectedCollege) return { male: 0, female: 0, total: 0 };
    
    const dbMale = athletes.filter(a => {
      const athleteCollegeId = a.college?._id || a.college || a.collegeId?._id || a.collegeId;
      return athleteCollegeId == selectedCollege && 
        a.gender === 'Male' &&
        a.mixedRelay;
    }).length;
    
    const dbFemale = athletes.filter(a => {
      const athleteCollegeId = a.college?._id || a.college || a.collegeId?._id || a.collegeId;
      return athleteCollegeId == selectedCollege && 
        a.gender === 'Female' &&
        a.mixedRelay;
    }).length;
    
    const formMale = athleteRows.filter(row => 
      row.mixedRelay && activeTab === 'men'
    ).length;
    
    const formFemale = athleteRows.filter(row => 
      row.mixedRelay && activeTab === 'women'
    ).length;
    
    const totalMale = dbMale + formMale;
    const totalFemale = dbFemale + formFemale;
    
    return { male: totalMale, female: totalFemale, total: totalMale + totalFemale };
  };

  const isMixedRelayAvailable = (currentRowId) => {
    const counts = getMixedRelayCount();
    const currentGender = activeTab === 'men' ? 'Male' : 'Female';
    
    const currentRow = athleteRows.find(r => r.id === currentRowId);
    if (currentRow && currentRow.mixedRelay) return true;
    
    if (currentGender === 'Male' && counts.male >= 2) return false;
    if (currentGender === 'Female' && counts.female >= 2) return false;
    if (counts.total >= 4) return false;
    
    return true;
  };

  const isEventAvailable = (eventName, gender, currentRowId, fieldName) => {
    if (!eventName) return true;
    
    const count = athletes.filter(a => {
      const athleteCollegeId = a.collegeId?._id || a.collegeId || a.college?._id || a.college;
      return athleteCollegeId == selectedCollege && 
        a.gender === (gender === 'men' ? 'Male' : 'Female') &&
        (a.event1 === eventName || a.event2 === eventName);
    }).length;
    
    const rowCount = athleteRows.filter(row => {
      if (row.id === currentRowId) {
        if (fieldName === 'event1') return row.event2 === eventName;
        if (fieldName === 'event2') return row.event1 === eventName;
      }
      return row.event1 === eventName || row.event2 === eventName;
    }).length;
    
    return (count + rowCount) < 2;
  };

  const isRelayAvailable = (relayEvent, currentRowId, fieldName) => {
    if (!relayEvent) return true;
    
    const gender = activeTab === 'men' ? 'Male' : 'Female';
    
    const dbCount = athletes.filter(a => 
      a.collegeId == selectedCollege && 
      a.gender === gender &&
      (a.relay1 === relayEvent || a.relay2 === relayEvent)
    ).length;
    
    const formCount = athleteRows.filter(row => {
      if (row.id === currentRowId) {
        if (fieldName === 'relay1') return row.relay2 === relayEvent;
        if (fieldName === 'relay2') return row.relay1 === relayEvent;
      }
      return row.relay1 === relayEvent || row.relay2 === relayEvent;
    }).length;
    
    return (dbCount + formCount) < 4;
  };

  const validateName = (name) => {
    if (!name) return 'Name is required';
    if (!/^[a-zA-Z\s.]+$/.test(name)) return 'Name can only contain letters, spaces, and periods';
    return null;
  };

  const validateUUCMS = (uucms, rowId) => {
    if (!uucms) return null;
    
    const duplicateInRows = athleteRows.filter(row => row.id !== rowId && row.uucms && row.uucms === uucms);
    if (duplicateInRows.length > 0) return 'UUCMS already exists in current form';
    
    const duplicateInDB = athletes.find(a => a.uucms && a.uucms === uucms);
    if (duplicateInDB) return 'UUCMS already exists in the system';
    
    return null;
  };

  const validateRow = (row) => {
    const errors = [];
    
    const nameError = validateName(row.name);
    if (nameError) errors.push(nameError);
    
    const uucmsError = validateUUCMS(row.uucms, row.id);
    if (uucmsError) errors.push(uucmsError);
    
    const hasAnyEvent = row.event1 || row.event2 || row.relay1 || row.relay2 || row.mixedRelay;
    if (!hasAnyEvent) {
      errors.push('Athlete must participate in at least one event or relay');
    }
    
    if (row.event1 && row.event2 && row.event1 === row.event2) {
      errors.push('Event 1 and Event 2 cannot be the same');
    }

    if (row.event1 && !isEventAvailable(row.event1, activeTab, row.id, 'event1')) {
      errors.push(`Event quota reached for ${row.event1} (max 2 athletes per college)`);
    }
    if (row.event2 && !isEventAvailable(row.event2, activeTab, row.id, 'event2')) {
      errors.push(`Event quota reached for ${row.event2} (max 2 athletes per college)`);
    }

    if (row.relay1 && !isRelayAvailable(row.relay1, row.id, 'relay1')) {
      errors.push(`Relay quota reached for ${row.relay1} (max 1 team per college)`);
    }
    if (row.relay2 && !isRelayAvailable(row.relay2, row.id, 'relay2')) {
      errors.push(`Relay quota reached for ${row.relay2} (max 1 team per college)`);
    }
    
    return errors;
  };

  const generateChestNumber = (index) => {
    const allAthletes = athletes.filter(a => a.collegeId == selectedCollege);
    const existingCount = allAthletes.length;
    return String(1001 + existingCount + index);
  };

  const addAthleteRow = () => {
    const newRow = {
      id: Date.now(),
      name: '',
      uucms: '',
      event1: '',
      event2: '',
      relay1: '',
      relay2: '',
      mixedRelay: ''
    };
    setAthleteRows([...athleteRows, newRow]);
  };

  const deleteAthleteRow = (id) => {
    setAthleteRows(athleteRows.filter(row => row.id !== id));
  };

  const updateAthleteRow = (id, field, value) => {
    setAthleteRows(athleteRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSubmitAll = async () => {
    if (!selectedCollege) {
      showToast?.('Please select a college', 'error');
      return;
    }

    if (athleteRows.length === 0) {
      showToast?.('Please add at least one athlete', 'error');
      return;
    }

    const allErrors = [];
    athleteRows.forEach((row, index) => {
      const errors = validateRow(row);
      if (errors.length > 0) {
        allErrors.push(`Row ${index + 1}: ${errors.join(', ')}`);
      }
    });

    if (allErrors.length > 0) {
      showToast?.(allErrors[0], 'error');
      return;
    }

    try {
      setLoading(true);
      const gender = activeTab === 'men' ? 'Male' : 'Female';
      
      const newAthletes = [];
      for (let i = 0; i < athleteRows.length; i++) {
        const row = athleteRows[i];
        const chestNo = generateChestNumber(i);
        
        const athlete = {
          id: Date.now() + i,
          name: row.name,
          uucms: row.uucms,
          gender: gender,
          collegeId: selectedCollege,
          chestNo: chestNo,
          event1: row.event1 || null,
          event2: row.event2 || null,
          relay1: row.relay1 || null,
          relay2: row.relay2 || null,
          mixedRelay: row.mixedRelay || null,
          createdAt: new Date()
        };
        newAthletes.push(athlete);
      }

      setAthletes([...athletes, ...newAthletes]);
      showToast?.(`✓ ${athleteRows.length} athletes registered successfully!`, 'success');
      setAthleteRows([]);
      addAthleteRow();
    } catch (error) {
      showToast?.('Error saving athletes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAthlete = async (id) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = (id) => {
    setAthletes(athletes.filter(a => a.id !== id));
    setDeleteConfirm(null);
    showToast?.('Athlete deleted', 'success');
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (!selectedCollege) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-blue-600">
            <h1 className="text-3xl font-bold text-gray-800">Athlete Registration</h1>
            <p className="text-gray-600 mt-1">BU Inter-Collegiate Athletic Meet</p>
          </div>

          {!pedCollege && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-blue-600">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Select College <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCollege}
                onChange={(e) => {
                  setSelectedCollege(e.target.value);
                  setAthleteRows([]);
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Choose College --</option>
                {colleges.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🏛️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a College</h3>
            <p className="text-gray-600">Choose from the dropdown to start registration</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-blue-600">
          <h1 className="text-3xl font-bold text-gray-800">Athlete Registration</h1>
          <p className="text-gray-600 mt-1">BU Inter-Collegiate Athletic Meet</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-blue-600">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Select College <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCollege}
            onChange={(e) => {
              setSelectedCollege(e.target.value);
              setAthleteRows([]);
            }}
            disabled={!!pedCollege}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
          >
            <option value="">-- Choose College --</option>
            {colleges.map(c => (
              <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => {
                setActiveTab('men');
                setAthleteRows([]);
              }}
              className={`flex-1 px-6 py-4 font-semibold text-center transition ${
                activeTab === 'men'
                  ? 'bg-blue-600 text-white border-b-4 border-blue-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              🧔 Men's Events
            </button>
            <button
              onClick={() => {
                setActiveTab('women');
                setAthleteRows([]);
              }}
              className={`flex-1 px-6 py-4 font-semibold text-center transition ${
                activeTab === 'women'
                  ? 'bg-pink-600 text-white border-b-4 border-pink-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              👩 Women's Events
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition ${
                activeTab === 'all'
                  ? 'bg-green-600 text-white border-b-4 border-green-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              👥 View All Athletes
            </button>
          </div>
        </div>

        {activeTab === 'all' ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">All Registered Athletes</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-bold text-blue-700 mb-4">👨 Men ({maleAthletes.length})</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">SL</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Chest No</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Event 1</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Event 2</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Relay 1</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Relay 2</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Mixed Relay</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maleAthletes.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                          No male athletes registered yet
                        </td>
                      </tr>
                    ) : (
                      maleAthletes.map((a, idx) => (
                        <tr key={a.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-bold text-blue-600">{a.chestNo}</td>
                          <td className="px-4 py-3 text-sm font-medium">{a.name}</td>
                          <td className="px-4 py-3 text-sm">{a.event1?.name || a.event1 || '-'}</td>
                          <td className="px-4 py-3 text-sm">{a.event2?.name || a.event2 || '-'}</td>
                          <td className="px-4 py-3 text-sm">{a.relay1?.name || a.relay1 || '-'}</td>
                          <td className="px-4 py-3 text-sm">{a.relay2?.name || a.relay2 || '-'}</td>
                          <td className="px-4 py-3 text-sm">{a.mixedRelay?.name || a.mixedRelay || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            {deleteConfirm === a.id ? (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => confirmDelete(a.id)}
                                  className="text-red-600 hover:text-red-800 font-semibold text-xs bg-red-100 px-2 py-1 rounded"
                                >
                                  Confirm
                                </button>
                                <button 
                                  onClick={cancelDelete}
                                  className="text-gray-600 hover:text-gray-800 font-semibold text-xs bg-gray-100 px-2 py-1 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleDeleteAthlete(a.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-pink-700 mb-4">👩 Women ({femaleAthletes.length})</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-pink-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">SL</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Chest No</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Event 1</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Event 2</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Relay 1</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Relay 2</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Mixed Relay</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {femaleAthletes.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                          No female athletes registered yet
                        </td>
                      </tr>
                    ) : (
                      femaleAthletes.map((a, idx) => (
                        <tr key={a.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-bold text-pink-600">{a.chestNo}</td>
                          <td className="px-4 py-3 text-sm font-medium">{a.name}</td>
                          <td className="px-4 py-3 text-sm">{a.event1?.name || a.event1 || '-'}</td>
                          <td className="px-4 py-3 text-sm">{a.event2?.name || a.event2 || '-'}</td>
                          <td className="px-4 py-3 text-sm">{a.relay1?.name || a.relay1 || '-'}</td>
                          <td className="px-4 py-3 text-sm">{a.relay2?.name || a.relay2 || '-'}</td>
                          <td className="px-4 py-3 text-sm">{a.mixedRelay?.name || a.mixedRelay || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            {deleteConfirm === a.id ? (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => confirmDelete(a.id)}
                                  className="text-red-600 hover:text-red-800 font-semibold text-xs bg-red-100 px-2 py-1 rounded"
                                >
                                  Confirm
                                </button>
                                <button 
                                  onClick={cancelDelete}
                                  className="text-gray-600 hover:text-gray-800 font-semibold text-xs bg-gray-100 px-2 py-1 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleDeleteAthlete(a.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {activeTab === 'men' ? '🧔 Men\'s Events Registration' : '👩 Women\'s Events Registration'}
                </h2>
                <p className="text-gray-600 mt-1">Add athletes and select their events below</p>
              </div>
              <span className="px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-lg">
                {athleteRows.length} {athleteRows.length === 1 ? 'Athlete' : 'Athletes'}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              {athleteRows.map((row, index) => (
                <div key={row.id} className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-blue-700">SL NO: {index + 1}</span>
                    {athleteRows.length > 1 && (
                      <button
                        onClick={() => deleteAthleteRow(row.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-semibold"
                      >
                        🗑️ Delete Row
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Athlete Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateAthleteRow(row.id, 'name', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        UUCMS No <span className="text-gray-500 text-xs">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={row.uucms}
                        onChange={(e) => updateAthleteRow(row.id, 'uucms', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter UUCMS ID (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Event 1</label>
                      <select
                        value={row.event1}
                        onChange={(e) => updateAthleteRow(row.id, 'event1', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Event</option>
                        {allEvents.map(e => {
                          const count = getEventAthleteCount(e, activeTab);
                          const available = count < 2;
                          return (
                            <option key={e} value={e} disabled={!available}>
                              {e} {available ? `(${count}/2)` : '(Full)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Event 2</label>
                      <select
                        value={row.event2}
                        onChange={(e) => updateAthleteRow(row.id, 'event2', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Event</option>
                        {allEvents.filter(e => e !== row.event1).map(e => {
                          const count = getEventAthleteCount(e, activeTab);
                          const available = count < 2;
                          return (
                            <option key={e} value={e} disabled={!available}>
                              {e} {available ? `(${count}/2)` : '(Full)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Relay 1</label>
                      <select
                        value={row.relay1}
                        onChange={(e) => updateAthleteRow(row.id, 'relay1', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Relay</option>
                        {relayEvents.map(e => {
                          const count = getRelayTeamCount(e);
                          const available = count < 4;
                          return (
                            <option key={e} value={e} disabled={!available}>
                              {e} {available ? `(${count}/4)` : '(4/4 Team Full)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Relay 2</label>
                      <select
                        value={row.relay2}
                        onChange={(e) => updateAthleteRow(row.id, 'relay2', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Relay</option>
                        {relayEvents.filter(e => e !== row.relay1).map(e => {
                          const count = getRelayTeamCount(e);
                          const available = count < 4;
                          return (
                            <option key={e} value={e} disabled={!available}>
                              {e} {available ? `(${count}/4)` : '(4/4 Team Full)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Mixed Relay (2 Men + 2 Women)
                      </label>
                      <select
                        value={row.mixedRelay}
                        onChange={(e) => updateAthleteRow(row.id, 'mixedRelay', e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Mixed Relay</option>
                        {mixedRelayEvents.map(e => {
                          const counts = getMixedRelayCount();
                          const available = isMixedRelayAvailable(row.id);
                          const currentGender = activeTab === 'men' ? 'Male' : 'Female';
                          
                          let statusText = '';
                          if (!available) {
                            if (counts.total >= 4) {
                              statusText = '(Team Full 4/4)';
                            } else if (currentGender === 'Male' && counts.male >= 2) {
                              statusText = '(Male Limit 2/2)';
                            } else if (currentGender === 'Female' && counts.female >= 2) {
                              statusText = '(Female Limit 2/2)';
                            }
                          } else {
                            statusText = `(${counts.male}M + ${counts.female}F / 2M+2F)`;
                          }
                          
                          return (
                            <option key={e} value={e} disabled={!available}>
                              {e} {statusText}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={addAthleteRow}
                className="flex-1 bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 shadow-md"
              >
                ➕ Add Athlete
              </button>
              <button
                onClick={handleSubmitAll}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 shadow-md disabled:opacity-50"
              >
                {loading ? '⏳ Submitting...' : '✓ Submit Registration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
