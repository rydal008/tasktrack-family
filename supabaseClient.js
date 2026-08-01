import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables not found. Running in demo mode.'
  );
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;

// Verify PIN
export const verifyPin = (pin, familyPinHash) => {
  const hash = btoa(pin);
  return hash === familyPinHash;
};

// Get current cycle info
export const getCurrentCycleInfo = (cycleStartDate) => {
  if (!cycleStartDate) return null;
  
  const start = new Date(cycleStartDate);
  const today = new Date();
  
  return {
    start,
    current: today
  };
};

// Get scores for a cycle
export const getScoresForCycle = async (familyId, cycleStartDate) => {
  try {
    const { data, error } = await supabase
      .from('completions')
      .select(`
        family_member_id,
        task_id,
        is_completed,
        tasks(points)
      `)
      .eq('family_id', familyId)
      .eq('cycle_start_date', cycleStartDate);

    if (error) throw error;

    // Calculate scores
    const scores = {};
    const members = new Set();

    data.forEach(completion => {
      members.add(completion.family_member_id);
      
      if (!scores[completion.family_member_id]) {
        scores[completion.family_member_id] = 0;
      }

      if (completion.is_completed && completion.tasks?.points) {
        scores[completion.family_member_id] += parseFloat(completion.tasks.points);
      }
    });

    return { scores, memberIds: Array.from(members) };
  } catch (error) {
    console.error('Error getting scores:', error);
    return { scores: {}, memberIds: [] };
  }
};

// Get cycle start date
export const getCycleStartDate = (cycleDays) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysBack = today.getDay() === 0 ? cycleDays : today.getDay();
  const start = new Date(today);
  start.setDate(start.getDate() - (today.getDay()));
  
  return start.toISOString().split('T')[0];
};

// Get cycle end date
export const getCycleEndDate = (cycleStartDate, cycleDays) => {
  const start = new Date(cycleStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + cycleDays - 1);
  
  return end.toISOString().split('T')[0];
};
