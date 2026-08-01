import React from 'react';

export const AVATAR_OPTIONS = [
  { id: 'avatar-1', name: 'Alex', label: 'Boy - Black Hair' },
  { id: 'avatar-2', name: 'Maya', label: 'Girl - Brown Hair' },
  { id: 'avatar-3', name: 'Lucas', label: 'Boy - Blonde Hair' },
  { id: 'avatar-4', name: 'Zara', label: 'Girl - Curly Hair' },
  { id: 'avatar-5', name: 'Jordan', label: 'Boy - Glasses' },
  { id: 'avatar-6', name: 'Emma', label: 'Girl - Red Hair' },
];

export const Avatar1 = ({ size = 80 }) => (
  <svg viewBox="0 0 120 140" style={{ width: size, height: 'auto' }}>
    <circle cx="60" cy="50" r="32" fill="#daa876"/>
    <path d="M 28 50 Q 28 18 60 18 Q 92 18 92 50 Z" fill="#1a1a1a"/>
    <circle cx="48" cy="45" r="4" fill="#1a1a1a"/>
    <circle cx="72" cy="45" r="4" fill="#1a1a1a"/>
    <path d="M 48 60 Q 60 68 72 60" stroke="#8b6f47" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="20" y="85" width="80" height="50" fill="#4a90e2" rx="8"/>
    <rect x="5" y="90" width="15" height="40" fill="#daa876" rx="8"/>
    <rect x="100" y="90" width="15" height="40" fill="#daa876" rx="8"/>
  </svg>
);

export const Avatar2 = ({ size = 80 }) => (
  <svg viewBox="0 0 120 140" style={{ width: size, height: 'auto' }}>
    <circle cx="60" cy="50" r="32" fill="#f4a460"/>
    <path d="M 28 50 Q 28 18 60 18 Q 92 18 92 50 Z" fill="#8b4513"/>
    <path d="M 28 50 L 25 70 Q 28 75 35 72" fill="#8b4513"/>
    <path d="M 92 50 L 95 70 Q 92 75 85 72" fill="#8b4513"/>
    <circle cx="48" cy="45" r="4" fill="#5d4e37"/>
    <circle cx="72" cy="45" r="4" fill="#5d4e37"/>
    <path d="M 48 60 Q 60 68 72 60" stroke="#cd853f" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="20" y="85" width="80" height="50" fill="#e74c3c" rx="8"/>
    <rect x="5" y="90" width="15" height="40" fill="#f4a460" rx="8"/>
    <rect x="100" y="90" width="15" height="40" fill="#f4a460" rx="8"/>
  </svg>
);

export const Avatar3 = ({ size = 80 }) => (
  <svg viewBox="0 0 120 140" style={{ width: size, height: 'auto' }}>
    <circle cx="60" cy="50" r="32" fill="#f5deb3"/>
    <path d="M 28 50 Q 28 18 60 18 Q 92 18 92 50 Z" fill="#daa520"/>
    <circle cx="48" cy="45" r="4" fill="#4169e1"/>
    <circle cx="72" cy="45" r="4" fill="#4169e1"/>
    <path d="M 48 60 Q 60 68 72 60" stroke="#d4a574" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="20" y="85" width="80" height="50" fill="#27ae60" rx="8"/>
    <rect x="5" y="90" width="15" height="40" fill="#f5deb3" rx="8"/>
    <rect x="100" y="90" width="15" height="40" fill="#f5deb3" rx="8"/>
  </svg>
);

export const Avatar4 = ({ size = 80 }) => (
  <svg viewBox="0 0 120 140" style={{ width: size, height: 'auto' }}>
    <circle cx="60" cy="50" r="32" fill="#b8956a"/>
    <circle cx="28" cy="40" r="12" fill="#2d2d2d"/>
    <circle cx="35" cy="25" r="11" fill="#2d2d2d"/>
    <circle cx="48" cy="18" r="12" fill="#2d2d2d"/>
    <circle cx="60" cy="15" r="12" fill="#2d2d2d"/>
    <circle cx="72" cy="18" r="12" fill="#2d2d2d"/>
    <circle cx="85" cy="25" r="11" fill="#2d2d2d"/>
    <circle cx="92" cy="40" r="12" fill="#2d2d2d"/>
    <circle cx="48" cy="45" r="4" fill="#2d2d2d"/>
    <circle cx="72" cy="45" r="4" fill="#2d2d2d"/>
    <path d="M 48 60 Q 60 68 72 60" stroke="#8b6f47" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="20" y="85" width="80" height="50" fill="#9b59b6" rx="8"/>
    <rect x="5" y="90" width="15" height="40" fill="#b8956a" rx="8"/>
    <rect x="100" y="90" width="15" height="40" fill="#b8956a" rx="8"/>
  </svg>
);

export const Avatar5 = ({ size = 80 }) => (
  <svg viewBox="0 0 120 140" style={{ width: size, height: 'auto' }}>
    <circle cx="60" cy="50" r="32" fill="#daa876"/>
    <path d="M 28 50 Q 28 18 60 18 Q 92 18 92 50 Z" fill="#5d4e37"/>
    <circle cx="45" cy="43" r="8" fill="none" stroke="#333" strokeWidth="2"/>
    <circle cx="75" cy="43" r="8" fill="none" stroke="#333" strokeWidth="2"/>
    <line x1="53" y1="43" x2="67" y2="43" stroke="#333" strokeWidth="2"/>
    <circle cx="45" cy="43" r="3" fill="#333"/>
    <circle cx="75" cy="43" r="3" fill="#333"/>
    <path d="M 48 60 Q 60 68 72 60" stroke="#8b6f47" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="20" y="85" width="80" height="50" fill="#3498db" rx="8"/>
    <rect x="5" y="90" width="15" height="40" fill="#daa876" rx="8"/>
    <rect x="100" y="90" width="15" height="40" fill="#daa876" rx="8"/>
  </svg>
);

export const Avatar6 = ({ size = 80 }) => (
  <svg viewBox="0 0 120 140" style={{ width: size, height: 'auto' }}>
    <circle cx="60" cy="50" r="32" fill="#f5deb3"/>
    <path d="M 28 50 Q 28 18 60 18 Q 92 18 92 50 Z" fill="#e74c3c"/>
    <path d="M 28 50 L 25 70 Q 28 75 35 72" fill="#e74c3c"/>
    <path d="M 92 50 L 95 70 Q 92 75 85 72" fill="#e74c3c"/>
    <circle cx="48" cy="45" r="4" fill="#27ae60"/>
    <circle cx="72" cy="45" r="4" fill="#27ae60"/>
    <path d="M 48 60 Q 60 68 72 60" stroke="#d4a574" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="20" y="85" width="80" height="50" fill="#f39c12" rx="8"/>
    <rect x="5" y="90" width="15" height="40" fill="#f5deb3" rx="8"/>
    <rect x="100" y="90" width="15" height="40" fill="#f5deb3" rx="8"/>
  </svg>
);

const AVATARS = [Avatar1, Avatar2, Avatar3, Avatar4, Avatar5, Avatar6];

export const getAvatarComponent = (avatarId) => {
  const index = parseInt(avatarId.split('-')[1]) - 1;
  return AVATARS[index] || Avatar1;
};

export const AvatarDisplay = ({ avatarId, size = 80 }) => {
  const AvatarComponent = getAvatarComponent(avatarId || 'avatar-1');
  return <AvatarComponent size={size} />;
};
