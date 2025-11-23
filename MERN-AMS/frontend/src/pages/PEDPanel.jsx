import React, { useState, useEffect, useCallback } from 'react';
import ChangePassword from './ChangePassword';

export default function PEDPanel({ userEmail, userName, onLogout, showChangePassword, onPasswordChanged }) {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [collegeId, setCollegeId] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [token, setToken] = useState('');
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get college info from token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedCollegeName = localStorage.getItem('collegeName');
    const savedCollegeId = localStorage.getItem('collegeId');
    
    if (savedToken) {
      setToken(savedToken);
      setCollegeName(savedCollegeName || '');
      setCollegeId(savedCollegeId || '');
    }
  }, []);

  const fetchAthletes = useCallback(async () => {
    setLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_BASE_URL}/api/athletes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch athletes');
      }

      const data = await response.json();
      setAthletes(data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching athletes:', err);
      setError('Failed to load athletes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch athletes for PED's college
  useEffect(() => {
    if (token && collegeId) {
      fetchAthletes();
    }
  }, [token, collegeId, fetchAthletes]);

  // Calculate statistics for PED's college
  const stats = {
    total: athletes.length,
    men: athletes.filter(a => a.gender === 'Male').length,
    women: athletes.filter(a => a.gender === 'Female').length,
    relayTeams: athletes.filter(a => a.relayTeam).length,
    mixedRelay: athletes.filter(a => a.mixedRelay).length
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200">
          <div className="p-6">
            <div className="space-y-2">
              <button
                onClick={() => setCurrentSection('dashboard')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentSection === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 Dashboard
              </button>

              <button
                onClick={() => setCurrentSection('athletes')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentSection === 'athletes'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                👥 All Registered Athletes
              </button>

              <button
                onClick={() => setCurrentSection('relay')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentSection === 'relay'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🏃 Relay Teams
              </button>

              <button
                onClick={() => setCurrentSection('pdf')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentSection === 'pdf'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📥 PDF Exports
              </button>

              <button
                onClick={() => setCurrentSection('password')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentSection === 'password'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🔐 Change Password
              </button>

              <hr className="my-4" />

              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Dashboard */}
          {currentSection === 'dashboard' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h2>
              <p className="text-gray-600 mb-8">Overview of your college's participation</p>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
                  <div className="text-3xl mb-2">👥</div>
                  <h3 className="font-semibold text-gray-600 text-sm mb-2">Total Athletes</h3>
                  <p className="text-4xl font-bold text-blue-600">{stats.total}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
                  <div className="text-3xl mb-2">👨</div>
                  <h3 className="font-semibold text-gray-600 text-sm mb-2">Men Athletes</h3>
                  <p className="text-4xl font-bold text-green-600">{stats.men}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-pink-600">
                  <div className="text-3xl mb-2">👩</div>
                  <h3 className="font-semibold text-gray-600 text-sm mb-2">Women Athletes</h3>
                  <p className="text-4xl font-bold text-pink-600">{stats.women}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
                  <div className="text-3xl mb-2">🏃</div>
                  <h3 className="font-semibold text-gray-600 text-sm mb-2">Relay Teams</h3>
                  <p className="text-4xl font-bold text-purple-600">{stats.relayTeams}</p>
                </div>
              </div>

              <div className="mt-12 bg-white rounded-lg shadow p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🔒 College Information</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700"><span className="font-semibold">College Name:</span> {collegeName || 'Loading...'}</p>
                  <p className="text-gray-700 mt-2"><span className="font-semibold">Your Role:</span> Physical Education Director (PED)</p>
                  <p className="text-gray-600 text-sm mt-4 italic">You can only see and manage athletes from your assigned college.</p>
                </div>
              </div>
            </div>
          )}

          {/* All Registered Athletes */}
          {currentSection === 'athletes' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">All Registered Athletes</h2>
              <p className="text-gray-600 mb-4">{collegeName} - Total: {athletes.length} athletes</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-blue-700 text-sm">🔒 Read-Only View: You can view your college's athletes but cannot edit or add new ones.</p>
              </div>

              {loading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600">Loading athletes...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="text-red-700">{error}</p>
                </div>
              ) : athletes.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-600">No athletes registered for your college yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Contact your administrator to register athletes.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SL</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Chest No</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Gender</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Event 1</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Event 2</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Relay</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Mixed Relay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {athletes.map((athlete, idx) => (
                        <tr key={athlete._id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm text-gray-700">{idx + 1}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-semibold">{athlete.chestNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-800 font-medium">{athlete.name}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              athlete.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                            }`}>
                              {athlete.gender}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{athlete.event1 || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{athlete.event2 || '-'}</td>
                          <td className="px-6 py-4 text-sm text-center">
                            {athlete.relayTeam ? '✓' : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            {athlete.mixedRelay ? '✓' : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Relay Teams */}
          {currentSection === 'relay' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Relay Teams</h2>
              <p className="text-gray-600 mb-4">{collegeName} - Relay participation overview</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-blue-700 text-sm">🔍 View-Only: Shows your college's relay team composition and status.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">4×100m Relay</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600 text-sm">Athletes: <span className="font-semibold text-2xl text-blue-600">{athletes.filter(a => a.event1 === '4×100m' || a.event2 === '4×100m').length}</span>/4</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${(athletes.filter(a => a.event1 === '4×100m' || a.event2 === '4×100m').length / 4) * 100}%` }}
                      ></div>
                    </div>
                    <p className={`text-sm font-semibold ${athletes.filter(a => a.event1 === '4×100m' || a.event2 === '4×100m').length === 4 ? 'text-green-600' : 'text-orange-600'}`}>
                      {athletes.filter(a => a.event1 === '4×100m' || a.event2 === '4×100m').length === 4 ? '✓ Complete' : '⏳ Incomplete'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">4×400m Relay</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600 text-sm">Athletes: <span className="font-semibold text-2xl text-purple-600">{athletes.filter(a => a.event1 === '4×400m' || a.event2 === '4×400m').length}</span>/4</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${(athletes.filter(a => a.event1 === '4×400m' || a.event2 === '4×400m').length / 4) * 100}%` }}
                      ></div>
                    </div>
                    <p className={`text-sm font-semibold ${athletes.filter(a => a.event1 === '4×400m' || a.event2 === '4×400m').length === 4 ? 'text-green-600' : 'text-orange-600'}`}>
                      {athletes.filter(a => a.event1 === '4×400m' || a.event2 === '4×400m').length === 4 ? '✓ Complete' : '⏳ Incomplete'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Mixed Relay (4×100m)</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600 text-sm">Athletes: <span className="font-semibold text-2xl text-pink-600">{athletes.filter(a => a.mixedRelay).length}</span>/4 (2M + 2F)</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-pink-600 h-2 rounded-full transition-all"
                        style={{ width: `${(athletes.filter(a => a.mixedRelay).length / 4) * 100}%` }}
                      ></div>
                    </div>
                    <p className={`text-sm font-semibold ${athletes.filter(a => a.mixedRelay).length === 4 ? 'text-green-600' : 'text-orange-600'}`}>
                      {athletes.filter(a => a.mixedRelay).length === 4 ? '✓ Complete' : '⏳ Incomplete'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PDF Exports */}
          {currentSection === 'pdf' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">PDF Exports</h2>
              <p className="text-gray-600 mb-6">Download athlete lists in PDF format for {collegeName}</p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">📋 Full Athlete List</h3>
                  <p className="text-gray-600 text-sm mb-4">All {stats.total} athletes from your college</p>
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
                    Download PDF
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">👨 Men Athlete List</h3>
                  <p className="text-gray-600 text-sm mb-4">{stats.men} men athletes from your college</p>
                  <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium">
                    Download PDF
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">👩 Women Athlete List</h3>
                  <p className="text-gray-600 text-sm mb-4">{stats.women} women athletes from your college</p>
                  <button className="w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition font-medium">
                    Download PDF
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">🏃 Relay Team List</h3>
                  <p className="text-gray-600 text-sm mb-4">Athletes in relay events</p>
                  <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition font-medium">
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Change Password */}
          {currentSection === 'password' && (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Change Password</h2>
              {token ? (
                <ChangePassword 
                  token={token}
                  onPasswordChanged={() => {
                    onPasswordChanged();
                    setCurrentSection('dashboard');
                  }}
                />
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <p className="text-red-700">⚠️ Unable to change password. Please login again.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal (First Login) */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Change Password</h2>
            <p className="text-gray-600 mb-6">This is your first login. Please set a new password.</p>
            {token ? (
              <ChangePassword 
                token={token}
                onPasswordChanged={() => {
                  onPasswordChanged();
                }}
              />
            ) : (
              <p className="text-red-600">Error: Unable to verify token</p>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
