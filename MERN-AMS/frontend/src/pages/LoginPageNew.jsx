import React, { useState } from 'react';
import PedLogin from './PedLogin';
import ChangePassword from './ChangePassword';

export default function LoginPage({ onLoginSuccess }) {
  const [step, setStep] = useState('role-select'); // role-select, admin, ped-login, ped-change-password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pedToken, setPedToken] = useState('');

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
      const response = await fetch('http://localhost:5002/api/auth/send-otp', {
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
      const response = await fetch('http://localhost:5002/api/auth/verify-otp', {
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
      setStep('admin-select');
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
      console.error('Error verifying OTP:', err);
    }
  };

  const handleAdminSelect = (admin) => {
    setUsername(admin.name);
    setStep('admin-credentials');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== '12345') {
      setError('Invalid password. Use: 12345');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess('admin', email, username);
    }, 500);
  };

  const handlePedLoginSuccess = (data) => {
    if (data.requiresPasswordChange) {
      setPedToken(data.token);
      setStep('ped-change-password');
    } else {
      // PED login successful, no password change needed
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'ped');
      onLoginSuccess('ped', data.username, data.username);
    }
  };

  const handlePasswordChangeSuccess = () => {
    // Password changed, proceed to PED dashboard
    onLoginSuccess('ped', localStorage.getItem('username'), localStorage.getItem('username'));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Step 1: Role Selection */}
          {step === 'role-select' && (
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-purple-600 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Login Type</h2>
                <p className="text-gray-600 text-sm">Choose your account type to continue</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setStep('email');
                    setError('');
                  }}
                  className="w-full p-4 border-2 border-purple-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition text-left"
                >
                  <h3 className="font-semibold text-gray-800">👨‍💼 Admin Login</h3>
                  <p className="text-sm text-gray-600">Sign in with admin account</p>
                </button>

                <button
                  onClick={() => {
                    setStep('ped-login');
                    setError('');
                  }}
                  className="w-full p-4 border-2 border-blue-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left"
                >
                  <h3 className="font-semibold text-gray-800">👨‍🏫 PED Login</h3>
                  <p className="text-sm text-gray-600">Physical Education Director login</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Email for Admin */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-purple-600 space-y-6">
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
                  setStep('role-select');
                  setEmail('');
                  setError('');
                }}
                className="w-full text-purple-600 py-2 font-medium hover:text-purple-700"
              >
                Back
              </button>
            </form>
          )}

          {/* Step 3: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-purple-600 space-y-6">
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
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
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
                Back
              </button>
            </form>
          )}

          {/* Step 4: Admin Selection */}
          {step === 'admin-select' && (
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-purple-600 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Admin</h2>
                <p className="text-gray-600 text-sm">Choose your admin account</p>
              </div>

              <div className="space-y-3">
                {ADMIN_USERS.map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => handleAdminSelect(admin)}
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
                Back
              </button>
            </div>
          )}

          {/* Step 5: Admin Credentials */}
          {step === 'admin-credentials' && (
            <form onSubmit={handleAdminLogin} className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-purple-600 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Admin Login</h2>
                <p className="text-gray-600 text-sm">Enter your password</p>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Selected Admin:</span> {username}
                </p>
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
                  placeholder="Enter password"
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
                  setStep('admin-select');
                  setPassword('');
                  setError('');
                }}
                className="w-full text-purple-600 py-2 font-medium hover:text-purple-700"
              >
                Back
              </button>
            </form>
          )}

          {/* Step 6: PED Login */}
          {step === 'ped-login' && (
            <PedLogin
              onLoginSuccess={handlePedLoginSuccess}
              onNavigateBack={() => {
                setStep('role-select');
                setError('');
              }}
            />
          )}

          {/* Step 7: PED Change Password */}
          {step === 'ped-change-password' && (
            <ChangePassword
              token={pedToken}
              onPasswordChanged={handlePasswordChangeSuccess}
            />
          )}

        </div>
      </div>


    </div>
  );
}
