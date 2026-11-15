import { describe, it, expect, afterEach } from 'vitest';
import http from 'node:http';
import { validateStreamUrl } from '../../api/_lib/cameraStream.js';
import { isAllowedRequest, createProxy } from '../../tools/camera-bridge/proxy.js';

describe('địa chỉ luồng camera', () => {
  it('nhận link HLS https hợp lệ', () => {
    const r = validateStreamUrl('  https://abc-def.trycloudflare.com/api/stream.m3u8?src=camera ');
    expect(r.ok).toBe(true);
    expect(r.url).toBe('https://abc-def.trycloudflare.com/api/stream.m3u8?src=camera');
  });
  it('từ chối http, link không phải m3u8, link có mật khẩu và để trống', () => {
    expect(validateStreamUrl('http://x.com/a.m3u8').ok).toBe(false);
    expect(validateStreamUrl('https://x.com/video.mp4').ok).toBe(false);
    expect(validateStreamUrl('https://admin:pw@x.com/a.m3u8').ok).toBe(false);
    expect(validateStreamUrl('rtsp://admin:code@192.168.1.5/a').ok).toBe(false);
    expect(validateStreamUrl('').ok).toBe(false);
  });
});

describe('cổng bảo vệ go2rtc', () => {
  it('chỉ cho đi qua đường dẫn phát HLS của camera', () => {
    expect(isAllowedRequest('GET', '/api/stream.m3u8?src=camera')).toBe(true);
    expect(isAllowedRequest('GET', '/api/hls/playlist.m3u8?id=abc')).toBe(true);
    expect(isAllowedRequest('GET', '/api/hls/segment.ts?id=abc&n=1')).toBe(true);
  });
  it('chặn trang cấu hình, nguồn khác, phương thức ghi và đường dẫn lách', () => {
    expect(isAllowedRequest('GET', '/')).toBe(false);
    expect(isAllowedRequest('GET', '/api/config')).toBe(false);
    expect(isAllowedRequest('GET', '/api/streams')).toBe(false);
    expect(isAllowedRequest('GET', '/api/stream.m3u8?src=khac')).toBe(false);
    expect(isAllowedRequest('GET', '/api/stream.m3u8?src=camera&mp4=1')).toBe(false);
    expect(isAllowedRequest('PUT', '/api/streams?src=x')).toBe(false);
    expect(isAllowedRequest('POST', '/api/stream.m3u8?src=camera')).toBe(false);
    expect(isAllowedRequest('GET', '/api/hls/../config')).toBe(false);
  });
});

describe('cổng bảo vệ chạy thật', () => {
  let upstream; let proxy;
  afterEach(() => { upstream?.close(); proxy?.close(); });

  it('chuyển tiếp luồng HLS, thêm CORS, chặn trang cấu hình', async () => {
    const seen = [];
    upstream = http.createServer((req, res) => {
      seen.push(req.url);
      res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl' });
      res.end('#EXTM3U\n');
    });
    await new Promise((r) => upstream.listen(0, '127.0.0.1', r));
    process.env.GO2RTC_PORT = String(upstream.address().port);
    // nạp lại module để nhận cổng mới
    const mod = await import('../../tools/camera-bridge/proxy.js?port=' + process.env.GO2RTC_PORT);
    proxy = mod.createProxy();
    await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
    const base = `http://127.0.0.1:${proxy.address().port}`;

    const ok = await fetch(`${base}/api/stream.m3u8?src=camera`);
    expect(ok.status).toBe(200);
    expect(ok.headers.get('access-control-allow-origin')).toBe('*');
    expect(await ok.text()).toContain('#EXTM3U');

    const blocked = await fetch(`${base}/api/config`);
    expect(blocked.status).toBe(404);
    expect(seen).toEqual(['/api/stream.m3u8?src=camera']);
  });
});
