import React, { useState } from 'react';
import { AvatarDisplay } from './Avatars';
import AddMemberModal from './AddMemberModal';
import {
  useStore, startOfWeek, weekDates, dayIndexOf, formatDate, scoreForWeek
} from './store';

export default function Leaderboard() {
  const { data, addMember, removeMember } = useStore();
  const [showAddMember, setShowAddMember] = useState(false);

  const today = new Date();
  const weekStart = startOfWeek(today);
  const dates = weekDates(weekStart);
  const daysLeft = 7 - dayIndexOf(today);

  const scores = data.members
    .map(member => {
      const { earned, possible } = scoreForWeek(data, member.id, weekStart);
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

  const handleRemove = (member) => {
    if (window.confirm(`Remove ${member.name} from the family list?`)) {
      removeMember(member.id);
    }
  };

  const topScore = scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0;

  return (
    <div className="page">
      {/* Cycle info — one full week, Monday to Sunday */}
      <div className="cycle-info">
        <div className="cycle-left">
          <div className="cycle-label">This Week · Mon–Sun</div>
          <div className="cycle-countdown">
            {formatDate(dates[0])} – {formatDate(dates[6])}
          </div>
          <div className="task-meta">
            {daysLeft === 1 ? 'Last day of the cycle' : `Resets in ${daysLeft} days`}
          </div>
        </div>
        <button className="btn-add-member" onClick={() => setShowAddMember(true)}>+ Add Member</button>
      </div>

      {/* Leaderboard */}
      {scores.length === 0 ? (
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
                  <button className="btn-remove" onClick={() => handleRemove(member)} aria-label="Remove member">✕</button>
                </div>
              </div>
            );
          })}
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

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          onAdd={(member) => {
            addMember(member);
            setShowAddMember(false);
          }}
          onCancel={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
}
