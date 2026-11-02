import React from 'react';
import { Clock, Users, Calendar, Send, CheckCircle2, Loader, AlertCircle, RefreshCw, Info, AlertTriangle } from 'lucide-react';
import { CUSTOMER_SEGMENTS, SEGMENT_COLORS } from './marketingStore';
import { MISSING_DATA_CONDITIONS } from './marketingCustomerAdapter';

const STATUS_CONFIG = {
  pending: { label: 'Chờ gửi (mô phỏng)', color: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Loader },
  sent:    { label: 'Đã gửi (mô phỏng)',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
};

const Tab3Schedule = ({
  scheduleItems = [],
  recipients = [],
  loading = false,
  error = null,
  onRetry = () => {},
  totalCustomers = 0,
}) => {
  const segmentLabel = (id) => CUSTOMER_SEGMENTS.find((s) => s.id === id)?.label || id;
  const pendingCount = recipients.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* 1. Trạng thái lỗi tải dữ liệu */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-800">Không thể tải dữ liệu khách hàng thật</h4>
            <p className="text-xs text-rose-600 mt-1">{error}</p>
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Thử lại ngay
            </button>
          </div>
        </div>
      )}

      {/* 2. Lịch gửi sắp tới */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-800">Lịch gửi sắp tới (tự động tính theo kịch bản đang bật)</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            {scheduleItems.length} đợt gửi
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <Loader className="h-5 w-5 animate-spin text-emerald-500" />
            <span className="text-xs font-medium">Đang tính toán lịch gửi từ dữ liệu khách hàng thật...</span>
          </div>
        ) : scheduleItems.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            Hiện không có kịch bản nào đang bật hoặc chưa có đối tượng phù hợp để lên lịch.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {scheduleItems.map((item) => (
              <div key={item.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{item.scenarioName}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.sendAt}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {item.recipients} người nhận thật
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  Sắp gửi
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Danh sách người nhận thật */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-800">Đối tượng chờ gửi (Dữ liệu khách hàng thật)</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
              Tổng hệ thống: {totalCustomers} khách
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {pendingCount} khách chờ gửi
            </span>
          </div>
        </div>

        {/* Thông báo chế độ an toàn */}
        <div className="mx-5 my-3 px-3 py-2 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
          <Info className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Chế độ an toàn:</strong> Dữ liệu danh sách người nhận là khách hàng thật 100%, nhưng mọi thao tác gửi tin vẫn ở chế độ mô phỏng an toàn, tuyệt đối không gửi tin nhắn thật ra bên ngoài.
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
            <Loader className="h-6 w-6 animate-spin text-emerald-500" />
            <p className="text-sm font-semibold text-gray-600">Đang tải và đồng bộ danh sách khách hàng thật...</p>
            <p className="text-xs text-gray-400">Đang kết nối Supabase, Server Sync và dữ liệu lưu trú</p>
          </div>
        ) : recipients.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-bold text-gray-600">Chưa có khách hàng nào trong danh sách chờ gửi</p>
            <p className="text-xs text-gray-400 mt-1">Khi khách hàng đăng ký, đặt phòng hoặc phát sinh lưu trú, hệ thống sẽ tự động đưa vào đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Khách / Mèo</th>
                  <th className="text-left px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Phân khúc thật</th>
                  <th className="text-left px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Lý do kích hoạt</th>
                  <th className="text-center px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recipients.map((r) => {
                  const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-gray-800">{r.name}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">🐾 Mèo: <span className="text-gray-700">{r.catName}</span></p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${SEGMENT_COLORS[r.segment] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {segmentLabel(r.segment)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-600 font-medium">
                        {r.trigger}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sc.color}`}>
                          <sc.Icon className="h-3 w-3" />
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Khối minh bạch: Các điều kiện chưa có dữ liệu trong hệ thống */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Minh bạch dữ liệu: Các nhóm / điều kiện hiện chưa có trường dữ liệu trong hệ thống
          </h4>
        </div>
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">
          Theo nguyên tắc an toàn dữ liệu, hệ thống tuyệt đối không tự bịa số liệu mẫu cho các trường thiếu:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MISSING_DATA_CONDITIONS.map((cond) => (
            <div key={cond.code} className="bg-white p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-800">{cond.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                  chưa có dữ liệu
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">{cond.reason}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tab3Schedule;
