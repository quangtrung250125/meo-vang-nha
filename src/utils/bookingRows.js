// Bảng Supabase `bookings`: id (uuid), customer_id (uuid), code ("MVN-xxxxx"), data (json), created_at.
// Mã đơn MVN-xxxxx nằm ở cột code; lọc `id = "MVN-..."` sẽ làm Supabase báo lỗi 22P02 vì id là uuid.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Gộp `updates` vào cột data của mọi dòng thuộc đơn (theo mã đơn, hoặc theo id nếu truyền vào uuid).
 * @returns {Promise<boolean>} true nếu có dòng được cập nhật
 */
export async function updateBookingRows(client, codeOrId, updates) {
  if (!codeOrId) return false;
  const query = client.from('bookings').select('id, data');
  const { data: rows, error } = UUID_RE.test(codeOrId)
    ? await query.eq('id', codeOrId)
    : await query.eq('code', codeOrId);
  if (error) throw error;
  if (!rows || rows.length === 0) return false;

  for (const row of rows) {
    const { error: updateError } = await client
      .from('bookings')
      .update({ data: { ...(row.data || {}), ...updates } })
      .eq('id', row.id);
    if (updateError) throw updateError;
  }
  return true;
}
