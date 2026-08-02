import { supabase } from './supabaseClient';

const BUCKET = 'evidence';

export const MAX_PHOTOS = 5;
export const MAX_VIDEO_SECONDS = 10;

// Phone cameras sometimes report 10.2s for a 10s clip, so allow a little slack.
const DURATION_SLACK = 1.5;

function extensionOf(file) {
  if (file.name && file.name.includes('.')) {
    return file.name.split('.').pop().toLowerCase();
  }
  return (file.type.split('/')[1] || 'bin').toLowerCase();
}

function randomName() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Reads a video's length without playing it.
export function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That video could not be read.'));
    };
    video.src = url;
  });
}

export function isVideoTooLong(seconds) {
  return Number.isFinite(seconds) && seconds > MAX_VIDEO_SECONDS + DURATION_SLACK;
}

// items: [{ file, kind }]
export async function uploadEvidence(day, taskId, memberId, items) {
  const rows = [];

  for (const item of items) {
    const path = `${day}/${taskId}/${memberId}/${randomName()}.${extensionOf(item.file)}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, item.file, { contentType: item.file.type || undefined });
    if (error) throw error;
    rows.push({ day, task_id: taskId, member_id: memberId, path, kind: item.kind });
  }

  const { error } = await supabase.from('evidence').insert(rows);
  if (error) throw error;
}

export async function loadEvidence(day, taskId, memberId) {
  const { data, error } = await supabase
    .from('evidence')
    .select('*')
    .eq('day', day)
    .eq('task_id', taskId)
    .eq('member_id', memberId)
    .order('created_at');
  if (error) throw error;
  if (data.length === 0) return [];

  // The bucket is private, so hand out links that expire after an hour.
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(data.map(row => row.path), 3600);
  if (signError) throw signError;

  const urlByPath = {};
  signed.forEach(entry => { urlByPath[entry.path] = entry.signedUrl; });

  return data.map((row, i) => ({
    ...row,
    url: urlByPath[row.path] || signed[i]?.signedUrl || null
  }));
}

export async function deleteEvidence(day, taskId, memberId) {
  const { data, error } = await supabase
    .from('evidence')
    .select('path')
    .eq('day', day)
    .eq('task_id', taskId)
    .eq('member_id', memberId);
  if (error) throw error;

  if (data.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove(data.map(row => row.path));
    if (removeError) throw removeError;
  }

  const { error: deleteError } = await supabase
    .from('evidence')
    .delete()
    .eq('day', day)
    .eq('task_id', taskId)
    .eq('member_id', memberId);
  if (deleteError) throw deleteError;
}
