import { describe, it, expect } from 'vitest';
import {
  MARKETING_TABS,
  CUSTOMER_SEGMENTS,
  CHANNELS,
  formatCurrency,
  formatPercent,
  initialScenarios,
  initialTemplates,
  initialFrequency,
} from '../../src/pages/AdminMarketing/marketingStore';

describe('Admin Marketing Automation Store & Data', () => {
  describe('Cấu hình Tabs & Phân khúc', () => {
    it('định nghĩa đầy đủ 6 tabs chức năng', () => {
      expect(MARKETING_TABS).toHaveLength(6);
      const tabIds = MARKETING_TABS.map(t => t.id);
      expect(tabIds).toEqual(['scenarios', 'templates', 'schedule', 'results', 'inbox', 'frequency']);
      expect(MARKETING_TABS[0].label).toBe('Kịch bản');
      expect(MARKETING_TABS[1].label).toBe('Mẫu tin nhắn');
      expect(MARKETING_TABS[2].label).toBe('Lịch gửi & đối tượng');
      expect(MARKETING_TABS[3].label).toBe('Kết quả');
      expect(MARKETING_TABS[4].label).toBe('Hộp thư tập trung');
      expect(MARKETING_TABS[5].label).toBe('Giới hạn tần suất');
    });

    it('định nghĩa các phân khúc khách hàng bằng tiếng Việt có dấu', () => {
      expect(CUSTOMER_SEGMENTS.length).toBeGreaterThanOrEqual(10);
      const potential = CUSTOMER_SEGMENTS.find(s => s.id === 'potential');
      expect(potential?.label).toBe('Tiềm năng');
      const atRisk = CUSTOMER_SEGMENTS.find(s => s.id === 'at_risk');
      expect(atRisk?.label).toBe('Nguy cơ rời bỏ');
    });

    it('hỗ trợ đầy đủ các kênh gửi', () => {
      const channelIds = CHANNELS.map(c => c.id);
      expect(channelIds).toContain('zalo');
      expect(channelIds).toContain('email');
      expect(channelIds).toContain('sms');
      expect(channelIds).toContain('webpush');
      expect(channelIds).toContain('call');
    });
  });

  describe('Định dạng Formatters', () => {
    it('định dạng tiền tệ theo chuẩn Việt Nam có ký hiệu đ', () => {
      expect(formatCurrency(43200000)).toBe('43.200.000đ');
      expect(formatCurrency(0)).toBe('0đ');
      expect(formatCurrency(null)).toBe('0đ');
    });

    it('định dạng phần trăm chính xác 1 chữ số thập phân', () => {
      expect(formatPercent(45.0)).toBe('45.0%');
      expect(formatPercent(3.75)).toBe('3.8%');
      expect(formatPercent(null)).toBe('0%');
    });
  });

  describe('Kịch bản tự động', () => {
    it('khởi tạo 7 kịch bản chuẩn', () => {
      expect(initialScenarios).toHaveLength(7);
      const sc1 = initialScenarios[0];
      expect(sc1.name).toBe('Đăng ký nhưng chưa đặt phòng sau 3 ngày');
      expect(sc1.enabled).toBe(true);

      const winback = initialScenarios.find(s => s.id === 'sc-7');
      expect(winback?.enabled).toBe(false);
      expect(winback?.segment).toBe('at_risk');
    });
  });

  describe('Mẫu tin nhắn & Cá nhân hóa', () => {
    it('các mẫu tin nhắn có chứa biến cá nhân hóa {ten_chu} hoặc {ten_meo}', () => {
      expect(initialTemplates.length).toBeGreaterThanOrEqual(7);
      initialTemplates.forEach(tpl => {
        expect(tpl.body).toBeDefined();
        expect(tpl.variables.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Giới hạn tần suất', () => {
    it('có cấu hình mặc định hợp lý cho tần suất gửi', () => {
      expect(initialFrequency.maxPerWeek).toBe(3);
      expect(initialFrequency.minGapHours).toBe(24);
      expect(initialFrequency.pauseOnComplaint).toBe(true);
    });
  });
});
