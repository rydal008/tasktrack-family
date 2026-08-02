import React, { useEffect, useMemo, useState } from 'react';
import { AvatarDisplay } from './Avatars';
import AddMemberModal from './AddMemberModal';
import {
  useStore, startOfWeek, weekDates, dayIndexOf, formatDate, scoreForWeek
} from './store';

export default function Leaderboard() {
  const { data, loading, addMember, updateMember, removeMember, loadWeek } = useStore();

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // 0 is this week, -1 last week, and so on.
  const [weekOffset, setWeekOffset] = useState(0);
  const [pastCompletions, setPastCompletions] = useState(null);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [weekError, setWeekError] = useState('');

  const today = new Date();
  const isCurrentWeek = weekOffset === 0;

  const weekStart = useMemo(() => {
    const start = startOfWeek(today);
    start.setDate(start.getDate() + weekOffset * 7);
    return start;
  }, [weekOffset]);

  const dates = weekDates(weekStart);
  const daysLeft = 7 - dayIndexOf(today);

  useEffect(() => {
    if (isCurrentWeek) {
      setPastCompletions(null);
      setWeekError('');
      return undefined;
    }

    let cancelled = false;
    setLoadingWeek(true);
    setWeekError('');

    loadWeek(weekStart)
      .then(found => { if (!cancelled) setPastCompletions(found); })
      .catch(err => {
        console.error(err);
        if (!cancelled) setWeekError('Could not load that week.');
      })
      .finally(() => { if (!cancelled) setLoadingWeek(false); });

    return () => { cancelled = true; };
  }, [weekOffset]);

  // Past weeks are scored against the completions of that week, but against
  // today's chore list — there is no history of what the chores used to be.
  const scoringData = isCurrentWeek
    ? data
    : { ...data, completions: pastCompletions || {} };

  const scores = data.members
    .map(member => {
      const { earned, possible } = scoreForWeek(scoringData, member.id, weekStart);
      return { ...member, score: earned, maxScore: possible };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '✨';
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#9370DB';
    }
  };

  const getHealthBarColor = (percentage) => {
    if (percentage >= 80) return 'linear-gradient(90deg, #0071e3, #34c759)';
    if (percentage >= 60) return 'linear-gradient(90deg, #0071e3, #FF9500)';
    return 'linear-gradient(90deg, #d70015, #FF9500)';
  };

  const weekLabel = () => {
    if (weekOffset === 0) return 'This week · Mon–Sun';
    if (weekOffset === -1) return 'Last week';
    return `${Math.abs(weekOffset)} weeks ago`;
  };

  const openAddMember = () => {
    setEditingMember(null);
    setShowMemberModal(true);
  };

  const openEditMember = (member) => {
    setEditingMember(member);
    setShowMemberModal(true);
  };

  const handleSaveMember = (fields) => {
    if (editingMember) {
      updateMember(editingMember.id, fields);
    } else {
      addMember(fields);
    }
    setShowMemberModal(false);
  };

  const handleRemoveMember = () => {
    const message =
      `Remove ${editingMember.name}? Their points and history go too.\n\n` +
      'To only fix a spelling, press Cancel and edit the name instead.';
    if (window.confirm(message)) {
      removeMember(editingMember.id);
      setShowMemberModal(false);
    }
  };

  const topScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;
  const busy = loading || loadingWeek;

  return (
    <div className="page">
      {/* Which week */}
      <div className="cycle-info">
        <button
          className="week-arrow"
          onClick={() => setWeekOffset(weekOffset - 1)}
          aria-label="Previous week"
        >◀</button>

        <div className="cycle-left" style={{ flex: 1, textAlign: 'center' }}>
          <div className="cycle-label">{weekLabel()}</div>
          <div className="cycle-countdown">
            {formatDate(dates[0])} – {formatDate(dates[6])}
          </div>
          <div className="task-meta">
            {isCurrentWeek
              ? (daysLeft === 1 ? 'Last day of the cycle' : `Resets in ${daysLeft} days`)
              : 'Finished'}
          </div>
        </div>

        <button
          className="week-arrow"
          onClick={() => setWeekOffset(weekOffset + 1)}
          disabled={isCurrentWeek}
          aria-label="Next week"
        >▶</button>
      </div>

      {isCurrentWeek && (
        <div className="section-actions">
          <div className="summary-title" style={{ marginBottom: 0 }}>Rankings</div>
          <button className="btn-add" onClick={openAddMember}>+ Add Member</button>
        </div>
      )}

      {weekError && <div className="error-message">{weekError}</div>}

      {/* Rankings */}
      {busy ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : scores.length === 0 ? (
        <div className="empty-state">
          <p>No family members yet.</p>
          <p style={{ fontSize: '13px' }}>Tap “+ Add Member” to get started.</p>
        </div>
      ) : (
        <div className="leaderboard">
          {scores.map((member) => {
            const percentage = member.maxScore > 0 ? (member.score / member.maxScore) * 100 : 0;

            return (
              <div key={member.id} className="leaderboard-item">
                <div className="leaderboard-header">
                  <div className="rank-badge" style={{ borderColor: getRankColor(member.rank) }}>
                    {getRankEmoji(member.rank)}
                  </div>
                  <div className="member-info">
                    <div className="member-display">
                      <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center' }}>
                        <AvatarDisplay avatarId={member.avatar} size={24} />
                      </div>
                      <span className="member-name">{member.name}</span>
                    </div>
                    <div className="health-bar-container">
                      <div
                        className="health-bar"
                        style={{ width: `${percentage}%`, background: getHealthBarColor(percentage) }}
                      ></div>
                    </div>
                  </div>
                  <div className="score-display">
                    <div className="score-value">{member.score.toFixed(1)}</div>
                    <div className="score-max">/ {member.maxScore.toFixed(1)}</div>
                  </div>
                  {isCurrentWeek && (
                    <button className="btn-edit" onClick={() => openEditMember(member)} aria-label="Edit member">✎</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isCurrentWeek && !busy && scores.length > 0 && (
        <div className="task-meta" style={{ marginBottom: '16px' }}>
          Totals are worked out from today’s chore list, so they shift if you
          change who does what.
        </div>
      )}

      {/* Stats */}
      <div className="stats-footer">
        <div className="stat-item">
          <div className="stat-label">Total Members</div>
          <div className="stat-value">{scores.length}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Top Score</div>
          <div className="stat-value">{topScore.toFixed(1)}</div>
        </div>
      </div>

      {/* Add / Edit Member */}
      {showMemberModal && (
        <AddMemberModal
          member={editingMember}
          onSave={handleSaveMember}
          onDelete={editingMember ? handleRemoveMember : null}
          onCancel={() => setShowMemberModal(false)}
        />
      )}
    </div>
  );
}
