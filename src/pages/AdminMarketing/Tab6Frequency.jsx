import React, { useState } from 'react';
import { Save, Clock, AlarmClock, MessageSquare, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MKT_STORAGE_KEYS, saveToStorage } from './marketingStore';

const Tab6Frequency = ({ frequency, setFrequency }) => {
  const [form, setForm] = useState({ ...frequency });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    if (form.maxPerWeek < 1 || form.maxPerWeek > 30) { toast.error('Số tin tối đa phải từ 1 đến 30!'); return; }
    if (form.minGapHours < 1) { toast.error('Khoảng cách tối thiểu phải lớn hơn 0 giờ!'); return; }
    setFrequency(form);
    saveToStorage(MKT_STORAGE_KEYS.FREQUENCY, form);
    toast.success('Đã lưu cài đặt giới hạn tần suất!');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
          <h3 className="text-sm font-bold text-gray-800">Cài đặt giới hạn tần suất gửi tin</h3>

          {/* Số tin tối đa */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-800 mb-0.5">Số tin tối đa / khách / tuần</label>
              <p className="text-xs text-gray-500 mb-3">Giới hạn số lượng tin marketing mỗi khách hàng nhận trong 1 tuần</p>
              <div className="flex items-center gap-3">
                <input type="number" min={1} max={30} value={form.maxPerWeek} onChange={e => set('maxPerWeek', Number(e.target.value))}
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                <span className="text-sm text-gray-500">tin/tuần</span>
              </div>
            </div>
          </div>

          {/* Khoảng cách tối thiểu */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-800 mb-0.5">Khoảng cách tối thiểu giữa 2 tin</label>
              <p className="text-xs text-gray-500 mb-3">Hệ thống sẽ không gửi 2 tin marketing liên tiếp trong khoảng thời gian này</p>
              <div className="flex items-center gap-3">
                <input type="number" min={1} max={168} value={form.minGapHours} onChange={e => set('minGapHours', Number(e.target.value))}
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                <span className="text-sm text-gray-500">giờ</span>
              </div>
            </div>
          </div>

          {/* Khung giờ yên lặng */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <AlarmClock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-800 mb-0.5">Khung giờ yên lặng</label>
              <p className="text-xs text-gray-500 mb-3">Không gửi tin trong khoảng thời gian này. Tin sẽ được trì hoãn đến sau giờ bắt đầu.</p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">Từ:</span>
                  <input type="time" value={form.quietStart} onChange={e => set('quietStart', e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600">Đến:</span>
                  <input type="time" value={form.quietEnd} onChange={e => set('quietEnd', e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Tạm dừng khi có khiếu nại */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 flex items-start justify-between gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-0.5">Tạm dừng với khách có khiếu nại chưa xử lý</label>
                <p className="text-xs text-gray-500">Khách hàng có khiếu nại chưa giải quyết sẽ không nhận tin marketing cho đến khi khiếu nại được đóng</p>
              </div>
              <button type="button" onClick={() => set('pauseOnComplaint', !form.pauseOnComplaint)}
                className={`relative inline-flex w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${form.pauseOnComplaint ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.pauseOnComplaint ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Lưu */}
          <div className="flex justify-end pt-2">
            <button type="submit" className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
              <Save className="h-4 w-4" />
              Lưu cài đặt
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Tab6Frequency;
