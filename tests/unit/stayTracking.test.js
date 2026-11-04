import { describe, expect, it, afterEach } from 'vitest';
import { getStayStep, formatCheckInTime, isMissedBooking } from '../../src/utils/stayJourney';
import { makeImouSign, getImouConfig, getImouLiveStream, setImouFetch, parseRoomCameras } from '../../api/_lib/imouService.js';

describe('Hành trình lưu trú', () => {
  const booking = { checkIn: '2026-11-03', checkOut: '2026-11-06', status: 'check-in' };

  it('chưa tới ngày gửi bé: bước Đặt cọc', () => {
    expect(getStayStep(booking, '2026-11-01')).toBe(1);
  });
  it('tới ngày gửi bé nhưng admin chưa chuyển "đang ở": bước Check-in', () => {
    expect(getStayStep(booking, '2026-11-03')).toBe(2);
    expect(getStayStep({ ...booking, pending_changes: { type: 'UPDATE' } }, '2026-11-04')).toBe(2);
  });
  it('admin chuyển "đang ở": bước Đang lưu trú & chăm sóc cho tới trước ngày đón bé', () => {
    const inHouse = { ...booking, status: 'đang ở' };
    expect(getStayStep(inHouse, '2026-11-03')).toBe(3);
    expect(getStayStep(inHouse, '2026-11-05')).toBe(3);
  });
  it('tới ngày đón bé: Chuẩn bị check-out; gia hạn thì quay về Đang lưu trú', () => {
    const inHouse = { ...booking, status: 'đang ở' };
    expect(getStayStep(inHouse, '2026-11-06')).toBe(4);
    expect(getStayStep(inHouse, '2026-11-08')).toBe(4);
    expect(getStayStep({ ...inHouse, checkOut: '2026-11-09' }, '2026-11-06')).toBe(3);
  });
  it('đơn đã qua ngày đón mà chưa check-in thì không còn là đơn sắp tới', () => {
    const old = { checkIn: '2026-10-07', checkOut: '2026-10-08', status: 'check-in' };
    expect(isMissedBooking(old, '2026-11-04')).toBe(true);
    expect(isMissedBooking(old, '2026-10-08')).toBe(true);
    expect(isMissedBooking(old, '2026-10-07')).toBe(false);
    expect(isMissedBooking({ ...old, status: 'đang ở' }, '2026-11-04')).toBe(false);
  });
  it('định dạng thời gian check-in', () => {
    const d = new Date(2026, 10, 3, 9, 5);
    expect(formatCheckInTime(d.toISOString())).toBe('09:05, 03/11/2026');
    expect(formatCheckInTime(null)).toBe('');
  });
});

describe('Camera Imou', () => {
  afterEach(() => setImouFetch(null));

  it('ký request đúng ví dụ trong tài liệu Imou', () => {
    expect(makeImouSign(1706511734, 'f5a1ae2d-c09c-4d39-a744-83a5c2c653c2', 'test123456789test123456789'))
      .toBe('xjhCQBoJ9hRDsCjyDcHjtDNzRZ3ZJezcawsfWeiaoxU=');
  });

  it('đọc cấu hình camera theo phòng', () => {
    expect(parseRoomCameras('{"vip-01":"ABC:1","VVIP-01":"XYZ"}')).toEqual({
      'VIP-01': { deviceId: 'ABC', channelId: '1' },
      'VVIP-01': { deviceId: 'XYZ', channelId: '0' },
    });
    expect(getImouConfig({}).configured).toBe(false);
  });

  it('live đã tồn tại (LV1001) thì đọc lại link HLS https', async () => {
    const calls = [];
    setImouFetch(async (url, opts) => {
      const method = url.split('/openapi/')[1];
      const body = JSON.parse(opts.body);
      calls.push({ method, params: body.params });
      const ok = (data) => ({ json: async () => ({ result: { code: '0', data } }) });
      if (method === 'accessToken') return ok({ accessToken: 'tok', expireTime: 3600 });
      if (method === 'v2/device.detail.page') return ok({ deviceList: [{ deviceId: 'CAM1', deviceStatus: 'online', channelList: [{ channelId: '0', channelStatus: 'online' }] }] });
      if (method === 'bindDeviceLive') return { json: async () => ({ result: { code: 'LV1001', msg: 'exists' } }) };
      if (method === 'getLiveStreamInfo') return ok({ streams: [
        { streamId: 0, hls: 'https://x/hd.m3u8' },
        { streamId: 1, hls: 'http://x/sd.m3u8' },
        { streamId: 1, hls: 'https://x/sd.m3u8?proto=https' },
      ] });
      throw new Error('unexpected ' + method);
    });
    const config = getImouConfig({ IMOU_APP_ID: 'app', IMOU_APP_SECRET: 'secret' });
    const stream = await getImouLiveStream({ roomId: 'VIP-01' }, config);
    expect(stream.hls).toBe('https://x/sd.m3u8?proto=https');
    expect(stream.deviceId).toBe('CAM1');
    expect(calls.map((c) => c.method)).toEqual(['accessToken', 'v2/device.detail.page', 'bindDeviceLive', 'getLiveStreamInfo']);
    expect(calls[2].params).toMatchObject({ token: 'tok', deviceId: 'CAM1', channelId: '0', streamId: 1 });
  });
});
