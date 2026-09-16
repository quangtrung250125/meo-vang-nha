import React, { useState, useMemo } from 'react';
import {
  Utensils, Droplets, Smile, HeartPulse, Sparkles, Camera,
  AlertTriangle, CheckCircle2, MessageCircle, X, Bell, Filter,
  CalendarDays, ChevronDown, Send, Phone, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const generateMockReports = (checkIn, checkOut) => {
  const base = checkIn || '2026-09-16';
  const baseDate2 = checkOut || '2026-09-17';
  return [
    { id: 1, date: base, time: '08:00', type: 'eating', label: 'Ăn sáng', status: 'normal', note: 'Bé ăn hết 1/2 phần cá hồi, uống nước bình thường.', images: ['https://placecats.com/400/300', 'https://placecats.com/401/300'], staff: 'Nhân viên Hoa' },
    { id: 2, date: base, time: '09:30', type: 'health', label: 'Kiểm tra sức khỏe', status: 'issue', note: 'Bé có dấu hiệu sổ mũi nhẹ, nhịp thở hơi nhanh. Đã báo bác sĩ theo dõi.', images: ['https://placecats.com/402/300'], staff: 'Bác sĩ Minh' },
    { id: 3, date: base, time: '11:00', type: 'play', label: 'Giờ vui chơi', status: 'normal', note: 'Bé chơi với đồ chơi lông vũ, tâm trạng tốt hơn sau khi nghỉ ngơi.', images: ['https://placecats.com/403/300', 'https://placecats.com/404/300'], staff: 'Nhân viên Hoa' },
    { id: 4, date: base, time: '12:30', type: 'hygiene', label: 'Vệ sinh', status: 'normal', note: 'Bé đi vệ sinh bình thường (1 tiểu, 1 đại). Khay sạch sẽ.', images: [], staff: 'Nhân viên Nam' },
    { id: 5, date: base, time: '14:00', type: 'eating', label: 'Bữa trưa', status: 'warning', note: 'Bé bỏ bữa trưa, chỉ liếm nước. Cần theo dõi bữa tối.', images: ['https://placecats.com/406/300'], staff: 'Nhân viên Hoa' },
    { id: 6, date: base, time: '17:30', type: 'mood', label: 'Theo dõi tâm trạng', status: 'normal', note: 'Bé ngủ ngon, không có dấu hiệu stress.', images: ['https://placecats.com/407/300'], staff: 'Nhân viên Nam' },
    { id: 7, date: baseDate2, time: '07:30', type: 'eating', label: 'Ăn sáng', status: 'normal', note: 'Bé ăn hết phần thức ăn, ngon miệng hơn hôm qua!', images: ['https://placecats.com/408/300'], staff: 'Nhân viên Hoa' },
    { id: 8, date: baseDate2, time: '10:00', type: 'health', label: 'Kiểm tra sức khỏe', status: 'normal', note: 'Bé hết sổ mũi, khỏe mạnh bình thường. Bác sĩ đã xác nhận ổn.', images: [], staff: 'Bác sĩ Minh' },
    { id: 9, date: baseDate2, time: '15:00', type: 'play', label: 'Giờ vui chơi', status: 'normal', note: 'Bé rất năng động, chơi đùa với các bé khác trong khu vui chơi.', images: ['https://placecats.com/409/300', 'https://placecats.com/410/300'], staff: 'Nhân viên Nam' },
  ].sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
};

const TYPE_CONFIG = {
  eating:  { label: 'Ăn uống',   icon: Utensils,   color: 'text-orange-500', bg: 'bg-orange-50',  border: 'border-orange-200' },
  hygiene: { label: 'Vệ sinh',   icon: Droplets,   color: 'text-blue-500',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  mood:    { label: 'Tâm trạng', icon: Smile,      color: 'text-purple-500', bg: 'bg-purple-50',  border: 'border-purple-200' },
  health:  { label: 'Sức khỏe', icon: HeartPulse, color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-200'    },
  play:    { label: 'Vui chơi',  icon: Sparkles,   color: 'text-yellow-500', bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  camera:  { label: 'Camera',    icon: Camera,     color: 'text-gray-500',   bg: 'bg-gray-50',    border: 'border-gray-200'   },
};

const STATUS_CONFIG = {
  normal:  { label: 'Bình thường', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400', ring: '' },
  warning: { label: 'Cần chú ý',  badge: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-400',   ring: 'ring-2 ring-amber-300' },
  issue:   { label: 'Có vấn đề',  badge: 'bg-red-100 text-red-700',         dot: 'bg-red-500',     ring: 'ring-2 ring-red-400' },
};

const QuickMessageModal = ({ onClose, reportLabel }) => {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  const handleSend = () => {
    if (!msg.trim()) return;
    setSent(true);
    toast.success('Tin nhắn đã được gửi tới nhân viên!');
    setTimeout(onClose, 1500);
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-3xl p-7 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-primary" /></div>
            <div><h3 className="font-bold text-text-dark text-base">Nhắn tin nhanh</h3><p className="text-xs text-gray-500">Liên quan: {reportLabel}</p></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-2 mb-4">
          <a href="tel:0904957555" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-primary hover:text-primary transition-colors"><Phone className="w-4 h-4" />Gọi điện</a>
          <a href="https://zalo.me/0904957555" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-200 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"><MessageCircle className="w-4 h-4" />Zalo</a>
        </div>
        {!sent ? (
          <>
            <textarea className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary text-text-dark h-28" placeholder="Nhập câu hỏi hoặc thắc mắc của bạn..." value={msg} onChange={(e) => setMsg(e.target.value)} />
            <button onClick={handleSend} disabled={!msg.trim()} className="mt-3 w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-xl hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Send className="w-4 h-4" />Gửi tin nhắn</button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 text-emerald-600"><CheckCircle2 className="w-10 h-10" /><p className="font-semibold">Đã gửi thành công!</p></div>
        )}
      </div>
    </div>
  );
};

const Lightbox = ({ src, onClose }) => (
  <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
    <img src={src} alt="preview" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
    <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={onClose}><X className="w-8 h-8" /></button>
  </div>
);

const ReportCard = ({ report, onMessage }) => {
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const typeConf = TYPE_CONFIG[report.type] || TYPE_CONFIG.camera;
  const statusConf = STATUS_CONFIG[report.status] || STATUS_CONFIG.normal;
  const Icon = typeConf.icon;
  const isAlert = report.status === 'issue' || report.status === 'warning';
  return (
    <>
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      <div className={elative bg-white border  rounded-2xl p-5 shadow-sm transition-all hover:shadow-md }>
        {report.status === 'issue' && (<div className="flex items-center gap-2 mb-3 bg-red-100 text-red-700 text-xs font-bold px-3 py-2 rounded-xl"><AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse" /><span>⚠️ Phát hiện vấn đề – Nhân viên đã được thông báo ngay lập tức</span></div>)}
        {report.status === 'warning' && (<div className="flex items-center gap-2 mb-3 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-2 rounded-xl"><AlertTriangle className="w-4 h-4 flex-shrink-0" /><span>Cần chú ý – Nhân viên đang theo dõi</span></div>)}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0   border}><Icon className={w-5 h-5 } /></div>
            <div>
              <p className="font-bold text-text-dark text-sm">{report.label}</p>
              <div className="flex items-center gap-1.5 mt-0.5"><Clock className="w-3 h-3 text-gray-400" /><span className="text-xs text-gray-500 font-medium">{report.time}</span><span className="text-gray-300">•</span><span className="text-xs text-gray-400">{report.staff}</span></div>
            </div>
          </div>
          <span className={	ext-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 }><span className={inline-block w-1.5 h-1.5 rounded-full mr-1.5 }></span>{statusConf.label}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-4 bg-gray-50/80 rounded-xl px-3 py-2.5">{report.note}</p>
        {report.images && report.images.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {report.images.map((src, i) => (<img key={i} src={src} alt={nh } onClick={() => setLightboxSrc(src)} className="w-20 h-20 object-cover rounded-xl flex-shrink-0 border border-gray-100 cursor-pointer hover:opacity-90 hover:scale-105 transition-all" />))}
          </div>
        )}
        <button onClick={() => onMessage(report)} className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-secondary bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"><MessageCircle className="w-3.5 h-3.5" />Nhắn tin cho nhân viên</button>
      </div>
    </>
  );
};

const ActivityReport = ({ bookingData }) => {
  const checkIn = bookingData?.checkIn;
  const checkOut = bookingData?.checkOut;
  const allReports = useMemo(() => generateMockReports(checkIn, checkOut), [checkIn, checkOut]);
  const dates = useMemo(() => { const set = new Set(allReports.map(r => r.date)); return ['Tất cả', ...Array.from(set).sort().reverse()]; }, [allReports]);
  const types = ['Tất cả', ...Object.keys(TYPE_CONFIG)];
  const [filterDate, setFilterDate] = useState('Tất cả');
  const [filterType, setFilterType] = useState('Tất cả');
  const [msgModal, setMsgModal] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const issueCount = allReports.filter(r => r.status === 'issue').length;
  const warningCount = allReports.filter(r => r.status === 'warning').length;
  const filtered = useMemo(() => allReports.filter(r => (filterDate === 'Tất cả' || r.date === filterDate) && (filterType === 'Tất cả' || r.type === filterType)), [allReports, filterDate, filterType]);
  const formatDate = (d) => { if (!d || d === 'Tất cả') return 'Tất cả'; const [y, m, day] = d.split('-'); return ${day}//; };
  return (
    <>
      {msgModal && <QuickMessageModal onClose={() => setMsgModal(null)} reportLabel={msgModal.label} />}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm"><p className="text-2xl font-black text-text-dark">{allReports.length}</p><p className="text-xs text-gray-500 font-semibold mt-0.5">Tổng báo cáo</p></div>
          <div className={order rounded-2xl p-4 text-center shadow-sm }><p className={	ext-2xl font-black }>{issueCount}</p><p className="text-xs text-gray-500 font-semibold mt-0.5">Có vấn đề</p></div>
          <div className={order rounded-2xl p-4 text-center shadow-sm }><p className={	ext-2xl font-black }>{warningCount}</p><p className="text-xs text-gray-500 font-semibold mt-0.5">Cần chú ý</p></div>
        </div>
        {issueCount > 0 && (<div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4"><Bell className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5 animate-bounce" /><div><p className="font-bold text-red-700 text-sm">Có {issueCount} vấn đề cần chú ý!</p><p className="text-red-600 text-xs mt-0.5">Cửa hàng đã thông báo ngay cho nhân viên. Bạn có thể nhắn tin hỏi thêm để nắm tình hình.</p></div></div>)}
        <div>
          <button onClick={() => setShowFilters(v => !v)} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors"><Filter className="w-4 h-4" />Bộ lọc<ChevronDown className={w-4 h-4 transition-transform } /></button>
          {showFilters && (
            <div className="mt-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-2"><CalendarDays className="w-3.5 h-3.5" />Lọc theo ngày</label><div className="flex flex-wrap gap-2">{dates.map(d => (<button key={d} onClick={() => setFilterDate(d)} className={px-3 py-1.5 rounded-full text-xs font-semibold border transition-all }>{formatDate(d)}</button>))}</div></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-2"><Filter className="w-3.5 h-3.5" />Lọc theo loại</label><div className="flex flex-wrap gap-2">{types.map(t => { const conf = TYPE_CONFIG[t]; return (<button key={t} onClick={() => setFilterType(t)} className={px-3 py-1.5 rounded-full text-xs font-semibold border transition-all }>{conf ? conf.label : 'Tất cả'}</button>); })}</div></div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Hiển thị <span className="font-bold text-text-dark">{filtered.length}</span> báo cáo</p>{(filterDate !== 'Tất cả' || filterType !== 'Tất cả') && (<button onClick={() => { setFilterDate('Tất cả'); setFilterType('Tất cả'); }} className="text-xs text-gray-500 hover:text-red-500 underline transition-colors">Xóa bộ lọc</button>)}</div>
        {filtered.length === 0 ? (<div className="text-center py-16 bg-white rounded-2xl border border-gray-100"><Sparkles className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-gray-400 font-semibold">Không có báo cáo nào phù hợp.</p></div>) : (<div className="space-y-4">{filtered.map(report => (<ReportCard key={report.id} report={report} onMessage={setMsgModal} />))}</div>)}
      </div>
    </>
  );
};

export default ActivityReport;
