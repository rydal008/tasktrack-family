import React, { useState, useEffect } from 'react';
import { AvatarDisplay } from './Avatars';
import AddMemberModal from './AddMemberModal';

const DEMO_MODE = true;

export default function Leaderboard({ onRequirePIN }) {
  const [scores, setScores] = useState([]);
  const [cycleType, setCycleType] = useState(7);
  const [cycleEndDate, setCycleEndDate] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) {
      // Demo scores with avatars
      setScores([
        { id: '3', name: 'Sam', avatar: 'avatar-5', score: 13.5, rank: 1, maxScore: 15 },
        { id: '1', name: 'Alx', avatar: 'avatar-1', score: 12.0, rank: 2, maxScore: 15 },
        { id: '4', name: 'Cas', avatar: 'avatar-6', score: 10.5, rank: 3, maxScore: 5 },
        { id: '2', name: 'Jor', avatar: 'avatar-2', score: 9.0, rank: 4, maxScore: 15 }
      ]);
      
      // Calculate cycle end date
      const today = new Date(2024, 6, 15); // Tuesday, July 15, 2024
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 6);
      setCycleEndDate(endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
  }, []);

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
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return '#9370DB'; // Purple
    }
  };

  const getHealthBarColor = (percentage) => {
    if (percentage >= 80) return 'linear-gradient(90deg, #0071e3, #34c759)';
    if (percentage >= 60) return 'linear-gradient(90deg, #0071e3, #FF9500)';
    return 'linear-gradient(90deg, #d70015, #FF9500)';
  };

  const daysUntilReset = () => {
    const today = new Date(2024, 6, 15);
    const endDate = new Date(2024, 6, 21);
    const diff = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="page">
      {/* Cycle Info */}
      <div className="cycle-info">
        <div className="cycle-left">
          <div className="cycle-label">7-Day Cycle</div>
          <div className="cycle-countdown">
            Resets in {daysUntilReset()} days (Jul 21)
          </div>
        </div>
        <button className="btn-add-member" onClick={() => setShowAddMember(true)}>+ Add Member</button>
      </div>

      {/* Leaderboard */}
      <div className="leaderboard">
        {scores.map((member) => {
          const percentage = (member.score / member.maxScore) * 100;
          const healthColor = getHealthBarColor(percentage);
          
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
                      style={{ 
                        width: `${percentage}%`,
                        background: healthColor
                      }}
                    ></div>
                  </div>
                </div>
                <div className="score-display">
                  <div className="score-value">{member.score.toFixed(1)}</div>
                  <div className="score-max">/ {member.maxScore}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Footer */}
      <div className="stats-footer">
        <div className="stat-item">
          <div className="stat-label">Total Members</div>
          <div className="stat-value">{scores.length}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Top Score</div>
          <div className="stat-value">{Math.max(...scores.map(s => s.score)).toFixed(1)}</div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <AddMemberModal
          onAdd={(member) => {
            setScores([...scores, {
              id: Date.now().toString(),
              name: member.name,
              avatar: member.avatar,
              score: 0,
              rank: scores.length + 1,
              maxScore: 15
            }]);
            setShowAddMember(false);
          }}
          onCancel={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
}
