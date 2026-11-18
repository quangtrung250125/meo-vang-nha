import { supabaseAdmin } from './db.js';

export async function changeRoomSafe(bookingCode, targetRoomId, capacity, patch) {
  const { data, error } = await supabaseAdmin.rpc('change_room_safe', {
    p_booking_code: bookingCode,
    p_target_room_id: targetRoomId,
    p_capacity: capacity,
    p_patch: patch,
  });

  if (error) {
    const message = [error.message, error.details, error.hint].filter(Boolean).join(' ');
    throw new Error(message || 'Supabase RPC change_room_safe failed');
  }

  return data;
}
