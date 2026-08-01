import React, { useState } from 'react';
import AvatarPicker from './AvatarPicker';

export default function AddMemberModal({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar-1');

  const handleAdd = () => {
    if (name.trim() && name.length <= 3) {
      onAdd({
        name: name.trim(),
        avatar: selectedAvatar
      });
      setName('');
      setSelectedAvatar('avatar-1');
    }
  };

  return (
    <div className="modal active" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-title">👤 Add Family Member</div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            color: '#86868b',
            marginBottom: '8px',
            letterSpacing: '0.5px'
          }}>
            Name (max 3 characters)
          </label>
          <input
            type="text"
            maxLength="3"
            placeholder="e.g., Alx"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="settings-input"
            style={{ width: '100%', marginBottom: '8px' }}
            autoFocus
          />
          <div style={{
            fontSize: '11px',
            color: '#86868b'
          }}>
            {name.length}/3 characters
          </div>
        </div>

        <AvatarPicker 
          selectedAvatar={selectedAvatar}
          onSelect={setSelectedAvatar}
        />

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button 
            className="btn-confirm" 
            onClick={handleAdd}
            disabled={!name.trim() || name.length > 3}
            style={{ opacity: (!name.trim() || name.length > 3) ? 0.5 : 1 }}
          >
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}
