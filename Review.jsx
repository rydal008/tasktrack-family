import React, { useMemo, useState } from 'react';
import { AvatarDisplay } from './Avatars';
import ReviewModal from './ReviewModal';
import { useStore, DAY_NAMES, dayIndexOf } from './store';

// Everything waiting on a parent, in one list, so nobody has to go hunting
// through days and chores to find the hourglasses.
export function pendingQueue(data) {
  const byId = (list) => Object.fromEntries(list.map(item => [item.id, item]));
  const members = byId(data.members);
  const tasks = byId(data.tasks);

  return Object.entries(data.completions)
    .filter(([, status]) => status === 'pending')
    .map(([key]) => {
      const [dk, taskId, memberId] = key.split('|');
      const task = tasks[taskId];
      const member = members[memberId];
      if (!task || !member) return null;

      const date = new Date(`${dk}T00:00:00`);
      return {
        key,
        dk,
        taskId,
        memberId,
        taskName: task.name,
        memberName: member.name,
        avatar: member.avatar,
        dayLabel: DAY_NAMES[dayIndexOf(date)]
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.dk === b.dk
      ? a.memberName.localeCompare(b.memberName) || a.taskName.localeCompare(b.taskName)
      : a.dk.localeCompare(b.dk)));
}

export default function Review({ onRequirePIN }) {
  const { data, loading } = useStore();
  const [active, setActive] = useState(null);

  const queue = useMemo(() => pendingQueue(data), [data]);

  // Step straight on to the next one, so a run of approvals is one tap each.
  const handleFinished = () => {
    const remaining = queue.filter(item => item.key !== active.key);
    setActive(remaining.length > 0 ? remaining[0] : null);
  };

  return (
    <div className="page">
      <div className="section-actions">
        <div className="summary-title" style={{ marginBottom: 0 }}>
          {queue.length === 0 ? 'Nothing waiting' : `${queue.length} waiting for you`}
        </div>
        {queue.length > 1 && (
          <button className="btn-add" onClick={() => setActive(queue[0])}>Review all</button>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading…</p></div>
      ) : queue.length === 0 ? (
        <div className="empty-state">
          <p>🎉 All caught up.</p>
          <p style={{ fontSize: '13px' }}>Evidence the kids send will show up here.</p>
        </div>
      ) : (
        <div className="tasks-container">
          {queue.map(item => (
            <div key={item.key} className="queue-row" onClick={() => setActive(item)}>
              <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center' }}>
                <AvatarDisplay avatarId={item.avatar} size={28} />
              </div>
              <div className="queue-text">
                <div className="queue-title">{item.memberName} · {item.taskName}</div>
                <div className="task-meta">{item.dayLabel}</div>
              </div>
              <div className="check-icon pending">⏳</div>
            </div>
          ))}
        </div>
      )}

      {active && (
        <ReviewModal
          cell={active}
          onRequirePIN={onRequirePIN}
          onFinished={handleFinished}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
