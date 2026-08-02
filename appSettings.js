import { supabase } from './supabaseClient';

export const MAX_TITLE = 40;

// The stored value is just the custom prefix, or null for none.
export function composeTitle(prefix) {
  const trimmed = (prefix || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'tasktrack') return 'TaskTrack';
  return `${trimmed} - TaskTrack`;
}

export async function getAppTitle() {
  const { data, error } = await supabase.rpc('get_app_title');
  if (error) throw error;
  return data || '';
}

export async function setAppTitle(prefix) {
  const { data, error } = await supabase.rpc('set_app_title', { new_title: prefix || '' });
  if (error) throw error;
  return data === true;
}
