import { createClient } from '@supabase/supabase-js';

// The publishable key is meant to be public — it ships inside the built page
// either way, and every table is protected by row level security. We keep it
// here as a fallback because Vercel has not been passing the VITE_* variables
// into the build. Set the env vars and they win; otherwise these are used.
const FALLBACK_URL = 'https://xdkznkbygxkoighcsect.supabase.co';
const FALLBACK_KEY = 'sb_publishable_FjeHglq-NPerA85xlGcccw_L-Ujkf_A';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Shared parent PIN check.
export const verifyPin = (pin, familyPinHash) => btoa(pin) === familyPinHash;
