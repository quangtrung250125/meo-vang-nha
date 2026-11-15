// Cổng bảo vệ đặt trước go2rtc: chỉ cho đi qua đúng các đường dẫn phát HLS của camera,
// chặn mọi trang quản trị / cấu hình của go2rtc (nơi có thể lộ mã an toàn của camera).
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const UPSTREAM_HOST = '127.0.0.1';
const UPSTREAM_PORT = Number(process.env.GO2RTC_PORT || 11984);
const LISTEN_PORT = Number(process.env.PROXY_PORT || 18080);
const STREAM_NAME = 'camera';

// true nếu request được phép đi qua
export function isAllowedRequest(method, rawUrl) {
  if (method !== 'GET' && method !== 'HEAD') return false;
  let url;
  try {
    url = new URL(rawUrl, 'http://localhost');
  } catch {
    return false;
  }
  if (url.pathname === '/api/stream.m3u8') {
    const keys = [...url.searchParams.keys()];
    return keys.length === 1 && keys[0] === 'src' && url.searchParams.get('src') === STREAM_NAME;
  }
  // Danh sách phát và các đoạn video con của luồng HLS
  return /^\/api\/hls\/(?!.*\.\.)[A-Za-z0-9_./-]+$/.test(url.pathname);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

export function createProxy() {
  return http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      return res.end();
    }
    if (!isAllowedRequest(req.method, req.url)) {
      res.writeHead(404, { ...CORS, 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }
    const upstream = http.request(
      { host: UPSTREAM_HOST, port: UPSTREAM_PORT, path: req.url, method: req.method, headers: { Accept: req.headers.accept || '*/*' } },
      (up) => {
        res.writeHead(up.statusCode || 502, { ...CORS, 'Content-Type': up.headers['content-type'] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        up.pipe(res);
      },
    );
    upstream.setTimeout(30000, () => upstream.destroy(new Error('timeout')));
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(502, { ...CORS, 'Content-Type': 'text/plain' });
      res.end('Camera chưa sẵn sàng');
    });
    req.on('aborted', () => upstream.destroy());
    upstream.end();
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  // Khong de cong bi tat vi mot loi le te: ghi log roi chay tiep
  process.on('uncaughtException', (e) => console.error('Loi:', e && e.message));
  process.on('unhandledRejection', (e) => console.error('Loi:', e && e.message));
  createProxy().listen(LISTEN_PORT, '127.0.0.1', () => console.log(`Cổng camera đang chạy ở cổng ${LISTEN_PORT}`));
}
