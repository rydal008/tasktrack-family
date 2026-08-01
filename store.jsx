import React, { createContext, useContext, useEffect, useState } from 'react';

// Single source of truth for members, tasks and completions.
// Saved in this browser only (localStorage). Swap this file for Supabase later.

const STORAGE_KEY = 'tasktrack.data.v1';

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Day numbers below are Monday = 0 ... Sunday = 6
export const FREQUENCIES = [
  { id: 'daily', label: 'Daily',     sub: 'Every day',       days: [0, 1, 2, 3, 4, 5, 6] },
  { id: '5x',    label: '5x / week', sub: 'Mon to Fri',      days: [0, 1, 2, 3, 4] },
  { id: '3x',    label: '3x / week', sub: 'Mon, Wed, Fri',   days: [0, 2, 4] },
  { id: '2x',    label: '2x / week', sub: 'Tue, Thu',        days: [1, 3] }
];

export function getFrequency(id) {
  return FREQUENCIES.find(f => f.id === id) || FREQUENCIES[0];
}

/* ---------- dates: the cycle is one full week, Monday to Sunday ---------- */

export function dayIndexOf(date) {
  return (date.getDay() + 6) % 7; // Monday = 0
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - dayIndexOf(d));
  return d;
}

export function weekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isSameDay(a, b) {
  return dateKey(a) === dateKey(b);
}

/* ---------- scoring ---------- */

// A member's points for one week: earned counts parent-approved tasks only.
export function scoreForWeek(data, memberId, weekStart) {
  let earned = 0;
  let possible = 0;

  weekDates(weekStart).forEach(date => {
    const di = dayIndexOf(date);
    const dk = dateKey(date);

    data.tasks.forEach(task => {
      if (!task.members.includes(memberId)) return;
      if (!getFrequency(task.frequency).days.includes(di)) return;

      possible += task.points;
      if (data.completions[`${dk}|${task.id}|${memberId}`] === 'approved') {
        earned += task.points;
      }
    });
  });

  return { earned, possible };
}

/* ---------- store ---------- */

const EMPTY = { members: [], tasks: [], completions: {} };

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      members: parsed.members || [],
      tasks: (parsed.tasks || []).map(t => ({ ...t, members: t.members || [] })),
      completions: parsed.completions || {}
    };
  } catch (err) {
    console.warn('Could not read saved data, starting fresh.', err);
    return EMPTY;
  }
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Could not save data.', err);
    }
  }, [data]);

  const addMember = ({ name, avatar }) =>
    setData(d => ({ ...d, members: [...d.members, { id: newId(), name, avatar }] }));

  const removeMember = (memberId) =>
    setData(d => ({
      ...d,
      members: d.members.filter(m => m.id !== memberId),
      tasks: d.tasks.map(t => ({ ...t, members: t.members.filter(id => id !== memberId) }))
    }));

  const addTask = ({ name, points, frequency, members }) =>
    setData(d => ({
      ...d,
      tasks: [...d.tasks, { id: newId(), name, points, frequency, members }]
    }));

  const updateTask = (taskId, patch) =>
    setData(d => ({
      ...d,
      tasks: d.tasks.map(t => (t.id === taskId ? { ...t, ...patch } : t))
    }));

  const removeTask = (taskId) =>
    setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== taskId) }));

  const setCompletion = (dk, taskId, memberId, status) =>
    setData(d => ({
      ...d,
      completions: { ...d.completions, [`${dk}|${taskId}|${memberId}`]: status }
    }));

  const getCompletion = (dk, taskId, memberId) =>
    data.completions[`${dk}|${taskId}|${memberId}`] || 'incomplete';

  const value = {
    data,
    addMember,
    removeMember,
    addTask,
    updateTask,
    removeTask,
    setCompletion,
    getCompletion
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
