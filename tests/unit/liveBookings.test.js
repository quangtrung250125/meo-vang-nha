import { describe, expect, it } from 'vitest';
import { getLiveBookingUpdates, latestPendingChanges, LOCAL_FRESH_MS } from '../../src/utils/liveBookings';

const NOW = Date.parse('2026-11-03T10:00:00Z');
const OLD = new Date(NOW - 60 * 1000).toISOString();
const proposal = { type: 'CANCEL', proposedBy: 'admin', reason: 'Phòng bảo trì', timestamp: new Date(NOW - 10 * 1000).toISOString() };

describe('Đồng bộ "Lịch đặt" của khách theo kho phòng trên server', () => {
  const local = { id: 'MVN-10001', code: 'MVN-10001', status: 'check-in', pending_changes: null, updatedAt: OLD };

  it('khách nhận được đề xuất hủy Admin gửi từ máy khác', () => {
    const updates = getLiveBookingUpdates(local, { live: { ...local, pending_changes: proposal }, now: NOW });
    expect(updates).toEqual({ pending_changes: proposal });
  });

  it('Admin Check-in thì đơn sang "đang ở"; đã khớp thì không đổi gì', () => {
    expect(getLiveBookingUpdates(local, { live: { ...local, status: 'đang ở', checkedInAt: OLD }, now: NOW }))
      .toEqual({ status: 'đang ở', checkedInAt: OLD });
    expect(getLiveBookingUpdates(local, { live: { ...local }, now: NOW })).toBeNull();
  });

  it('Admin Check-out / hủy (server đã trả phòng) thì đơn sang đã kết thúc, bỏ đề xuất đang chờ', () => {
    const waiting = { ...local, status: 'đang ở', pending_changes: proposal };
    expect(getLiveBookingUpdates(waiting, { closed: { code: local.code, status: 'check-out', checkOutNote: 'Check-out sớm 1 đêm' }, now: NOW }))
      .toEqual({ status: 'check-out', checkOutNote: 'Check-out sớm 1 đêm', pending_changes: null });
    expect(getLiveBookingUpdates(local, { closed: { code: local.code, status: 'cancelled', cancelReason: 'Quá hạn cọc', cancelledBy: 'admin' }, now: NOW }))
      .toEqual({ status: 'cancelled', cancelReason: 'Quá hạn cọc', cancelledBy: 'admin' });
  });

  it('khách chỉnh sửa đơn ở máy khác thì Admin nhận đơn mới (phòng, số mèo, giá) và nội dung chỉnh sửa', () => {
    const edited = { ...local, roomId: 'VVIP-02', cats: 2, totalPrice: 1440000, editedAt: OLD, lastEditSummary: 'Phòng: VIP-01 → VVIP-02' };
    expect(getLiveBookingUpdates(local, { live: edited, now: NOW }))
      .toEqual({ roomId: 'VVIP-02', cats: 2, totalPrice: 1440000, editedAt: OLD, lastEditSummary: 'Phòng: VIP-01 → VVIP-02' });
    // Đã nhận bản chỉnh sửa này rồi thì không lấy lại nội dung cũ trên server
    expect(getLiveBookingUpdates({ ...local, editedAt: OLD }, { live: { ...edited, roomId: 'VIP-01' }, now: NOW })).toBeNull();
  });

  it('không đè thay đổi khách vừa làm trên máy này (server có thể chưa kịp nhận)', () => {
    const justAnswered = { ...local, updatedAt: new Date(NOW - LOCAL_FRESH_MS + 1000).toISOString() };
    expect(getLiveBookingUpdates(justAnswered, { live: { ...local, pending_changes: proposal }, now: NOW })).toBeNull();
  });

  it('đơn đã kết thúc trong trình duyệt thì giữ nguyên; "Đã thanh toán" không bị trạng thái cọc đè', () => {
    expect(getLiveBookingUpdates({ ...local, status: 'cancelled' }, { live: { ...local, status: 'check-in' }, now: NOW })).toBeNull();
    const paid = { ...local, paymentStatus: 'Đã thanh toán' };
    expect(getLiveBookingUpdates(paid, { live: { ...paid, paymentStatus: 'deposit_paid' }, now: NOW })).toBeNull();
  });
});

describe('Đề xuất đang chờ giữa "Lịch đặt" và kho phòng', () => {
  it('bản cũ trong trình duyệt không xóa mất đề xuất mới trên server', () => {
    expect(latestPendingChanges({ pending_changes: null, updatedAt: OLD }, { pending_changes: proposal })).toBe(proposal);
  });

  it('khách đã trả lời (cập nhật sau lúc gửi đề xuất) thì bỏ đề xuất', () => {
    expect(latestPendingChanges({ pending_changes: null, updatedAt: new Date(NOW).toISOString() }, { pending_changes: proposal })).toBeNull();
  });

  it('đề xuất trong trình duyệt luôn được giữ', () => {
    expect(latestPendingChanges({ pending_changes: proposal }, { pending_changes: null })).toBe(proposal);
  });
});
