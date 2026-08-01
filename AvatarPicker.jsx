import React from 'react';
import { AVATAR_OPTIONS, AvatarDisplay } from './Avatars';

export default function AvatarPicker({ selectedAvatar, onSelect }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        color: '#86868b',
        marginBottom: '12px',
        letterSpacing: '0.5px'
      }}>
        Choose Avatar
      </label>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px'
      }}>
        {AVATAR_OPTIONS.map(option => (
          <div
            key={option.id}
            onClick={() => onSelect(option.id)}
            style={{
              cursor: 'pointer',
              textAlign: 'center',
              padding: '12px',
              borderRadius: '8px',
              border: selectedAvatar === option.id 
                ? '2px solid #0071e3'
                : '2px solid #e5e5e7',
              backgroundColor: selectedAvatar === option.id 
                ? '#f0f6ff'
                : 'white',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (selectedAvatar !== option.id) {
                e.currentTarget.style.borderColor = '#b3b3b7';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedAvatar !== option.id) {
                e.currentTarget.style.borderColor = '#e5e5e7';
              }
            }}
          >
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '60px', height: '60px' }}>
                <AvatarDisplay avatarId={option.id} size={60} />
              </div>
            </div>
            <p style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#1d1d1f',
              margin: '0',
              marginBottom: '2px'
            }}>
              {option.name}
            </p>
            <p style={{
              fontSize: '10px',
              color: '#86868b',
              margin: '0'
            }}>
              {option.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
