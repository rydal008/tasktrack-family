import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { cleanupOldEvidence, purgeEvidenceFor } from './evidence';

// Single source of truth for members, tasks and completions.
// Uses Supabase when it is configured, otherwise falls back to this browser's
// localStorage so the app still works offline / without env vars.

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

/* ---------- local fallback storage ---------- */

const EMPTY = { members: [], tasks: [], completions: {} };

function loadLocal() {
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

/* ---------- store ---------- */

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const online = !!supabase;
  const [data, setData] = useState(() => (online ? EMPTY : loadLocal()));
  const [loading, setLoading] = useState(online);

  useEffect(() => {
    if (!online) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.warn('Could not save data.', err);
      }
    }
  }, [data, online]);

  const failed = (action, error) => {
    console.error(`${action} failed:`, error);
    alert(`Could not ${action}.\n\n${error.message}`);
  };

  // Pull everything for the current week in one go.
  const fetchAll = useCallback(async () => {
    const dates = weekDates(startOfWeek());

    const [mRes, tRes, tmRes, cRes] = await Promise.all([
      supabase.from('members').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('task_members').select('*'),
      supabase.from('completions').select('*')
        .gte('day', dateKey(dates[0]))
        .lte('day', dateKey(dates[6]))
    ]);

    const error = mRes.error || tRes.error || tmRes.error || cRes.error;
    if (error) {
      console.error('Could not load data from Supabase:', error);
      setLoading(false);
      return;
    }

    const completions = {};
    cRes.data.forEach(c => {
      completions[`${c.day}|${c.task_id}|${c.member_id}`] = c.status;
    });

    setData({
      members: mRes.data.map(m => ({ id: m.id, name: m.name, avatar: m.avatar })),
      tasks: tRes.data.map(t => ({
        id: t.id,
        name: t.name,
        points: Number(t.points),
        frequency: t.frequency,
        members: tmRes.data.filter(x => x.task_id === t.id).map(x => x.member_id)
      })),
      completions
    });
    setLoading(false);
  }, []);

  // Load once, then keep every device in sync.
  useEffect(() => {
    if (!online) return undefined;

    fetchAll();

    // Sweep away evidence from earlier weeks. Never let this break start-up.
    cleanupOldEvidence(dateKey(startOfWeek()))
      .then(count => { if (count > 0) console.info(`Cleared ${count} old evidence file(s).`); })
      .catch(err => console.warn('Evidence cleanup skipped.', err));

    const channel = supabase
      .channel('tasktrack-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [online, fetchAll]);

  /* ---------- mutations ---------- */

  const addMember = async ({ name, avatar }) => {
    if (!online) {
      setData(d => ({ ...d, members: [...d.members, { id: newId(), name, avatar }] }));
      return;
    }
    const { error } = await supabase.from('members').insert({ name, avatar });
    if (error) return failed('add that member', error);
    fetchAll();
  };

  const removeMember = async (memberId) => {
    if (!online) {
      setData(d => ({
        ...d,
        members: d.members.filter(m => m.id !== memberId),
        tasks: d.tasks.map(t => ({ ...t, members: t.members.filter(id => id !== memberId) }))
      }));
      return;
    }
    // Clear their photos before the rows pointing at them cascade away.
    try {
      await purgeEvidenceFor('member_id', memberId);
    } catch (err) {
      console.warn('Could not clear that member\'s evidence files.', err);
    }

    const { error } = await supabase.from('members').delete().eq('id', memberId);
    if (error) return failed('remove that member', error);
    fetchAll();
  };

  const addTask = async ({ name, points, frequency, members }) => {
    if (!online) {
      setData(d => ({ ...d, tasks: [...d.tasks, { id: newId(), name, points, frequency, members }] }));
      return;
    }
    const { data: rows, error } = await supabase
      .from('tasks')
      .insert({ name, points, frequency })
      .select();
    if (error) return failed('create that task', error);

    if (members.length > 0) {
      const { error: linkError } = await supabase
        .from('task_members')
        .insert(members.map(id => ({ task_id: rows[0].id, member_id: id })));
      if (linkError) return failed('assign that task', linkError);
    }
    fetchAll();
  };

  const updateTask = async (taskId, patch) => {
    if (!online) {
      setData(d => ({ ...d, tasks: d.tasks.map(t => (t.id === taskId ? { ...t, ...patch } : t)) }));
      return;
    }
    const { members, ...fields } = patch;

    if (Object.keys(fields).length > 0) {
      const { error } = await supabase.from('tasks').update(fields).eq('id', taskId);
      if (error) return failed('save that task', error);
    }

    if (members) {
      const { error } = await supabase.from('task_members').delete().eq('task_id', taskId);
      if (error) return failed('save that task', error);

      if (members.length > 0) {
        const { error: linkError } = await supabase
          .from('task_members')
          .insert(members.map(id => ({ task_id: taskId, member_id: id })));
        if (linkError) return failed('save that task', linkError);
      }
    }
    fetchAll();
  };

  const removeTask = async (taskId) => {
    if (!online) {
      setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== taskId) }));
      return;
    }
    try {
      await purgeEvidenceFor('task_id', taskId);
    } catch (err) {
      console.warn('Could not clear that task\'s evidence files.', err);
    }

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) return failed('delete that task', error);
    fetchAll();
  };

  const setCompletion = async (dk, taskId, memberId, status) => {
    // Update on screen straight away, then save.
    setData(d => ({
      ...d,
      completions: { ...d.completions, [`${dk}|${taskId}|${memberId}`]: status }
    }));
    if (!online) return;

    const { error } = await supabase
      .from('completions')
      .upsert(
        { day: dk, task_id: taskId, member_id: memberId, status, updated_at: new Date().toISOString() },
        { onConflict: 'day,task_id,member_id' }
      );
    if (error) {
      failed('save that', error);
      fetchAll();
    }
  };

  const getCompletion = (dk, taskId, memberId) =>
    data.completions[`${dk}|${taskId}|${memberId}`] || 'incomplete';

  const value = {
    data,
    loading,
    online,
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
