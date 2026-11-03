import React, { useMemo, useState } from 'react';
import { Clock, Users, Calendar, Send, Loader, BellOff, ShieldAlert } from 'lucide-react';
import { VN_OFFSET_MS } from '../../utils/marketingEngine';

const STATUS_CONFIG = {
  ready:     { label: 'Chờ gửi', color: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Loader },
  no_device: { label: 'Chưa bật thông báo', color: 'bg-gray-100 text-gray-500 border-gray-200', Icon: BellOff },
  blocked:   { label: 'Tạm hoãn', color: 'bg-purple-50 text-purple-700 border-purple-200', Icon: ShieldAlert },
};

const fmtTime = (t) => {
  const d = new Date(t + VN_OFFSET_MS).toISOString();
  return `${d.slice(8, 10)}/${d.slice(5, 7)} ${d.slice(11, 16)}`;
};

const Tab3Schedule = ({ evaluation, send, openManual, status }) => {
  const [selected, setSelected] = useState(() => new Set());
  const [sending, setSending] = useState(false);

  // Lịch gửi sắp tới: gom theo kịch bản + giờ gửi
  const schedule = useMemo(() => {
    const groups = new Map();
    evaluation.upcoming.forEach((item) => {
      const key = `${item.scenarioId}|${item.dueAt}`;
      if (!groups.has(key)) groups.set(key, { id: key, scenarioName: item.scenarioName, dueAt: item.dueAt, people: [] });
      groups.get(key).people.push(item.customerName);
    });
    return [...groups.values()].sort((a, b) => a.dueAt - b.dueAt);
  }, [evaluation.upcoming]);

  const pending = useMemo(() => [
    ...evaluation.due.map((d) => ({ ...d, state: d.hasDevice === false ? 'no_device' : 'ready' })),
    ...evaluation.blocked.map((d) => ({ ...d, state: 'blocked' })),
  ], [evaluation.due, evaluation.blocked]);

  const readyCount = pending.filter((p) => p.state === 'ready').length;
  const toggle = (key) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const allSelected = pending.length > 0 && pending.every((p) => selected.has(p.dedupeKey));

  // Admin chủ động gửi các tin đã chọn (bỏ qua giới hạn tần suất, vẫn không gửi trùng)
  const handleSendSelected = async () => {
    const list = pending.filter((p) => selected.has(p.dedupeKey));
    if (!list.length) return;
    setSending(true);
    await send(list, 'manual');
    setSelected(new Set());
    setSending(false);
  };

  return (
    <div className="space-y-6">
      {/* Lịch gửi sắp tới */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-gray-800">Lịch gửi sắp tới (14 ngày)</h3>
          <span className="ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">{schedule.length} đợt gửi</span>
        </div>
        <div className="divide-y divide-gray-50">
          {schedule.length === 0 && <p className="px-5 py-8 text-center text-sm text-gray-400">Chưa có tin nào được lên lịch. Lịch tự cập nhật theo đơn đặt phòng và khách hàng thật.</p>}
          {schedule.map(item => (
            <div key={item.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{item.scenarioName}</p>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(item.dueAt)}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="h-3 w-3" />{item.people.length} người: {item.people.slice(0, 3).join(', ')}{item.people.length > 3 ? '…' : ''}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">Sắp gửi</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danh sách người nhận */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-gray-800">Đối tượng chờ gửi</h3>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">{readyCount} tin sẽ tự gửi</span>
          <div className="ml-auto flex gap-2">
            <button onClick={() => openManual({ customerIds: [...new Set(pending.filter(p => selected.has(p.dedupeKey)).map(p => p.customerId))] })}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer">
              Soạn tin khác cho khách đã chọn
            </button>
            <button onClick={handleSendSelected} disabled={!selected.size || sending || status?.pushConfigured === false} data-testid="send-selected"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold cursor-pointer">
              <Send className="h-3.5 w-3.5" />{sending ? 'Đang gửi...' : `Gửi ngay ${selected.size || ''} tin đã chọn`}
            </button>
          </div>
        </div>
        <p className="mx-5 my-3 text-[11px] text-gray-500">
          Danh sách lấy từ khách hàng và đơn đặt phòng thật. Tin "Chờ gửi" sẽ tự gửi trong vài phút khi trang Admin đang mở, và hằng ngày lúc 8 giờ sáng.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 w-8"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(pending.map(p => p.dedupeKey)))} className="h-4 w-4 accent-emerald-600" /></th>
                <th className="text-left px-3 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Khách</th>
                <th className="text-left px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Kịch bản / Lý do</th>
                <th className="text-left px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Nội dung</th>
                <th className="text-center px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pending.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">Hiện chưa có khách nào đến hạn nhận tin.</td></tr>
              )}
              {pending.map(r => {
                const sc = STATUS_CONFIG[r.state];
                return (
                  <tr key={r.dedupeKey} className="hover:bg-gray-50/50 align-top">
                    <td className="px-5 py-3.5"><input type="checkbox" checked={selected.has(r.dedupeKey)} onChange={() => toggle(r.dedupeKey)} className="h-4 w-4 accent-emerald-600" /></td>
                    <td className="px-3 py-3.5">
                      <p className="text-sm font-bold text-gray-800">{r.customerName}</p>
                      <p className="text-xs text-gray-400">{r.phone}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs font-bold text-gray-700">{r.scenarioName}</p>
                      <p className="text-xs text-gray-500">{r.reason}</p>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="text-xs font-bold text-gray-700">{r.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{r.body}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sc.color}`}>
                        <sc.Icon className="h-3 w-3" />
                        {sc.label}
                      </span>
                      {r.blockReason && <p className="text-[10px] text-gray-400 mt-1">{r.blockReason}</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tab3Schedule;
