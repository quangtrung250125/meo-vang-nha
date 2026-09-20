import React, { useState } from 'react';
import { Package, Utensils, Droplets, Camera, Home, Sparkles, Plus, ChevronDown, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const ADDONS = {
  room: {
    title: 'Đổi / Nâng cấp phòng',
    icon: Home,
    description: 'Nâng cấp không gian lưu trú cho bé thêm thoải mái và sang xịn hơn.',
    options: [
      { value: 'vvip', label: 'Nâng lên phòng VVIP (+10.000đ/ngày)', price: '+10.000đ/ngày' },
      { value: 'deluxe', label: 'Nâng lên phòng Deluxe (+20.000đ/ngày)', price: '+20.000đ/ngày' },
    ],
  },
  food: {
    title: 'Cho ăn thêm',
    icon: Utensils,
    description: 'Thêm bữa phụ hoặc nâng cấp khẩu phần ăn cho bé thêm dinh dưỡng.',
    options: [
      { value: 'extra_meal', label: 'Thêm 1 bữa phụ (+15.000đ/ngày)', price: '+15.000đ/ngày' },
      { value: 'upgrade_portion', label: 'Nâng khẩu phần ăn (+20.000đ/ngày)', price: '+20.000đ/ngày' },
      { value: 'premium_food', label: 'Nâng lên thức ăn premium (+35.000đ/ngày)', price: '+35.000đ/ngày' },
    ],
  },
  play: {
    title: 'Cho chơi thêm',
    icon: Sparkles,
    isNew: true,
    description: 'Dịch vụ đặc biệt giúp bé vui vẻ, giải trí và giảm stress trong thời gian lưu trú.',
    options: [
      { value: 'play_session', label: 'Buổi chơi riêng 30 phút (liên hệ để biết giá)', price: 'Tư vấn' },
      { value: 'toy_rental', label: 'Thuê thêm đồ chơi cao cấp (liên hệ để biết giá)', price: 'Tư vấn' },
    ],
  },
};

const PackageBlock = ({ booking }) => {
  const pkg = booking?.selectedPackage;
  const room = booking?.selectedRoom;
  const perks = [
    { icon: Utensils, text: '3 bữa ăn/ngày (sáng, trưa, tối)' },
    { icon: Droplets, text: 'Dọn vệ sinh 2 lần/ngày' },
    { icon: Camera, text: 'Camera included' },
    { icon: Home, text: 'Đưa đón miễn phí trong bán kính 5km' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="font-bold text-text-dark mb-4 flex items-center gap-2">
        <Package className="w-4 h-4 text-primary" />
        Gói đang sử dụng
      </h3>
      <div className="flex items-center gap-4 mb-5 p-4 bg-gradient-to-r from-primary/5 to-[#a7f3d0]/20 rounded-xl border border-primary/10">
        <div className="w-14 h-14 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
          <span className="text-2xl">🐱</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-dark text-base">{pkg?.name || 'Gói Tiêu Chuẩn'}</p>
          <p className="text-primary font-bold text-sm">{pkg?.price || '150.000đ'}/ngày</p>
          {room && <p className="text-xs text-gray-500 mt-0.5">Phòng: {room.name}</p>}
        </div>
      </div>
      <div className="space-y-2.5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quyền lợi đi kèm</p>
        {perks.map((perk, i) => {
          const Icon = perk.icon;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm text-gray-700">{perk.text}</span>
              <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AddonCard = ({ addonKey, onRequest }) => {
  const addon = ADDONS[addonKey];
  const [selected, setSelected] = useState('');
  const Icon = addon.icon;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-text-dark text-sm">{addon.title}</h4>
            {addon.isNew && (
              <span className="text-[10px] font-black bg-accent text-white px-2 py-0.5 rounded-full tracking-wide">ĐỀ XUẤT MỚI</span>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">{addon.description}</p>
      <div className="relative mb-3">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer pr-8"
        >
          <option value="">— Chọn tuỳ chọn —</option>
          {addon.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      <button
        onClick={() => {
            if (selected) {
                onRequest(addonKey, selected);
                setSelected('');
            }
        }}
        disabled={!selected}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
          selected
            ? 'bg-primary text-white hover:bg-secondary shadow-md shadow-primary/20 cursor-pointer'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Plus className="w-4 h-4" />
        Yêu cầu dịch vụ
      </button>
    </div>
  );
};

const ActiveAddonsList = ({ booking, isAdmin, onApprove, onRemove }) => {
  const addons = booking?.addons || [];
  if (addons.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mt-6">
      <h3 className="font-bold text-text-dark mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        Dịch vụ thêm đã chọn
      </h3>
      <div className="space-y-3">
        {addons.map((addonReq) => {
          const addonDef = ADDONS[addonReq.type];
          const optionDef = addonDef?.options.find(o => o.value === addonReq.option);
          const isPending = addonReq.status === 'pending';
          
          return (
            <div key={addonReq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="font-bold text-sm text-text-dark">{addonDef?.title}</p>
                <p className="text-xs text-gray-500">{optionDef?.label}</p>
                <div className="flex items-center gap-1 mt-1">
                  {isPending ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Chờ duyệt
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Đang sử dụng
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">{new Date(addonReq.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              
              {isAdmin && (
                <div className="flex gap-2">
                  {isPending && (
                    <button 
                      onClick={() => onApprove(addonReq.id)}
                      className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Duyệt"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => onRemove(addonReq.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xoá/Từ chối"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ServiceManagement = ({ booking, isAdmin, onRequestAddon, onApproveAddon, onRemoveAddon }) => {
  return (
    <div className="space-y-6">
      <PackageBlock booking={booking} />
      
      <ActiveAddonsList 
        booking={booking} 
        isAdmin={isAdmin} 
        onApprove={onApproveAddon} 
        onRemove={onRemoveAddon} 
      />

      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-extrabold text-text-dark font-title">Dịch vụ thêm</h3>
          <span className="text-xs text-gray-400 font-medium">(cộng vào hoá đơn cuối)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(ADDONS).map(key => (
            <AddonCard key={key} addonKey={key} onRequest={onRequestAddon} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceManagement;
