/**
 * PHASE 5: FINAL SCORING & ANNOUNCEMENT DASHBOARD
 * Components for AFI scoring, best athlete selection, and team championship announcement
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

/**
 * AFI Scoring Dashboard - Shows AFI points per event and athlete
 */
export function Phase5AFIScoringDashboard({ eventData, appState }) {
  const [afiScores, setAfiScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, counted, excluded

  useEffect(() => {
    if (eventData?._id) {
      fetchAFIScores();
    }
  }, [eventData?._id]);

  const fetchAFIScores = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/events/${eventData._id}/afi-event-points`
      );
      setAfiScores(response.data.eventPoints || []);
    } catch (err) {
      console.error('❌ Error fetching AFI scores:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredScores = afiScores.filter(score => {
    if (filter === 'all') return true;
    if (filter === 'counted') return score.isCounted;
    if (filter === 'excluded') return !score.isCounted;
    return true;
  });

  const totalAFIPoints = filteredScores.reduce((sum, s) => sum + (s.afiPoints || 0), 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold mb-4">🏅 AFI Scoring Dashboard</h3>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded font-semibold ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({afiScores.length})
        </button>
        <button
          onClick={() => setFilter('counted')}
          className={`px-4 py-2 rounded font-semibold ${
            filter === 'counted'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Counted ({afiScores.filter(s => s.isCounted).length})
        </button>
        <button
          onClick={() => setFilter('excluded')}
          className={`px-4 py-2 rounded font-semibold ${
            filter === 'excluded'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Excluded ({afiScores.filter(s => !s.isCounted).length})
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-600">Loading AFI scores...</div>
      ) : (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-center">Athlete</th>
                  <th className="p-2 text-center">College</th>
                  <th className="p-2 text-center">Performance</th>
                  <th className="p-2 text-center">AFI Points</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredScores.map((score, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="p-2">{score.athlete?.name || 'N/A'}</td>
                    <td className="p-2">{score.college || 'N/A'}</td>
                    <td className="p-2 text-center">{score.performance || 'N/A'}</td>
                    <td className="p-2 text-center font-bold text-lg">
                      {score.afiPoints || 0}
                    </td>
                    <td className="p-2 text-center">
                      {score.isCounted ? (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                          ✓ Counted
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-semibold">
                          ✗ Excluded
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 p-4 rounded border-2 border-blue-300">
            <p className="text-lg font-semibold">
              Total {filter === 'all' ? 'AFI' : filter === 'counted' ? 'Counted AFI' : 'Excluded'} Points:
            </p>
            <p className="text-3xl font-bold text-blue-600">{totalAFIPoints}</p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Best Athlete Leaderboard
 */
export function Phase5BestAthletePanel({ appState }) {
  const [bestAthletes, setBestAthletes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, male, female

  useEffect(() => {
    fetchBestAthletes();
  }, []);

  const fetchBestAthletes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/events/final/best-athletes-summary`
      );
      setBestAthletes(response.data.summary || {});
    } catch (err) {
      console.error('❌ Error fetching best athletes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center text-gray-600">Loading best athletes...</div>;

  const displayMale = filter === 'all' || filter === 'male';
  const displayFemale = filter === 'all' || filter === 'female';

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold mb-4">🏆 Best Athletes</h3>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded font-semibold ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('male')}
          className={`px-4 py-2 rounded font-semibold ${
            filter === 'male'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Male
        </button>
        <button
          onClick={() => setFilter('female')}
          className={`px-4 py-2 rounded font-semibold ${
            filter === 'female'
              ? 'bg-pink-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Female
        </button>
      </div>

      {/* Best Male Athlete */}
      {displayMale && bestAthletes?.bestMaleAthlete && (
        <div className="bg-purple-50 p-4 rounded-lg mb-6 border-2 border-purple-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Best Male Athlete</p>
              <h4 className="text-2xl font-bold text-purple-700">
                🏅 {bestAthletes.bestMaleAthlete.name}
              </h4>
              <p className="text-lg text-purple-600">{bestAthletes.bestMaleAthlete.college}</p>
              <p className="text-sm text-gray-700 mt-2">
                Events: {bestAthletes.bestMaleAthlete.eventCount}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">AFI Points</p>
              <p className="text-4xl font-bold text-purple-600">
                {bestAthletes.bestMaleAthlete.totalAFIPoints}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Best Female Athlete */}
      {displayFemale && bestAthletes?.bestFemaleAthlete && (
        <div className="bg-pink-50 p-4 rounded-lg mb-6 border-2 border-pink-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">Best Female Athlete</p>
              <h4 className="text-2xl font-bold text-pink-700">
                🏅 {bestAthletes.bestFemaleAthlete.name}
              </h4>
              <p className="text-lg text-pink-600">{bestAthletes.bestFemaleAthlete.college}</p>
              <p className="text-sm text-gray-700 mt-2">
                Events: {bestAthletes.bestFemaleAthlete.eventCount}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">AFI Points</p>
              <p className="text-4xl font-bold text-pink-600">
                {bestAthletes.bestFemaleAthlete.totalAFIPoints}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 5 Male Athletes */}
      {displayMale && bestAthletes?.topMaleAthletes && bestAthletes.topMaleAthletes.length > 0 && (
        <div className="mb-6">
          <h5 className="text-lg font-bold mb-3">Top 5 Male Athletes</h5>
          <div className="space-y-2">
            {bestAthletes.topMaleAthletes.map((athlete, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                <div>
                  <span className="font-semibold">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  '} {idx + 1}. {athlete.name}
                  </span>
                  <p className="text-sm text-gray-600">{athlete.college}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{athlete.totalAFIPoints} pts</p>
                  <p className="text-sm text-gray-600">{athlete.eventCount} events</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top 5 Female Athletes */}
      {displayFemale && bestAthletes?.topFemaleAthletes && bestAthletes.topFemaleAthletes.length > 0 && (
        <div className="mb-6">
          <h5 className="text-lg font-bold mb-3">Top 5 Female Athletes</h5>
          <div className="space-y-2">
            {bestAthletes.topFemaleAthletes.map((athlete, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                <div>
                  <span className="font-semibold">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  '} {idx + 1}. {athlete.name}
                  </span>
                  <p className="text-sm text-gray-600">{athlete.college}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{athlete.totalAFIPoints} pts</p>
                  <p className="text-sm text-gray-600">{athlete.eventCount} events</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={fetchBestAthletes}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
      >
        🔄 Refresh Best Athletes
      </button>
    </div>
  );
}

/**
 * Team Championship Scoring Panel
 */
export function Phase5TeamChampionshipPanel({ appState }) {
  const [teamRankings, setTeamRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [persisting, setPersisting] = useState(false);

  useEffect(() => {
    fetchTeamRankings();
  }, []);

  const fetchTeamRankings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/events/final/team-championship/rankings`
      );
      setTeamRankings(response.data.rankings || []);
    } catch (err) {
      console.error('❌ Error fetching team rankings:', err);
    } finally {
      setLoading(false);
    }
  };

  const persistScores = async () => {
    try {
      setPersisting(true);
      await axios.post(
        `${API_BASE_URL}/api/events/final/team-championship/persist`
      );
      alert('✅ Team scores persisted to database successfully!');
      fetchTeamRankings();
    } catch (err) {
      console.error('❌ Error persisting scores:', err);
      alert('❌ Error persisting team scores');
    } finally {
      setPersisting(false);
    }
  };

  if (loading) return <div className="text-center text-gray-600">Loading team rankings...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold mb-4">🥇 Team Championship Rankings</h3>

      {teamRankings.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          No team rankings available yet
        </div>
      ) : (
        <>
          {/* Champion Display */}
          {teamRankings[0] && (
            <div className="bg-gradient-to-r from-yellow-300 to-yellow-100 p-6 rounded-lg mb-6 border-4 border-yellow-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">CHAMPIONSHIP WINNER</p>
                  <h4 className="text-4xl font-bold text-gray-800">🏆 {teamRankings[0].collegeName}</h4>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">Total Points</p>
                  <p className="text-5xl font-bold text-yellow-700">{teamRankings[0].totalPoints}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-700">Gold</p>
                  <p className="text-3xl font-bold">🥇 {teamRankings[0].medals.gold}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-700">Silver</p>
                  <p className="text-3xl font-bold">🥈 {teamRankings[0].medals.silver}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-700">Bronze</p>
                  <p className="text-3xl font-bold">🥉 {teamRankings[0].medals.bronze}</p>
                </div>
              </div>
            </div>
          )}

          {/* Runner-up and Third Place */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {teamRankings[1] && (
              <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-400">
                <p className="text-sm font-semibold">🥈 Runner-Up</p>
                <h5 className="text-xl font-bold text-gray-800">{teamRankings[1].collegeName}</h5>
                <p className="text-2xl font-bold text-gray-600 mt-2">{teamRankings[1].totalPoints} pts</p>
              </div>
            )}
            {teamRankings[2] && (
              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-400">
                <p className="text-sm font-semibold">🥉 Third Place</p>
                <h5 className="text-xl font-bold text-gray-800">{teamRankings[2].collegeName}</h5>
                <p className="text-2xl font-bold text-amber-600 mt-2">{teamRankings[2].totalPoints} pts</p>
              </div>
            )}
          </div>

          {/* All Rankings */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-gray-400 text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-center">Rank</th>
                  <th className="p-2">College</th>
                  <th className="p-2 text-center">Points</th>
                  <th className="p-2 text-center">🥇</th>
                  <th className="p-2 text-center">🥈</th>
                  <th className="p-2 text-center">🥉</th>
                </tr>
              </thead>
              <tbody>
                {teamRankings.map((team, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="p-2 text-center font-bold">{team.rank}</td>
                    <td className="p-2 font-semibold">{team.collegeName}</td>
                    <td className="p-2 text-center font-bold text-lg">{team.totalPoints}</td>
                    <td className="p-2 text-center">{team.medals.gold}</td>
                    <td className="p-2 text-center">{team.medals.silver}</td>
                    <td className="p-2 text-center">{team.medals.bronze}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4">
            <button
              onClick={fetchTeamRankings}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
            >
              🔄 Refresh Rankings
            </button>
            <button
              onClick={persistScores}
              disabled={persisting}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold disabled:bg-gray-400"
            >
              {persisting ? '⏳ Persisting...' : '💾 Persist to Database'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Final Announcement Panel
 */
export function Phase5FinalAnnouncementPanel({ appState }) {
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    generateAnnouncement();
  }, []);

  const generateAnnouncement = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/events/final/announcement/generate`
      );
      setAnnouncement(response.data.announcement || {});
    } catch (err) {
      console.error('❌ Error generating announcement:', err);
    } finally {
      setLoading(false);
    }
  };

  const publishAnnouncement = async () => {
    try {
      setPublishing(true);
      await axios.post(
        `${API_BASE_URL}/api/events/final/announcement/publish`,
        { announcementData: announcement }
      );
      alert('✅ Final announcement published successfully!');
    } catch (err) {
      console.error('❌ Error publishing announcement:', err);
      alert('❌ Error publishing announcement');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="text-center text-gray-600">Generating announcement...</div>;
  if (!announcement) return <div className="text-center text-gray-600">No announcement data</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold mb-4">📢 Final Announcement</h3>

      {/* Announcement Messages */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-3">Announcement Messages</h4>
        <div className="space-y-3">
          {announcement.messages?.map((msg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-l-4 ${
                msg.priority === 'CRITICAL'
                  ? 'bg-red-50 border-red-500'
                  : msg.priority === 'HIGH'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <p className="font-semibold text-gray-800">{msg.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Best Athletes */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-3">Best Athletes</h4>
        <div className="grid grid-cols-2 gap-4">
          {announcement.bestAthletes?.bestMale && (
            <div className="bg-purple-50 p-4 rounded border-2 border-purple-300">
              <p className="text-sm text-gray-700">Best Male Athlete</p>
              <p className="font-bold">{announcement.bestAthletes.bestMale.name}</p>
              <p className="text-sm text-gray-600">{announcement.bestAthletes.bestMale.college}</p>
              <p className="text-lg font-bold text-purple-600 mt-2">
                {announcement.bestAthletes.bestMale.totalAFIPoints} pts
              </p>
            </div>
          )}
          {announcement.bestAthletes?.bestFemale && (
            <div className="bg-pink-50 p-4 rounded border-2 border-pink-300">
              <p className="text-sm text-gray-700">Best Female Athlete</p>
              <p className="font-bold">{announcement.bestAthletes.bestFemale.name}</p>
              <p className="text-sm text-gray-600">{announcement.bestAthletes.bestFemale.college}</p>
              <p className="text-lg font-bold text-pink-600 mt-2">
                {announcement.bestAthletes.bestFemale.totalAFIPoints} pts
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Team Champion */}
      {announcement.teamChampionship?.champion && (
        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-400 mb-6">
          <p className="text-sm font-semibold text-gray-700">TEAM CHAMPION</p>
          <h5 className="text-2xl font-bold text-gray-800">🏆 {announcement.teamChampionship.champion.collegeName}</h5>
          <p className="text-lg font-bold text-yellow-700 mt-2">{announcement.teamChampionship.champion.totalPoints} points</p>
        </div>
      )}

      {/* Event Results Summary */}
      <div className="mb-6">
        <h4 className="text-lg font-bold mb-3">Event Winners</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Event</th>
                <th className="p-2">Winner</th>
                <th className="p-2">College</th>
                <th className="p-2">Performance</th>
              </tr>
            </thead>
            <tbody>
              {announcement.eventRankings?.slice(0, 5).map((event, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="p-2 font-semibold">{event.eventName}</td>
                  <td className="p-2">{event.medals?.gold?.athleteName || 'N/A'}</td>
                  <td className="p-2">{event.medals?.gold?.college || 'N/A'}</td>
                  <td className="p-2 text-center">{event.medals?.gold?.performance || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={generateAnnouncement}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
        >
          🔄 Regenerate Announcement
        </button>
        <button
          onClick={publishAnnouncement}
          disabled={publishing}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold disabled:bg-gray-400"
        >
          {publishing ? '⏳ Publishing...' : '📤 Publish Announcement'}
        </button>
      </div>
    </div>
  );
}

export default {
  Phase5AFIScoringDashboard,
  Phase5BestAthletePanel,
  Phase5TeamChampionshipPanel,
  Phase5FinalAnnouncementPanel
};
