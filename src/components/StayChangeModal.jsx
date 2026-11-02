import React, { useMemo, useState } from 'react';
import {
  X, PawPrint, CalendarDays, CalendarCheck, CheckCircle2, AlertTriangle, MessageCircle, PhoneCall,
  RefreshCw, ArrowUpCircle, BedDouble, Receipt,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRoomState, ROOM_CONFIG } from '../contexts/RoomStateContext';
import { useServiceCatalog } from '../contexts/ServiceCatalogContext';
import { useBookingHistory } from '../contexts/BookingHistoryContext';
import { todayInVietnam } from '../utils/bookingDeposit';
import { buildInvoice } from '../utils/bookingInvoice';
import { ADDONS } from './ServiceManagement';
import {
  addDays, applyStayChange, describeSegment, findRoomsWithSpace, getStaySegments, nightsOf,
  packageNightlyPrice, roomTypeOf, sameStay, segmentOnDate, shortDate,
} from '../utils/staySegments';

const TYPE_LABEL = { VIP: 'Hạng VIP', VVIP: 'Hạng VVIP', DELUXE: 'Hạng DELUXE' };
const TYPE_RANK = { VIP: 1, VVIP: 2, DELUXE: 3 };
const money = (n) => `${Math.round(Number(n) || 0).toLocaleString('vi-VN')}đ`;
const fullDate = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '');

/**
 * Khách tự gia hạn, đổi phòng, đổi gói, nâng hạng ngay trên trang Theo dõi lưu trú, không cần chờ nhân viên duyệt.
 * Gia hạn: phòng đang ở còn chỗ thì kéo dài luôn; hết chỗ thì báo và gợi ý các phòng còn chỗ để khách chọn.
 * Mọi thay đổi ghi thành lịch theo chặng (ngày a – b phòng nào, gói nào) để hóa đơn tự tính theo.
 */
const StayChangeModal = ({ isOpen, onClose, booking, resolvedPets, isDemo, onOpenChat, onOpenCall }) => {
  const { bookings: roomBookings, maintenanceRooms = {} } = useRoomState();
  const { publishedItems = [], roomSurcharges = {} } = useServiceCatalog();
  const { customerChangeStay } = useBookingHistory();

  const [mode, setMode] = useState('extend'); // extend | change
  const [days, setDays] = useState(3);
  const [pickOther, setPickOther] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [pkgId, setPkgId] = useState('');
  const [changeFrom, setChangeFrom] = useState('');
  const [changeTo, setChangeTo] = useState('');
  const [done, setDone] = useState(null); // booking sau khi cập nhật (màn hình thành công)

  const today = todayInVietnam();
  const cats = Math.max(1, Number(booking?.cats) || (booking?.petIds || []).length || 1);
  const segments = useMemo(() => getStaySegments(booking), [booking]);
  const lastSeg = segments[segments.length - 1];
  const currentEnd = booking?.checkOut || lastSeg?.to || '';
  const excludeCodes = [booking?.code, booking?.id].filter(Boolean);
  const nowSeg = segmentOnDate(booking, today) || lastSeg;

  // Gói lưu trú dùng được cho từng hạng phòng
  const lodgingFor = (type) => publishedItems.filter((p) => p.category === 'Lưu trú' && (p.forRoomTypes?.includes(type) ?? true));
  // Giá 1 đêm cho cả đơn. Gói & hạng phòng đã có trong đơn thì giữ đúng giá đã đặt.
  const priceFor = (type, pkg) => {
    const known = segments.find((s) => roomTypeOf(s.roomId) === type && (s.packageId || s.packageName) === (pkg?.id || pkg?.name));
    if (known) return Number(known.pricePerNight);
    return packageNightlyPrice(pkg, type, roomSurcharges) * cats;
  };
  const defaultPkgFor = (type, prefer) => {
    const list = lodgingFor(type);
    return list.find((p) => p.id === prefer?.packageId || p.name === prefer?.packageName) || list[0] || null;
  };

  // Khoảng ngày đang chọn
  const extendFrom = currentEnd;
  const extendTo = addDays(currentEnd, days);
  const minChangeFrom = [today, booking?.checkIn].filter(Boolean).sort().pop();
  const from = mode === 'extend' ? extendFrom : (changeFrom || minChangeFrom);
  const to = mode === 'extend' ? extendTo : (changeTo || currentEnd);
  const nights = nightsOf(from, to);

  const roomsWithSpace = useMemo(() => {
    if (!from || !to || from >= to) return [];
    return findRoomsWithSpace({
      rooms: ROOM_CONFIG, allBookingsByRoom: roomBookings || {}, from, to, cats, excludeCodes, maintenance: maintenanceRooms,
    });
  }, [roomBookings, maintenanceRooms, from, to, cats, excludeCodes.join(',')]);

  // Gia hạn: phòng đang ở cuối kỳ còn chỗ không
  const sameRoomFree = mode === 'extend' && roomsWithSpace.some((r) => r.id === lastSeg?.roomId);
  const showRoomList = mode === 'change' || !sameRoomFree || pickOther;

  // Phòng & gói đang chọn
  const effectiveRoomId = (mode === 'extend' && !showRoomList)
    ? lastSeg?.roomId
    : (roomsWithSpace.some((r) => r.id === roomId) ? roomId : '');
  const effectiveType = roomTypeOf(effectiveRoomId);
  const basisSeg = mode === 'extend' ? lastSeg : nowSeg;
  const pkg = effectiveRoomId
    ? (lodgingFor(effectiveType).find((p) => p.id === pkgId) || defaultPkgFor(effectiveType, basisSeg))
    : null;
  const pricePerNight = (mode === 'extend' && !showRoomList && lastSeg)
    ? Number(lastSeg.pricePerNight)
    : (pkg ? priceFor(effectiveType, pkg) : 0);

  const change = effectiveRoomId && nights > 0 ? {
    from, to, roomId: effectiveRoomId, roomType: effectiveType,
    packageId: (mode === 'extend' && !showRoomList) ? lastSeg.packageId : (pkg?.id || ''),
    packageName: (mode === 'extend' && !showRoomList) ? lastSeg.packageName : (pkg?.name || ''),
    pricePerNight,
  } : null;

  // Đổi phòng/gói mà y hệt hiện tại thì không có gì để đổi
  const nothingChanges = mode === 'change' && change
    && segments.every((s) => s.to <= from || s.from >= to || sameStay(s, change));

  const preview = useMemo(() => {
    if (!change || !booking) return null;
    const plan = applyStayChange(booking, change);
    const next = { ...booking, staySegments: plan.segments, checkOut: plan.checkOut, baseCheckOut: booking.baseCheckOut || booking.checkOut };
    const before = buildInvoice(booking, ADDONS);
    const after = buildInvoice(next, ADDONS);
    return { plan, next, before, after, diff: (after?.total || 0) - (before?.total || 0) };
  }, [booking, JSON.stringify(change)]);

  if (!isOpen || !booking) return null;
  const firstPet = resolvedPets?.[0];

  const reset = () => {
    setMode('extend'); setDays(3); setPickOther(false); setRoomId(''); setPkgId('');
    setChangeFrom(''); setChangeTo(''); setDone(null);
  };
  const handleClose = () => { reset(); onClose(); };

  const handleConfirm = () => {
    if (!preview || nothingChanges) return;
    if (isDemo) {
      toast.error('Đây là đơn mẫu, hãy đăng nhập và dùng đơn thật để gia hạn / đổi phòng.');
      return;
    }
    const text = mode === 'extend'
      ? `gia hạn ${nights} đêm (${shortDate(from)} – ${shortDate(to)}) ở ${describeSegment(change)}`
      : `đổi sang ${describeSegment(change)} ngày ${shortDate(from)} – ${shortDate(to)}`;
    const ok = customerChangeStay(booking.id || booking.code, preview.plan, { type: mode, text });
    if (ok) {
      setDone(preview.next);
      toast.success(mode === 'extend' ? `Đã gia hạn thêm ${nights} đêm!` : 'Đã đổi phòng / gói thành công!');
    }
  };

  const doneInvoice = done ? buildInvoice(done, ADDONS) : null;

  // ── Danh sách phòng còn chỗ ──
  const grouped = ['VIP', 'VVIP', 'DELUXE']
    .map((type) => ({ type, rooms: roomsWithSpace.filter((r) => r.type === type) }))
    .filter((g) => g.rooms.length > 0);

  const RoomPicker = () => (
    <div className="space-y-3">
      {grouped.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-600">
          Rất tiếc, không còn phòng nào đủ chỗ cho {cats} bé trong khoảng {shortDate(from)} – {shortDate(to)}. Bạn thử chọn ít ngày hơn hoặc chat với nhân viên nhé.
        </div>
      ) : grouped.map((g) => (
        <div key={g.type}>
          <p className="text-xs font-bold text-gray-500 mb-1.5">{TYPE_LABEL[g.type] || g.type}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {g.rooms.map((r) => {
              const selected = effectiveRoomId === r.id;
              const isCurrent = r.id === (mode === 'extend' ? lastSeg?.roomId : nowSeg?.roomId);
              const upgrade = TYPE_RANK[r.type] > TYPE_RANK[roomTypeOf(basisSeg?.roomId)];
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setRoomId(r.id); setPkgId(''); }}
                  className={`text-left rounded-xl border-2 px-3 py-2 transition-all cursor-pointer ${selected ? 'border-primary bg-primary-light/60 ring-2 ring-primary/20' : 'border-gray-200 bg-white hover:border-primary/40'}`}
                >
                  <p className="font-bold text-sm text-text-dark flex items-center gap-1">
                    <BedDouble className="w-3.5 h-3.5 text-primary" /> {r.id}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold">Còn {r.remaining}/{r.capacity} chỗ</p>
                  {isCurrent && <p className="text-[10px] text-gray-500 font-semibold">Phòng hiện tại</p>}
                  {upgrade && <p className="text-[10px] text-purple-600 font-bold">Nâng hạng</p>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {effectiveRoomId && (
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1.5">Gói dịch vụ cho phòng {effectiveRoomId}</p>
          <div className="space-y-2">
            {lodgingFor(effectiveType).map((p) => {
              const selected = pkg?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPkgId(p.id)}
                  className={`w-full flex items-center justify-between gap-3 text-left rounded-xl border-2 px-3 py-2.5 cursor-pointer transition-all ${selected ? 'border-primary bg-primary-light/60' : 'border-gray-200 bg-white hover:border-primary/40'}`}
                >
                  <span className="text-sm font-semibold text-text-dark">{p.name}</span>
                  <span className="text-sm font-black text-accent whitespace-nowrap">{money(priceFor(effectiveType, p))}/đêm</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Gia hạn và đổi phòng">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary px-6 py-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden">
              {firstPet?.imagePreview
                ? <img src={firstPet.imagePreview} alt={firstPet.name} className="w-full h-full object-cover" />
                : <PawPrint className="w-5 h-5 text-white" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base leading-tight">{done ? 'Đã cập nhật lưu trú' : 'Gia hạn / Đổi phòng'}</h3>
              <p className="text-white/80 text-xs mt-0.5 truncate">
                {firstPet?.name || 'Bé mèo'}{nowSeg ? ` • ${describeSegment(nowSeg)}` : ''}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center cursor-pointer shrink-0" aria-label="Đóng">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {done ? (
          /* ── Thành công: áp dụng ngay, không chờ nhân viên ── */
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-text-dark font-title">Đã áp dụng ngay!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Ngày đón bé: <span className="font-bold text-primary">{fullDate(done.checkOut)}</span>. Lịch lưu trú và hóa đơn đã được cập nhật, nhân viên đã nhận thông báo.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary" /> Lịch lưu trú</p>
              <ul className="space-y-1.5">
                {doneInvoice?.stayPlan.map((s) => (
                  <li key={s.from} className="text-sm text-gray-700 flex justify-between gap-3">
                    <span>{s.label}</span>
                    <span className="text-gray-500 whitespace-nowrap">{s.nights} đêm</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold">
                <span className="text-gray-700">Tổng hóa đơn tạm tính</span>
                <span className="text-primary">{money(doneInvoice?.total)}</span>
              </div>
            </div>
            <button onClick={handleClose} className="w-full bg-primary hover:bg-secondary text-white font-bold py-3.5 rounded-2xl cursor-pointer">Đóng</button>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Chọn kiểu thay đổi */}
              <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-2xl">
                {[
                  { key: 'extend', label: 'Gia hạn lưu trú', icon: CalendarCheck },
                  { key: 'change', label: 'Đổi phòng / gói', icon: ArrowUpCircle },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setMode(key); setRoomId(''); setPkgId(''); setPickOther(false); }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all ${mode === key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>

              {/* Lịch hiện tại */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">Lịch lưu trú hiện tại</p>
                {segments.map((s) => (
                  <p key={s.from} className="text-sm font-semibold text-text-dark">
                    {shortDate(s.from)} – {shortDate(s.to)}: {describeSegment(s)}
                  </p>
                ))}
              </div>

              {mode === 'extend' ? (
                <>
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-1">Số ngày gia hạn</p>
                    <div className="text-center mb-2">
                      <span className="text-5xl font-black text-primary">{days}</span>
                      <span className="text-lg font-bold text-gray-500 ml-1">ngày</span>
                    </div>
                    <input
                      type="range" min={1} max={15} step={1} value={days}
                      onChange={(e) => { setDays(Number(e.target.value)); setRoomId(''); setPkgId(''); }}
                      aria-label="Số ngày gia hạn"
                      className="w-full h-2 appearance-none rounded-full cursor-pointer"
                      style={{ background: `linear-gradient(to right, #22c55e 0%, #22c55e ${((days - 1) / 14) * 100}%, #e5e7eb ${((days - 1) / 14) * 100}%, #e5e7eb 100%)` }}
                    />
                    <div className="flex justify-between mt-1.5 text-xs text-gray-400"><span>1 ngày</span><span>15 ngày</span></div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      Từ <b>{fullDate(extendFrom)}</b> đến ngày đón mới <b className="text-primary">{fullDate(extendTo)}</b>
                    </p>
                  </div>

                  {sameRoomFree ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold text-emerald-800">Phòng {lastSeg?.roomId} còn chỗ trống trong thời gian bạn chọn</p>
                        <p className="text-emerald-700">Bấm "Gia hạn ngay" là ngày lưu trú được kéo dài luôn, không cần chờ nhân viên.</p>
                        {!pickOther && (
                          <button type="button" onClick={() => setPickOther(true)} className="mt-1 text-xs font-bold text-primary underline cursor-pointer">
                            Muốn ở phòng hoặc gói khác cho những ngày gia hạn?
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3" role="alert">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold text-red-700">Phòng {lastSeg?.roomId} không còn chỗ trống trong khoảng thời gian bạn chọn.</p>
                        <p className="text-red-600">Vui lòng chọn phòng khác còn chỗ bên dưới.</p>
                      </div>
                    </div>
                  )}
                  {showRoomList && <RoomPicker />}

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex flex-col gap-2">
                    <p className="text-xs text-amber-700 font-medium">Cần gia hạn trên 15 ngày? Vui lòng liên hệ nhân viên:</p>
                    <div className="flex gap-2">
                      <button onClick={() => { handleClose(); onOpenChat?.(); }} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-3 rounded-lg cursor-pointer">
                        <MessageCircle className="w-3.5 h-3.5" /> Chat với nhân viên
                      </button>
                      <button onClick={() => { handleClose(); onOpenCall?.(); }} className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-secondary text-white font-bold text-xs py-2 px-3 rounded-lg cursor-pointer">
                        <PhoneCall className="w-3.5 h-3.5" /> Gọi hotline
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-gray-600">
                      Áp dụng từ ngày
                      <input
                        type="date" value={from} min={minChangeFrom} max={addDays(currentEnd, -1)}
                        onChange={(e) => { setChangeFrom(e.target.value); setRoomId(''); }}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-text-dark"
                      />
                    </label>
                    <label className="text-xs font-bold text-gray-600">
                      Đến ngày
                      <input
                        type="date" value={to} min={addDays(from, 1)} max={currentEnd}
                        onChange={(e) => { setChangeTo(e.target.value); setRoomId(''); }}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-text-dark"
                      />
                    </label>
                  </div>
                  {from >= currentEnd || nights <= 0 ? (
                    <p className="text-sm text-red-600 font-semibold">Khoảng ngày không hợp lệ, vui lòng chọn lại.</p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500">Chọn phòng và gói bạn muốn dùng cho {nights} đêm này (chỉ hiện phòng còn chỗ):</p>
                      <RoomPicker />
                    </>
                  )}
                  {nothingChanges && <p className="text-sm text-amber-700 font-semibold">Đây đúng là phòng và gói bạn đang dùng, hãy chọn phòng hoặc gói khác.</p>}
                </>
              )}

              {/* Chi phí */}
              {preview && !nothingChanges && (
                <div className="bg-primary-light/50 border border-primary/20 rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" /> Hóa đơn sẽ cập nhật</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{shortDate(from)} – {shortDate(to)}: {describeSegment(change)}</span>
                    <span className="font-semibold text-gray-800 whitespace-nowrap">{money(pricePerNight)}/đêm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phát sinh thêm</span>
                    <span className={`font-semibold ${preview.diff < 0 ? 'text-emerald-600' : 'text-gray-800'}`}>{preview.diff >= 0 ? '+' : ''}{money(preview.diff)}</span>
                  </div>
                  <div className="border-t border-primary/20 pt-2 flex justify-between">
                    <span className="font-bold text-gray-700">Tổng hóa đơn mới</span>
                    <span className="font-black text-primary text-lg">{money(preview.after?.total)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 shrink-0 flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                disabled={!preview || nothingChanges}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 cursor-pointer text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mode === 'extend' ? <CalendarCheck className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                {mode === 'extend'
                  ? (effectiveRoomId && effectiveRoomId !== lastSeg?.roomId ? `Gia hạn ${days} ngày ở phòng ${effectiveRoomId}` : `Gia hạn ngay ${days} ngày`)
                  : (effectiveRoomId ? `Đổi sang phòng ${effectiveRoomId}` : 'Chọn phòng để đổi')}
              </button>
              <button onClick={handleClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-2xl cursor-pointer text-sm">Để sau</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StayChangeModal;
