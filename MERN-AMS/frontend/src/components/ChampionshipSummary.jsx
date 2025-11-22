import React, { useEffect, useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

export default function ChampionshipSummary() {
  const [summary, setSummary] = useState({ men: [], women: [], menChampion: null, womenChampion: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/team-scores/summary`);
      if (!response.ok) throw new Error('Failed to fetch championship summary');
      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-6 text-gray-600">Loading...</div>;

  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">🏆 Championship Winners 🏆</h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Men's Champion */}
        <div className="bg-white p-6 rounded-lg shadow border-4 border-yellow-400">
          <h3 className="text-lg font-bold text-blue-600 mb-4">👨 Men's Champion</h3>
          {summary.menChampion ? (
            <div>
              <p className="text-4xl font-bold text-yellow-600 mb-2">{summary.menChampion.collegeName}</p>
              <div className="space-y-2 text-lg">
                <p>
                  <span className="text-2xl">🥇</span> Gold: <strong>{summary.menChampion.golds}</strong>
                </p>
                <p>
                  <span className="text-2xl">🥈</span> Silver: <strong>{summary.menChampion.silvers}</strong>
                </p>
                <p>
                  <span className="text-2xl">🥉</span> Bronze: <strong>{summary.menChampion.bronzes}</strong>
                </p>
                <p className="text-2xl font-bold text-blue-600 mt-4">
                  Total Points: <strong className="text-4xl">{summary.menChampion.points}</strong>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>

        {/* Women's Champion */}
        <div className="bg-white p-6 rounded-lg shadow border-4 border-pink-400">
          <h3 className="text-lg font-bold text-pink-600 mb-4">👩 Women's Champion</h3>
          {summary.womenChampion ? (
            <div>
              <p className="text-4xl font-bold text-pink-600 mb-2">{summary.womenChampion.collegeName}</p>
              <div className="space-y-2 text-lg">
                <p>
                  <span className="text-2xl">🥇</span> Gold: <strong>{summary.womenChampion.golds}</strong>
                </p>
                <p>
                  <span className="text-2xl">🥈</span> Silver: <strong>{summary.womenChampion.silvers}</strong>
                </p>
                <p>
                  <span className="text-2xl">🥉</span> Bronze: <strong>{summary.womenChampion.bronzes}</strong>
                </p>
                <p className="text-2xl font-bold text-pink-600 mt-4">
                  Total Points: <strong className="text-4xl">{summary.womenChampion.points}</strong>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No data available</p>
          )}
        </div>
      </div>

      {/* Overall Top Teams */}
      {(summary.men.length > 0 || summary.women.length > 0) && (
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {/* Men's Top 3 */}
          {summary.men.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
              <h4 className="font-bold text-blue-800 mb-3">Top 3 - Men</h4>
              <ol className="space-y-2">
                {summary.men.map((team, idx) => (
                  <li key={team._id} className="flex justify-between p-2 bg-white rounded">
                    <span className="font-semibold">{idx + 1}. {team.collegeName}</span>
                    <span className="text-blue-600 font-bold">{team.points} pts</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Women's Top 3 */}
          {summary.women.length > 0 && (
            <div className="bg-pink-50 p-4 rounded-lg border-l-4 border-pink-600">
              <h4 className="font-bold text-pink-800 mb-3">Top 3 - Women</h4>
              <ol className="space-y-2">
                {summary.women.map((team, idx) => (
                  <li key={team._id} className="flex justify-between p-2 bg-white rounded">
                    <span className="font-semibold">{idx + 1}. {team.collegeName}</span>
                    <span className="text-pink-600 font-bold">{team.points} pts</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchSummary}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}
