import { describe, expect, it } from 'vitest';
import { canUndoLog, getTodayTaskStatus, vnDateKey, vnDateLabel, vnTime } from '../../src/utils/careTasks';
import { getStayingCats, getTodayCheckIns, getTodayCheckOuts } from '../../src/utils/stayingCats';

describe('Giờ Việt Nam cho nhật ký chăm sóc', () => {
  it('17:30 UTC đã là ngày hôm sau ở Việt Nam', () => {
    expect(vnDateKey('2026-11-16T17:30:00Z')).toBe('2026-11-17');
    expect(vnTime('2026-11-16T17:30:00Z')).toBe('00:30');
  });

  it('nhãn ngày: hôm nay hoặc thứ trong tuần', () => {
    expect(vnDateLabel('2026-11-17T01:00:00Z', '2026-11-17')).toBe('Hôm nay, 17/11');
    expect(vnDateLabel('2026-11-16T01:00:00Z', '2026-11-17')).toMatch(/^Thứ Hai, 16\/11$/);
  });
});

describe('Trạng thái tác vụ hôm nay', () => {
  const logs = [
    { id: 'a', type: 'eating', createdAt: '2026-11-17T01:15:00Z' },
    { id: 'b', type: 'eating', createdAt: '2026-11-17T05:00:00Z' },
    { id: 'c', type: 'play', createdAt: '2026-11-17T02:00:00Z' },
    { id: 'd', type: 'hygiene', createdAt: '2026-11-16T03:00:00Z' }, // hôm qua
    { id: 'e', type: 'health', status: 'watch', createdAt: '2026-11-17T03:00:00Z' },
  ];

  it('tính theo ngày Việt Nam, lấy lần hoàn thành đầu tiên', () => {
    const status = getTodayTaskStatus(logs, '2026-11-17');
    expect(status.fed).toBe(true);
    expect(status.done.fed).toEqual({ at: '2026-11-17T01:15:00Z', logId: 'a' });
    expect(status.played).toBe(true); // 'play' cũ được tính là Vận động
    expect(status.hygiene).toBe(false); // dọn hôm qua không tính cho hôm nay
    expect(status.hasWarning).toBe(true);
  });

  it('chỉ hoàn tác được trong 5 phút', () => {
    const at = Date.parse('2026-11-17T01:00:00Z');
    expect(canUndoLog({ createdAt: '2026-11-17T01:00:00Z' }, at + 4 * 60000)).toBe(true);
    expect(canUndoLog({ createdAt: '2026-11-17T01:00:00Z' }, at + 6 * 60000)).toBe(false);
  });
});

describe('Một nguồn dữ liệu cho Tổng quan và Tình trạng phòng', () => {
  const roomBookings = {
    'VIP-01': [
      { code: 'MVN-1', status: 'đang ở', checkIn: '2026-11-15', checkOut: '2026-11-17', ownerName: 'An', petProfiles: [{ id: 1, name: 'Mochi' }, { id: 'p2', name: 'Bơ' }] },
      { code: 'MVN-2', status: 'check-in', checkIn: '2026-11-17', checkOut: '2026-11-19', ownerName: 'Bình' },
    ],
    'VIP-02': [
      { code: 'MVN-3', status: 'đang ở', checkIn: '2026-11-16', checkOut: '2026-11-20', catNames: 'Mướp' },
    ],
    'VIP-03': [
      // Đơn ở nhiều phòng vẫn chỉ tính 1 lần
      { code: 'MVN-3', status: 'đang ở', checkIn: '2026-11-16', checkOut: '2026-11-20', catNames: 'Mướp' },
    ],
  };

  it('chỉ lấy bé của đơn đã check-in, đúng phòng, không có mèo mẫu', () => {
    const cats = getStayingCats(roomBookings, [{ id: 'p2', name: 'Bơ mới', imagePreview: 'bo.jpg' }]);
    expect(cats.map((c) => [c.bookingId, c.id, c.catName, c.roomId])).toEqual([
      ['MVN-1', '1', 'Mochi', 'VIP-01'],
      ['MVN-1', 'p2', 'Bơ', 'VIP-01'],
      ['MVN-3', 'pet_MVN-3', 'Mướp', 'VIP-02'],
    ]);
    expect(getStayingCats({}, [])).toEqual([]);
  });

  it('danh sách cần check-in / check-out hôm nay', () => {
    expect(getTodayCheckIns(roomBookings, '2026-11-17').map((b) => b.code)).toEqual(['MVN-2']);
    expect(getTodayCheckOuts(roomBookings, '2026-11-17').map((b) => b.code)).toEqual(['MVN-1']);
  });
});
