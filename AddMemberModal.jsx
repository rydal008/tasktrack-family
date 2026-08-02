import React, { useState } from 'react';
import AvatarPicker from './AvatarPicker';

const MAX_NAME = 3;

export default function AddMemberModal({ member, onSave, onDelete, onCancel }) {
  const [name, setName] = useState(member ? member.name : '');
  const [avatar, setAvatar] = useState(member ? member.avatar : 'avatar-1');

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && trimmed.length <= MAX_NAME;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ name: trimmed, avatar });
  };

  return (
    <div className="modal active" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          {member ? '✏️ Edit Family Member' : '👤 Add Family Member'}
        </div>

        {member && (
          <div className="modal-body">
            Renaming keeps every point they have already earned.
          </div>
        )}

        <div className="input-group">
          <label className="input-label">Name (max {MAX_NAME} characters)</label>
          <input
            type="text"
            maxLength={MAX_NAME}
            placeholder="e.g., Alx"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="settings-input"
            style={{ width: '100%' }}
            autoFocus
          />
          <div className="task-meta" style={{ marginTop: '6px' }}>
            {trimmed.length}/{MAX_NAME} characters
          </div>
        </div>

        <AvatarPicker selectedAvatar={avatar} onSelect={setAvatar} />

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="btn-confirm"
            onClick={handleSave}
            disabled={!canSave}
            style={{ opacity: canSave ? 1 : 0.5 }}
          >
            {member ? 'Save' : 'Add Member'}
          </button>
        </div>

        {onDelete && (
          <button type="button" className="btn-danger" onClick={onDelete}>
            Remove this member
          </button>
        )}
      </div>
    </div>
  );
}
