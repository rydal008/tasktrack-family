import React, { useEffect, useRef, useState } from 'react';
import { AvatarDisplay } from './Avatars';
import AddTaskModal from './AddTaskModal';
import {
  useStore, DAY_NAMES, DAY_SHORT, describeDays, timesPerWeek,
  startOfWeek, weekDates, dayIndexOf, dateKey, formatDate, isSameDay
} from './store';
import {
  uploadEvidence, loadEvidence, deleteEvidence,
  readVideoDuration, isVideoTooLong, MAX_PHOTOS, MAX_VIDEO_SECONDS
} from './evidence';

export default function Tracker({ onRequirePIN }) {
  const { data, loading, addTask, updateTask, removeTask, setCompletion, getCompletion } = useStore();

  const today = new Date();
  const weekStart = startOfWeek(today);
  const dates = weekDates(weekStart);

  const [dayIndex, setDayIndex] = useState(dayIndexOf(today));
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [picked, setPicked] = useState([]);      // [{ file, kind, preview }]
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const photoInput = useRef(null);
  const videoInput = useRef(null);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewState, setReviewState] = useState('loading'); // loading | ready | error
  const [busy, setBusy] = useState(false);

  const date = dates[dayIndex];
  const dk = dateKey(date);
  const isToday = isSameDay(date, today);

  const tasksToday = data.tasks.filter(task => task.days.includes(dayIndex));

  // Local preview URLs have to be released by hand, but only once we are
  // actually finished with them — never on every change to `picked`.
  const releasePreviews = (items) => items.forEach(i => URL.revokeObjectURL(i.preview));
  const pickedRef = useRef(picked);
  pickedRef.current = picked;
  useEffect(() => () => releasePreviews(pickedRef.current), []);

  const getCheckIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'pending': return '⏳';
      case 'approved': return '✓✓';
      default: return '✗';
    }
  };

  const closeUpload = () => {
    releasePreviews(picked);
    setPicked([]);
    setUploadError('');
    setShowUploadModal(false);
  };

  const handleCheckClick = (task, member) => {
    const status = getCompletion(dk, task.id, member.id);
    const cell = { dk, taskId: task.id, memberId: member.id, taskName: task.name, memberName: member.name };
    setSelectedCell(cell);

    // Chores set to "just tick it off" have no evidence and no review, so the
    // check simply toggles and the points count immediately.
    if (task.requiresEvidence === false) {
      setCompletion(dk, task.id, member.id, status === 'approved' ? 'incomplete' : 'approved');
      return;
    }

    if (status === 'incomplete') {
      setCompletion(dk, task.id, member.id, 'completed');
    } else if (status === 'completed') {
      setPicked([]);
      setUploadError('');
      setShowUploadModal(true);
    } else if (status === 'pending') {
      setReviewItems([]);
      setReviewIndex(0);
      setReviewState('loading');
      setShowReviewModal(true);
      loadEvidence(cell.dk, cell.taskId, cell.memberId)
        .then(items => {
          setReviewItems(items);
          setReviewState(items.length > 0 ? 'ready' : 'error');
        })
        .catch(err => {
          console.error(err);
          setReviewState('error');
        });
    } else {
      alert('✓✓ Already approved by a parent.');
    }
  };

  const onPhotoPick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploadError('');

    const photos = picked.filter(i => i.kind === 'photo');
    const hadVideo = picked.some(i => i.kind === 'video');
    if (hadVideo) releasePreviews(picked.filter(i => i.kind === 'video'));

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setUploadError(`That's the limit — ${MAX_PHOTOS} photos.`);
      return;
    }

    const added = files.slice(0, room).map(file => ({
      file,
      kind: 'photo',
      preview: URL.createObjectURL(file)
    }));

    setPicked([...photos, ...added]);
    if (files.length > room) {
      setUploadError(`Only the first ${room} were kept — ${MAX_PHOTOS} photos max.`);
    }
  };

  const onVideoPick = async (e) => {
    const file = (e.target.files || [])[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');

    try {
      const seconds = await readVideoDuration(file);
      if (isVideoTooLong(seconds)) {
        setUploadError(`That clip is ${Math.round(seconds)} seconds. Keep it under ${MAX_VIDEO_SECONDS}.`);
        return;
      }
    } catch (err) {
      console.error(err);
      setUploadError('That video could not be read. Try a photo instead.');
      return;
    }

    // One video replaces everything else.
    releasePreviews(picked);
    setPicked([{ file, kind: 'video', preview: URL.createObjectURL(file) }]);
  };

  const removePicked = (index) => {
    const item = picked[index];
    URL.revokeObjectURL(item.preview);
    setPicked(picked.filter((_, i) => i !== index));
  };

  const submitEvidence = async () => {
    if (picked.length === 0 || uploading) return;
    setUploading(true);
    setUploadError('');
    try {
      await uploadEvidence(
        selectedCell.dk, selectedCell.taskId, selectedCell.memberId,
        picked.map(({ file, kind }) => ({ file, kind }))
      );
      setCompletion(selectedCell.dk, selectedCell.taskId, selectedCell.memberId, 'pending');
      closeUpload();
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const undoCompletion = () => {
    setCompletion(selectedCell.dk, selectedCell.taskId, selectedCell.memberId, 'incomplete');
    closeUpload();
  };

  const finishReview = async (approved) => {
    setBusy(true);
    try {
      await deleteEvidence(selectedCell.dk, selectedCell.taskId, selectedCell.memberId);
      setCompletion(
        selectedCell.dk, selectedCell.taskId, selectedCell.memberId,
        approved ? 'approved' : 'completed'
      );
      setShowReviewModal(false);
    } catch (err) {
      console.error(err);
      alert('Could not finish the review.\n\n' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const approveEvidence = () => {
    onRequirePIN(() => finishReview(true));
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

  const photoCount = picked.filter(i => i.kind === 'photo').length;
  const hasVideo = picked.some(i => i.kind === 'video');

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
                  <div className="task-meta">
                    {describeDays(task.days)} · {timesPerWeek(task.days)}
                    {task.requiresEvidence === false ? ' · no photo' : ''}
                  </div>
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
        <div className="modal active" onClick={() => !uploading && closeUpload()}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📸 Submit Evidence</div>
            <div className="modal-body">
              Show that “{selectedCell.taskName}” is done — up to {MAX_PHOTOS} photos,
              or one video of {MAX_VIDEO_SECONDS} seconds.
            </div>

            <input
              ref={photoInput} type="file" accept="image/*" capture="environment"
              multiple hidden onChange={onPhotoPick}
            />
            <input
              ref={videoInput} type="file" accept="video/*" capture="environment"
              hidden onChange={onVideoPick}
            />

            <div className="upload-options">
              <button
                className="upload-btn"
                onClick={() => photoInput.current.click()}
                disabled={uploading || photoCount >= MAX_PHOTOS}
              >
                <span className="upload-icon">📷</span>
                Take Photo
              </button>
              <button
                className="upload-btn"
                onClick={() => videoInput.current.click()}
                disabled={uploading}
              >
                <span className="upload-icon">🎥</span>
                Record Video
              </button>
            </div>

            {picked.length > 0 && (
              <div className="evidence-grid">
                {picked.map((item, i) => (
                  <div key={i} className="evidence-thumb">
                    {item.kind === 'photo'
                      ? <img src={item.preview} alt={`Photo ${i + 1}`} />
                      : <video src={item.preview} muted playsInline />}
                    <button
                      className="thumb-remove"
                      onClick={() => removePicked(i)}
                      disabled={uploading}
                      aria-label="Remove"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {picked.length > 0 && (
              <div className="task-meta" style={{ marginTop: '8px' }}>
                {hasVideo ? '1 video ready' : `${photoCount} of ${MAX_PHOTOS} photos`}
              </div>
            )}

            {uploadError && <div className="error-message">{uploadError}</div>}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={undoCompletion} disabled={uploading}>Undo ✓</button>
              <button
                className="btn-confirm"
                onClick={submitEvidence}
                disabled={picked.length === 0 || uploading}
                style={{ opacity: picked.length === 0 || uploading ? 0.5 : 1 }}
              >
                {uploading ? 'Sending…' : 'Submit Evidence'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parent review */}
      {showReviewModal && (
        <div className="modal active" onClick={() => !busy && setShowReviewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🔍 Review Evidence</div>

            {reviewState === 'loading' && (
              <div className="carousel-placeholder">Loading…</div>
            )}

            {reviewState === 'error' && (
              <div className="carousel-placeholder">
                No evidence found for this one.
              </div>
            )}

            {reviewState === 'ready' && (
              <>
                <div className="evidence-stage">
                  {reviewItems[reviewIndex].kind === 'photo'
                    ? <img src={reviewItems[reviewIndex].url} alt="Evidence" />
                    : <video src={reviewItems[reviewIndex].url} controls playsInline />}
                </div>

                {reviewItems.length > 1 && (
                  <div className="carousel-nav">
                    <button
                      onClick={() => setReviewIndex(reviewIndex - 1)}
                      disabled={reviewIndex === 0}
                    >← Prev</button>
                    <span className="task-meta">{reviewIndex + 1} of {reviewItems.length}</span>
                    <button
                      onClick={() => setReviewIndex(reviewIndex + 1)}
                      disabled={reviewIndex === reviewItems.length - 1}
                    >Next →</button>
                  </div>
                )}
              </>
            )}

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => finishReview(false)} disabled={busy}>
                Not OK
              </button>
              <button className="btn-confirm" onClick={approveEvidence} disabled={busy || reviewState !== 'ready'}>
                {busy ? 'Working…' : 'OK ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
