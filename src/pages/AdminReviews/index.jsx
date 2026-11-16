import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Star,
  MessageSquare,
  BarChart2,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Tag,
  Globe,
  EyeOff,
  RefreshCw,
  User,
  ChevronRight,
} from "lucide-react";
import useReviews from "../../hooks/useReviews";
import { updateReviewAsAdmin } from "../../services/reviewsApi";
import { REVIEW_TAGS } from "../../utils/reviewRules";

// Trang admin nằm dưới /admin hoặc ở gốc: giữ đúng tiền tố khi chuyển sang trang khác
const useAdminPrefix = () => (useLocation().pathname.startsWith("/admin") ? "/admin" : "");

// Đường dẫn mở đúng một đánh giá trên trang này (chuông, Tổng quan, hồ sơ khách dùng chung)
export const reviewLink = (prefix, bookingCode) => `${prefix}/reviews?tab=list&code=${encodeURIComponent(bookingCode)}`;

// Đánh giá từ 2 sao trở xuống chưa được trả lời: cần xử lý (cũng hiện ở Tổng quan admin)
export const needsAttention = (r) => r.rating <= 2 && !r.adminReply;

const statusOf = (r) => (r.adminReply ? "replied" : r.rating <= 2 ? "complaint" : "pending");

const formatDate = (iso) => {
  const d = new Date(iso || "");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const initials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "K";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const StarRating = ({ rating, size = "sm" }) => {
  const sz = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sz} ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    replied: { label: "Đã trả lời", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    pending: { label: "Chờ trả lời", icon: Clock, cls: "bg-amber-50 text-amber-700 border-amber-200" },
    complaint: { label: "Cần xử lý", icon: XCircle, cls: "bg-rose-50 text-rose-700 border-rose-200" },
  };
  const { label, icon: Icon, cls } = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${cls}`}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
};

const EmptyState = ({ icon: Icon = MessageSquare, text }) => (
  <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
    <Icon className="h-12 w-12 mx-auto mb-3 opacity-30" />
    <p className="font-semibold">{text}</p>
  </div>
);

const TABS = [
  { id: "overview", label: "Tổng quan", icon: BarChart2 },
  { id: "list", label: "Danh sách đánh giá", icon: MessageSquare },
  { id: "topics", label: "Chủ đề", icon: Tag },
  { id: "attention", label: "Cần xử lý", icon: AlertTriangle },
];

const OverviewTab = ({ reviews, go }) => {
  const total = reviews.length;
  const avgNum = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const avg = avgNum.toFixed(1);
  const dist = [5, 4, 3, 2, 1].map((s) => ({ star: s, count: reviews.filter((r) => r.rating === s).length }));
  const replied = reviews.filter((r) => r.adminReply).length;
  const now = new Date();
  const thisMonth = reviews.filter((r) => {
    const d = new Date(r.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const list = reviews.filter((r) => {
      const c = new Date(r.createdAt);
      return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear();
    });
    return { month: `T${d.getMonth() + 1}`, count: list.length, avg: list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0 };
  });
  const kpis = [
    { label: "Điểm trung bình", value: total ? avg : "–", sub: `Trên ${total} đánh giá`, icon: Star, color: "from-amber-400 to-orange-500", to: { tab: "list" } },
    { label: "Tổng đánh giá", value: total, sub: `${thisMonth} đánh giá trong tháng này`, icon: MessageSquare, color: "from-blue-400 to-indigo-500", to: { tab: "list" } },
    { label: "Tỷ lệ đã trả lời", value: total ? `${Math.round((replied / total) * 100)}%` : "–", sub: `${total - replied} đánh giá chờ trả lời`, icon: CheckCircle2, color: "from-emerald-400 to-teal-500", to: { tab: "list", status: "unreplied" } },
    { label: "Cần xử lý", value: reviews.filter(needsAttention).length, sub: "Từ 2 sao trở xuống, chưa trả lời", icon: AlertTriangle, color: "from-rose-400 to-red-500", to: { tab: "attention" } },
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <button type="button" key={k.label} onClick={() => go(k.to)} className="text-left bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition cursor-pointer">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center shadow-md mb-4`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900">{k.value}</p>
              <p className="text-sm font-semibold text-gray-700 mt-1">{k.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
              <p className="text-xs font-semibold text-orange-500 mt-3 inline-flex items-center gap-0.5">Xem chi tiết <ChevronRight className="h-3 w-3" /></p>
            </button>
          );
        })}
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Phân bố số sao</h2>
        <p className="text-xs text-gray-400 mb-6">Bấm vào một hàng để xem các đánh giá có số sao đó.</p>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex flex-col items-center shrink-0">
            <span className="text-7xl font-black bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">{total ? avg : "–"}</span>
            <div className="mt-2"><StarRating rating={Math.round(avgNum)} size="lg" /></div>
            <p className="text-sm text-gray-400 mt-1">Dựa trên {total} đánh giá</p>
          </div>
          <div className="flex-1 w-full space-y-3">
            {dist.map(({ star, count }) => {
              const pct = total ? Math.round((count / total) * 100) : 0;
              const barColor = star >= 4 ? "bg-amber-400" : star === 3 ? "bg-yellow-300" : "bg-rose-400";
              return (
                <button type="button" key={star} onClick={() => go({ tab: "list", rating: String(star) })} title={`Xem các đánh giá ${star} sao`} className="w-full flex items-center gap-3 rounded-lg px-1 -mx-1 hover:bg-orange-50 cursor-pointer">
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-gray-700">{star}</span>
                  </div>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-16 text-right">{count} ({pct}%)</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">Điểm trung bình theo tháng</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">6 tháng gần nhất</span>
        </div>
        <div className="flex items-end gap-3 h-36">
          {months.map(({ month, avg: a, count }) => (
            <div key={month} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
              <span className="text-xs font-bold text-gray-700">{count ? a.toFixed(1) : "–"}</span>
              <div className="w-full rounded-t-lg bg-gradient-to-t from-orange-400 to-amber-300" style={{ height: `${(a / 5) * 100}%` }} />
              <span className="text-xs text-gray-500">{month}</span>
              <span className="text-[10px] text-gray-400">{count} lượt</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ReviewCard = ({ review, highlighted = false }) => {
  const prefix = useAdminPrefix();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.adminReply || "");
  const [saving, setSaving] = useState(false);

  const save = async (fields, success) => {
    setSaving(true);
    try {
      const res = await updateReviewAsAdmin({ bookingCode: review.bookingCode, ...fields });
      toast.success(res.pushSent ? `${success} Đã gửi thông báo cho khách.` : success);
      return true;
    } catch (e) {
      toast.error(e.message || "Chưa lưu được, thử lại nhé.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    if (await save({ adminReply: replyText }, "Đã gửi câu trả lời.")) setReplying(false);
  };

  return (
    <div id={`review-${review.bookingCode}`} className={`bg-white rounded-2xl p-5 shadow-sm border ${highlighted ? "border-orange-400 ring-2 ring-orange-200" : needsAttention(review) ? "border-rose-200" : "border-gray-100"}`} data-testid="admin-review-card">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {initials(review.customerName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <Link to={`${prefix}/customers?tab=profile&id=${encodeURIComponent(review.customerId)}`} title="Mở hồ sơ khách hàng" className="font-bold text-gray-900 hover:text-orange-600 hover:underline">
                {review.customerName || "Khách hàng"}
              </Link>
              <p className="text-xs text-gray-400">
                Bé <span className="font-semibold text-gray-600">{review.petNames || "–"}</span>
                {review.roomName ? ` · Phòng ${review.roomName}` : ""} · Đơn{" "}
                <Link to={`${prefix}/my-booking?code=${encodeURIComponent(review.bookingCode)}`} title="Mở đơn trong Lịch đặt" className="font-semibold text-orange-600 hover:underline">#{review.bookingCode}</Link>
                {" "}· {formatDate(review.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} />
              <StatusBadge status={statusOf(review)} />
            </div>
          </div>
          {review.comment ? (
            <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.comment}</p>
          ) : (
            <p className="text-sm text-gray-400 italic mb-3">Khách không viết nhận xét.</p>
          )}
          {review.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {review.tags.map((t) => (
                <Link key={t} to={`${prefix}/reviews?tab=list&tag=${encodeURIComponent(t)}`} title="Xem các đánh giá cùng thẻ" className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full font-medium hover:bg-orange-100">
                  <Tag className="h-2.5 w-2.5" />{t}
                </Link>
              ))}
            </div>
          )}
          {review.adminReply && !replying && (
            <div className="text-sm bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-3">
              <span className="font-semibold text-emerald-700">Mèo Vắng Nhà trả lời:</span> {review.adminReply}
            </div>
          )}
          {replying ? (
            <div className="mt-3 space-y-2">
              <textarea className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" rows={3} maxLength={1000} placeholder="Nhập câu trả lời cho khách..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              <div className="flex gap-2">
                <button disabled={saving} onClick={sendReply} className="px-4 py-2 text-sm font-semibold bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-60">Gửi trả lời</button>
                <button onClick={() => { setReplying(false); setReplyText(review.adminReply || ""); }} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700">Hủy</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setReplying(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />{review.adminReply ? "Sửa câu trả lời" : "Trả lời"}
              </button>
              {review.allowPublic ? (
                <button
                  disabled={saving}
                  onClick={() => save({ isPublic: !review.isPublic }, review.isPublic ? "Đã gỡ khỏi trang chủ." : "Đã duyệt hiển thị trên trang chủ.")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${review.isPublic ? "text-gray-600 bg-gray-100 hover:bg-gray-200" : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"}`}
                >
                  {review.isPublic ? <EyeOff className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                  {review.isPublic ? "Gỡ khỏi trang chủ" : "Duyệt hiển thị trên trang chủ"}
                </button>
              ) : (
                <span className="text-[11px] text-gray-400">Khách không đồng ý hiển thị công khai</span>
              )}
              {review.isPublic && (
                <span className="text-[11px] font-semibold text-emerald-600">● Đang hiện trên trang chủ</span>
              )}
              <Link to={`${prefix}/customers?tab=profile&id=${encodeURIComponent(review.customerId)}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />Hồ sơ khách
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ListTab = ({ reviews, params, setParam }) => {
  const search = params.get("q") || "";
  const filterRating = params.get("rating") || "all";
  const filterStatus = params.get("status") || "all";
  const filterTag = params.get("tag") || "all";
  const focusCode = params.get("code") || "";
  const q = search.trim().toLowerCase();
  const filtered = reviews.filter((r) => {
    if (focusCode) return r.bookingCode === focusCode;
    const matchSearch = !q || [r.customerName, r.comment, r.petNames, r.bookingCode].some((v) => String(v || "").toLowerCase().includes(q));
    const matchRating = filterRating === "all" || r.rating === parseInt(filterRating, 10);
    const matchStatus = filterStatus === "all" || statusOf(r) === filterStatus
      || (filterStatus === "public" && r.isPublic) || (filterStatus === "unreplied" && !r.adminReply);
    const matchTag = filterTag === "all" || (r.tags || []).includes(filterTag);
    return matchSearch && matchRating && matchStatus && matchTag;
  });

  useEffect(() => {
    if (!focusCode) return undefined;
    const t = setTimeout(() => document.getElementById(`review-${focusCode}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    return () => clearTimeout(t);
  }, [focusCode, filtered.length]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Tìm theo tên, nhận xét, mã đơn..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" value={search} onChange={(e) => setParam({ q: e.target.value, code: "" })} />
        </div>
        <select className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" value={filterRating} onChange={(e) => setParam({ rating: e.target.value, code: "" })}>
          <option value="all">Tất cả số sao</option>
          {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} sao</option>)}
        </select>
        <select className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" value={filterStatus} onChange={(e) => setParam({ status: e.target.value, code: "" })}>
          <option value="all">Tất cả trạng thái</option>
          <option value="unreplied">Chưa trả lời</option>
          <option value="pending">Chờ trả lời (từ 3 sao)</option>
          <option value="complaint">Cần xử lý</option>
          <option value="replied">Đã trả lời</option>
          <option value="public">Đang hiện trên trang chủ</option>
        </select>
        <select className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" value={filterTag} onChange={(e) => setParam({ tag: e.target.value, code: "" })}>
          <option value="all">Tất cả thẻ</option>
          {REVIEW_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {focusCode && (
        <div className="flex flex-wrap items-center gap-2 text-sm bg-orange-50 border border-orange-200 text-orange-800 rounded-xl px-4 py-2">
          Đang xem đánh giá của đơn <strong>#{focusCode}</strong>.
          <button onClick={() => setParam({ code: "" })} className="font-semibold underline">Xem tất cả đánh giá</button>
        </div>
      )}
      <div className="space-y-4">
        {filtered.length === 0
          ? <EmptyState text={reviews.length ? "Không tìm thấy đánh giá nào" : "Chưa có khách nào đánh giá"} />
          : filtered.map((r) => <ReviewCard key={r.bookingCode} review={r} highlighted={r.bookingCode === focusCode} />)}
      </div>
    </div>
  );
};

const TopicsTab = ({ reviews, go }) => {
  const topics = REVIEW_TAGS.map((tag) => {
    const list = reviews.filter((r) => (r.tags || []).includes(tag));
    return {
      tag,
      total: list.length,
      positive: list.filter((r) => r.rating >= 4).length,
      negative: list.filter((r) => r.rating <= 2).length,
    };
  }).sort((a, b) => b.total - a.total);
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Khách nhắc tới điều gì</h2>
        <p className="text-sm text-gray-400 mb-6">Đếm theo thẻ khách chọn khi đánh giá. Tích cực: 4 đến 5 sao, tiêu cực: 1 đến 2 sao. Bấm vào một thẻ để xem các đánh giá đó.</p>
        <div className="space-y-4">
          {topics.map(({ tag, total, positive, negative }) => {
            const posPct = total ? Math.round((positive / total) * 100) : 0;
            const negPct = total ? Math.round((negative / total) * 100) : 0;
            return (
              <button type="button" key={tag} onClick={() => go({ tab: "list", tag })} title="Xem các đánh giá có thẻ này" className="w-full text-left bg-gray-50 hover:bg-orange-50 rounded-xl p-4 cursor-pointer transition">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{tag}</p>
                    <p className="text-xs text-gray-400">{total} lượt chọn</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Tích cực {positive}</span>
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">Tiêu cực {negative}</span>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-400" style={{ width: `${posPct}%` }} />
                  <div className="h-full bg-yellow-300" style={{ width: `${total ? 100 - posPct - negPct : 0}%` }} />
                  <div className="h-full bg-rose-400" style={{ width: `${negPct}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Tích cực (4 đến 5 sao)", emoji: "😊", count: reviews.filter((r) => r.rating >= 4).length, color: "bg-emerald-50 border-emerald-200 text-emerald-700", rating: "5" },
          { label: "Trung tính (3 sao)", emoji: "😐", count: reviews.filter((r) => r.rating === 3).length, color: "bg-yellow-50 border-yellow-200 text-yellow-700", rating: "3" },
          { label: "Tiêu cực (1 đến 2 sao)", emoji: "😟", count: reviews.filter((r) => r.rating <= 2).length, color: "bg-rose-50 border-rose-200 text-rose-700", tab: "attention" },
        ].map(({ label, emoji, count, color, rating, tab }) => (
          <button type="button" key={label} onClick={() => go(tab ? { tab } : { tab: "list", rating })} className={`text-left rounded-2xl p-6 border flex items-center gap-4 hover:shadow-md transition cursor-pointer ${color}`}>
            <span className="text-4xl">{emoji}</span>
            <div><p className="text-3xl font-black">{count}</p><p className="text-sm font-bold">{label}</p></div>
          </button>
        ))}
      </div>
    </div>
  );
};

const AttentionTab = ({ reviews }) => {
  const list = reviews.filter(needsAttention).sort((a, b) => a.rating - b.rating);
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-5 flex gap-4 items-start">
        <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0" />
        <div>
          <p className="font-bold text-rose-800">{list.length} đánh giá từ 2 sao trở xuống chưa được trả lời</p>
          <p className="text-sm text-rose-700 mt-0.5">Trả lời khách để đánh giá ra khỏi danh sách này. Khách nhận thông báo khi có câu trả lời.</p>
        </div>
      </div>
      {list.length === 0
        ? <EmptyState icon={CheckCircle2} text="Không có đánh giá nào cần xử lý" />
        : list.map((r) => <ReviewCard key={r.bookingCode} review={r} />)}
    </div>
  );
};

const AdminReviews = () => {
  // Tab và bộ lọc nằm trên đường dẫn (?tab=list&code=MVN-...), nên chuông, trang Tổng quan, hồ sơ khách mở thẳng được
  const [params, setParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "overview";
  const setParam = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v && v !== "all" ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  // Chuyển tab kèm bộ lọc mới (bỏ bộ lọc cũ)
  const go = (target) => setParams(new URLSearchParams(Object.entries(target).filter(([, v]) => v)));
  const setActiveTab = (tab) => go({ tab });
  const { reviews, loaded, error, refresh } = useReviews(true);
  const sorted = useMemo(() => [...reviews].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), [reviews]);
  const attentionCount = sorted.filter(needsAttention).length;

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab reviews={sorted} go={go} />;
      case "list": return <ListTab reviews={sorted} params={params} setParam={setParam} />;
      case "topics": return <TopicsTab reviews={sorted} go={go} />;
      case "attention": return <AttentionTab reviews={sorted} />;
      default: return null;
    }
  };
  return (
    <div className="p-6 min-h-screen bg-gray-50/50">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-1">Đánh giá &amp; Phản hồi</h1>
          <p className="text-gray-500 text-sm">Khách đánh giá sau khi check-out. Trả lời khách và duyệt đánh giá hiện trên trang chủ.</p>
        </div>
        <button onClick={refresh} className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5">
          <RefreshCw className="h-4 w-4" />Tải lại
        </button>
      </div>
      {error && loaded && (
        <p className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">Không tải được đánh giá: {error}</p>
      )}
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
                {id === "attention" && attentionCount > 0 && <span className="ml-1 bg-rose-500 text-white text-xs font-black px-1.5 py-0.5 rounded-full">{attentionCount}</span>}
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
