import React, { useState } from 'react';
import { AvatarDisplay } from './Avatars';
import { DAY_PRESETS, DAY_SHORT, ALL_DAYS, sortDays, sameDays, timesPerWeek } from './store';

export default function AddTaskModal({ members, task, onSave, onDelete, onClose }) {
  const [name, setName] = useState(task ? task.name : '');
  const [points, setPoints] = useState(task ? String(task.points) : '1');
  const [days, setDays] = useState(task ? task.days : ALL_DAYS);
  const [selectedMembers, setSelectedMembers] = useState(task ? task.members : []);
  const [error, setError] = useState('');

  const toggleDay = (day) => {
    setError('');
    setDays(days.includes(day) ? days.filter(d => d !== day) : sortDays([...days, day]));
  };

  const toggleMember = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Give the task a name.');
      return;
    }
    if (days.length === 0) {
      setError('Pick at least one day.');
      return;
    }
    if (selectedMembers.length === 0) {
      setError('Pick at least one family member.');
      return;
    }
    const pointsNum = parseFloat(points);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      setError('Points must be a number above 0.');
      return;
    }

    onSave({
      name: name.trim(),
      points: pointsNum,
      days: sortDays(days),
      members: selectedMembers
    });
  };

  return (
    <div className="modal active" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{task ? 'Edit Task' : 'Add New Task'}</div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Task Name (10 characters max)</label>
            <input
              type="text"
              className="settings-input"
              placeholder="e.g., Homework"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 10))}
              maxLength="10"
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label">Which days?</label>

            <div className="day-picker">
              {ALL_DAYS.map(day => (
                <button
                  type="button"
                  key={day}
                  className={`day-toggle${days.includes(day) ? ' on' : ''}`}
                  onClick={() => toggleDay(day)}
                  aria-pressed={days.includes(day)}
                >
                  {DAY_SHORT[day]}
                </button>
              ))}
            </div>

            <div className="preset-row">
              {DAY_PRESETS.map(preset => (
                <button
                  type="button"
                  key={preset.id}
                  className={`preset-btn${sameDays(preset.days, days) ? ' on' : ''}`}
                  onClick={() => { setError(''); setDays(preset.days); }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="task-meta" style={{ marginTop: '8px' }}>
              {days.length > 0 ? timesPerWeek(days) : 'No days chosen yet'}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Points each time</label>
            <input
              type="number"
              className="settings-input"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              step="0.5"
              min="0.5"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Assign to</label>
            <div className="member-check-list">
              {members.length === 0 ? (
                <div className="task-meta">No family members yet. Add one on the Leaderboard page.</div>
              ) : (
                members.map(member => (
                  <label key={member.id} className="member-check">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => toggleMember(member.id)}
                    />
                    <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center' }}>
                      <AvatarDisplay avatarId={member.avatar} size={24} />
                    </div>
                    <span className="member-name">{member.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-confirm">{task ? 'Save' : 'Create'}</button>
          </div>

          {onDelete && (
            <button type="button" className="btn-danger" onClick={onDelete}>Delete this task</button>
          )}
        </form>
      </div>
    </div>
  );
}
