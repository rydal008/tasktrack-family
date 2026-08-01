import React, { useState, useEffect } from 'react';

export default function Settings({ onUpdateTitle }) {
  const [customTitle, setCustomTitle] = useState('');
  const [cycleType, setCycleType] = useState(7);
  const [titlePreview, setTitlePreview] = useState('TaskTrack');

  useEffect(() => {
    const savedTitle = localStorage.getItem('appTitle') || 'TaskTrack';
    // Extract custom part
    const customPart = savedTitle.replace(' - TaskTrack', '').replace('TaskTrack', '');
    setCustomTitle(customPart);
    updatePreview(customPart);
  }, []);

  const updatePreview = (input) => {
    if (input && input.toLowerCase() !== 'tasktrack') {
      setTitlePreview(`${input} - TaskTrack`);
    } else {
      setTitlePreview('TaskTrack');
    }
  };

  const handleTitleChange = (value) => {
    setCustomTitle(value);
    updatePreview(value);
  };

  const handleTitleSave = () => {
    onUpdateTitle(customTitle);
    alert(`✓ App title updated to "${titlePreview}"`);
  };

  return (
    <div className="page">
      {/* App Customization */}
      <div className="settings-section">
        <h3 className="settings-title">👤 App Customization</h3>
        
        <div className="input-group">
          <label className="input-label">Custom Title (optional)</label>
          <input
            type="text"
            placeholder="e.g., Alegrado Kids, Family Chores"
            value={customTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="settings-input"
          />
          <div className="input-hint">
            💡 Will display as "<strong>{titlePreview}</strong>"
          </div>
          <button className="btn-save" onClick={handleTitleSave}>
            Save Title
          </button>
        </div>
      </div>

      {/* Cycle Configuration */}
      <div className="settings-section">
        <h3 className="settings-title">🔄 Cycle Configuration</h3>
        
        <div className="radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="cycle"
              value="3"
              checked={cycleType === 3}
              onChange={(e) => setCycleType(3)}
            />
            <span>3-Day Cycle</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="cycle"
              value="7"
              checked={cycleType === 7}
              onChange={(e) => setCycleType(7)}
            />
            <span>7-Day Cycle</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="cycle"
              value="30"
              checked={cycleType === 30}
              onChange={(e) => setCycleType(30)}
            />
            <span>30-Day Cycle</span>
          </label>
        </div>
      </div>

      {/* Family Members */}
      <div className="settings-section">
        <h3 className="settings-title">👨‍👩‍👧‍👦 Family Members</h3>
        <div className="settings-hint">
          📝 Manage family members in the Leaderboard page
        </div>
      </div>

      {/* Tasks */}
      <div className="settings-section">
        <h3 className="settings-title">✓ Tasks</h3>
        <div className="settings-hint">
          📝 Manage tasks in the Tasks page
        </div>
      </div>

      {/* About */}
      <div className="settings-section">
        <h3 className="settings-title">ℹ️ About</h3>
        <div className="about-content">
          <p><strong>TaskTrack</strong></p>
          <p>Family task tracking with evidence-based verification</p>
          <p>Version 1.0.0</p>
          <p style={{ fontSize: '12px', color: '#86868b', marginTop: '16px' }}>
            Made with ❤️ by rydal
          </p>
        </div>
      </div>
    </div>
  );
}
