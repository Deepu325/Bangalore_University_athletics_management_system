import React, { useState } from 'react';
import PedLogin from './PedLogin';

export default function LoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState('email'); // email, otp, role-select, credentials
  const [showPedLogin, setShowPedLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [selectedRole, setSelectedRole] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Preset credentials
  const ADMIN_EMAIL = 'vscode956@gmail.com';
  const ADMIN_USERS = [
    { id: 1, name: 'Admin One', email: ADMIN_EMAIL },
    { id: 2, name: 'Admin Two', email: ADMIN_EMAIL },
    { id: 3, name: 'Admin Three', email: ADMIN_EMAIL },
    { id: 4, name: 'Admin Four', email: ADMIN_EMAIL }
  ];

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setError(`Only ${ADMIN_EMAIL} is authorized for admin access`);
      return;
    }

    setLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to send OTP');
        setLoading(false);
        return;
      }

      setError('');
      setLoading(false);
      setStep('otp');
    } catch (err) {
      setError('Network error. Please check your connection.');
      setLoading(false);
      console.error('Error sending OTP:', err);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp) {
      setError('Please enter OTP');
      return;
    }

    setLoading(true);
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid OTP');
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep('role-select');
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
      console.error('Error verifying OTP:', err);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setStep('credentials');
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setError('');

    const admin = ADMIN_USERS.find(u => u.name.toLowerCase() === username.toLowerCase());
    
    if (!admin) {
      setError('Invalid admin username');
      return;
    }

    if (password !== '12345') {
      setError('Invalid password. Use default password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess('admin', admin.email, admin.name);
    }, 500);
  };

  return (
    <>
      {showPedLogin ? (
        <PedLogin
          onLoginSuccess={onLoginSuccess}
          onNavigateBack={() => {
            setShowPedLogin(false);
            setStep('email');
          }}
        />
      ) : (
        <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-purple-600\">
          {/* Step 1: Email for Admin */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Sign In</h2>
                <p className="text-gray-600 text-sm">Enter authorized admin email</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder={ADMIN_EMAIL}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPedLogin(true);
                }}
                className="w-full text-purple-600 py-2 font-medium hover:text-purple-700"
              >
                Sign in as PED User
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Verify OTP</h2>
                <p className="text-gray-600 text-sm">We've sent a 6-digit code to your email</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Check your email or backend console for OTP
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
              >
                Verify OTP
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError('');
                }}
                className="w-full text-purple-600 py-2 font-medium hover:text-purple-700"
              >
                Back to Email
              </button>
            </form>
          )}

          {/* Step 3: Admin Role Selection */}
          {step === 'role-select' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Admin</h2>
                <p className="text-gray-600 text-sm">Choose your admin account</p>
              </div>

              <div className="space-y-3">
                {ADMIN_USERS.map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => handleRoleSelect('admin')}
                    className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition text-left"
                  >
                    <h3 className="font-semibold text-gray-800">{admin.name}</h3>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
                }}
                className="w-full text-purple-600 py-2 font-medium hover:text-purple-700"
              >
                Back to Email
              </button>
            </div>
          )}

          {/* Step 4: Admin Credentials */}
          {step === 'credentials' && (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Login</h2>
                <p className="text-gray-600 text-sm">Enter your credentials</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Admin Name
                </label>
                <select
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition"
                >
                  <option value="">Select Admin</option>
                  {ADMIN_USERS.map((admin) => (
                    <option key={admin.id} value={admin.name}>{admin.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Default: 12345"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-2">Default password: <span className="font-bold">12345</span></p>
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Logging in...' : 'Login to Admin Panel'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('role-select');
                  setUsername('');
                  setPassword('');
                  setError('');
                }}
                className="w-full text-purple-600 py-2 font-medium hover:text-purple-700"
              >
                Back
              </button>
            </form>
          )}


        </div>
        </div>
      </div>


        </div>
      )}
    </>
  );
}
