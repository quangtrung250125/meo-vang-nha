import React from 'react';
import { Clock, Users, Calendar, Send, CheckCircle2, Loader } from 'lucide-react';
import { CUSTOMER_SEGMENTS, SEGMENT_COLORS } from './marketingStore';

const STATUS_CONFIG = {
  pending: { label: 'Cho gui', color: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Loader },
  sent:    { label: 'Da gui',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
};

const Tab3Schedule = ({ scheduleItems, recipients }) => {
  const segmentLabel = (id) => CUSTOMER_SEGMENTS.find(s => s.id === id)?.label || id;
  const pendingCount = recipients.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Lich gui sap toi */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-gray-800">Lich gui sap toi</h3>
          <span className="ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">{scheduleItems.length} dot gui</span>
        </div>
        <div className="divide-y divide-gray-50">
          {scheduleItems.map(item => (
            <div key={item.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{item.scenarioName}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" />{item.sendAt}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="h-3 w-3" />{item.recipients} nguoi</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">Sap gui</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danh sach nguoi nhan */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Users className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-gray-800">Doi tuong cho gui</h3>
          <span className="ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">{pendingCount} khach cho gui</span>
        </div>
        {/* CANH BAO: Du lieu mau — chua noi API dat phong va khach hang that */}
        <div className="mx-5 my-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700 font-medium">
          ⚠️ Du lieu mau — chua noi API dat phong va khach hang that. Sau khi ket noi, danh sach nay se tu dong cap nhat.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Khach / Meo</th>
                <th className="text-left px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Phan khuc</th>
                <th className="text-left px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Ly do kich hoat</th>
                <th className="text-center px-4 py-3 text-[11px] font-black text-gray-400 uppercase tracking-wider">Trang thai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recipients.map(r => {
                const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-bold text-gray-800">{r.name}</p>
                      <p className="text-xs text-gray-400">Meo: {r.catName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${SEGMENT_COLORS[r.segment] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>{segmentLabel(r.segment)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{r.trigger}</td>
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
      </div>
    </div>
  );
};

export default Tab3Schedule;
