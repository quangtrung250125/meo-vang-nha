import React from 'react';
import {
  ArrowLeft, Phone, Mail, CalendarDays, PawPrint, CalendarCheck, Wallet, BedDouble, HeartPulse, ChevronRight,
} from 'lucide-react';
import { bookingStage, formatMoney, formatDate } from './customerUtils';
import { Card, SectionTitle, SegmentBadge, StageBadge, Avatar, EmptyState } from './shared';

const PERSONALITY_LABELS = {
  friendly: 'Thân thiện',
  shy: 'Nhút nhát',
  stress: 'Dễ căng thẳng',
  hardToReach: 'Khó gần',
};

const PetCard = ({ pet }) => {
  const traits = Object.entries(PERSONALITY_LABELS)
    .filter(([key]) => pet.personality?.[key])
    .map(([, label]) => label);
  if (pet.personality?.other && pet.personality?.otherDetail) traits.push(pet.personality.otherDetail);
  const health = pet.health || {};
  const healthNotes = [health.medicalCondition, health.allergy && `Dị ứng: ${health.allergy}`, health.medication && `Thuốc: ${health.medication}`]
    .filter(Boolean);

  return (
    <div className="rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex items-center gap-3">
        {pet.imagePreview ? (
          <img src={pet.imagePreview} alt={pet.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <PawPrint className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-gray-800 truncate">{pet.name || 'Bé mèo'}</p>
          <p className="text-xs text-gray-500">
            {[pet.breed, pet.gender, pet.age && `${pet.age} tuổi`, pet.weight && `${pet.weight} kg`].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-xs">
        {health.vaccinated && (
          <p className="text-gray-600"><span className="font-semibold text-gray-700">Tiêm phòng:</span> {health.vaccinated}</p>
        )}
        {healthNotes.length > 0 && (
          <p className="text-rose-600 inline-flex items-start gap-1"><HeartPulse className="h-3.5 w-3.5 shrink-0 mt-px" />{healthNotes.join(' · ')}</p>
        )}
        {(pet.habits || pet.notes) && (
          <p className="text-gray-600"><span className="font-semibold text-gray-700">Thói quen:</span> {pet.habits || pet.notes}</p>
        )}
        {traits.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {traits.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-medium">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CustomerPicker = ({ customers, onSelect }) => (
  <Card className="p-6">
    <SectionTitle title="Chọn khách hàng để xem hồ sơ" subtitle="Hoặc bấm vào một khách trong mục Danh sách khách hàng" />
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {customers.slice(0, 12).map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 text-left hover:border-orange-200 hover:bg-orange-50/40 transition-colors"
        >
          <Avatar name={c.fullName} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{c.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{c.phone || c.email || '—'}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300" />
        </button>
      ))}
    </div>
  </Card>
);

const CustomerProfileTab = ({ customers, selectedId, onSelect, onBack }) => {
  if (customers.length === 0) {
    return <EmptyState title="Chưa có khách hàng nào" />;
  }

  const customer = customers.find((c) => c.id === selectedId);
  if (!customer) return <CustomerPicker customers={customers} onSelect={onSelect} />;

  const stats = [
    { label: 'Hồ sơ mèo', value: customer.pets.length, icon: PawPrint },
    { label: 'Đơn đặt phòng', value: customer.bookingCount, icon: CalendarCheck },
    { label: 'Đã hoàn tất', value: customer.completedCount, icon: BedDouble },
    { label: 'Tổng chi tiêu', value: formatMoney(customer.totalSpent), icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-600">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
      </button>

      {/* Thông tin khách */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <Avatar name={customer.fullName} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-gray-900">{customer.fullName}</h2>
              <SegmentBadge segment={customer.segment} />
              {customer.isStaying && (
                <span className="px-2.5 py-0.5 rounded-full border text-xs font-bold bg-emerald-50 text-emerald-700 border-emerald-200">Đang lưu trú</span>
              )}
              {!customer.hasAccount && (
                <span className="px-2.5 py-0.5 rounded-full border text-xs font-bold bg-gray-50 text-gray-500 border-gray-200">Chưa có tài khoản</span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-600">
              <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4 text-gray-400" />{customer.phone || '—'}</span>
              <span className="inline-flex items-center gap-1.5 min-w-0"><Mail className="h-4 w-4 text-gray-400" /><span className="truncate">{customer.email || '—'}</span></span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-gray-400" />Khách từ {formatDate(customer.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500 inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5 text-orange-500" />{label}</p>
              <p className="text-xl font-black text-gray-900 mt-1 break-words">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Hồ sơ mèo */}
      <Card className="p-6">
        <SectionTitle icon={PawPrint} title={`Hồ sơ mèo (${customer.pets.length})`} subtitle="Đồng bộ từ mục Hồ sơ mèo và bước 3 khi đặt phòng" />
        {customer.pets.length === 0 ? (
          <p className="text-sm text-gray-500">Khách chưa tạo hồ sơ mèo nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {customer.pets.map((pet) => <PetCard key={pet.id} pet={pet} />)}
          </div>
        )}
      </Card>

      {/* Lịch sử đặt phòng */}
      <Card>
        <div className="p-6 pb-0">
          <SectionTitle icon={CalendarCheck} title={`Lịch sử đặt phòng (${customer.bookings.length})`} />
        </div>
        {customer.bookings.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-gray-500">Khách chưa có đơn đặt phòng nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50/60">
                  <th className="px-6 py-3">Mã đơn</th>
                  <th className="px-6 py-3">Ngày gửi → đón</th>
                  <th className="px-6 py-3">Phòng / Gói</th>
                  <th className="px-6 py-3">Mèo</th>
                  <th className="px-6 py-3 text-right">Tổng tiền</th>
                  <th className="px-6 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customer.bookings.map((b) => (
                  <tr key={b.code || b.id}>
                    <td className="px-6 py-3 font-bold text-gray-800 whitespace-nowrap">{b.code || b.id}</td>
                    <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</td>
                    <td className="px-6 py-3 text-gray-600">
                      <p className="font-semibold text-gray-700">{b.roomId || b.selectedRoom?.name || '—'}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[220px]">{(b.packages || []).join(', ') || b.selectedPackage?.name || ''}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{b.catNames || `${b.cats || 1} bé`}</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">{formatMoney(b.totalPrice)}</td>
                    <td className="px-6 py-3"><StageBadge stage={bookingStage(b)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CustomerProfileTab;
