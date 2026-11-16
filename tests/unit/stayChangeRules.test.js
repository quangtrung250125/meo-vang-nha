import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { applyStayChange } from '../../src/utils/staySegments';
import { isRoomOrPackageChange, planIsRoomChange, stayChangeQuota } from '../../src/utils/stayChangeRules';
import { getStaySegments } from '../../src/utils/staySegments';

process.env.MVN_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mvn-stay-rule-'));
process.env.MVN_BOOKINGS_DB = 'off';
let service;
beforeAll(async () => {
  service = await import('../../api/_lib/bookingsService.js');
});

const todayStr = '2026-11-03';
const lan = {
  code: 'MVN-11111', id: 'MVN-11111', customerId: 'lan', status: 'đang ở', roomId: 'VIP-01', cats: 1,
  checkIn: '2026-11-01', checkOut: '2026-11-05',
  selectedLodging: { id: 'p2', name: 'Gói Mèo Sang Chảnh', price: 135000 },
  totalPrice: 540000,
};
const all = (b) => ({ 'VIP-01': [b], 'VIP-02': [], 'VIP-03': [] });
const moveTo = (b, roomId) => applyStayChange(b, { from: '2026-11-03', to: b.checkOut, roomId, packageId: 'p2', packageName: 'Gói Mèo Sang Chảnh', pricePerNight: 135000 });
const applied = (b, plan, extra = {}) => ({
  ...b, staySegments: plan.segments, checkOut: plan.checkOut,
  stayChanges: [...(b.stayChanges || []), { type: 'change', text: 'đổi phòng', roomChange: true }], ...extra,
});
const send = (b, updates) => service.checkCustomerUpdate({ userId: 'lan', roomId: 'VIP-01', code: b.code, updates }, all(b), todayStr);

describe('Nhận biết đổi phòng / gói', () => {
  it('gia hạn cùng phòng cùng gói không tính là đổi, sang phòng khác hoặc đổi gói thì tính', () => {
    const same = applyStayChange(lan, { from: '2026-11-05', to: '2026-11-07', roomId: 'VIP-01', packageId: 'p2', packageName: 'Gói Mèo Sang Chảnh', pricePerNight: 135000 });
    expect(planIsRoomChange(lan, same.segments)).toBe(false);
    expect(planIsRoomChange(lan, moveTo(lan, 'VIP-02').segments)).toBe(true);
    const pkg = applyStayChange(lan, { from: '2026-11-03', to: '2026-11-05', roomId: 'VIP-01', packageId: 'p1', packageName: 'Gói Quý Tộc', pricePerNight: 180000 });
    expect(isRoomOrPackageChange(getStaySegments(lan), pkg.segments)).toBe(true);
  });
});

describe('Quy tắc: tự đổi 1 lần, lần 2–3 chờ nhân viên, tối đa 3 lần', () => {
  it('lần 1 khách tự đổi được ngay và server đánh dấu là 1 lần đổi', () => {
    expect(stayChangeQuota(lan).mode).toBe('self');
    const plan = moveTo(lan, 'VIP-02');
    const result = send(lan, { staySegments: plan.segments, checkOut: plan.checkOut, stayChanges: [{ type: 'change', text: 'đổi sang VIP-02' }] });
    expect(result.ok).toBe(true);
    expect(result.updates.stayChanges.filter((c) => c.roomChange)).toHaveLength(1);
  });

  it('lần 2 khách không tự đổi được, phải gửi yêu cầu; server nhận yêu cầu ở trạng thái chờ', () => {
    const b1 = applied(lan, moveTo(lan, 'VIP-02'));
    expect(stayChangeQuota(b1).mode).toBe('request');
    const plan = moveTo(b1, 'VIP-03');
    const direct = send(b1, { staySegments: plan.segments, checkOut: plan.checkOut, stayChanges: [{ type: 'change' }] });
    expect(direct.ok).toBe(false);
    expect(direct.message).toContain('nhân viên xác nhận');

    const req = send(b1, { stayChangeRequests: [{ id: 'r1', type: 'change', text: 'đổi sang VIP-03', segments: plan.segments, status: 'approved' }] });
    expect(req.ok).toBe(true);
    expect(req.updates.stayChangeRequests[0]).toMatchObject({ status: 'pending', number: 2, checkOut: '2026-11-05' });
  });

  it('đang có yêu cầu chờ thì không gửi thêm được; khách lách bằng cách xóa lịch sử cũng không được', () => {
    const b1 = applied(lan, moveTo(lan, 'VIP-02'), { stayChangeRequests: [{ id: 'r1', status: 'pending', segments: [] }] });
    expect(stayChangeQuota(b1).mode).toBe('waiting');
    const plan = moveTo(b1, 'VIP-03');
    expect(send(b1, { stayChangeRequests: [{ id: 'r2', segments: plan.segments }] }).ok).toBe(false);
    // Gửi stayChanges rỗng kèm lịch đổi phòng: server vẫn đếm theo lịch sử mình giữ
    const sneaky = send(b1, { staySegments: plan.segments, checkOut: plan.checkOut, stayChanges: [] });
    expect(sneaky.ok).toBe(false);
  });

  it('đã đổi đủ 3 lần thì chặn hẳn, cả tự đổi lẫn gửi yêu cầu', () => {
    let b = applied(lan, moveTo(lan, 'VIP-02'));
    b = applied(b, moveTo(b, 'VIP-03'));
    b = applied(b, moveTo(b, 'VIP-01'));
    const quota = stayChangeQuota(b);
    expect(quota).toMatchObject({ used: 3, mode: 'blocked', remaining: 0 });
    const plan = moveTo(b, 'VIP-02');
    expect(send(b, { stayChangeRequests: [{ id: 'r4', segments: plan.segments }] }).message).toContain('đủ 3 lần');
    expect(send(b, { staySegments: plan.segments, checkOut: plan.checkOut }).message).toContain('đủ 3 lần');
  });

  it('bị từ chối thì không tính là 1 lần đổi', () => {
    const b1 = applied(lan, moveTo(lan, 'VIP-02'), { stayChangeRequests: [{ id: 'r1', status: 'rejected', rejectReason: 'Phòng đang sửa' }] });
    expect(stayChangeQuota(b1)).toMatchObject({ used: 1, mode: 'request', nextNumber: 2 });
  });
});
