import React, { useState } from 'react';
import { PawPrint, X, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Bell, BellOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCustomerProfile } from '../contexts/CustomerContext';
import {
  requestNotificationPermission,
  sendWelcomeNotifications,
  saveNotificationPreference,
  wasNotificationAsked,
} from '../utils/notifications';

const AuthModal = ({ isOpen, onClose }) => {
  const { authenticateCustomer, registerCustomer } = useCustomerProfile();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [registeredName, setRegisteredName] = useState('');

  const [formData, setFormData] = useState({
    identifier: '', // Email hoặc Số điện thoại khi đăng nhập
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setErrorMessage('');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
    setShowNotifPrompt(false);
    setFormData({
      identifier: '',
      fullName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  // ── Xử lý notification prompt ───────────────────────────────
  const handleAllowNotification = async () => {
    const result = await requestNotificationPermission();
    saveNotificationPreference(result === 'granted');
    if (result === 'granted') {
      await sendWelcomeNotifications(registeredName);
      toast.success('🔔 Đã bật thông báo! Bạn sẽ nhận tin tức & ưu đãi từ Mèo Vắng Nhà.');
    } else {
      toast('Bạn có thể bật thông báo sau trong cài đặt trình duyệt.', { icon: '🔕' });
    }
    setShowNotifPrompt(false);
    onClose();
  };

  const handleDeclineNotification = () => {
    saveNotificationPreference(false);
    toast('Bạn có thể bật thông báo sau trong cài đặt trình duyệt.', { icon: '🔕' });
    setShowNotifPrompt(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (activeTab === 'register') {
      if (!formData.fullName.trim()) {
        toast.error('Vui lòng nhập họ và tên!');
        return;
      }
      if (!formData.phone.trim()) {
        toast.error('Vui lòng nhập số điện thoại!');
        return;
      }
      if (!formData.email.trim()) {
        toast.error('Vui lòng nhập email!');
        return;
      }
      if (!formData.password || !formData.confirmPassword) {
        toast.error('Vui lòng nhập đầy đủ mật khẩu và xác nhận mật khẩu!');
        return;
      }
      if (formData.password.length < 6) {
        const msg = 'Mật khẩu phải có tối thiểu 6 ký tự!';
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        const msg = 'Mật khẩu và Nhập lại mật khẩu không trùng khớp!';
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      setIsLoading(true);
      try {
        await registerCustomer({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          password: formData.password,
          pets: [],
        });

        setSuccessMessage('🎉 Đăng ký thành công! Thông tin tài khoản đã được lưu vào hệ thống.');
        toast.success('Đăng ký tài khoản thành công!');
        setRegisteredName(formData.fullName.trim());
        setTimeout(() => {
          if (!wasNotificationAsked() && 'Notification' in window && Notification.permission === 'default') {
            setSuccessMessage('');
            setShowNotifPrompt(true);
          } else {
            onClose();
            setSuccessMessage('');
          }
        }, 1200);
      } catch (error) {
        const msg = error.message || 'Đăng ký thất bại, vui lòng thử lại!';
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }

    } else {
      const loginId = formData.identifier.trim() || formData.phone.trim() || formData.email.trim();
      if (!loginId) {
        toast.error('Vui lòng nhập Email hoặc Số điện thoại!');
        return;
      }
      if (!formData.password) {
        toast.error('Vui lòng nhập mật khẩu!');
        return;
      }

      setIsLoading(true);
      try {
        await authenticateCustomer(loginId, formData.password);
        setSuccessMessage('Đăng nhập thành công! Chào mừng bạn trở lại.');
        toast.success('Đăng nhập thành công!');
        setTimeout(() => {
          onClose();
          setSuccessMessage('');
        }, 1200);
      } catch (error) {
        const msg = error.message || 'Email/Số điện thoại hoặc mật khẩu không đúng!';
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-md mx-4 p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label="Đóng"
        >
          <X className="w-6 h-6" />
        </button>

        {/* ── MÀN HÌNH XIN PHÉP THÔNG BÁO ─────────────────────── */}
        {showNotifPrompt ? (
          <div className="text-center py-2 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-primary shadow-inner">
              <Bell className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-text-dark mb-2">Nhận thông báo từ Mèo Vắng Nhà?</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Nhận cập nhật nhật ký chăm sóc, hình ảnh camera của bé, cùng các voucher khuyến mãi độc quyền ngay khi có tin mới!
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleAllowNotification}
                className="w-full bg-primary hover:opacity-95 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-orange-200 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                Cho phép nhận thông báo
              </button>
              <button
                type="button"
                onClick={handleDeclineNotification}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-2.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <BellOff className="w-4 h-4 text-gray-400" />
                Để sau
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 shadow-sm">
                  <PawPrint className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-text-dark font-title">
                {activeTab === 'register' ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập Khách Hàng'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {activeTab === 'register'
                  ? 'Tạo tài khoản Pet Hotel an toàn & bảo mật trên Supabase'
                  : 'Đăng nhập Pet Hotel an toàn & bảo mật'}
              </p>
            </div>

            {/* Tabs */}
            <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'login' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleTabChange('login')}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'register' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleTabChange('register')}
              >
                Đăng Ký
              </button>
            </div>

            {/* Success Message Banner */}
            {successMessage && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-green-700 text-sm font-semibold">{successMessage}</p>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-3.5 mb-4 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-red-700 text-xs font-semibold">{errorMessage}</p>
              </div>
            )}

            {/* Form */}
            {!successMessage && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Họ và Tên</label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Số điện thoại</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0987654321"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="customer@gmail.com"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'login' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Email hoặc Số điện thoại</label>
                    <input
                      type="text"
                      name="identifier"
                      required
                      value={formData.identifier || formData.phone}
                      onChange={handleChange}
                      placeholder="customer@gmail.com hoặc 0987654321"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Tối thiểu 6 ký tự..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {activeTab === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Nhập lại mật khẩu</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Nhập lại mật khẩu..."
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:opacity-95 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-orange-200 mt-2 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang kết nối Supabase...</span>
                    </>
                  ) : (
                    activeTab === 'register' ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'
                  )}
                </button>

                {activeTab === 'login' && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, identifier: '0962606249', phone: '0962606249', password: 'admin' });
                      }}
                      className="w-full py-2 px-3 bg-orange-50 hover:bg-orange-100/70 border border-dashed border-orange-200 rounded-xl text-xs font-semibold text-primary flex items-center justify-center gap-1.5 transition-all"
                      title="Nhấn để tự động điền SĐT 0962606249"
                    >
                      <span>⚡ Điền nhanh tài khoản Admin: <strong>0962606249</strong></span>
                    </button>
                  </div>
                )}
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
