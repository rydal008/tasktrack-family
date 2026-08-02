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

/* ---------- shrinking ---------- */

// A phone photo is 3-5 MB, which is slow to send and eats the storage quota.
// Nobody needs 4000 pixels to see whether a room got tidied.
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.7;
const ALREADY_SMALL = 200 * 1024;

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      // Honour the camera's rotation flag rather than banking sideways photos.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (err) {
      try {
        return await createImageBitmap(file);
      } catch (err2) {
        /* fall through to the <img> path */
      }
    }
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
    image.src = url;
  });
}

// Always returns something usable: on any failure the original file is kept.
export async function shrinkImage(file) {
  if (!file.type.startsWith('image/')) return file;

  let source;
  try {
    source = await decode(file);
  } catch (err) {
    console.warn('Shrinking skipped.', err);
    return file;
  }

  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  if (!width || !height) return file;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  if (scale === 1 && file.size <= ALREADY_SMALL) {
    if (source.close) source.close();
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  if (source.close) source.close();

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now()
  });
}

/* ---------- upload ---------- */

// items: [{ file, kind }]
export async function uploadEvidence(day, taskId, memberId, items) {
  const rows = [];

  for (const item of items) {
    const file = item.kind === 'photo' ? await shrinkImage(item.file) : item.file;
    const path = `${day}/${taskId}/${memberId}/${randomName()}.${extensionOf(file)}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || undefined });
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

async function removePaths(paths) {
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await supabase.storage.from(BUCKET).remove(paths.slice(i, i + 100));
    if (error) throw error;
  }
}

// Evidence a parent never got round to reviewing would otherwise sit in
// storage forever. Anything older than the current week is unreachable in the
// app anyway, so it goes.
export async function cleanupOldEvidence(beforeDay) {
  const { data, error } = await supabase
    .from('evidence')
    .select('path')
    .lt('day', beforeDay);
  if (error) throw error;
  if (data.length === 0) return 0;

  await removePaths(data.map(row => row.path));

  const { error: deleteError } = await supabase.from('evidence').delete().lt('day', beforeDay);
  if (deleteError) throw deleteError;

  return data.length;
}

// Deleting a task or member cascades the evidence rows away, which would leave
// the files themselves stranded with nothing left pointing at them. Clear the
// files first.
export async function purgeEvidenceFor(column, value) {
  const { data, error } = await supabase.from('evidence').select('path').eq(column, value);
  if (error) throw error;
  if (data.length === 0) return 0;

  await removePaths(data.map(row => row.path));
  return data.length;
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
