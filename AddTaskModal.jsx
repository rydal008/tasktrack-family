import React, { useState } from 'react';
import { supabase } from './utils/supabaseClient';

export default function AddTaskModal({ familyId, members, onClose, onSuccess }) {
  const [taskName, setTaskName] = useState('');
  const [points, setPoints] = useState('1.0');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleMemberToggle = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!taskName.trim() || taskName.length > 10) {
      setError('Task name must be 1-10 characters');
      return;
    }

    if (selectedMembers.length === 0) {
      setError('Select at least one family member');
      return;
    }

    const pointsNum = parseFloat(points);
    if (isNaN(pointsNum) || pointsNum < 0) {
      setError('Points must be a valid number');
      return;
    }

    setLoading(true);

    try {
      // Create task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .insert([{
          family_id: familyId,
          name: taskName.toUpperCase(),
          points: pointsNum
        }])
        .select();

      if (taskError) throw taskError;

      const taskId = taskData[0].id;

      // Create assignments
      const assignments = selectedMembers.map(memberId => ({
        task_id: taskId,
        family_member_id: memberId
      }));

      const { error: assignError } = await supabase
        .from('task_assignments')
        .insert(assignments);

      if (assignError) throw assignError;

      onSuccess();
    } catch (err) {
      setError('Error creating task: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal active" onClick={(e) => e.target.classList.contains('modal') && onClose()}>
      <div className="modal-content">
        <div className="modal-title">Add New Task</div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Task Name (10 chars max)</label>
            <input
              type="text"
              placeholder="e.g., Morning Brush"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value.slice(0, 10))}
              maxLength="10"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Points</label>
            <input
              type="number"
              placeholder="1.0"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              step="0.5"
              min="0"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Assign to:</label>
            <div style={{ padding: '8px', backgroundColor: '#f5f5f7', borderRadius: '8px' }}>
              {members.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#86868b' }}>No family members yet</p>
              ) : (
                members.map(member => (
                  <label key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => handleMemberToggle(member.id)}
                    />
                    {member.emoji} {member.name}
                  </label>
                ))
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-confirm" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
