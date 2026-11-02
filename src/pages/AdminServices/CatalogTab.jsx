import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, EyeOff, Eye, RotateCcw, BedDouble, Users, PauseCircle } from 'lucide-react';
import { useServiceCatalog } from '../../contexts/ServiceCatalogContext';
import { SERVICE_CATEGORIES, formatVnd } from '../../utils/serviceCatalog';
import ServiceEditModal from './ServiceEditModal';
import RoomEditModal from './RoomEditModal';

const StatusBadge = ({ item }) => {
  if (item.published === false) {
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 border border-gray-200">Đã gỡ</span>;
  }
  if (item.status === 'paused') {
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Tạm ngưng nhận</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đang đăng</span>;
};

const ServiceRow = ({ item, onEdit }) => {
  const { setItemPublished, resetItem } = useServiceCatalog();
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const hidden = item.published === false;

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
    } catch (err) {
      toast.error(err.message || 'Không lưu được');
    } finally {
      setBusy(false);
      setConfirmReset(false);
    }
  };

  return (
    <div
      data-testid={`service-row-${item.id}`}
      className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row gap-4 ${hidden ? 'border-dashed border-gray-300 opacity-70' : 'border-gray-100 shadow-sm'}`}
    >
      {item.image ? (
        <img src={item.image} alt="" className="w-full sm:w-28 h-28 object-cover rounded-xl bg-gray-100 shrink-0" />
      ) : (
        <div className="w-full sm:w-28 h-28 rounded-xl bg-orange-50 flex items-center justify-center text-3xl shrink-0">🐾</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="font-bold text-gray-800">{item.name}</h3>
          <StatusBadge item={item} />
          {item.isCustom && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Dịch vụ mới</span>}
          {item.edited && !item.isCustom && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200">Đã chỉnh sửa</span>}
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm mb-1">
          <span className="font-black text-orange-600">{item.priceString}</span>
          <span className="text-gray-400 text-xs">{item.period}</span>
          {item.discountPercent > 0 && (
            <>
              <span className="text-gray-400 line-through text-xs">{item.originalPriceString}</span>
              <span className="text-emerald-700 text-xs font-semibold">Ưu đãi -{item.discountPercent}%</span>
            </>
          )}
        </div>
        <p className="text-xs text-gray-500 line-clamp-2">{item.desc}</p>
        <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-gray-500">
          {item.forRoomTypes?.length > 0 && (
            <span className="inline-flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> Phòng: {item.forRoomTypes.join(', ')}</span>
          )}
          {item.capacity && (
            <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {item.capacity}</span>
          )}
          {item.updatedAt && <span>Sửa lúc {new Date(item.updatedAt).toLocaleString('vi-VN')}</span>}
        </div>
      </div>
      <div className="flex sm:flex-col gap-2 shrink-0 flex-wrap">
        <button
          onClick={() => onEdit(item)}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
        >
          <Pencil className="w-3.5 h-3.5" /> Sửa
        </button>
        <button
          onClick={() => run(() => setItemPublished(item.id, hidden), hidden ? `Đã đăng lại "${item.name}"` : `Đã gỡ "${item.name}" khỏi trang khách`)}
          disabled={busy}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border disabled:opacity-50 ${hidden ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
        >
          {hidden ? <><Eye className="w-3.5 h-3.5" /> Đăng lại</> : <><EyeOff className="w-3.5 h-3.5" /> Gỡ xuống</>}
        </button>
        {item.edited && !item.isCustom && (
          confirmReset ? (
            <button
              onClick={() => run(() => resetItem(item.id), `Đã đưa "${item.name}" về bản gốc`)}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"
            >
              Bấm lần nữa để khôi phục
            </button>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              title="Bỏ mọi chỉnh sửa, quay về giá & thông tin ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Về bản gốc
            </button>
          )
        )}
      </div>
    </div>
  );
};

const CatalogTab = () => {
  const { items, rooms } = useServiceCatalog();
  const [editing, setEditing] = useState(null); // item | { isNew: true, category }
  const [editingRoom, setEditingRoom] = useState(null);

  return (
    <div className="space-y-8">
      {/* Hạng phòng */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-800">Hạng phòng</h2>
          <span className="text-xs text-gray-400">Phụ phí nâng hạng cộng vào giá gói lưu trú mỗi ngày</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {rooms.map((room) => (
            <div key={room.key} data-testid={`room-card-${room.key}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800">{room.name}</h3>
                {room.status === 'paused' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><PauseCircle className="w-3 h-3" /> Tạm ngưng</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đang nhận khách</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-2 line-clamp-3 flex-1">{room.description}</p>
              <div className="text-xs text-gray-600 space-y-1 mb-3">
                <p><Users className="inline w-3.5 h-3.5 mr-1" />{room.capacity}</p>
                <p>Phụ phí nâng hạng: <strong>{room.surcharge > 0 ? `+${formatVnd(room.surcharge)}/ngày` : 'Không'}</strong></p>
              </div>
              <button
                onClick={() => setEditingRoom(room)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-orange-600 border border-orange-200 hover:bg-orange-50"
              >
                <Pencil className="w-3.5 h-3.5" /> Sửa hạng phòng
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Dịch vụ theo nhóm */}
      {SERVICE_CATEGORIES.map((category) => {
        const list = items.filter((i) => i.category === category);
        return (
          <section key={category}>
            <div className="flex items-center justify-between mb-3 gap-3">
              <h2 className="font-extrabold text-gray-800">{category} <span className="text-gray-400 font-semibold text-sm">({list.length})</span></h2>
              <button
                onClick={() => setEditing({ isNew: true, category })}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm dịch vụ {category.toLowerCase()}
              </button>
            </div>
            <div className="space-y-3">
              {list.map((item) => (
                <ServiceRow key={item.id} item={item} onEdit={setEditing} />
              ))}
              {list.length === 0 && <p className="text-sm text-gray-400">Chưa có dịch vụ nào.</p>}
            </div>
          </section>
        );
      })}

      {editing && <ServiceEditModal item={editing} onClose={() => setEditing(null)} />}
      {editingRoom && <RoomEditModal room={editingRoom} onClose={() => setEditingRoom(null)} />}
    </div>
  );
};

export default CatalogTab;
