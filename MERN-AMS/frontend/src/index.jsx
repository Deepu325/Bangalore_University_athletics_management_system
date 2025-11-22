import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import PEDPanel from './pages/PEDPanel';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // landing, login, admin, ped
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [userRole, setUserRole] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLoginClick = () => {
    setCurrentPage('login');
  };

  const handleLoginSuccess = (roleOrData, email, name, isFirstLogin) => {
    // Handle both admin login (4 params) and PED login (object)
    if (typeof roleOrData === 'object') {
      // PED login response
      const data = roleOrData;
      setUserEmail(data.username || 'ped@system.com');
      setUserName(data.username || 'PED User');
      setUserRole('ped');
      if (data.requiresPasswordChange) {
        setShowChangePassword(true);
      }
      setCurrentPage('ped');
    } else {
      // Admin login (traditional parameters)
      setUserEmail(email);
      setUserName(name);
      setUserRole(roleOrData);
      if (isFirstLogin && roleOrData === 'ped') {
        setShowChangePassword(true);
      }
      setCurrentPage(roleOrData === 'admin' ? 'admin' : 'ped');
    }
  };

  const handleLogout = () => {
    setCurrentPage('landing');
    setUserEmail('');
    setUserName('');
    setUserRole('');
    setShowChangePassword(false);
  };

  const renderPage = () => {
    if (currentPage === 'landing') {
      return <LandingPage onLoginClick={handleLoginClick} />;
    }

    if (currentPage === 'login') {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    if (currentPage === 'admin') {
      return <AdminDashboard userEmail={userEmail} userName={userName} onLogout={handleLogout} />;
    }

    if (currentPage === 'ped') {
      return <PEDPanel userEmail={userEmail} userName={userName} onLogout={handleLogout} showChangePassword={showChangePassword} onPasswordChanged={() => setShowChangePassword(false)} />;
    }

    return <LandingPage onLoginClick={handleLoginClick} />;
  };

  return (
    <>
      <Header />
      {renderPage()}
      <Footer />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
