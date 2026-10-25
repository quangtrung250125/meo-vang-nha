import React, { useState } from "react";
import {
  Star,
  MessageSquare,
  BarChart2,
  AlertTriangle,
  ThumbsDown,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Smile,
  Frown,
  Tag,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const mockReviews = [
  { id: 1, author: "Nguyen Thi Lan", avatar: "NL", rating: 5, date: "22/10/2026", petName: "Be Cam", comment: "Dich vu tuyet voi! Nhan vien cham soc meo rat tan tam, be Cam ve nha vui ve va khoe manh.", status: "replied", tags: ["Cham soc tot", "Nhan vien than thien"] },
  { id: 2, author: "Tran Van Minh", avatar: "TM", rating: 4, date: "20/10/2026", petName: "Mochi", comment: "Phong sach se, meo duoc cham soc tot. Hy vong lan sau gia phong VIP se uu dai hon.", status: "pending", tags: ["Phong sach", "Gia ca"] },
  { id: 3, author: "Le Thi Hong", avatar: "LH", rating: 2, date: "18/10/2026", petName: "Be Xam", comment: "Meo ve co ve cang thang hon binh thuong. Toi khong thay nhat ky cham soc duoc cap nhat day du.", status: "complaint", tags: ["Cang thang", "Nhat ky thieu"] },
  { id: 4, author: "Pham Quoc Bao", avatar: "PB", rating: 5, date: "15/10/2026", petName: "Luna", comment: "Lan dau gui meo ma yen tam tuyet doi. App theo doi rat tien loi, cam on doi ngu!", status: "replied", tags: ["App tien loi", "Yen tam"] },
  { id: 5, author: "Vu Thanh Tu", avatar: "VT", rating: 1, date: "12/10/2026", petName: "Be Den", comment: "Rat that vong. Meo bi thuong nho o chan ma khong duoc thong bao kip thoi.", status: "complaint", tags: ["Bi thuong", "Thieu thong bao"] },
  { id: 6, author: "Hoang Bich Ngan", avatar: "HN", rating: 4, date: "10/10/2026", petName: "Kitty", comment: "Moi truong sach se va an toan. Nhan vien nhiet tinh. Se quay lai lan sau!", status: "replied", tags: ["An toan", "Nhan vien nhiet tinh"] },
  { id: 7, author: "Dinh Cong Son", avatar: "DS", rating: 3, date: "08/10/2026", petName: "Miso", comment: "Tam on. Phong hoi nho so voi gia tien nhung meo trong co ve binh thuong.", status: "pending", tags: ["Phong nho", "Gia ca"] },
  { id: 8, author: "Truong My Linh", avatar: "TL", rating: 2, date: "05/10/2026", petName: "Be Trang", comment: "Dat phong kha thuan tien nhung khi den nhan meo thi thay long chua duoc don sach.", status: "pending", tags: ["Ve sinh", "Long ban"] },
];

const topicData = [
  { topic: "Cham soc tan tam", positive: 42, negative: 3, icon: "🐱" },
  { topic: "Nhan vien than thien", positive: 38, negative: 2, icon: "👥" },
  { topic: "Phong sach se", positive: 35, negative: 5, icon: "🏠" },
  { topic: "App & Nhat ky", positive: 28, negative: 4, icon: "📱" },
  { topic: "Gia ca", positive: 18, negative: 12, icon: "💰" },
  { topic: "Ve sinh long", positive: 20, negative: 8, icon: "🧹" },
  { topic: "Thong bao kip thoi", positive: 15, negative: 7, icon: "🔔" },
];

const StarRating = ({ rating, size = "sm" }) => {
  const sz = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`${sz} ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
};

const RatingBadge = ({ rating }) => {
  const color = rating >= 4 ? "bg-emerald-100 text-emerald-700" : rating === 3 ? "bg-yellow-100 text-yellow-700" : "bg-rose-100 text-rose-700";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      <Star className="h-3 w-3 fill-current" />{rating}/5
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    replied: { label: "Da phan hoi", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    pending: { label: "Cho phan hoi", icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200" },
    complaint: { label: "Khieu nai", icon: XCircle, cls: "bg-rose-50 text-rose-700 border-rose-200" },
  };
  const { label, icon: Icon, cls } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${cls}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
};

const AvatarCircle = ({ initials }) => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
    {initials}
  </div>
);

const TABS = [
  { id: "overview", label: "Diem danh gia trung binh", icon: Star },
  { id: "list", label: "Danh sach danh gia", icon: MessageSquare },
  { id: "topics", label: "Phan tich chu de", icon: BarChart2 },
  { id: "complaints", label: "Khieu nai", icon: AlertTriangle },
  { id: "warnings", label: "Canh bao duoi 3 sao", icon: ThumbsDown },
];

const OverviewTab = () => {
  const avg = (mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length).toFixed(1);
  const dist = [5,4,3,2,1].map((s) => ({ star: s, count: mockReviews.filter((r) => r.rating === s).length }));
  const total = mockReviews.length;
  const kpis = [
    { label: "Diem TB thang nay", value: avg, sub: "+0.3 so voi thang truoc", trend: "up", icon: Star, color: "from-amber-400 to-orange-500" },
    { label: "Tong danh gia", value: total, sub: "8 danh gia moi thang nay", trend: "up", icon: MessageSquare, color: "from-blue-400 to-indigo-500" },
    { label: "Ty le phan hoi", value: "75%", sub: "6/8 da tra loi", trend: "up", icon: CheckCircle2, color: "from-emerald-400 to-teal-500" },
    { label: "Danh gia duoi 3 sao", value: `${mockReviews.filter((r) => r.rating < 3).length}`, sub: "Can xu ly gap", trend: "down", icon: AlertTriangle, color: "from-rose-400 to-red-500" },
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center shadow-md`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                {k.trend === "up" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><ArrowUp className="h-3 w-3" />Tot</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full"><ArrowDown className="h-3 w-3" />Can xu ly</span>
                )}
              </div>
              <p className="text-3xl font-black text-gray-900">{k.value}</p>
              <p className="text-sm font-semibold text-gray-700 mt-1">{k.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Phan bo sao danh gia</h2>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex flex-col items-center shrink-0">
            <span className="text-7xl font-black bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">{avg}</span>
            <div className="flex mt-2 gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`h-6 w-6 ${parseFloat(avg) >= s ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
              ))}
            </div>
            <p className="text-sm text-gray-400 mt-1">Dua tren {total} danh gia</p>
          </div>
          <div className="flex-1 w-full space-y-3">
            {dist.map(({ star, count }) => {
              const pct = total ? Math.round((count / total) * 100) : 0;
              const barColor = star >= 4 ? "bg-amber-400" : star === 3 ? "bg-yellow-300" : "bg-rose-400";
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-gray-700">{star}</span>
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-16 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">Xu huong danh gia theo thang</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">6 thang gan nhat</span>
        </div>
        <div className="flex items-end gap-3 h-36">
          {[{month:"T5",avg:4.1},{month:"T6",avg:4.3},{month:"T7",avg:3.8},{month:"T8",avg:4.5},{month:"T9",avg:4.2},{month:"T10",avg:parseFloat(avg)}].map(({month,avg:a}) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-gray-700">{a.toFixed(1)}</span>
              <div className="w-full rounded-t-lg bg-gradient-to-t from-orange-400 to-amber-300" style={{ height: `${(a/5)*100}%` }} />
              <span className="text-xs text-gray-500">{month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ListTab = () => {
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const filtered = mockReviews.filter((r) => {
    const matchSearch = r.author.toLowerCase().includes(search.toLowerCase()) || r.comment.toLowerCase().includes(search.toLowerCase()) || r.petName.toLowerCase().includes(search.toLowerCase());
    const matchRating = filterRating === "all" || r.rating === parseInt(filterRating);
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchRating && matchStatus;
  });
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Tim theo ten, binh luan..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
          <option value="all">Tat ca sao</option>
          {[5,4,3,2,1].map((s) => <option key={s} value={s}>{s} sao</option>)}
        </select>
        <select className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Tat ca trang thai</option>
          <option value="replied">Da phan hoi</option>
          <option value="pending">Cho phan hoi</option>
          <option value="complaint">Khieu nai</option>
        </select>
      </div>
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Khong tim thay danh gia nao</p>
          </div>
        ) : filtered.map((review) => (
          <div key={review.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              <AvatarCircle initials={review.avatar} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{review.author}</p>
                    <p className="text-xs text-gray-400">Meo: <span className="font-semibold text-gray-600">{review.petName}</span> · {review.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <StatusBadge status={review.status} />
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.comment}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {review.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full font-medium">
                      <Tag className="h-2.5 w-2.5" />{t}
                    </span>
                  ))}
                </div>
                {replyId === review.id ? (
                  <div className="mt-3 space-y-2">
                    <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" rows={3} placeholder="Nhap phan hoi..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => { setReplyId(null); setReplyText(""); }} className="px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-xl hover:bg-orange-600">Gui phan hoi</button>
                      <button onClick={() => { setReplyId(null); setReplyText(""); }} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700">Huy</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplyId(review.id)} className="text-xs font-semibold text-orange-500 hover:text-orange-700 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />{review.status === "replied" ? "Xem & chinh sua phan hoi" : "Tra loi danh gia"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TopicsTab = () => (
  <div className="space-y-5">
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Phan tich chu de tu danh gia</h2>
      <p className="text-sm text-gray-400 mb-6">Nhung chu de khach hang de cap nhieu nhat</p>
      <div className="space-y-4">
        {topicData.map(({ topic, positive, negative, icon }) => {
          const total = positive + negative;
          const posPct = Math.round((positive / total) * 100);
          return (
            <div key={topic} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{topic}</p>
                    <p className="text-xs text-gray-400">{total} luot de cap</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><Smile className="h-3 w-3" />{positive}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full"><Frown className="h-3 w-3" />{negative}</span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-400 rounded-l-full transition-all duration-700" style={{ width: `${posPct}%` }} />
                <div className="h-full bg-rose-400 rounded-r-full transition-all duration-700" style={{ width: `${100-posPct}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-emerald-600 font-medium">Tich cuc {posPct}%</span>
                <span className="text-xs text-rose-600 font-medium">Tieu cuc {100-posPct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {[
        { label: "Tich cuc", emoji: "😊", count: mockReviews.filter(r=>r.rating>=4).length, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
        { label: "Trung tinh", emoji: "😐", count: mockReviews.filter(r=>r.rating===3).length, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
        { label: "Tieu cuc", emoji: "😟", count: mockReviews.filter(r=>r.rating<=2).length, color: "bg-rose-50 border-rose-200 text-rose-700" },
      ].map(({ label, emoji, count, color }) => (
        <div key={label} className={`rounded-2xl p-6 border flex items-center gap-4 ${color}`}>
          <span className="text-4xl">{emoji}</span>
          <div><p className="text-3xl font-black">{count}</p><p className="text-sm font-bold">{label}</p></div>
        </div>
      ))}
    </div>
  </div>
);

const ComplaintsTab = () => {
  const complaints = mockReviews.filter((r) => r.status === "complaint");
  const [selectedId, setSelectedId] = useState(null);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Tong khieu nai", value: complaints.length, color: "from-rose-400 to-red-500" },
          { label: "Cho xu ly", value: complaints.length, color: "from-amber-400 to-orange-500" },
          { label: "Da giai quyet", value: 0, color: "from-emerald-400 to-teal-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-xl shadow-md`}>{value}</div>
            <p className="font-bold text-gray-700">{label}</p>
          </div>
        ))}
      </div>
      {complaints.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Khong co khieu nai nao!</p>
        </div>
      ) : complaints.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-rose-50 border-b border-rose-100">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span className="text-sm font-bold text-rose-700">Khieu nai · {r.date}</span>
            <RatingBadge rating={r.rating} />
          </div>
          <div className="p-5 flex gap-4">
            <AvatarCircle initials={r.avatar} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{r.author}</p>
              <p className="text-xs text-gray-400 mb-2">Meo: {r.petName}</p>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{r.comment}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {r.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 text-xs bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full font-medium">
                    <Tag className="h-2.5 w-2.5" />{t}
                  </span>
                ))}
              </div>
              {selectedId === r.id ? (
                <div className="space-y-2">
                  <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" rows={3} placeholder="Nhap phan hoi xu ly khieu nai..." />
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedId(null)} className="px-4 py-2 text-sm font-semibold bg-rose-500 text-white rounded-xl hover:bg-rose-600">Gui phan hoi</button>
                    <button onClick={() => setSelectedId(null)} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700">Huy</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setSelectedId(r.id)} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />Xu ly khieu nai
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const WarningsTab = () => {
  const lowRated = mockReviews.filter((r) => r.rating < 3);
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <p className="font-bold text-amber-800 text-base">Canh bao: {lowRated.length} danh gia duoi 3 sao</p>
          <p className="text-sm text-amber-700 mt-0.5">Nhung danh gia nay can duoc phan hoi va xu ly ngay de bao ve uy tin thuong hieu.</p>
        </div>
      </div>
      {lowRated.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <Star className="h-12 w-12 mx-auto mb-3 opacity-30 fill-amber-200 text-amber-200" />
          <p className="font-semibold">Tuyet voi! Khong co danh gia nao duoi 3 sao</p>
        </div>
      ) : lowRated.sort((a,b)=>a.rating-b.rating).map((r) => (
        <div key={r.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-b border-amber-100 rounded-t-2xl">
            <div className="flex items-center gap-2">
              {r.rating === 1 ? <span className="text-xs font-bold bg-rose-500 text-white px-2.5 py-1 rounded-lg">🔴 Rat te</span> : <span className="text-xs font-bold bg-amber-500 text-white px-2.5 py-1 rounded-lg">🟡 Te</span>}
              <StarRating rating={r.rating} />
            </div>
            <span className="text-xs text-gray-400">{r.date}</span>
          </div>
          <div className="p-5 flex gap-4">
            <AvatarCircle initials={r.avatar} />
            <div className="flex-1">
              <p className="font-bold text-gray-900">{r.author}</p>
              <p className="text-xs text-gray-400 mb-2">Meo: {r.petName} · Diem: {r.rating}/5</p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{r.comment}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {r.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-medium">
                    <Tag className="h-2.5 w-2.5" />{t}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />Phan hoi ngay
                </button>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">
                  Danh dau da xu ly
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminReviews = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab />;
      case "list": return <ListTab />;
      case "topics": return <TopicsTab />;
      case "complaints": return <ComplaintsTab />;
      case "warnings": return <WarningsTab />;
      default: return null;
    }
  };
  return (
    <div className="p-6 min-h-screen bg-gray-50/50">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-1">Danh gia &amp; Phan hoi</h1>
        <p className="text-gray-500 text-sm">Quan ly va phan tich danh gia tu khach hang cua Meo Vang Nha.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${active ? "border-orange-500 text-orange-600 bg-orange-50/50" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {id === "warnings" && <span className="ml-1 bg-rose-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full">{mockReviews.filter(r=>r.rating<3).length}</span>}
                {id === "complaints" && <span className="ml-1 bg-amber-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full">{mockReviews.filter(r=>r.status==="complaint").length}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {renderTab()}
    </div>
  );
};

export default AdminReviews;
