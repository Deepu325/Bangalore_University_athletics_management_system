import React, { useState } from 'react';
import './PedLogin.css';

const PedLogin = ({ onLoginSuccess, onNavigateBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_BASE_URL}/api/auth/ped-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'ped');
      localStorage.setItem('username', data.username);
      localStorage.setItem('collegeId', data.collegeId || '');

      // Check if password change required
      if (data.mustChangePassword) {
        onLoginSuccess({ 
          ...data, 
          requiresPasswordChange: true 
        });
      } else {
        onLoginSuccess(data);
      }
    } catch (err) {
      setError('Network error or server is offline');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ped-login-container">
      <div className="ped-login-card">
        <div className="login-header">
          <h1>BU-AMS</h1>
          <h2>PED Login</h2>
          <p>Physical Education Director</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="e.g., harish_pm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
            <small>Sanitized PED name (e.g., Dr. Harish P M → harish_pm)</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Phone number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
            <small>Default: Your phone number (PED will be prompted to change on first login)</small>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="back-button"
            onClick={onNavigateBack}
            disabled={loading}
          >
            ← Back to Main Login
          </button>
        </div>

        <div className="login-help">
          <p>Need help? Contact your administrator.</p>
        </div>
      </div>
    </div>
  );
};

export default PedLogin;
