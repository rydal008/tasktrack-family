import { supabase } from './supabaseClient';

// The PIN hash lives on the server and never comes down to the browser.
// These three calls are the only way to touch it, and they answer yes or no.

export async function pinIsSet() {
  const { data, error } = await supabase.rpc('parent_pin_is_set');
  if (error) throw error;
  return data === true;
}

export async function checkPin(pin) {
  const { data, error } = await supabase.rpc('verify_parent_pin', { pin });
  if (error) throw error;
  return data === true;
}

// Leave currentPin null only when no PIN has been set yet.
export async function changePin(newPin, currentPin = null) {
  const { data, error } = await supabase.rpc('set_parent_pin', {
    new_pin: newPin,
    current_pin: currentPin
  });
  if (error) throw error;
  return data === true;
}

export const PIN_MIN = 4;
export const PIN_MAX = 6;

export function pinLooksValid(pin) {
  return new RegExp(`^[0-9]{${PIN_MIN},${PIN_MAX}}$`).test(pin);
}
