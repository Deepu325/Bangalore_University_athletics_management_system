import React from 'react';

export default function LandingPage({ onLoginClick }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col">
      {/* Professional Branding Header - Centered */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        paddingTop: '40px',
        paddingBottom: '50px',
        textAlign: 'center'
      }}>
        <div className="max-w-7xl mx-auto px-6">
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* BU Logo - SVG Circle */}
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ marginBottom: '30px' }}>
              <defs>
                <linearGradient id="buGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.9 }} />
                  <stop offset="100%" style={{ stopColor: '#f0f0f0', stopOpacity: 0.8 }} />
                </linearGradient>
              </defs>
              <circle cx="70" cy="70" r="65" fill="url(#buGradient)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
              <text x="70" y="85" fontSize="48" fontWeight="bold" textAnchor="middle" fill="#667eea" fontFamily="Arial, sans-serif">BU</text>
            </svg>
            
            {/* Main Title - Centered */}
            <h1 style={{
              fontSize: '56px',
              fontWeight: 'bold',
              marginBottom: '8px',
              letterSpacing: '1px',
              margin: '0 auto 8px',
              width: '100%'
            }}>BANGALORE UNIVERSITY</h1>
            
            {/* Directorate - Centered */}
            <h2 style={{
              fontSize: '26px',
              fontWeight: '600',
              marginBottom: '12px',
              opacity: '0.95',
              margin: '0 auto 12px',
              width: '100%'
            }}>Directorate of Physical Education & Sports</h2>
            
            {/* Campus Address - Centered */}
            <p style={{
              fontSize: '18px',
              marginBottom: '8px',
              opacity: '0.9',
              margin: '0 auto 8px',
              width: '100%'
            }}>UCPE Stadium, Jnanabharathi Campus, Bengaluru – 560056</p>
            
            {/* Championship Title - Centered */}
            <p style={{
              fontSize: '22px',
              fontWeight: '600',
              marginBottom: '35px',
              opacity: '0.95',
              letterSpacing: '0.3px',
              margin: '0 auto 35px',
              width: '100%'
            }}>61st Inter-Collegiate Athletic Championship 2025–26</p>
            
            {/* Buttons - Centered */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
              <button onClick={onLoginClick} style={{
                background: 'white',
                color: '#667eea',
                padding: '14px 32px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }} onMouseOver={(e) => e.target.style.background = '#f0f0f0'} onMouseOut={(e) => e.target.style.background = 'white'}>
                View Events & Results
              </button>
              <button onClick={onLoginClick} style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '14px 32px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                border: '2px solid rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }} onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'} onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}>
                Admin / PED Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full">
        {/* Hero Section - Centered */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'semibold', marginBottom: '32px', color: '#1f2937', width: '100%' }}>Athletic Meet Management System</h2>
        </div>

        {/* Event Categories Section - Centered */}
        <div style={{ marginBottom: '64px', width: '100%' }}>
          <h3 style={{ fontSize: '30px', fontWeight: 'bold', textAlign: 'center', marginBottom: '48px', color: '#1f2937', width: '100%' }}>Event Categories</h3>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-purple-600">
              <div className="text-5xl mb-4 text-center">🏃</div>
              <h4 className="font-bold mb-3 text-gray-800 text-center">Track Events</h4>
              <p className="text-sm text-gray-600 text-center">100m, 200m, 400m, Hurdles & More</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-purple-600">
              <div className="text-5xl mb-4 text-center">🦘</div>
              <h4 className="font-bold mb-3 text-gray-800 text-center">Jump Events</h4>
              <p className="text-sm text-gray-600 text-center">Long Jump, High Jump, Pole Vault</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-purple-600">
              <div className="text-5xl mb-4 text-center">💪</div>
              <h4 className="font-bold mb-3 text-gray-800 text-center">Throw Events</h4>
              <p className="text-sm text-gray-600 text-center">Shot Put, Discus, Javelin, Hammer</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-purple-600">
              <div className="text-5xl mb-4 text-center">🤝</div>
              <h4 className="font-bold mb-3 text-gray-800 text-center">Relay Events</h4>
              <p className="text-sm text-gray-600 text-center">4x100m, 4x400m, Mixed Relay</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-l-4 border-purple-600">
              <div className="text-5xl mb-4 text-center">🏆</div>
              <h4 className="font-bold mb-3 text-gray-800 text-center">Combined</h4>
              <p className="text-sm text-gray-600 text-center">Decathlon & Heptathlon</p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
