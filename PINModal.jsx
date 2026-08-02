import React, { useEffect, useState } from 'react';
import { pinIsSet, checkPin, changePin, pinLooksValid, PIN_MIN, PIN_MAX } from './pin';

// Modes: loading → enter (a PIN exists) | create → repeat (first time)
export default function PINModal({ onSuccess, onCancel }) {
  const [mode, setMode] = useState('loading');
  const [entry, setEntry] = useState('');
  const [firstEntry, setFirstEntry] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pinIsSet()
      .then(isSet => { if (!cancelled) setMode(isSet ? 'enter' : 'create'); })
      .catch(err => {
        console.error(err);
        if (!cancelled) {
          setMode('enter');
          setError('Could not reach the server.');
        }
      });
    return () => { cancelled = true; };
  }, []);

  const addDigit = (digit) => {
    if (busy || entry.length >= PIN_MAX) return;
    setError('');
    setEntry(entry + digit);
  };

  const backspace = () => {
    if (busy) return;
    setEntry(entry.slice(0, -1));
  };

  const submit = async () => {
    if (busy || !pinLooksValid(entry)) return;
    setBusy(true);
    setError('');

    try {
      if (mode === 'enter') {
        const ok = await checkPin(entry);
        if (ok) {
          onSuccess();
        } else {
          setError('Wrong PIN.');
          setEntry('');
        }
      } else if (mode === 'create') {
        setFirstEntry(entry);
        setEntry('');
        setMode('repeat');
      } else {
        if (entry !== firstEntry) {
          setError('Those did not match. Start again.');
          setFirstEntry('');
          setEntry('');
          setMode('create');
        } else {
          const ok = await changePin(entry);
          if (ok) {
            onSuccess();
          } else {
            setError('Could not save that PIN.');
            setEntry('');
            setMode('create');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Try again.');
      setEntry('');
    } finally {
      setBusy(false);
    }
  };

  const heading = {
    loading: 'Parent PIN',
    enter: 'Enter Parent PIN',
    create: 'Choose a Parent PIN',
    repeat: 'Type it once more'
  }[mode];

  const blurb = {
    loading: 'Checking…',
    enter: 'Only a parent should know this.',
    create: `No PIN yet. Pick ${PIN_MIN} to ${PIN_MAX} digits — kids must not know it.`,
    repeat: 'Just to be sure you remember it.'
  }[mode];

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-title">{heading}</div>
        <div className="modal-body">{blurb}</div>

        <div className="pin-display">{'●'.repeat(entry.length)}</div>

        <div className="modal-pin-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
            <button
              key={digit}
              className="pin-btn"
              onClick={() => addDigit(String(digit))}
              disabled={mode === 'loading' || busy}
            >
              {digit}
            </button>
          ))}
          <button className="pin-btn" style={{ visibility: 'hidden' }}>*</button>
          <button
            className="pin-btn"
            onClick={() => addDigit('0')}
            disabled={mode === 'loading' || busy}
          >0</button>
          <button className="pin-btn" onClick={backspace} disabled={busy}>⌫</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            className="btn-confirm"
            onClick={submit}
            disabled={busy || mode === 'loading' || !pinLooksValid(entry)}
            style={{ opacity: busy || !pinLooksValid(entry) ? 0.5 : 1 }}
          >
            {busy ? 'Checking…' : mode === 'create' ? 'Next' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
