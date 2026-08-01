import React, { useState, useEffect } from 'react';
import { supabase, getCycleStartDate, getCycleEndDate } from './supabaseClient';
import { AvatarDisplay } from './Avatars';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEMO_MODE = true; // Set to false when connected to real Supabase

export default function Tracker({ onRequirePIN }) {
  const [currentDayIndex, setCurrentDayIndex] = useState(1); // Tuesday (today)
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [completions, setCompletions] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [demoData, setDemoData] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      // Demo data
      setMembers([
        { id: '1', name: 'Alx', avatar: 'avatar-1' },
        { id: '2', name: 'Jor', avatar: 'avatar-2' },
        { id: '3', name: 'Sam', avatar: 'avatar-5' },
        { id: '4', name: 'Cas', avatar: 'avatar-6' }
      ]);
      setTasks([
        { id: '1', name: 'Morning Brush', points: 1, members: ['1', '2', '3'] },
        { id: '2', name: 'Evening Brush', points: 1, members: ['1', '2', '3'] },
        { id: '3', name: 'Clean Washroom', points: 2, members: ['4'] },
        { id: '4', name: 'Homework', points: 2, members: ['1', '2', '3', '4'] }
      ]);
      // Demo completion states: completed (✓), pending (⏳), approved (✓✓)
      setCompletions({
        '1-1': 'completed', // Morning Brush - Alx - completed
        '1-2': 'pending',   // Morning Brush - Jor - pending
        '1-3': 'approved',  // Morning Brush - Sam - approved
        '2-1': 'incomplete',// Evening Brush - Alx - incomplete
        '2-2': 'completed', // Evening Brush - Jor - completed
        '2-3': 'incomplete',// Evening Brush - Sam - incomplete
        '3-4': 'approved',  // Clean Washroom - Cas - approved
        '4-1': 'approved',  // Homework - Alx - approved
        '4-2': 'completed', // Homework - Jor - completed
        '4-3': 'completed', // Homework - Sam - completed
        '4-4': 'approved'   // Homework - Cas - approved
      });
    }
  }, []);

  const getDateForDay = (dayIndex) => {
    const date = new Date(2024, 6, 15); // July 15, 2024 (start date)
    date.setDate(date.getDate() + dayIndex);
    return date;
  };

  const dayName = DAYS[currentDayIndex];
  const date = getDateForDay(currentDayIndex);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const isToday = currentDayIndex === 1;

  const canAdvanceDay = () => {
    // Can advance if today's tasks are complete or not today
    if (!isToday) return true;
    return tasks.every(task => 
      task.members.every(memberId => 
        ['approved', 'completed'].includes(completions[`${task.id}-${memberId}`])
      )
    );
  };

  const previousDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const nextDay = () => {
    if (!canAdvanceDay() && isToday) {
      alert('❌ Please complete all tasks for today before moving to the next day.');
      return;
    }
    if (currentDayIndex < 6) {
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  const handleCheckClick = (taskId, memberId, currentState) => {
    const cellKey = `${taskId}-${memberId}`;
    setSelectedCell({ taskId, memberId, key: cellKey, currentState });

    if (currentState === 'completed') {
      // Show upload modal
      setUploadedFiles([]);
      setCurrentFileIndex(0);
      setShowUploadModal(true);
    } else if (currentState === 'pending') {
      // Show review modal for parent
      setShowReviewModal(true);
    } else if (currentState === 'approved') {
      alert('✓✓ This task was already approved by parent!');
    } else {
      // Mark as incomplete (no upload needed)
      setCompletions(prev => ({
        ...prev,
        [cellKey]: 'incomplete'
      }));
      alert('✓ Marked as incomplete');
    }
  };

  const submitEvidence = () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one photo or video');
      return;
    }
    
    const cellKey = selectedCell.key;
    setCompletions(prev => ({
      ...prev,
      [cellKey]: 'pending'
    }));
    setShowUploadModal(false);
    alert('✓ Evidence submitted! Waiting for parent review...');
  };

  const approveEvidence = () => {
    // Show PIN modal
    onRequirePIN((pin) => {
      // In demo, accept any 4+ digit PIN
      if (pin.length >= 4) {
        const cellKey = selectedCell.key;
        setCompletions(prev => ({
          ...prev,
          [cellKey]: 'approved'
        }));
        setShowReviewModal(false);
        alert('✓ Task approved! Evidence deleted. Check shows ✓✓');
      } else {
        alert('❌ Invalid PIN');
      }
    });
  };

  const getTasksForDay = () => {
    return tasks;
  };

  const getCompletionStatus = (taskId, memberId) => {
    return completions[`${taskId}-${memberId}`] || 'incomplete';
  };

  const getCheckIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'pending': return '⏳';
      case 'approved': return '✓✓';
      default: return '✗';
    }
  };

  return (
    <div className="page">
      {/* Day Navigation */}
      <div className="day-header">
        <div>
          <h2>{dayName}</h2>
          <p className="day-meta">{formattedDate} {isToday ? '(Today)' : ''}</p>
        </div>
        <div className="day-nav">
          <button onClick={previousDay} disabled={currentDayIndex === 0}>← Prev</button>
          <button onClick={nextDay} disabled={currentDayIndex === 6}>Next →</button>
        </div>
      </div>

      {/* Tasks */}
      <div className="tasks-container">
        {getTasksForDay().map(task => (
          <div key={task.id} className="task-card">
            <div className="task-header">
              <h3>{task.name}</h3>
              <span className="task-points">{task.points} pts</span>
            </div>

            <div className="task-checklist">
              {members
                .filter(m => task.members.includes(m.id))
                .map(member => {
                  const status = getCompletionStatus(task.id, member.id);
                  const icon = getCheckIcon(status);
                  
                  return (
                    <div
                      key={member.id}
                      className={`check-row status-${status}`}
                      onClick={() => handleCheckClick(task.id, member.id, status)}
                    >
                      <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AvatarDisplay avatarId={member.avatar} size={28} />
                      </div>
                      <span className="member-name">{member.name}</span>
                      <div className={`check-icon ${status}`}>{icon}</div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="day-summary">
        <div className="summary-title">Progress Summary</div>
        <div className="summary-grid">
          {members.map(member => {
            const assignedTasks = tasks.filter(t => t.members.includes(member.id));
            const completedTasks = assignedTasks.filter(t => 
              ['completed', 'approved'].includes(getCompletionStatus(t.id, member.id))
            ).length;
            const percentage = assignedTasks.length > 0 
              ? Math.round((completedTasks / assignedTasks.length) * 100)
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
                <div className="summary-status">{completedTasks}/{assignedTasks.length} today</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal active" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📸 Submit Evidence</div>
            <div className="modal-body">Take a photo or video proving you completed the task!</div>

            <div className="upload-options">
              <button 
                className="upload-btn"
                onClick={() => {
                  setUploadedFiles([...uploadedFiles, { type: 'photo', name: `photo_${uploadedFiles.length + 1}.jpg` }]);
                }}
              >
                <span className="upload-icon">📷</span>
                Take Photo
              </button>
              <button 
                className="upload-btn"
                onClick={() => {
                  setUploadedFiles([...uploadedFiles, { type: 'video', name: `video_${uploadedFiles.length + 1}.mp4 (8 sec)` }]);
                }}
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
              <button className="btn-cancel" onClick={() => setShowUploadModal(false)}>Skip</button>
              {uploadedFiles.length > 0 && (
                <button className="btn-confirm" onClick={submitEvidence}>Submit Evidence</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal active" onClick={() => setShowReviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🔍 Review Evidence</div>
            <div className="carousel-placeholder">📸 Photo/Video Preview</div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowReviewModal(false)}>Not OK</button>
              <button className="btn-confirm" onClick={approveEvidence}>OK ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
