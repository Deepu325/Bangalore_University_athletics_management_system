import React, { useState } from 'react';
import AthleteRegistration from '../components/AthleteRegistration';
import EventManagementNew from '../components/EventManagementNew';
import ManageColleges from './admin/ManageColleges';
import TeamScoresPanel from '../components/TeamScoresPanel';
import ChampionshipSummary from '../components/ChampionshipSummary';

export default function AdminDashboard({ userEmail, userName, onLogout }) {
  const [currentSection, setCurrentSection] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <div className="space-y-2">
              <button
                onClick={() => setCurrentSection('overview')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentSection === 'overview'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 Dashboard Overview
              </button>
              <button
                onClick={() => setCurrentSection('colleges')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentSection === 'colleges'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🏛️ Manage Colleges
              </button>
              <button
                onClick={() => setCurrentSection('athletes')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentSection === 'athletes'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🏃 Athlete Registration
              </button>
              <button
                onClick={() => setCurrentSection('events')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentSection === 'events'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📅 Event Management
              </button>
              <button
                onClick={() => setCurrentSection('results')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentSection === 'results'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🏆 Results & Scoring
              </button>
              <button
                onClick={() => setCurrentSection('championship')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentSection === 'championship'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🏅 Team Championship
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {currentSection === 'overview' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-purple-600 text-3xl mb-2">🏛️</div>
                  <div className="text-3xl font-bold text-gray-800">3</div>
                  <div className="text-gray-600 text-sm">Total Colleges</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-blue-600 text-3xl mb-2">🏃</div>
                  <div className="text-3xl font-bold text-gray-800">0</div>
                  <div className="text-gray-600 text-sm">Registered Athletes</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-green-600 text-3xl mb-2">📅</div>
                  <div className="text-3xl font-bold text-gray-800">0</div>
                  <div className="text-gray-600 text-sm">Total Events</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-yellow-600 text-3xl mb-2">🏅</div>
                  <div className="text-3xl font-bold text-gray-800">0</div>
                  <div className="text-gray-600 text-sm">Medals Awarded</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Start Guide</h2>
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-purple-50 rounded-lg">
                    <span className="text-lg">1️⃣</span>
                    <div>
                      <p className="font-semibold">Add/Manage Colleges</p>
                      <p className="text-sm text-gray-600">Register participating colleges and PED information</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-lg">2️⃣</span>
                    <div>
                      <p className="font-semibold">Register Athletes</p>
                      <p className="text-sm text-gray-600">Add athletes and assign them to events</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-green-50 rounded-lg">
                    <span className="text-lg">3️⃣</span>
                    <div>
                      <p className="font-semibold">Create Events</p>
                      <p className="text-sm text-gray-600">Set up athletic events with dates and venues</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-yellow-50 rounded-lg">
                    <span className="text-lg">4️⃣</span>
                    <div>
                      <p className="font-semibold">Manage Results</p>
                      <p className="text-sm text-gray-600">Enter scores and publish final rankings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentSection === 'athletes' && <AthleteRegistration />}

          {currentSection === 'colleges' && <ManageColleges />}

          {currentSection === 'events' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-8">Event Management - 13 Stage Workflow</h1>
              <EventManagementNew onBackToDashboard={() => setCurrentSection('overview')} />
            </div>
          )}

          {currentSection === 'results' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-8">Results & Scoring</h1>
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-gray-600">Results and scoring features coming soon...</p>
              </div>
            </div>
          )}

          {currentSection === 'championship' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-8">🏅 Team Championship Points</h1>
              
              {/* Championship Summary */}
              <div className="mb-12">
                <ChampionshipSummary />
              </div>

              {/* Team Scores Panel */}
              <div className="mt-12">
                <TeamScoresPanel />
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
