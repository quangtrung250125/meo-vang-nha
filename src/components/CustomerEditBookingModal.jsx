import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  X, Cat, Calendar, BedDouble, Package, Check, Lock, AlertTriangle, CheckCircle2, ArrowLeft, Save, PencilLine, Plus,
} from 'lucide-react';
import { useBookingHistory } from '../contexts/BookingHistoryContext';
import { usePetProfile } from '../contexts/PetContext';
import { useRoomState, ROOM_CONFIG, getPeakOccupancyForRoom } from '../contexts/RoomStateContext';
import { useServiceCatalog } from '../contexts/ServiceCatalogContext';
import { lodgingPricingForRoom } from '../utils/bookingPricing';
import { buildBookingEdit, roomTypeOf, lodgingFitsRoom, EDIT_SECTIONS } from '../utils/bookingEdit';
import { buildInvoice } from '../utils/bookingInvoice';
import {
  getEditedDepositState, getDepositPolicy, depositReceivedOf, depositToTransferOf, todayInVietnam,
  formatVietnamDateTime, getDepositDueAt, PAYMENT_STATUS, DEPOSIT_MIN_STAY_DAYS, DEPOSIT_DEADLINE_HOURS,
} from '../utils/bookingDeposit';
import { formatDateSingle } from '../utils/bookingStatus';
import { paymentAccount } from '../config/payment';
import { buildVietQrPayload, isPaymentAccountReady } from '../utils/vietqr';
import { ADDONS } from './ServiceManagement';

const SECTIONS = [
  { key: EDIT_SECTIONS.PETS, label: 'Mèo', hint: 'Đổi bé, số lượng bé', icon: Cat },
  { key: EDIT_SECTIONS.DATES, label: 'Lịch đặt', hint: 'Ngày gửi & ngày đón', icon: Calendar },
  { key: EDIT_SECTIONS.ROOM, label: 'Phòng', hint: 'Chọn phòng khác', icon: BedDouble },
  { key: EDIT_SECTIONS.PACKAGES, label: 'Gói dịch vụ', hint: 'Lưu trú, spa, dịch vụ khác', icon: Package },
];

const ROOM_TYPE_LABEL = { VIP: 'Hạng VIP', VVIP: 'Hạng VVIP', DELUXE: 'Hạng Deluxe' };

const money = (n) => `${(Number(n) || 0).toLocaleString('vi-VN')}đ`;

// Khung của từng mục: mục khách không chọn sửa thì chỉ hiện thông tin hiện tại
const SectionCard = ({ icon: Icon, title, editing, children }) => (
  <div className={`rounded-2xl border-2 p-4 ${editing ? 'border-primary/40 bg-white' : 'border-gray-100 bg-gray-50/70'}`}>
    <div className="flex items-center justify-between gap-2 mb-2.5">
      <p className="flex items-center gap-2 text-sm font-bold text-text-dark">
        <Icon className={`w-4 h-4 ${editing ? 'text-primary' : 'text-gray-400'}`} />
        {title}
      </p>
      {editing ? (
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-light px-2 py-0.5 rounded-full">Đang sửa</span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400"><Lock className="w-3 h-3" />Giữ nguyên</span>
      )}
    </div>
    {children}
  </div>
);

// Danh sách phòng còn đủ chỗ trong khoảng ngày khách chọn (giống bước kiểm tra phòng lúc đặt)
const RoomChoiceList = ({ groups, selectedId, currentId, cats, onSelect }) => {
  if (groups.length === 0) {
    return (
      <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
        Không còn phòng nào đủ chỗ cho {cats} bé trong khoảng thời gian này, vui lòng chọn ngày khác.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {groups.map(({ type, rooms }) => (
        <div key={type}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">{ROOM_TYPE_LABEL[type] || type}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {rooms.map((r) => {
              const isSelected = r.id === selectedId;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className={`rounded-xl border-2 px-3 py-2 text-left text-xs transition cursor-pointer ${
                    isSelected ? 'border-primary bg-primary-light/40 ring-2 ring-primary/20' : 'border-gray-200 bg-white hover:border-primary/50'
                  }`}
                >
                  <span className="flex items-center justify-between gap-1 font-bold text-text-dark">
                    {r.id}
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </span>
                  <span className="block text-emerald-700 font-semibold">Còn {r.remaining}/{r.capacity} chỗ</span>
                  {r.id === currentId && <span className="block text-[10px] font-bold text-primary">Phòng hiện tại</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// Thẻ chọn gói dịch vụ
const PackageOption = ({ pkg, priceString, isSelected, isCurrent, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-xl border-2 px-3 py-2.5 text-left text-xs transition cursor-pointer ${
      isSelected ? 'border-primary bg-primary-light/40 ring-2 ring-primary/20' : 'border-gray-200 bg-white hover:border-primary/50'
    }`}
  >
    <span className="flex items-start justify-between gap-2">
      <span className="font-bold text-text-dark">{pkg.name}</span>
      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
    </span>
    <span className="block text-accent font-bold mt-0.5">{priceString}{pkg.period ? <span className="text-gray-400 font-medium"> {pkg.period}</span> : null}</span>
    {isCurrent && <span className="inline-block mt-1 text-[10px] font-bold text-primary bg-primary-light px-1.5 py-0.5 rounded-full">Đang chọn</span>}
  </button>
);

// Ghi chú thanh toán / đặt cọc theo quy định: gửi từ 5 ngày cọc 50%, dưới 5 ngày chỉ hiện giá
const DepositNote = ({ booking, total }) => {
  const policy = getDepositPolicy({ checkIn: booking.checkIn, checkOut: booking.checkOut, total: booking.totalPrice });
  const received = depositReceivedOf(booking);
  const toTransfer = depositToTransferOf(booking);

  if (booking.paymentStatus === 'Đã thanh toán') {
    const paid = Number(booking.paidAmount) || 0;
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Đơn đã thanh toán {money(paid)}.{total > paid ? <> Phần chênh lệch <strong>{money(total - paid)}</strong> thanh toán khi hoàn thành dịch vụ.</> : null}
      </div>
    );
  }
  if (!policy.required) {
    return (
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 space-y-1">
        <p className="font-bold">✅ Không bắt buộc đặt cọc</p>
        <p>Bạn gửi bé {policy.stayDays} ngày (dưới {DEPOSIT_MIN_STAY_DAYS} ngày) nên chỉ cần thanh toán <strong>{money(total)}</strong> khi hoàn thành dịch vụ.</p>
        {received > 0 && <p>Tiền cọc {money(received)} bạn đã chuyển sẽ được trừ khi thanh toán.</p>}
      </div>
    );
  }
  return (
    <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-1">
      <p className="font-bold">💰 Cần đặt cọc 50%: {money(policy.amount)}</p>
      <p>Bạn gửi bé {policy.stayDays} ngày (từ {DEPOSIT_MIN_STAY_DAYS} ngày trở lên) nên cần cọc 50% tiền dịch vụ.</p>
      {booking.paymentStatus === PAYMENT_STATUS.DEPOSIT_PAID && (
        <p className="font-semibold text-emerald-700">Bạn đã cọc {money(received)}, đủ mức cọc. Số còn lại {money(Math.max(total - received, 0))} thanh toán khi hoàn thành dịch vụ.</p>
      )}
      {booking.paymentStatus === PAYMENT_STATUS.AWAITING_TOP_UP && (
        <p className="font-semibold">
          {received > 0 ? <>Bạn đã cọc {money(received)}, vui lòng chuyển thêm </> : <>Vui lòng chuyển cọc </>}
          <strong className="text-red-700">{money(toTransfer)}</strong> (nội dung: COC {booking.code || booking.id}). Mã đặt phòng của bạn giữ nguyên.
        </p>
      )}
      {booking.paymentStatus === PAYMENT_STATUS.AWAITING_DEPOSIT && (
        <p className="font-semibold">
          Vui lòng chuyển cọc <strong className="text-red-700">{money(toTransfer)}</strong> (nội dung: COC {booking.code || booking.id})
          {formatVietnamDateTime(getDepositDueAt(booking)) ? <> trước {formatVietnamDateTime(getDepositDueAt(booking))}</> : null} để nhận mã đặt phòng.
        </p>
      )}
    </div>
  );
};

// Thông tin đơn sau khi sửa (giống phần xác nhận lúc đặt phòng)
const OrderInfo = ({ booking, days }) => (
  <div className="rounded-2xl border border-gray-100 bg-bg-cream/60 p-4 text-sm space-y-1.5">
    <p className="flex justify-between gap-3"><span className="text-gray-500">Mèo</span><strong className="text-right text-text-dark">{booking.catNames || '—'} ({booking.cats} bé)</strong></p>
    <p className="flex justify-between gap-3"><span className="text-gray-500">Lịch</span><strong className="text-right text-text-dark">{formatDateSingle(booking.checkIn)} → {formatDateSingle(booking.checkOut)} ({days} ngày)</strong></p>
    <p className="flex justify-between gap-3"><span className="text-gray-500">Phòng</span><strong className="text-right text-text-dark">{booking.roomId}</strong></p>
    <p className="flex justify-between gap-3"><span className="text-gray-500">Gói dịch vụ</span><strong className="text-right text-text-dark">{(booking.packages || []).join(' + ') || '—'}</strong></p>
  </div>
);

const EditBookingContent = ({ booking, onClose }) => {
  const { customerEditBooking, globalBookingList } = useBookingHistory();
  const { petList } = usePetProfile();
  const { bookings: roomBookings, getRoomAvailability } = useRoomState();
  const { publishedItems, roomSurcharges, activeRules } = useServiceCatalog();

  const code = booking.code || booking.id;
  const excludeCodes = useMemo(() => [booking.code, booking.id].filter(Boolean), [booking.code, booking.id]);
  const today = todayInVietnam();
  const originalRoomId = booking.roomId || booking.selectedRoom?.id;
  const originalRoomType = roomTypeOf(originalRoomId);
  const lodgingCatalog = publishedItems.filter((p) => p.category === 'Lưu trú');
  // Gói lưu trú đã lưu trong đơn (giá lúc đặt); đơn cũ chỉ có tên gói thì tìm theo tên trong danh mục
  const storedLodging = booking.selectedLodging || booking.selectedPackage || null;
  const originalLodging = storedLodging || lodgingCatalog.find((p) => p.name === booking.packages?.[0]) || null;

  // Mèo của đơn: ưu tiên hồ sơ mới nhất trong "Hồ sơ mèo", bé đã xóa khỏi hồ sơ thì lấy bản lưu trong đơn
  const originalPets = useMemo(() => {
    const ids = booking.petIds?.length ? booking.petIds : (booking.petProfiles || []).map((p) => p?.id);
    return ids
      .map((id) => petList.find((p) => p.id === id) || (booking.petProfiles || []).find((p) => p?.id === id))
      .filter(Boolean);
  }, [booking.petIds, booking.petProfiles, petList]);
  const petOptions = useMemo(() => {
    const list = [...petList];
    originalPets.forEach((p) => { if (!list.some((x) => x.id === p.id)) list.push(p); });
    return list;
  }, [petList, originalPets]);

  const [sections, setSections] = useState(() => new Set());
  const [petIds, setPetIds] = useState(() => originalPets.map((p) => p.id));
  const [checkIn, setCheckIn] = useState(booking.checkIn || '');
  const [checkOut, setCheckOut] = useState(booking.checkOut || '');
  const [roomId, setRoomId] = useState(originalRoomId);
  const [lodging, setLodging] = useState(originalLodging);
  const [spa, setSpa] = useState(booking.selectedSpa || null);
  const [extra, setExtra] = useState(booking.selectedExtra || null);
  const [step, setStep] = useState('edit'); // 'edit' | 'review' | 'done'
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSummary, setSavedSummary] = useState([]);

  const editing = (key) => sections.has(key);

  // ── Mèo ──
  const editingPets = sections.has(EDIT_SECTIONS.PETS);
  const draftPets = useMemo(() => (editingPets
    ? petIds.map((id) => petOptions.find((p) => p.id === id)).filter(Boolean)
    : (booking.petProfiles?.length ? booking.petProfiles : originalPets)), [editingPets, petIds, petOptions, booking.petProfiles, originalPets]);
  const cats = Math.max(1, draftPets.length || Number(booking.cats) || 1);

  // ── Lịch & phòng ──
  const dateError = !checkIn || !checkOut
    ? 'Vui lòng chọn ngày gửi và ngày đón.'
    : checkOut <= checkIn
      ? 'Ngày đón bé phải sau ngày gửi bé.'
      : checkIn < today ? 'Ngày gửi bé không được trước hôm nay.' : '';
  const room = ROOM_CONFIG.find((r) => r.id === roomId) || null;
  const roomType = roomTypeOf(roomId);
  const roomFits = Boolean(room) && !dateError && cats <= room.capacity
    && getPeakOccupancyForRoom(roomId, roomBookings, checkIn, checkOut, excludeCodes) + cats <= room.capacity;
  const roomGroups = useMemo(() => (dateError ? [] : getRoomAvailability(cats, checkIn, checkOut, excludeCodes)
    .map((g) => ({ ...g, rooms: g.rooms.filter((r) => !r.isBooked) }))
    .filter((g) => g.rooms.length > 0)), [dateError, getRoomAvailability, cats, checkIn, checkOut, excludeCodes]);
  const days = dateError ? 0 : Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000);

  // ── Gói dịch vụ (gói lưu trú tính giá theo hạng phòng như bước 2 đặt phòng) ──
  const lodgingOptions = lodgingCatalog.filter((p) => lodgingFitsRoom(p, roomType));
  const spaOptions = publishedItems.filter((p) => p.category === 'Spa - Tắm cắt');
  const extraOptions = publishedItems.filter((p) => p.category === 'Dịch vụ khác');
  const lodgingSource = lodging ? (lodgingCatalog.find((p) => p.id === lodging.id) || lodging) : null;
  const lodgingValid = Boolean(lodgingSource) && lodgingFitsRoom(lodgingSource, roomType);
  const pricedLodging = useMemo(() => {
    if (!lodgingSource) return null;
    // Không đổi gói và không đổi hạng phòng thì giữ đúng giá lúc đặt
    if (storedLodging && lodgingSource.id === storedLodging.id && roomType === originalRoomType) return storedLodging;
    return { ...lodgingSource, ...lodgingPricingForRoom(lodgingSource, roomType, roomSurcharges) };
  }, [lodgingSource, storedLodging, roomType, originalRoomType, roomSurcharges]);
  const mustPickLodging = !lodgingValid;

  const edit = useMemo(() => {
    if (!pricedLodging || dateError || !room) return null;
    return buildBookingEdit(booking, {
      pets: draftPets,
      checkIn,
      checkOut,
      room: { id: room.id, type: room.type, capacity: room.capacity },
      lodging: pricedLodging,
      spa,
      extra,
    }, { pricingRules: activeRules });
  }, [booking, draftPets, checkIn, checkOut, room, pricedLodging, spa, extra, activeRules, dateError]);

  const toggleSection = (key) => {
    setError('');
    const turningOff = sections.has(key);
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    if (!turningOff) return;
    // Bỏ chọn mục nào thì mục đó trở về như đơn hiện tại
    if (key === EDIT_SECTIONS.PETS) setPetIds(originalPets.map((p) => p.id));
    if (key === EDIT_SECTIONS.DATES) {
      setCheckIn(booking.checkIn || '');
      setCheckOut(booking.checkOut || '');
    }
    if (key === EDIT_SECTIONS.PACKAGES) {
      setLodging(originalLodging);
      setSpa(booking.selectedSpa || null);
      setExtra(booking.selectedExtra || null);
    }
    // Phòng chỉ đổi vì lịch / số mèo mới (khách không chọn sửa phòng) thì cũng trở về phòng cũ
    if (key === EDIT_SECTIONS.ROOM || (key !== EDIT_SECTIONS.PACKAGES && !sections.has(EDIT_SECTIONS.ROOM))) {
      setRoomId(originalRoomId);
    }
  };

  const togglePet = (id) => setPetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleReview = () => {
    if (sections.size === 0) return setError('Vui lòng chọn mục bạn muốn thay đổi.');
    if (editing(EDIT_SECTIONS.PETS) && draftPets.length === 0) return setError('Vui lòng chọn ít nhất 1 bé mèo.');
    if (dateError) return setError(dateError);
    if (!roomFits) return setError(`Phòng ${roomId} đã full trong khoảng thời gian này, vui lòng chọn phòng khác.`);
    if (!lodgingValid || !edit) return setError(`Vui lòng chọn gói lưu trú dành cho phòng ${roomType}.`);
    if (edit.summary.length === 0) return setError('Bạn chưa thay đổi thông tin nào của đơn.');
    setError('');
    setStep('review');
    return undefined;
  };

  const handleSave = async () => {
    if (!edit || saving) return;
    setSaving(true);
    setError('');
    const result = await customerEditBooking(booking.id, edit.changes, edit.summary.join('; '));
    setSaving(false);
    if (!result?.ok) {
      setError(result?.message || 'Chưa lưu được thay đổi, vui lòng thử lại.');
      setStep('edit');
      return;
    }
    setSavedSummary(edit.summary);
    setStep('done');
  };

  // Phần cảnh báo hết chỗ + danh sách phòng còn chỗ (hiện ở mục Lịch đặt nếu khách đang sửa lịch, không thì ở mục Phòng)
  const fullWarning = (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1.5 text-sm font-bold text-rose-700">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        Đã full, vui lòng chọn phòng khác
      </p>
      <RoomChoiceList groups={roomGroups} selectedId={roomId} currentId={originalRoomId} cats={cats} onSelect={(r) => { setRoomId(r.id); setError(''); }} />
    </div>
  );
  const showFullInDates = editing(EDIT_SECTIONS.DATES) && !dateError && !roomFits;
  const showFullInRoom = !editing(EDIT_SECTIONS.ROOM) && !showFullInDates && !dateError && !roomFits;

  // ── Bước 3: đã lưu ──
  if (step === 'done') {
    const saved = globalBookingList.find((b) => b.id === booking.id || b.code === code) || { ...booking, ...edit?.changes };
    const total = (buildInvoice(saved, ADDONS)?.total ?? Number(saved.totalPrice)) || 0;
    const toTransfer = depositToTransferOf(saved);
    const memo = `COC ${code}`;
    return (
      <div className="p-6 space-y-4">
        <div className="text-center">
          <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-2" />
          <h3 className="text-xl font-bold text-text-dark font-title">Đã cập nhật đơn #{code}</h3>
          <p className="text-xs text-gray-500 mt-1">Mèo Vắng Nhà đã nhận thay đổi của bạn.</p>
        </div>
        {savedSummary.length > 0 && (
          <ul className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 space-y-1 list-disc list-inside">
            {savedSummary.map((line) => <li key={line}>{line}</li>)}
          </ul>
        )}
        <OrderInfo booking={saved} days={edit?.days || days} />
        <div className="flex justify-between items-center rounded-2xl border border-gray-100 p-4">
          <span className="text-sm font-bold text-gray-500 uppercase">Tổng tiền đơn</span>
          <span className="text-2xl font-black text-accent">{money(total)}</span>
        </div>
        <DepositNote booking={saved} total={total} />
        {toTransfer > 0 && (
          <div className="rounded-2xl border border-emerald-100 p-4 text-center">
            <p className="text-xs font-semibold text-gray-500">
              {saved.paymentStatus === PAYMENT_STATUS.AWAITING_TOP_UP ? 'QUÉT MÃ ĐỂ CỌC BỔ SUNG' : 'QUÉT MÃ ĐỂ ĐẶT CỌC 50%'}
            </p>
            <p className="text-2xl font-black text-accent mb-3">{money(toTransfer)}</p>
            {isPaymentAccountReady(paymentAccount) ? (
              <>
                <div className="bg-white p-2 rounded-xl inline-block border border-gray-100">
                  <QRCodeSVG value={buildVietQrPayload({ ...paymentAccount, amount: toTransfer, memo })} size={170} level="M" />
                </div>
                <p className="text-xs text-gray-500 mt-2">{paymentAccount.bankName} · {paymentAccount.accountNumber} · Nội dung: <strong>{memo}</strong></p>
              </>
            ) : (
              <p className="text-xs text-gray-500">Nhân viên Mèo Vắng Nhà sẽ gửi thông tin chuyển khoản cho bạn qua Zalo/điện thoại.</p>
            )}
            {saved.paymentStatus === PAYMENT_STATUS.AWAITING_DEPOSIT && (
              <p className="text-xs text-red-700 mt-2">Vui lòng chuyển cọc trong {DEPOSIT_DEADLINE_HOURS} giờ kể từ lúc đặt phòng, quá hạn đơn có thể bị hủy.</p>
            )}
          </div>
        )}
        <button type="button" onClick={onClose} className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 cursor-pointer">
          Đóng
        </button>
      </div>
    );
  }

  // ── Bước 2: xem lại đơn (giống bước xác nhận lúc đặt phòng) ──
  if (step === 'review' && edit) {
    const { pricing, changes } = edit;
    const coupon = booking.couponApplied !== false;
    const lodgingAmount = coupon ? pricing.discountedLodgingTotal : pricing.originalLodgingTotal;
    const spaAmount = coupon ? pricing.spaTotal : pricing.spaOriginalTotal;
    const extraAmount = pricing.total - pricing.ruleAdjustmentTotal - lodgingAmount - spaAmount - pricing.cameraTotal;
    const preview = { ...booking, ...changes };
    Object.assign(preview, getEditedDepositState({ booking, checkIn: changes.checkIn, checkOut: changes.checkOut, total: changes.totalPrice }));
    const oldTotal = buildInvoice(booking, ADDONS)?.total ?? 0;
    const newTotal = buildInvoice({ ...preview, originalCheckIn: changes.checkIn, originalCheckOut: changes.checkOut }, ADDONS)?.total ?? pricing.total;
    const requestedExtras = newTotal - pricing.total;
    const diff = newTotal - oldTotal;
    return (
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-text-dark font-title">Xem lại đơn sau khi thay đổi</h3>
          <p className="text-xs text-gray-500">Kiểm tra thông tin và chi phí mới trước khi lưu.</p>
        </div>
        <ul className="text-xs text-gray-700 bg-primary-light/30 border border-primary/20 rounded-xl p-3 space-y-1 list-disc list-inside">
          {edit.summary.map((line) => <li key={line}>{line}</li>)}
        </ul>
        <OrderInfo booking={changes} days={edit.days} />
        <div className="rounded-2xl border border-gray-100 p-4 text-sm space-y-2">
          <p className="flex justify-between gap-3">
            <span className="text-gray-600">{changes.selectedLodging?.name} ({money(changes.selectedLodging?.price)} × {edit.days} ngày × {changes.cats} bé)</span>
            <span className="font-semibold">{money(lodgingAmount)}</span>
          </p>
          {changes.selectedSpa && (
            <p className="flex justify-between gap-3"><span className="text-gray-600">{changes.selectedSpa.name} (× {changes.cats} bé)</span><span className="font-semibold">{money(spaAmount)}</span></p>
          )}
          {changes.selectedExtra && (
            <p className="flex justify-between gap-3"><span className="text-gray-600">{changes.selectedExtra.name}</span><span className="font-semibold">{money(extraAmount)}</span></p>
          )}
          {pricing.cameraIncluded ? (
            <p className="flex justify-between gap-3"><span className="text-gray-600">Camera riêng</span><span className="font-semibold text-emerald-700">Đã gồm trong gói</span></p>
          ) : pricing.cameraTotal > 0 && (
            <p className="flex justify-between gap-3"><span className="text-gray-600">Camera riêng ({edit.days} ngày)</span><span className="font-semibold">{money(pricing.cameraTotal)}</span></p>
          )}
          {pricing.ruleAdjustments.map((line) => (
            <p key={line.id} className={`flex justify-between gap-3 ${line.amount < 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
              <span>{line.name}</span><span className="font-semibold">{line.amount > 0 ? '+' : ''}{money(line.amount)}</span>
            </p>
          ))}
          {requestedExtras !== 0 && (
            <p className="flex justify-between gap-3"><span className="text-gray-600">Dịch vụ thêm / gia hạn đã yêu cầu</span><span className="font-semibold">{money(requestedExtras)}</span></p>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="font-bold text-gray-500 uppercase text-xs">Tổng tiền đơn mới</span>
            <span className="text-2xl font-black text-accent">{money(newTotal)}</span>
          </div>
          <p className="text-xs text-gray-500 text-right">
            Trước khi sửa: {money(oldTotal)}
            {diff !== 0 && <strong className={diff > 0 ? 'text-rose-600' : 'text-emerald-600'}> ({diff > 0 ? '+' : '−'}{money(Math.abs(diff))})</strong>}
          </p>
        </div>
        <DepositNote booking={preview} total={newTotal} />
        {error && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>}
        <div className="flex gap-3">
          <button type="button" onClick={() => setStep('edit')} className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />Quay lại sửa
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 disabled:opacity-60 cursor-pointer">
            <Save className="w-4 h-4" />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    );
  }

  // ── Bước 1: chọn mục cần sửa và sửa ──
  return (
    <div className="p-6 space-y-4">
      <div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Bạn muốn thay đổi gì? (chọn được nhiều mục)</p>
        <div className="grid grid-cols-2 gap-2">
          {SECTIONS.map(({ key, label, hint, icon: Icon }) => {
            const active = editing(key);
            return (
              <button
                type="button"
                key={key}
                onClick={() => toggleSection(key)}
                aria-pressed={active}
                aria-label={`Sửa ${label.toLowerCase()}`}
                className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2.5 text-left transition cursor-pointer ${
                  active ? 'border-primary bg-primary-light/40' : 'border-gray-200 bg-white hover:border-primary/40'
                }`}
              >
                <span className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${active ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                  {active && <Check className="w-3 h-3 text-white" />}
                </span>
                <span>
                  <span className="flex items-center gap-1 text-sm font-bold text-text-dark"><Icon className="w-3.5 h-3.5" />{label}</span>
                  <span className="block text-[11px] text-gray-500">{hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mèo */}
      <SectionCard icon={Cat} title="Mèo" editing={editing(EDIT_SECTIONS.PETS)}>
        {editing(EDIT_SECTIONS.PETS) ? (
          <div className="space-y-2">
            {petOptions.length === 0 && <p className="text-xs text-gray-500">Bạn chưa có hồ sơ mèo nào.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {petOptions.map((pet) => {
                const selected = petIds.includes(pet.id);
                return (
                  <button
                    type="button"
                    key={pet.id}
                    onClick={() => togglePet(pet.id)}
                    className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left transition cursor-pointer ${selected ? 'border-primary bg-primary-light/30' : 'border-gray-200 bg-white hover:border-primary/40'}`}
                  >
                    <span className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                      {pet.imagePreview ? <img src={pet.imagePreview} alt={pet.name} className="w-full h-full object-cover" /> : <Cat className="w-4 h-4 text-gray-400" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold text-text-dark truncate">{pet.name || 'Bé mèo'}</span>
                      {pet.breed && <span className="block text-[11px] text-gray-500 truncate">{pet.breed}</span>}
                    </span>
                    {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-primary">Đã chọn {draftPets.length} bé</span>
              <Link to="/pet-profile" className="inline-flex items-center gap-1 font-semibold text-gray-500 hover:text-primary">
                <Plus className="w-3.5 h-3.5" />Thêm hồ sơ mèo
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700">{draftPets.map((p) => p?.name).filter(Boolean).join(', ') || booking.catNames || 'Bé mèo'} <span className="text-gray-400">({cats} bé)</span></p>
        )}
      </SectionCard>

      {/* Lịch đặt */}
      <SectionCard icon={Calendar} title="Lịch đặt" editing={editing(EDIT_SECTIONS.DATES)}>
        {editing(EDIT_SECTIONS.DATES) ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                Ngày gửi bé
                <input type="date" min={today} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); setError(''); }}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium normal-case" />
              </label>
              <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                Ngày đón bé
                <input type="date" min={checkIn || today} value={checkOut} onChange={(e) => { setCheckOut(e.target.value); setError(''); }}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium normal-case" />
              </label>
            </div>
            {dateError ? (
              <p className="text-xs font-semibold text-rose-700">{dateError}</p>
            ) : roomFits ? (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Còn chỗ: phòng {roomId} từ {formatDateSingle(checkIn)} đến {formatDateSingle(checkOut)} ({days} ngày)
              </p>
            ) : null}
            {showFullInDates && fullWarning}
          </div>
        ) : (
          <p className="text-sm text-gray-700">{formatDateSingle(checkIn)} → {formatDateSingle(checkOut)} <span className="text-gray-400">({days} ngày)</span></p>
        )}
      </SectionCard>

      {/* Phòng */}
      <SectionCard icon={BedDouble} title="Phòng" editing={editing(EDIT_SECTIONS.ROOM)}>
        {editing(EDIT_SECTIONS.ROOM) ? (
          <div className="space-y-2.5">
            <p className="text-xs text-gray-600">
              Phòng hiện tại: <strong className="text-text-dark">{originalRoomId}</strong>
              {roomId !== originalRoomId && <> → phòng mới: <strong className="text-primary">{roomId}</strong></>}
            </p>
            {dateError ? (
              <p className="text-xs font-semibold text-rose-700">{dateError}</p>
            ) : (
              <>
                <p className="text-[11px] text-gray-500">Các phòng còn chỗ cho {cats} bé từ {formatDateSingle(checkIn)} đến {formatDateSingle(checkOut)}:</p>
                <RoomChoiceList groups={roomGroups} selectedId={roomId} currentId={originalRoomId} cats={cats} onSelect={(r) => { setRoomId(r.id); setError(''); }} />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-sm text-gray-700">Phòng {roomId}{roomId !== originalRoomId && <span className="text-xs text-primary font-semibold"> (đổi từ {originalRoomId})</span>}</p>
            {showFullInRoom && fullWarning}
          </div>
        )}
      </SectionCard>

      {/* Gói dịch vụ */}
      <SectionCard icon={Package} title="Gói dịch vụ" editing={editing(EDIT_SECTIONS.PACKAGES) || mustPickLodging}>
        {editing(EDIT_SECTIONS.PACKAGES) || mustPickLodging ? (
          <div className="space-y-3">
            {mustPickLodging && (
              <p className="flex items-start gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {lodging
                  ? `Gói lưu trú hiện tại không áp dụng cho phòng ${roomType}, vui lòng chọn gói khác.`
                  : `Vui lòng chọn gói lưu trú cho phòng ${roomType}.`}
              </p>
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Gói lưu trú (bắt buộc)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lodgingOptions.map((pkg) => (
                  <PackageOption
                    key={pkg.id}
                    pkg={pkg}
                    priceString={lodgingPricingForRoom(pkg, roomType, roomSurcharges).priceString}
                    isSelected={lodging?.id === pkg.id}
                    isCurrent={originalLodging?.id === pkg.id}
                    onClick={() => { setLodging(pkg); setError(''); }}
                  />
                ))}
              </div>
            </div>
            {spaOptions.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Spa - Tắm cắt (tùy chọn, bấm lần nữa để bỏ)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {spaOptions.map((pkg) => (
                    <PackageOption key={pkg.id} pkg={pkg} priceString={pkg.priceString}
                      isSelected={spa?.id === pkg.id} isCurrent={booking.selectedSpa?.id === pkg.id}
                      onClick={() => setSpa(spa?.id === pkg.id ? null : pkg)} />
                  ))}
                </div>
              </div>
            )}
            {extraOptions.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Dịch vụ khác (tùy chọn, bấm lần nữa để bỏ)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {extraOptions.map((pkg) => (
                    <PackageOption key={pkg.id} pkg={pkg} priceString={pkg.priceString}
                      isSelected={extra?.id === pkg.id} isCurrent={booking.selectedExtra?.id === pkg.id}
                      onClick={() => setExtra(extra?.id === pkg.id ? null : pkg)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-700">{[lodging?.name, spa?.name, extra?.name].filter(Boolean).join(' + ') || (booking.packages || []).join(' + ') || '—'}</p>
        )}
      </SectionCard>

      {error && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 cursor-pointer">
          Đóng
        </button>
        <button type="button" onClick={handleReview} disabled={sections.size === 0}
          className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
          Xem lại đơn
        </button>
      </div>
    </div>
  );
};

/**
 * Khách chỉnh sửa đơn "Sắp tới": chọn mục muốn sửa (mèo, lịch, phòng, gói dịch vụ), xem lại chi phí rồi lưu.
 * Thay đổi áp dụng ngay; gửi từ 5 ngày thì cần cọc 50% (đơn đã có mã chỉ cọc bổ sung phần thiếu).
 */
const CustomerEditBookingModal = ({ isOpen, booking, onClose }) => {
  if (!isOpen || !booking) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Chỉnh sửa đơn đặt phòng"
      >
        <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <PencilLine className="w-5 h-5" />
            <h3 className="text-xl font-bold font-title">Chỉnh Sửa Đơn Đặt Phòng</h3>
          </div>
          <p className="text-xs text-amber-100 mt-0.5">Đơn #{booking.code || booking.id} • Thay đổi được áp dụng ngay sau khi lưu</p>
        </div>
        <EditBookingContent booking={booking} onClose={onClose} />
      </div>
    </div>
  );
};

export default CustomerEditBookingModal;
