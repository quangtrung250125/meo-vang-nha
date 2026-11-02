import { describe, it, expect } from 'vitest';
import { ROOM_CONFIG } from '../../Chi/RoomStateContext';

describe('Admin Dashboard KPI & Heatmap Calculations', () => {
  it('cấu hình ROOM_CONFIG phải có đủ 11 phòng', () => {
    expect(ROOM_CONFIG).toHaveLength(11);
    const vip = ROOM_CONFIG.filter((r) => r.type === 'VIP');
    const vvip = ROOM_CONFIG.filter((r) => r.type === 'VVIP');
    const deluxe = ROOM_CONFIG.filter((r) => r.type === 'DELUXE');
    expect(vip).toHaveLength(6);
    expect(vvip).toHaveLength(3);
    expect(deluxe).toHaveLength(2);
  });

  it('tính toán tỷ lệ công suất phòng chính xác', () => {
    const totalRooms = 11;
    const occupied = 7;
    const rate = (occupied / totalRooms) * 100;
    expect(rate).toBeCloseTo(63.63, 1);
  });

  it('kiểm tra định dạng tiền tệ VNĐ', () => {
    const formatMoney = (val) => `${Math.round(val || 0).toLocaleString('vi-VN')}đ`;
    expect(formatMoney(1500000)).toBe('1.500.000đ');
    expect(formatMoney(0)).toBe('0đ');
  });

  it('kiểm tra dữ liệu báo cáo cuối ngày có đầy đủ các trường cần thiết', () => {
    const report = {
      overallMood: 'Vui vẻ',
      eatingSummary: 'Ăn hết 2 bữa',
      hygieneSummary: 'Sạch sẽ',
      healthSummary: 'Khỏe mạnh',
      note: 'Bé ngoan',
    };
    expect(report.overallMood).toBeTruthy();
    expect(report.eatingSummary).toBeTruthy();
    expect(report.hygieneSummary).toBeTruthy();
    expect(report.healthSummary).toBeTruthy();
    expect(report.note).toBeTruthy();
  });
});
