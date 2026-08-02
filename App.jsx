import React, { useState, useEffect } from 'react';
import './App.css';
import Leaderboard from './Leaderboard';
import Tracker from './Tracker';
import Settings from './Settings';
import PINModal from './PINModal';
import Review, { pendingQueue } from './Review';
import { useStore } from './store';
import { getAppTitle, setAppTitle, composeTitle } from './appSettings';

// How long one PIN entry keeps approving unlocked for.
const PARENT_UNLOCK_MINUTES = 15;

function App() {
  const { data } = useStore();
  const waitingCount = pendingQueue(data).length;

  const [currentPage, setCurrentPage] = useState('leaderboard');
  const [darkMode, setDarkMode] = useState(false);
  // Just the custom part; 'TaskTrack' is always appended.
  const [titlePrefix, setTitlePrefix] = useState('');
  const [showPINModal, setShowPINModal] = useState(false);
  const [pinCallback, setPinCallback] = useState(null);
  // Kept in memory only: reloading the page locks it again.
  const [unlockedUntil, setUnlockedUntil] = useState(0);

  useEffect(() => {
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }

    // Show the cached title straight away, then take the shared one as truth.
    setTitlePrefix(localStorage.getItem('appTitlePrefix') || '');

    getAppTitle()
      .then(prefix => {
        setTitlePrefix(prefix);
        localStorage.setItem('appTitlePrefix', prefix);
      })
      .catch(err => console.warn('Could not read the shared title.', err));
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

  // Saves for the whole family, not just this device.
  const updateAppTitle = async (newPrefix) => {
    const saved = await setAppTitle(newPrefix);
    if (!saved) return false;
    setTitlePrefix(newPrefix);
    localStorage.setItem('appTitlePrefix', newPrefix);
    return true;
  };

  const appTitle = composeTitle(titlePrefix);

  useEffect(() => {
    document.title = appTitle === 'TaskTrack' ? 'TaskTrack Family' : appTitle;
  }, [appTitle]);

  // Approving forty chores should not mean typing the PIN forty times.
  const handleRequirePIN = (callback) => {
    if (Date.now() < unlockedUntil) {
      callback();
      return;
    }
    setPinCallback(() => callback);
    setShowPINModal(true);
  };

  const handlePINSuccess = () => {
    setUnlockedUntil(Date.now() + PARENT_UNLOCK_MINUTES * 60 * 1000);
    if (pinCallback) {
      pinCallback();
    }
    setShowPINModal(false);
    setPinCallback(null);
  };

  const lockParentMode = () => setUnlockedUntil(0);

  // Re-lock on its own so the badge cannot linger after it has expired.
  useEffect(() => {
    if (!unlockedUntil) return undefined;
    const remaining = unlockedUntil - Date.now();
    if (remaining <= 0) {
      setUnlockedUntil(0);
      return undefined;
    }
    const timer = setTimeout(() => setUnlockedUntil(0), remaining);
    return () => clearTimeout(timer);
  }, [unlockedUntil]);

  const handlePINCancel = () => {
    setShowPINModal(false);
    setPinCallback(null);
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>{appTitle}</h1>
        <div className="header-right">
          {unlockedUntil > 0 && (
            <button
              className="theme-btn"
              onClick={lockParentMode}
              title={`Parent mode on for ${PARENT_UNLOCK_MINUTES} minutes — tap to lock now`}
            >🔓</button>
          )}
          <div className="credit">by rydal</div>
          <button className="theme-btn" onClick={toggleDarkMode}>{darkMode ? '☀️' : '🌙'}</button>
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {currentPage === 'leaderboard' && <Leaderboard />}
        {currentPage === 'tracker' && <Tracker onRequirePIN={handleRequirePIN} />}
        {currentPage === 'review' && <Review onRequirePIN={handleRequirePIN} />}
        {currentPage === 'settings' && (
          <Settings titlePrefix={titlePrefix} onUpdateTitle={updateAppTitle} />
        )}
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
          className={`nav-tab ${currentPage === 'review' ? 'active' : ''}`}
          onClick={() => setCurrentPage('review')}
        >
          ⏳ Review
          {waitingCount > 0 && <span key={waitingCount} className="nav-badge">{waitingCount}</span>}
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
          onSuccess={handlePINSuccess}
          onCancel={handlePINCancel}
        />
      )}
    </div>
  );
}

export default App;
