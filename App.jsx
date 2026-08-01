import React, { useState, useEffect } from 'react';
import './App.css';
import Leaderboard from './Leaderboard';
import Tracker from './Tracker';
import Settings from './Settings';
import PINModal from './PINModal';
import { StoreProvider } from './store';

function App() {
  const [currentPage, setCurrentPage] = useState('leaderboard');
  const [darkMode, setDarkMode] = useState(false);
  const [appTitle, setAppTitle] = useState('TaskTrack');
  const [showPINModal, setShowPINModal] = useState(false);
  const [pinCallback, setPinCallback] = useState(null);

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }

    // Load custom title
    const savedTitle = localStorage.getItem('appTitle') || 'TaskTrack';
    setAppTitle(savedTitle);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const updateAppTitle = (newTitle) => {
    let fullTitle;
    if (newTitle && newTitle.toLowerCase() !== 'tasktrack') {
      fullTitle = `${newTitle} - TaskTrack`;
    } else {
      fullTitle = 'TaskTrack';
    }
    setAppTitle(fullTitle);
    localStorage.setItem('appTitle', fullTitle);
  };

  const handleRequirePIN = (callback) => {
    setPinCallback(() => callback);
    setShowPINModal(true);
  };

  const handlePINSubmit = (pin) => {
    if (pinCallback) {
      pinCallback(pin);
    }
    setShowPINModal(false);
    setPinCallback(null);
  };

  return (
    <StoreProvider>
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>{appTitle}</h1>
        <div className="header-right">
          <div className="credit">by rydal</div>
          <button className="theme-btn" onClick={toggleDarkMode}>🌙</button>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {currentPage === 'leaderboard' && <Leaderboard />}
        {currentPage === 'tracker' && <Tracker onRequirePIN={handleRequirePIN} />}
        {currentPage === 'settings' && <Settings onUpdateTitle={updateAppTitle} />}
      </div>

      {/* Navigation */}
      <div className="nav-bar">
        <button 
          className={`nav-tab ${currentPage === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setCurrentPage('leaderboard')}
        >
          🏆 Leaderboard
        </button>
        <button 
          className={`nav-tab ${currentPage === 'tracker' ? 'active' : ''}`}
          onClick={() => setCurrentPage('tracker')}
        >
          ✓ Tasks
        </button>
        <button 
          className={`nav-tab ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentPage('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* PIN Modal */}
      {showPINModal && (
        <PINModal 
          onSubmit={handlePINSubmit}
          onCancel={() => setShowPINModal(false)}
        />
      )}
    </div>
    </StoreProvider>
  );
}

export default App;
