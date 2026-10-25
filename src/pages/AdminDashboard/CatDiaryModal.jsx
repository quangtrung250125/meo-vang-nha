import React, { useState, useEffect } from 'react';
import CareLogTimeline from '../../components/CareLogTimeline';
import ServiceManagement from '../../components/ServiceManagement';
import { useBookingHistory } from '../../contexts/BookingHistoryContext';
import { toast } from 'react-hot-toast';

const CatDiaryModal = ({ isOpen, onClose, cat, onSave }) => {
  const [activeTab, setActiveTab] = useState('diary'); // 'diary', 'timeline', 'services'
  const { updateBooking } = useBookingHistory();

  const [formData, setFormData] = useState({
    foodAmount: '',
    played: false,
    stool: 'Bình thường',
    health: '',
  });

  useEffect(() => {
    if (cat && cat.diary) {
      setFormData({
        foodAmount: cat.diary.foodAmount || '',
        played: cat.diary.played || false,
        stool: cat.diary.stool || 'Bình thường',
        health: cat.diary.health || '',
      });
    }
  }, [cat]);

  if (!isOpen || !cat) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(cat.id || cat.rawPet?.id, formData);
    // Reset form after save? Or just close modal is handled by parent.
  };

  // Mock booking if missing (for demo data)
  const booking = cat.booking || {
    id: cat.bookingId || 'mock',
    selectedPackage: { name: 'Gói Tiêu Chuẩn', price: '150.000đ' },
    addons: []
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-light">
              <img src={cat.image} alt={cat.catName} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Quản lý bé: {cat.catName}</h2>
              <p className="text-sm text-gray-500">Phòng: {cat.room} | Chủ: {cat.ownerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar Tabs */}
          <div className="w-64 bg-white border-r p-4 shrink-0 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('diary')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'diary' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              📝 Nhập Nhật Ký
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'timeline' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              🕒 Dòng Thời Gian
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'services' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              📦 Gói & Dịch vụ
            </button>
          </div>

          {/* Main Panel */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {activeTab === 'diary' && (
              <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-3">
                  <span className="text-xl">📝</span>
                  Cập nhật Nhật ký mới
                </h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lượng thức ăn đã cho (gram)
                    </label>
                    <input
                      type="number"
                      name="foodAmount"
                      value={formData.foodAmount}
                      onChange={handleChange}
                      placeholder="VD: 50"
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none"
                    />
                  </div>

                  <div className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFormData(p => ({...p, played: !p.played}))}>
                    <input
                      type="checkbox"
                      name="played"
                      checked={formData.played}
                      onChange={handleChange}
                      className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary pointer-events-none"
                    />
                    <label className="ml-3 text-md font-medium text-gray-700 pointer-events-none">
                      Đã cho bé chơi đùa vận động
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tình trạng vệ sinh (Phân/Nước tiểu)
                    </label>
                    <select
                      name="stool"
                      value={formData.stool}
                      onChange={handleChange}
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none"
                    >
                      <option value="Bình thường">Bình thường</option>
                      <option value="Hơi lỏng">Hơi lỏng</option>
                      <option value="Tiêu chảy">Tiêu chảy</option>
                      <option value="Táo bón">Táo bón</option>
                      <option value="Chưa đi vệ sinh">Chưa đi vệ sinh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú thêm về sức khỏe / Tâm trạng
                    </label>
                    <textarea
                      name="health"
                      value={formData.health}
                      onChange={handleChange}
                      rows="3"
                      placeholder="VD: Bé hơi nhát, lười vận động, thích nằm trong góc..."
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none"
                    ></textarea>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t">
                    <button
                      type="button"
                      onClick={() => setFormData({ foodAmount: '', played: false, stool: 'Bình thường', health: '' })}
                      className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                    >
                      Làm mới
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition-colors shadow-md shadow-primary/30"
                    >
                      Lưu Nhật Ký
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="max-w-3xl mx-auto">
                <CareLogTimeline bookingId={cat.bookingId} petId={cat.id || cat.rawPet?.id} />
              </div>
            )}

            {activeTab === 'services' && (
              <div className="max-w-4xl mx-auto">
                <ServiceManagement 
                  booking={booking} 
                  isAdmin={true} 
                  onApproveAddon={(addonId) => {
                    const newAddons = booking.addons.map(a => a.id === addonId ? { ...a, status: 'active' } : a);
                    updateBooking(booking.id, { addons: newAddons });
                    toast.success('Đã duyệt dịch vụ');
                  }}
                  onRemoveAddon={(addonId) => {
                    const newAddons = booking.addons.map(a => a.id === addonId ? { ...a, status: 'rejected' } : a);
                    updateBooking(booking.id, { addons: newAddons });
                    toast.success('Đã huỷ dịch vụ');
                  }}
                  onRequestAddon={(addonKey, option) => {
                    // Admin adding addon manually
                    const newAddon = {
                      id: Date.now().toString(),
                      type: addonKey,
                      option: option,
                      status: 'active', // Auto active if admin adds
                      timestamp: new Date().toISOString()
                    };
                    updateBooking(booking.id, { addons: [...(booking.addons || []), newAddon] });
                    toast.success('Đã thêm dịch vụ thành công!');
                  }}
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CatDiaryModal;
