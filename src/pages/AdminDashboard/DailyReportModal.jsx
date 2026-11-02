import React, { useState } from 'react';
import { FileText, Send, X, CheckCircle2, Utensils, Smile, Droplets, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';

const DailyReportModal = ({ isOpen, onClose, cat, onSendReport }) => {
  const [reportNote, setReportNote] = useState(
    'Hôm nay bé ăn uống rất ngon miệng, vận động linh hoạt cùng nhân viên và các bạn. Vệ sinh tốt, tinh thần vui vẻ thoải mái. Mèo Vắng Nhà chúc bé và gia đình buổi tối an lành! 🐱🌙'
  );
  const [overallMood, setOverallMood] = useState('Vui vẻ & Ngoan ngoãn');
  const [eatingSummary, setEatingSummary] = useState('Ăn hết 2 bữa tiêu chuẩn (100g)');
  const [hygieneSummary, setHygieneSummary] = useState('Khay cát sạch, phân khuôn tốt');
  const [healthSummary, setHealthSummary] = useState('Khỏe mạnh, mắt mũi sạch sẽ');

  if (!isOpen || !cat) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();

    const reportData = {
      overallMood,
      eatingSummary,
      hygieneSummary,
      healthSummary,
      note: reportNote.trim(),
    };

    onSendReport(cat, reportData);
    toast.success(`Đã gửi Báo Cáo Cuối Ngày của bé ${cat.catName} tới khách hàng! 📋✨`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight font-title">
                Gửi báo cáo tổng kết cuối ngày
              </h3>
              <p className="text-white/80 text-xs mt-0.5">
                Bé: <b>{cat.catName}</b> • Phòng: {cat.room} • Khách: {cat.ownerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="bg-purple-50 border border-purple-200/80 rounded-2xl p-4">
            <p className="text-xs font-bold text-purple-900 mb-1">📋 Tổng hợp chăm sóc hôm nay</p>
            <p className="text-[11px] text-purple-700">
              Báo cáo này sẽ được gửi trực tiếp đến ứng dụng khách hàng và hiển thị nổi bật trên màn hình Theo dõi lưu trú.
            </p>
          </div>

          {/* Ăn uống */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1">
              <Utensils className="w-3.5 h-3.5 text-orange-500" />
              Tình hình ăn uống
            </label>
            <input
              type="text"
              value={eatingSummary}
              onChange={(e) => setEatingSummary(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>

          {/* Vận động & Tâm trạng */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1">
              <Smile className="w-3.5 h-3.5 text-purple-500" />
              Tâm trạng & Vận động
            </label>
            <input
              type="text"
              value={overallMood}
              onChange={(e) => setOverallMood(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>

          {/* Vệ sinh */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              Tình trạng vệ sinh
            </label>
            <input
              type="text"
              value={hygieneSummary}
              onChange={(e) => setHygieneSummary(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>

          {/* Sức khỏe */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase mb-1">
              <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
              Tình trạng sức khỏe
            </label>
            <input
              type="text"
              value={healthSummary}
              onChange={(e) => setHealthSummary(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>

          {/* Nhận xét tổng kết */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Lời nhắn gửi gia đình bé
            </label>
            <textarea
              rows="3"
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Gửi báo cáo cuối ngày
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyReportModal;
