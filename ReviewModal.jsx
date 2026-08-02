import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import { loadEvidence, deleteEvidence } from './evidence';

// Shared by the Tasks page and the Review queue, so both behave identically.
export default function ReviewModal({ cell, onRequirePIN, onFinished, onClose }) {
  const { setCompletion } = useStore();

  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [state, setState] = useState('loading'); // loading | ready | empty | error
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setItems([]);
    setIndex(0);

    loadEvidence(cell.dk, cell.taskId, cell.memberId)
      .then(found => {
        if (cancelled) return;
        setItems(found);
        setState(found.length > 0 ? 'ready' : 'empty');
      })
      .catch(err => {
        console.error(err);
        if (!cancelled) setState('error');
      });

    return () => { cancelled = true; };
  }, [cell.dk, cell.taskId, cell.memberId]);

  const finish = async (approved) => {
    setBusy(true);
    try {
      await deleteEvidence(cell.dk, cell.taskId, cell.memberId);
      setCompletion(cell.dk, cell.taskId, cell.memberId, approved ? 'approved' : 'completed');
      onFinished(approved);
    } catch (err) {
      console.error(err);
      alert('Could not finish the review.\n\n' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const approve = () => onRequirePIN(() => finish(true));

  return (
    <div className="modal active" onClick={() => !busy && onClose()}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-title">🔍 Review Evidence</div>
        <div className="modal-body">
          {cell.memberName} · {cell.taskName}{cell.dayLabel ? ` · ${cell.dayLabel}` : ''}
        </div>

        {state === 'loading' && <div className="carousel-placeholder">Loading…</div>}

        {state === 'empty' && (
          <div className="carousel-placeholder">
            The photos are gone. Send it back so it can be done again.
          </div>
        )}

        {state === 'error' && (
          <div className="carousel-placeholder">Could not load the evidence.</div>
        )}

        {state === 'ready' && (
          <>
            <div className="evidence-stage">
              {items[index].kind === 'photo'
                ? <img src={items[index].url} alt="Evidence" />
                : <video src={items[index].url} controls playsInline />}
            </div>

            {items.length > 1 && (
              <div className="carousel-nav">
                <button onClick={() => setIndex(index - 1)} disabled={index === 0}>← Prev</button>
                <span className="task-meta">{index + 1} of {items.length}</span>
                <button onClick={() => setIndex(index + 1)} disabled={index === items.length - 1}>Next →</button>
              </div>
            )}
          </>
        )}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={() => finish(false)} disabled={busy}>Not OK</button>
          <button
            className="btn-confirm"
            onClick={approve}
            disabled={busy || state !== 'ready'}
          >
            {busy ? 'Working…' : 'OK ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
