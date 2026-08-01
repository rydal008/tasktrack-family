import React, { useState } from 'react';

export default function PINModal({ onSubmit, onCancel }) {
  const [pinEntry, setPinEntry] = useState('');

  const handleAddPin = (digit) => {
    if (pinEntry.length < 6) {
      setPinEntry(pinEntry + digit);
    }
  };

  const handleClear = () => {
    setPinEntry(pinEntry.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pinEntry.length >= 4) {
      onSubmit(pinEntry);
      setPinEntry('');
    }
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-title">Enter Parent PIN</div>
        <div className="modal-body">Tap to toggle task completion</div>

        <div className="pin-display">
          {'●'.repeat(pinEntry.length)}
        </div>

        <div className="modal-pin-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
            <button
              key={digit}
              className="pin-btn"
              onClick={() => handleAddPin(digit.toString())}
            >
              {digit}
            </button>
          ))}
          <button className="pin-btn" style={{ visibility: 'hidden' }}>*</button>
          <button className="pin-btn" onClick={() => handleAddPin('0')}>0</button>
          <button className="pin-btn" onClick={handleClear}>⌫</button>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button 
            className="btn-confirm" 
            onClick={handleSubmit}
            disabled={pinEntry.length < 4}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
