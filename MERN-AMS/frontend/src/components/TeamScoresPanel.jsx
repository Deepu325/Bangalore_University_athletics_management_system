import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

export default function TeamScoresPanel({ category = 'Male' }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(category);

  useEffect(() => {
    fetchTeamScores(activeCategory);
  }, [activeCategory]);

  const fetchTeamScores = async (cat) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/team-scores?category=${cat}`);
      if (!response.ok) throw new Error('Failed to fetch team scores');
      const data = await response.json();
      setRankings(data.rankings || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching team scores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async (cat) => {
    try {
      const response = await fetch(`${API_BASE_URL}/team-scores/recalculate/${cat}`, { method: 'POST' });
      if (!response.ok) throw new Error('Recalculation failed');
      await fetchTeamScores(cat);
      alert(`✅ Team scores recalculated for ${cat}`);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-600">Loading team scores...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Team Championship Points</h2>

      {/* Category Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {['Male', 'Female'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-3 font-semibold transition ${
              activeCategory === cat
                ? 'border-b-4 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            {cat} Category
          </button>
        ))}
      </div>

      {/* Recalculate Button */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => handleRecalculate(activeCategory)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold"
        >
          🔄 Recalculate Scores
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Team Scores Table */}
      {rankings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="p-3 text-left border border-gray-300">Rank</th>
                <th className="p-3 text-left border border-gray-300">College</th>
                <th className="p-3 text-center border border-gray-300">
                  <span className="text-xl">🥇</span> Gold
                </th>
                <th className="p-3 text-center border border-gray-300">
                  <span className="text-xl">🥈</span> Silver
                </th>
                <th className="p-3 text-center border border-gray-300">
                  <span className="text-xl">🥉</span> Bronze
                </th>
                <th className="p-3 text-center border border-gray-300 font-bold">Points</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((row, idx) => (
                <tr
                  key={row._id || idx}
                  className={`border-b transition ${
                    idx === 0
                      ? 'bg-yellow-50 font-bold'
                      : idx === 1
                      ? 'bg-gray-50'
                      : idx === 2
                      ? 'bg-orange-50'
                      : ''
                  }`}
                >
                  <td className="p-3 border border-gray-300 text-center font-bold">
                    {row.rank === 1 ? '🏆' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : ''} {row.rank}
                  </td>
                  <td className="p-3 border border-gray-300">{row.collegeName}</td>
                  <td className="p-3 border border-gray-300 text-center">{row.golds}</td>
                  <td className="p-3 border border-gray-300 text-center">{row.silvers}</td>
                  <td className="p-3 border border-gray-300 text-center">{row.bronzes}</td>
                  <td className="p-3 border border-gray-300 text-center font-bold text-lg text-blue-600">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No team scores available for {activeCategory} category yet.
        </div>
      )}

      {/* Tie-break Rules */}
      <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
        <h4 className="font-semibold text-gray-800 mb-2">Tie-Breaking Rules:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>1️⃣ Higher total points wins</li>
          <li>2️⃣ More gold medals (1st places)</li>
          <li>3️⃣ More silver medals (2nd places)</li>
          <li>4️⃣ More bronze medals (3rd places)</li>
          <li>5️⃣ Alphabetical college name (final fallback)</li>
        </ul>
      </div>

      {/* Scoring System */}
      <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
        <h4 className="font-semibold text-gray-800 mb-2">Scoring System:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>🥇 1st Place = 5 points</li>
          <li>🥈 2nd Place = 3 points</li>
          <li>🥉 3rd Place = 1 point</li>
          <li className="text-gray-500 italic">Half Marathon & Mixed Relay excluded from team championship</li>
        </ul>
      </div>
    </div>
  );
}
