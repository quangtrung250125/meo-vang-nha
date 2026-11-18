import { createHash } from 'node:crypto';
import { hasServiceRole, supabaseAdmin } from './db.js';

const hex = /^[a-f0-9]{64}$/;
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const columns = 'id,sender,body,created_at';

export async function handleLiveChat(req, res, { staff = false } = {}) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Phương thức không được hỗ trợ.' });
  }

  const query = new URL(req.url || '/', 'http://localhost').searchParams;
  const guestKey = req.headers?.['x-chat-key'];
  if (!staff && (typeof guestKey !== 'string' || !hex.test(guestKey))) {
    return res.status(400).json({ error: 'Phiên chat không hợp lệ.' });
  }
  const threadId = staff
    ? query.get('thread')
    : createHash('sha256').update(guestKey).digest('hex');

  if (!hasServiceRole) {
    return res.status(503).json({ error: 'Chat trực tuyến đang tạm gián đoạn.' });
  }

  try {
    if (staff && req.method === 'GET' && threadId === null) {
      const { data, error } = await supabaseAdmin.from('live_chat_inbox')
        .select(`thread_id,${columns}`).order('id', { ascending: false }).limit(100);
      if (error) throw error;
      return res.status(200).json({ threads: data });
    }
    if (!hex.test(threadId || '')) {
      return res.status(400).json({ error: 'Cuộc trò chuyện không hợp lệ.' });
    }

    const messages = supabaseAdmin.from('live_chat_messages');
    if (req.method === 'GET') {
      const { data, error } = await messages.select(columns).eq('thread_id', threadId)
        .order('id', { ascending: false }).limit(200);
      if (error) throw error;
      return res.status(200).json({ messages: data.reverse() });
    }

    const body = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const requestId = req.body?.requestId;
    if (!body || body.length > 2000 || typeof requestId !== 'string' || !uuid.test(requestId)) {
      return res.status(400).json({ error: 'Tin nhắn phải có từ 1 đến 2.000 ký tự.' });
    }
    if (staff) {
      const { data, error } = await messages.select('id').eq('thread_id', threadId).limit(1);
      if (error) throw error;
      if (!data.length) return res.status(404).json({ error: 'Không tìm thấy cuộc trò chuyện.' });
    }
    const { error } = await messages.upsert({
      thread_id: threadId,
      sender: staff ? 'staff' : 'guest',
      request_id: requestId,
      body,
    }, { onConflict: 'thread_id,sender,request_id', ignoreDuplicates: true });
    if (error) throw error;
    return res.status(200).json({ sent: true });
  } catch (error) {
    console.error('[Live chat]', error.code || error.message);
    return res.status(503).json({ error: 'Chat trực tuyến đang tạm gián đoạn. Vui lòng thử lại.' });
  }
}