import React, { useState } from 'react';
import { AvatarDisplay } from './Avatars';
import AddTaskModal from './AddTaskModal';
import {
  useStore, DAY_NAMES, DAY_SHORT, getFrequency,
  startOfWeek, weekDates, dayIndexOf, dateKey, formatDate, isSameDay
} from './store';

export default function Tracker({ onRequirePIN }) {
  const { data, loading, addTask, updateTask, removeTask, setCompletion, getCompletion } = useStore();

  const today = new Date();
  const weekStart = startOfWeek(today);
  const dates = weekDates(weekStart);

  const [dayIndex, setDayIndex] = useState(dayIndexOf(today));
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const date = dates[dayIndex];
  const dk = dateKey(date);
  const isToday = isSameDay(date, today);

  const tasksToday = data.tasks.filter(task =>
    getFrequency(task.frequency).days.includes(dayIndex)
  );

  const getCheckIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'pending': return '⏳';
      case 'approved': return '✓✓';
      default: return '✗';
    }
  };

  const handleCheckClick = (task, member) => {
    const status = getCompletion(dk, task.id, member.id);
    setSelectedCell({ dk, taskId: task.id, memberId: member.id, taskName: task.name });

    if (status === 'incomplete') {
      setCompletion(dk, task.id, member.id, 'completed');
    } else if (status === 'completed') {
      setUploadedFiles([]);
      setShowUploadModal(true);
    } else if (status === 'pending') {
      setShowReviewModal(true);
    } else {
      alert('✓✓ Already approved by a parent.');
    }
  };

  const submitEvidence = () => {
    if (uploadedFiles.length === 0) return;
    setCompletion(selectedCell.dk, selectedCell.taskId, selectedCell.memberId, 'pending');
    setShowUploadModal(false);
    alert('✓ Evidence submitted. Waiting for a parent to review.');
  };

  const undoCompletion = () => {
    setCompletion(selectedCell.dk, selectedCell.taskId, selectedCell.memberId, 'incomplete');
    setShowUploadModal(false);
  };

  const approveEvidence = () => {
    onRequirePIN((pin) => {
      if (pin.length >= 4) {
        setCompletion(selectedCell.dk, selectedCell.taskId, selectedCell.memberId, 'approved');
        setShowReviewModal(false);
        alert('✓ Approved. Evidence deleted.');
      } else {
        alert('❌ Invalid PIN');
      }
    });
  };

  const rejectEvidence = () => {
    setCompletion(selectedCell.dk, selectedCell.taskId, selectedCell.memberId, 'completed');
    setShowReviewModal(false);
  };

  const openNewTask = () => {
    if (data.members.length === 0) {
      alert('Add a family member first, on the Leaderboard page.');
      return;
    }
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleSaveTask = (fields) => {
    if (editingTask) {
      updateTask(editingTask.id, fields);
    } else {
      addTask(fields);
    }
    setShowTaskModal(false);
  };

  const handleDeleteTask = () => {
    if (window.confirm(`Delete the task "${editingTask.name}"?`)) {
      removeTask(editingTask.id);
      setShowTaskModal(false);
    }
  };

  return (
    <div className="page">
      {/* Day navigation */}
      <div className="day-header">
        <div>
          <h2>{DAY_NAMES[dayIndex]}</h2>
          <p className="day-meta">{formatDate(date)}{isToday ? ' (Today)' : ''}</p>
        </div>
        <div className="day-nav">
          <button onClick={() => setDayIndex(dayIndex - 1)} disabled={dayIndex === 0}>← Prev</button>
          <button onClick={() => setDayIndex(dayIndex + 1)} disabled={dayIndex === 6}>Next →</button>
        </div>
      </div>

      {/* Whole week at a glance */}
      <div className="week-strip">
        {dates.map((d, i) => (
          <button
            key={i}
            className={`week-day${i === dayIndex ? ' selected' : ''}${isSameDay(d, today) ? ' today' : ''}`}
            onClick={() => setDayIndex(i)}
          >
            {DAY_SHORT[i]}
          </button>
        ))}
      </div>

      <div className="section-actions">
        <div className="summary-title" style={{ marginBottom: 0 }}>
          {tasksToday.length} {tasksToday.length === 1 ? 'task' : 'tasks'} today
        </div>
        <button className="btn-add" onClick={openNewTask}>+ Add Task</button>
      </div>

      {/* Tasks */}
      <div className="tasks-container">
        {loading && <div className="empty-state"><p>Loading…</p></div>}

        {!loading && tasksToday.length === 0 && (
          <div className="empty-state">
            <p>No tasks scheduled for {DAY_NAMES[dayIndex]}.</p>
            <p style={{ fontSize: '13px' }}>Tap “+ Add Task” to create one.</p>
          </div>
        )}

        {tasksToday.map(task => {
          const assigned = data.members.filter(m => task.members.includes(m.id));

          return (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <div className="task-title-wrap">
                  <h3>{task.name}</h3>
                  <div className="task-meta">{getFrequency(task.frequency).label} · {getFrequency(task.frequency).sub}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="task-points">{task.points} pts</span>
                  <button className="btn-edit" onClick={() => openEditTask(task)} aria-label="Edit task">✎</button>
                </div>
              </div>

              <div className="task-checklist">
                {assigned.length === 0 && (
                  <div className="task-meta">No one assigned yet — tap ✎ to assign.</div>
                )}

                {assigned.map(member => {
                  const status = getCompletion(dk, task.id, member.id);

                  return (
                    <div
                      key={member.id}
                      className={`check-row status-${status}`}
                      onClick={() => handleCheckClick(task, member)}
                    >
                      <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AvatarDisplay avatarId={member.avatar} size={28} />
                      </div>
                      <span className="member-name">{member.name}</span>
                      <div className={`check-icon ${status}`}>{getCheckIcon(status)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {data.members.length > 0 && (
        <div className="day-summary">
          <div className="summary-title">Progress Summary</div>
          <div className="summary-grid">
            {data.members.map(member => {
              const assignedTasks = tasksToday.filter(t => t.members.includes(member.id));
              const doneTasks = assignedTasks.filter(t =>
                ['completed', 'pending', 'approved'].includes(getCompletion(dk, t.id, member.id))
              ).length;
              const percentage = assignedTasks.length > 0
                ? Math.round((doneTasks / assignedTasks.length) * 100)
                : 0;

              return (
                <div key={member.id} className="summary-item">
                  <div className="summary-kid-header">
                    <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center' }}>
                      <AvatarDisplay avatarId={member.avatar} size={20} />
                    </div>
                    <div className="summary-name">{member.name}</div>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
                  </div>
                  <div className="summary-status">{doneTasks}/{assignedTasks.length} today</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit task */}
      {showTaskModal && (
        <AddTaskModal
          members={data.members}
          task={editingTask}
          onSave={handleSaveTask}
          onDelete={editingTask ? handleDeleteTask : null}
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {/* Upload evidence */}
      {showUploadModal && (
        <div className="modal active" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📸 Submit Evidence</div>
            <div className="modal-body">Take a photo or video proving you finished “{selectedCell.taskName}”.</div>

            <div className="upload-options">
              <button
                className="upload-btn"
                onClick={() => setUploadedFiles([...uploadedFiles, { type: 'photo', name: `photo_${uploadedFiles.length + 1}.jpg` }])}
                disabled={uploadedFiles.length >= 5}
              >
                <span className="upload-icon">📷</span>
                Take Photo
              </button>
              <button
                className="upload-btn"
                onClick={() => setUploadedFiles([{ type: 'video', name: 'video_1.mp4 (8 sec)' }])}
              >
                <span className="upload-icon">🎥</span>
                Record Video
              </button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="upload-preview">
                {uploadedFiles.map((f, i) => (
                  <div key={i} style={{ marginBottom: '8px', fontSize: '12px' }}>
                    {f.type === 'photo' ? '📷' : '🎥'} {f.name}
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={undoCompletion}>Undo ✓</button>
              <button className="btn-confirm" onClick={submitEvidence} disabled={uploadedFiles.length === 0}
                style={{ opacity: uploadedFiles.length === 0 ? 0.5 : 1 }}>
                Submit Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parent review */}
      {showReviewModal && (
        <div className="modal active" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🔍 Review Evidence</div>
            <div className="carousel-placeholder">📸 Photo/Video Preview</div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={rejectEvidence}>Not OK</button>
              <button className="btn-confirm" onClick={approveEvidence}>OK ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
