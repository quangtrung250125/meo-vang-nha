import crypto from 'crypto';

// ==========================================
// CAMERA IMOU (Imou Open Platform)
// Khoá AppId / AppSecret chỉ nằm trên server (biến môi trường), không bao giờ gửi ra trình duyệt.
// Tài liệu: https://open.imoulife.com/book/05-api/00.overview.html
// ==========================================

const DEFAULT_DATA_CENTER = 'sg'; // Việt Nam dùng trung tâm dữ liệu Singapore

export function getImouConfig(env = process.env) {
  const appId = (env.IMOU_APP_ID || '').trim();
  const appSecret = (env.IMOU_APP_SECRET || '').trim();
  const dataCenter = (env.IMOU_DATA_CENTER || DEFAULT_DATA_CENTER).trim();
  const baseUrl = (env.IMOU_API_BASE || `https://openapi-${dataCenter}.easy4ip.com`).replace(/\/+$/, '');
  const streamId = env.IMOU_STREAM_ID === '0' ? 0 : 1; // 1 = SD (nhẹ, mặc định), 0 = HD
  return {
    appId,
    appSecret,
    baseUrl,
    streamId,
    defaultCamera: parseCameraRef(env.IMOU_DEVICE_ID, env.IMOU_CHANNEL_ID),
    roomCameras: parseRoomCameras(env.IMOU_ROOM_CAMERAS),
    configured: Boolean(appId && appSecret),
  };
}

// "SERIAL" hoặc "SERIAL:kênh" -> { deviceId, channelId }
export function parseCameraRef(value, channel) {
  if (!value || typeof value !== 'string') return null;
  const [deviceId, ch] = value.trim().split(':');
  if (!deviceId) return null;
  return { deviceId, channelId: String(ch || channel || '0') };
}

// IMOU_ROOM_CAMERAS='{"VIP-01":"SERIAL1","VVIP-01":"SERIAL2:1"}' -> mỗi phòng một camera
export function parseRoomCameras(raw) {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    return Object.fromEntries(
      Object.entries(obj || {})
        .map(([room, ref]) => [String(room).toUpperCase(), parseCameraRef(String(ref))])
        .filter(([, cam]) => cam)
    );
  } catch {
    console.warn('[Imou] IMOU_ROOM_CAMERAS không phải JSON hợp lệ');
    return {};
  }
}

/**
 * Chữ ký theo quy chuẩn Imou:
 * password = hex thường(SHA-256(appSecret)); sign = Base64(HMAC-SHA256("time:{t},nonce:{n},appSecret:{s}", password))
 */
export function makeImouSign(time, nonce, appSecret) {
  const source = `time:${time},nonce:${nonce},appSecret:${appSecret}`;
  const password = crypto.createHash('sha256').update(appSecret, 'utf8').digest('hex').toLowerCase();
  return crypto.createHmac('sha256', password).update(source, 'utf8').digest('base64');
}

export class ImouError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

let fetchImpl = (...args) => fetch(...args);
// Cho phép test thay fetch
export function setImouFetch(fn) {
  fetchImpl = fn || ((...args) => fetch(...args));
  tokenCache = null;
}

async function callImou(config, method, params = {}) {
  const time = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID();
  const body = {
    system: { ver: '1.0', appId: config.appId, sign: makeImouSign(time, nonce, config.appSecret), time, nonce },
    id: crypto.randomUUID(),
    params,
  };
  const res = await fetchImpl(`${config.baseUrl}/openapi/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  const result = json?.result;
  if (!result) throw new ImouError('HTTP_' + res.status, 'Không kết nối được Imou');
  if (String(result.code) !== '0') throw new ImouError(String(result.code), result.msg);
  return result.data || {};
}

let tokenCache = null; // { token, expiresAt }

async function getAccessToken(config, force = false) {
  if (!force && tokenCache && tokenCache.appId === config.appId && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token;
  }
  const data = await callImou(config, 'accessToken');
  const ttl = Number(data.expireTime) > 0 ? Number(data.expireTime) * 1000 : 60 * 60 * 1000;
  tokenCache = { appId: config.appId, token: data.accessToken, expiresAt: Date.now() + ttl };
  return data.accessToken;
}

// Gọi API cần token; token hết hạn (TK1002) thì lấy token mới và thử lại một lần
async function callWithToken(config, method, params) {
  const token = await getAccessToken(config);
  try {
    return await callImou(config, method, { ...params, token });
  } catch (e) {
    if (e.code !== 'TK1002') throw e;
    const fresh = await getAccessToken(config, true);
    return callImou(config, method, { ...params, token: fresh });
  }
}

// Danh sách camera của tài khoản Imou (đã gắn hoặc được chia sẻ)
export async function listImouCameras(config = getImouConfig()) {
  const data = await callWithToken(config, 'v2/device.detail.page', { page: 1, pageSize: 50, source: 'bindAndShare' });
  return (data.deviceList || []).flatMap((d) =>
    (d.channelList && d.channelList.length > 0 ? d.channelList : [{ channelId: '0' }]).map((ch) => ({
      deviceId: d.deviceId,
      channelId: String(ch.channelId ?? '0'),
      name: ch.channelName || d.deviceName || d.deviceId,
      online: (ch.channelStatus || d.deviceStatus) === 'online',
    }))
  );
}

// Chọn camera cho phòng: theo IMOU_ROOM_CAMERAS -> IMOU_DEVICE_ID -> camera đầu tiên đang online của tài khoản
export async function resolveCamera(roomId, config = getImouConfig()) {
  const byRoom = roomId ? config.roomCameras[String(roomId).toUpperCase()] : null;
  if (byRoom) return byRoom;
  if (config.defaultCamera) return config.defaultCamera;
  const cams = await listImouCameras(config);
  const cam = cams.find((c) => c.online) || cams[0];
  if (!cam) throw new ImouError('NO_DEVICE', 'Tài khoản Imou chưa có camera nào');
  return { deviceId: cam.deviceId, channelId: cam.channelId };
}

const pickHls = (streams = [], streamId) => {
  const list = streams.filter((s) => s?.hls);
  const preferred = list.filter((s) => s.streamId === undefined || Number(s.streamId) === streamId);
  const pool = preferred.length > 0 ? preferred : list;
  // Web chạy https nên ưu tiên link https
  return (pool.find((s) => s.hls.startsWith('https')) || pool[0])?.hls || null;
};

/**
 * Lấy link HLS xem trực tiếp: tạo live (bindDeviceLive); nếu live đã có sẵn (LV1001) thì đọc lại link (getLiveStreamInfo)
 */
export async function getImouLiveStream({ roomId } = {}, config = getImouConfig()) {
  if (!config.configured) throw new ImouError('NOT_CONFIGURED', 'Chưa cấu hình IMOU_APP_ID / IMOU_APP_SECRET');
  const cam = await resolveCamera(roomId, config);
  const params = { deviceId: cam.deviceId, channelId: cam.channelId };
  let data;
  try {
    data = await callWithToken(config, 'bindDeviceLive', { ...params, streamId: config.streamId });
  } catch (e) {
    if (e.code !== 'LV1001') throw e;
    data = await callWithToken(config, 'getLiveStreamInfo', params);
  }
  let hls = pickHls(data.streams, config.streamId);
  if (!hls && data.streams === undefined) {
    data = await callWithToken(config, 'getLiveStreamInfo', params);
    hls = pickHls(data.streams, config.streamId);
  }
  if (!hls) throw new ImouError('NO_STREAM', 'Imou không trả về link xem trực tiếp');
  const cover = (data.streams || []).find((s) => s.coverUrl)?.coverUrl || null;
  return { hls, cover, deviceId: cam.deviceId, channelId: cam.channelId };
}

// Thông báo dễ hiểu cho khách khi camera lỗi
export function describeImouError(code) {
  if (code === 'NOT_CONFIGURED') return 'Camera đang được kết nối, vui lòng quay lại sau.';
  if (code === 'DV1007' || code === 'DV1020') return 'Camera đang tạm mất kết nối mạng.';
  if (code === 'NO_DEVICE' || code === 'DV1028') return 'Phòng này chưa được gắn camera.';
  return 'Không mở được camera lúc này, vui lòng thử lại sau.';
}
