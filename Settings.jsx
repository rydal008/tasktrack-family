import React, { useEffect, useState } from 'react';
import { pinIsSet, changePin, pinLooksValid, PIN_MIN, PIN_MAX } from './pin';

export default function Settings({ onUpdateTitle }) {
  const [customTitle, setCustomTitle] = useState('');
  const [titlePreview, setTitlePreview] = useState('TaskTrack');

  const [hasPin, setHasPin] = useState(null);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [repeatPin, setRepeatPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [pinError, setPinError] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  useEffect(() => {
    const savedTitle = localStorage.getItem('appTitle') || 'TaskTrack';
    const customPart = savedTitle.replace(' - TaskTrack', '').replace('TaskTrack', '');
    setCustomTitle(customPart);
    updatePreview(customPart);

    pinIsSet()
      .then(setHasPin)
      .catch(err => {
        console.error(err);
        setHasPin(false);
        setPinError('Could not reach the server.');
      });
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

  const onlyDigits = (value, setter) => setter(value.replace(/\D/g, '').slice(0, PIN_MAX));

  const handlePinSave = async () => {
    setPinError('');
    setPinMessage('');

    if (!pinLooksValid(newPin)) {
      setPinError(`The PIN must be ${PIN_MIN} to ${PIN_MAX} numbers.`);
      return;
    }
    if (newPin !== repeatPin) {
      setPinError('The two new PINs do not match.');
      return;
    }
    if (hasPin && !currentPin) {
      setPinError('Type your current PIN first.');
      return;
    }

    setSavingPin(true);
    try {
      const ok = await changePin(newPin, hasPin ? currentPin : null);
      if (ok) {
        setHasPin(true);
        setCurrentPin('');
        setNewPin('');
        setRepeatPin('');
        setPinMessage('✓ PIN saved. It works on every device.');
      } else {
        setPinError(hasPin ? 'That current PIN is wrong.' : 'Could not save that PIN.');
      }
    } catch (err) {
      console.error(err);
      setPinError('Something went wrong. Try again.');
    } finally {
      setSavingPin(false);
    }
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

      {/* Parent PIN */}
      <div className="settings-section">
        <h3 className="settings-title">🔒 Parent PIN</h3>

        {hasPin === null ? (
          <div className="settings-hint">Checking…</div>
        ) : (
          <>
            <div className="settings-hint" style={{ marginBottom: '16px' }}>
              {hasPin
                ? 'A PIN is set. It is needed to approve a kid\'s evidence.'
                : 'No PIN yet — anyone can approve evidence until you set one.'}
            </div>

            {hasPin && (
              <div className="input-group">
                <label className="input-label">Current PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  className="settings-input"
                  value={currentPin}
                  onChange={(e) => onlyDigits(e.target.value, setCurrentPin)}
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">{hasPin ? 'New PIN' : 'PIN'} ({PIN_MIN}–{PIN_MAX} numbers)</label>
              <input
                type="password"
                inputMode="numeric"
                className="settings-input"
                value={newPin}
                onChange={(e) => onlyDigits(e.target.value, setNewPin)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Type it again</label>
              <input
                type="password"
                inputMode="numeric"
                className="settings-input"
                value={repeatPin}
                onChange={(e) => onlyDigits(e.target.value, setRepeatPin)}
              />
            </div>

            {pinError && <div className="error-message">{pinError}</div>}
            {pinMessage && <div className="input-hint"><strong>{pinMessage}</strong></div>}

            <button className="btn-save" onClick={handlePinSave} disabled={savingPin}>
              {savingPin ? 'Saving…' : hasPin ? 'Change PIN' : 'Set PIN'}
            </button>
          </>
        )}
      </div>

      {/* Cycle Configuration */}
      <div className="settings-section">
        <h3 className="settings-title">🔄 Cycle Configuration</h3>

        <div className="settings-hint">
          📅 The cycle is one full week: <strong>Monday to Sunday</strong>.<br />
          Scores reset every Monday morning.
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
