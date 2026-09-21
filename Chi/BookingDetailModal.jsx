import React, { useState, useEffect, useRef } from "react";
import {
  X, Home, User, Phone, Cat, Calendar, CalendarCheck, Package,
  ExternalLink, AlertTriangle, Star, Crown, Shield, Sparkles,
  Edit3, LogIn, LogOut, Trash2,
} from "lucide-react";

// Badge hạng thành viên
const MemberBadge = ({ tier }) => {
  const cfg = {
    Vàng: { icon: Star, color: "text-yellow-600 bg-yellow-50 border-yellow-300", label: "Vàng" },
    "Bạch_Kim": { icon: Crown, color: "text-purple-600 bg-purple-50 border-purple-300", label: "Bạch Kim" },
    "Kim_Cương": { icon: Sparkles, color: "text-sky-600 bg-sky-50 border-sky-300", label: "Kim Cương" },
    Đồng: { icon: Shield, color: "text-orange-600 bg-orange-50 border-orange-300", label: "Đồng" },
  }[tier] || { icon: Star, color: "text-gray-500 bg-gray-50 border-gray-200", label: tier || "Thành viên" };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <Icon className="h-2.5 w-2.5" />{cfg.label}
    </span>
  );
};

// Hàng thông tin chi tiết
const DetailRow = ({ icon, label, children }) => (
  <div className="flex gap-3 items-start py-2.5 border-b border-gray-100 last:border-0">
    <div className="shrink-0 mt-0.5 h-7 w-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  </div>
);

// Hóa đơn thanh toán
const CheckoutInvoiceModal = ({ booking, roomId, onPay, onClose }) => {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const checkInDate = booking?.checkIn ? new Date(booking.checkIn) : new Date();
  const checkOutDate = booking?.checkOut ? new Date(booking.checkOut) : new Date();
  const nights = Math.max(Math.ceil((checkOutDate - checkInDate) / 86400000), 1);
  const typeFromId = (roomId || "VIP").split("-")[0];
  const pricePerNight = typeFromId === "DELUXE" ? 250000 : typeFromId === "VVIP" ? 180000 : 120000;
  const cats = booking?.cats || 1;
  const roomFee = pricePerNight * cats * nights;
  const pkgPrices = { "Tắm & Vệ Sinh": 100000, "Cắt Tỉa Lông": 150000, "Khám Sức Khỏe": 200000, "Spa Mèo": 250000, "Chụp Ảnh Kỷ Niệm": 80000 };
  const pkgs = booking?.packages || [];
  const pkgFee = pkgs.reduce((s, p) => s + (pkgPrices[p] || 0), 0);
  const subtotal = roomFee + pkgFee;
  const vat = Math.round(subtotal * 0.1);
  const total = subtotal + vat;
  const pts = Math.floor(total / 10000);
  const fmtVND = (n) => n.toLocaleString("vi-VN") + " đ";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
      <div ref={ref} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: "slideInUp 0.25s ease" }}>
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white flex justify-between items-start">
          <div>
            <div className="text-[10px] font-bold uppercase opacity-80 tracking-widest mb-0.5">Hóa Đơn Thanh Toán</div>
            <div className="text-xl font-black">{booking?.code}</div>
            <div className="text-xs opacity-70 mt-1">Mèo Vàng Nhà · {new Date().toLocaleDateString("vi-VN")}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/35 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
            {[
              ["Khách hàng", booking?.ownerName || "—"],
              ["Phòng", roomId],
              ["Check-in", booking?.checkIn ? new Date(booking.checkIn).toLocaleDateString("vi-VN") : "—"],
              ["Check-out", booking?.checkOut ? new Date(booking.checkOut).toLocaleDateString("vi-VN") : "—"],
              ["Số đêm", `${nights} đêm`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-semibold text-gray-800">{v}</span></div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Chi tiết khoản phí</div>
            <div className="flex justify-between text-sm"><span className="text-gray-600">Phòng {roomId} ({cats} mèo × {nights} đêm)</span><span className="font-semibold">{fmtVND(roomFee)}</span></div>
            {pkgs.filter(p => pkgPrices[p]).map(p => (
              <div key={p} className="flex justify-between text-sm"><span className="text-gray-600">{p}</span><span className="font-semibold">{fmtVND(pkgPrices[p])}</span></div>
            ))}
            <div className="border-t border-dashed border-gray-200 pt-2 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500"><span>Tạm tính</span><span>{fmtVND(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-gray-500"><span>VAT (10%)</span><span>{fmtVND(vat)}</span></div>
            </div>
            <div className="border-t-2 border-orange-200 pt-2 flex justify-between">
              <span className="font-extrabold text-gray-800 text-base">Tổng cộng</span>
              <span className="font-black text-xl text-orange-600">{fmtVND(total)}</span>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-400 flex items-center justify-center shrink-0"><Star className="h-5 w-5 text-white fill-white" /></div>
            <div><div className="text-xs text-amber-700 font-semibold">Điểm tích lũy được cộng</div><div className="text-lg font-black text-amber-800">+{pts} điểm</div></div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">Hủy</button>
          <button onClick={() => onPay(pts)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-sm shadow-lg shadow-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all">💳 Thanh toán {fmtVND(total)}</button>
        </div>
      </div>
    </div>
  );
};

// Xác nhận xóa đơn
const DeleteConfirmModal = ({ booking, onConfirm, onClose }) => {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
      <div ref={ref} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ animation: "slideInUp 0.25s ease" }}>
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="h-7 w-7 text-red-500" /></div>
          <div>
            <h3 className="font-black text-gray-800 text-lg">Xác nhận xóa đơn?</h3>
            <p className="text-sm text-gray-500 mt-1">Đơn đặt phòng <strong className="text-red-600">{booking?.code}</strong> sẽ bị xóa vĩnh viễn.</p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">Hủy</button>
            <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-sm shadow-lg shadow-red-200 transition-all hover:scale-[1.02]">Xác nhận xóa</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Form chỉnh sửa booking
const SERVICE_OPTIONS = ["Gói Cơ Bản", "Tắm & Vệ Sinh", "Cắt Tỉa Lông", "Khám Sức Khỏe", "Spa Mèo", "Chụp Ảnh Kỷ Niệm"];

const EditBookingModal = ({ booking, onSave, onClose }) => {
  const ref = useRef(null);
  const [form, setForm] = useState({
    ownerName: booking?.ownerName || "",
    ownerPhone: booking?.ownerPhone || "",
    ownerTier: booking?.ownerTier || "",
    catNames: booking?.catNames || "",
    checkIn: booking?.checkIn || "",
    checkOut: booking?.checkOut || "",
    packages: booking?.packages || ["Gói Cơ Bản"],
  });

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const togglePkg = (pkg) => setForm(prev => ({
    ...prev,
    packages: prev.packages.includes(pkg) ? prev.packages.filter(p => p !== pkg) : [...prev.packages, pkg],
  }));

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
      <div ref={ref} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" style={{ animation: "slideInUp 0.25s ease" }}>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="text-[10px] font-semibold uppercase opacity-80 tracking-widest">Chỉnh sửa đơn</div>
            <div className="font-black text-lg">{booking?.code}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/35 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Thông tin chủ nuôi</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Họ và tên</label>
                <input type="text" value={form.ownerName} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))} className={inp} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Số điện thoại</label>
                <input type="tel" value={form.ownerPhone} onChange={e => setForm(p => ({ ...p, ownerPhone: e.target.value }))} className={inp} placeholder="0901234567" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Hạng thành viên</label>
              <select value={form.ownerTier} onChange={e => setForm(p => ({ ...p, ownerTier: e.target.value }))} className={inp}>
                <option value="">-- Chọn hạng --</option>
                <option value="Đồng">Đồng</option>
                <option value="Vàng">Vàng</option>
                <option value="Bạch_Kim">Bạch Kim</option>
                <option value="Kim_Cương">Kim Cương</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Thông tin mèo</p>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Tên các mèo (ngăn cách dấu phẩy)</label>
              <input type="text" value={form.catNames} onChange={e => setForm(p => ({ ...p, catNames: e.target.value }))} className={inp} placeholder="Mimi, Bông, Lu" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Thời gian</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Ngày nhận</label>
                <input type="date" value={form.checkIn} onChange={e => setForm(p => ({ ...p, checkIn: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Ngày trả</label>
                <input type="date" value={form.checkOut} onChange={e => setForm(p => ({ ...p, checkOut: e.target.value }))} className={inp} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Gói dịch vụ</p>
            <div className="flex flex-wrap gap-2">
              {SERVICE_OPTIONS.map(pkg => (
                <button key={pkg} type="button" onClick={() => togglePkg(pkg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${form.packages.includes(pkg) ? "bg-blue-500 border-blue-500 text-white shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:border-blue-300"}`}>
                  {pkg}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3 shrink-0 border-t border-gray-100 pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">Hủy</button>
          <button onClick={() => onSave(form)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-blue-200 hover:scale-[1.02] transition-all">💾 Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// BookingDetailModal – Popup chính
// ─────────────────────────────────────────────
const BookingDetailModal = ({ booking, roomId, onClose, onCheckIn, onCheckOut, onDelete, onUpdate }) => {
  const modalRef = useRef(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    if (showInvoice || showDeleteConfirm || showEdit) return;
    const h = (e) => { if (modalRef.current && !modalRef.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose, showInvoice, showDeleteConfirm, showEdit]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!booking) return null;

  const { code, ownerName, ownerPhone, ownerTier, catNames, cats, checkIn, checkOut, packages, status } = booking;

  const fmtDate = (str) => {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const nights = (() => {
    if (!checkIn || !checkOut) return null;
    const n = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000);
    return n > 0 ? n : null;
  })();

  const statusBadge = {
    "đang ở": { cls: "bg-blue-500 text-white", label: "🏠 Đang ở" },
    "check-in": { cls: "bg-green-500 text-white", label: "✅ Check-in" },
    "check-out": { cls: "bg-gray-400 text-white", label: "🚪 Check-out" },
  };
  const badge = statusBadge[status] || { cls: "bg-gray-200 text-gray-700", label: status };

  const handleCheckIn = () => {
    onCheckIn(roomId, code);
    showToast(`✅ Check-in thành công cho ${code}!`);
    setTimeout(() => onClose(), 1500);
  };

  const handlePay = (pts) => {
    onCheckOut(roomId, code);
    showToast(`💳 Thanh toán thành công! +${pts} điểm tích lũy.`);
    setShowInvoice(false);
    setTimeout(() => onClose(), 1500);
  };

  const handleDeleteConfirm = () => {
    onDelete(roomId, code);
    showToast(`🗑️ Đã xóa đơn ${code}`, "error");
    setShowDeleteConfirm(false);
    setTimeout(() => onClose(), 1200);
  };

  const handleSaveEdit = (updates) => {
    onUpdate(roomId, code, updates);
    showToast(`✏️ Đã cập nhật thông tin đơn ${code}`);
    setShowEdit(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" style={{ animation: "slideInUp 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 p-5 text-white shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Chi tiết đặt phòng</div>
                <h2 className="text-2xl font-black tracking-tight truncate">{code}</h2>
                <div className="mt-1.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.cls}`}>{badge.label}</span>
                </div>
              </div>
              <button id={`btn-close-modal-${code}`} onClick={onClose} className="shrink-0 p-2 rounded-xl bg-white/20 hover:bg-white/35 transition-all hover:scale-110"><X className="h-5 w-5" /></button>
            </div>
          </div>

          {/* Nội dung */}
          <div className="overflow-y-auto flex-1 p-5 space-y-0.5">
            <DetailRow icon={<Home className="h-4 w-4 text-orange-500" />} label="Phòng">
              <span className="font-extrabold text-gray-800">{roomId}</span>
            </DetailRow>
            <DetailRow icon={<User className="h-4 w-4 text-blue-500" />} label="Chủ nuôi">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-gray-800">{ownerName || "—"}</span>
                {ownerTier && <MemberBadge tier={ownerTier} />}
                <button id={`link-customer-profile-${code}`} onClick={() => window.open("/admin/customer-profile", "_blank")} className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline transition-colors">
                  <ExternalLink className="h-3 w-3" />Hồ sơ khách hàng
                </button>
              </div>
            </DetailRow>
            <DetailRow icon={<Phone className="h-4 w-4 text-green-500" />} label="Số điện thoại">
              <a href={`tel:${ownerPhone}`} className="font-bold text-gray-800 hover:text-green-600 transition-colors">{ownerPhone || "—"}</a>
            </DetailRow>
            <DetailRow icon={<Cat className="h-4 w-4 text-purple-500" />} label="Mèo">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-gray-800">{catNames || "—"}{cats ? <span className="ml-1 text-xs font-semibold text-gray-500">({cats} mèo)</span> : null}</span>
                <button id={`link-pet-profile-${code}`} onClick={() => window.open("/admin/pet-profile", "_blank")} className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:text-purple-700 hover:underline transition-colors">
                  <ExternalLink className="h-3 w-3" />Hồ sơ mèo
                </button>
              </div>
            </DetailRow>
            <DetailRow icon={<Calendar className="h-4 w-4 text-sky-500" />} label="Ngày nhận">
              <span className="font-bold text-gray-800">{fmtDate(checkIn)}</span>
            </DetailRow>
            <DetailRow icon={<CalendarCheck className="h-4 w-4 text-teal-500" />} label="Ngày trả">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">{fmtDate(checkOut)}</span>
                {nights && <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{nights} đêm</span>}
              </div>
            </DetailRow>
            <DetailRow icon={<Package className="h-4 w-4 text-amber-500" />} label="Gói dịch vụ">
              <div className="flex flex-wrap gap-1.5">
                {packages && packages.length > 0 ? packages.map((pkg, i) => (
                  <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">{pkg}</span>
                )) : <span className="text-sm text-gray-400">—</span>}
              </div>
            </DetailRow>
          </div>

          {/* Action Buttons */}
          <div className="shrink-0 border-t border-gray-100 p-4 bg-gray-50/60">
            <div className="grid grid-cols-2 gap-2">
              <button id={`btn-edit-booking-${code}`} onClick={() => setShowEdit(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                <Edit3 className="h-4 w-4" />Chỉnh sửa
              </button>
              <button id={`btn-checkin-booking-${code}`} onClick={handleCheckIn} disabled={status === "đang ở"}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm transition-all ${status === "đang ở" ? "bg-blue-100 text-blue-400 border-2 border-blue-200 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-200 hover:scale-[1.02] active:scale-[0.98]"}`}>
                <LogIn className="h-4 w-4" />{status === "đang ở" ? "Đang ở" : "Check-in"}
              </button>
              <button id={`btn-checkout-booking-${code}`} onClick={() => setShowInvoice(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md shadow-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all">
                <LogOut className="h-4 w-4" />Check-out
              </button>
              <button id={`btn-delete-booking-${code}`} onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-500 hover:text-white hover:border-red-500 hover:scale-[1.02] transition-all">
                <Trash2 className="h-4 w-4" />Xóa đơn
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl text-sm font-bold text-white ${toastMsg.type === "error" ? "bg-red-500" : "bg-green-600"}`}
          style={{ animation: "fadeInDown 0.3s ease" }}>
          {toastMsg.msg}
        </div>
      )}

      {showInvoice && <CheckoutInvoiceModal booking={booking} roomId={roomId} onPay={handlePay} onClose={() => setShowInvoice(false)} />}
      {showDeleteConfirm && <DeleteConfirmModal booking={booking} onConfirm={handleDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} />}
      {showEdit && <EditBookingModal booking={booking} onSave={handleSaveEdit} onClose={() => setShowEdit(false)} />}

      <style>{`
        @keyframes slideInUp { from { opacity:0; transform:translateY(40px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes fadeInDown { from { opacity:0; transform:translateX(-50%) translateY(-12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
      `}</style>
    </>
  );
};

export default BookingDetailModal;
