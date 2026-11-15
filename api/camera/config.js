import { getRequestUser } from '../_lib/auth.js';
import { getCameraStreamUrl, setCameraStreamUrl, validateStreamUrl } from '../_lib/cameraStream.js';

// GET  /api/camera/config            -> địa chỉ luồng camera đang dùng (chỉ admin)
// PUT  /api/camera/config {streamUrl} -> lưu địa chỉ luồng camera; để trống để xoá (chỉ admin)
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const user = await getRequestUser(req);
  if (!user) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập tài khoản quản trị.' });
  if (!user.isAdmin) return res.status(403).json({ success: false, message: 'Chỉ quản trị viên mới được cấu hình camera.' });

  if (req.method === 'GET') {
    return res.status(200).json({ success: true, streamUrl: (await getCameraStreamUrl()) || '' });
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    const raw = typeof req.body === 'string' ? safeParse(req.body) : req.body;
    const input = String(raw?.streamUrl ?? '').trim();
    if (!input) {
      const result = await setCameraStreamUrl(null);
      return res.status(200).json({ success: true, streamUrl: '', persisted: result.persisted });
    }
    const check = validateStreamUrl(input);
    if (!check.ok) return res.status(400).json({ success: false, message: check.error });
    const result = await setCameraStreamUrl(check.url);
    return res.status(200).json({
      success: true,
      streamUrl: check.url,
      persisted: result.persisted,
      message: result.persisted ? undefined : 'Đã lưu tạm nhưng chưa lưu được vào cơ sở dữ liệu, có thể mất khi máy chủ khởi động lại.',
    });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
