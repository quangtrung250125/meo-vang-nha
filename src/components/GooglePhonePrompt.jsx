import React, { useState } from 'react';
import { Phone, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCustomerProfile } from '../contexts/CustomerContext';

// Google không cung cấp số điện thoại, nên khách đăng nhập Google lần đầu sẽ được hỏi SĐT ở đây.
const GooglePhonePrompt = () => {
  const { authenticatedCustomer, saveMissingPhone, logoutCustomer, isAdmin } = useCustomerProfile();
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const needsPhone = authenticatedCustomer
    && authenticatedCustomer.authProvider === 'google'
    && !authenticatedCustomer.phone
    && !isAdmin;

  if (!needsPhone) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSaving(true);
    try {
      await saveMissingPhone(phone);
      toast.success('Đã lưu số điện thoại. Chào mừng bạn đến Mèo Vắng Nhà!');
    } catch (error) {
      const msg = error.message || 'Không lưu được số điện thoại, vui lòng thử lại!';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md mx-4 p-8 shadow-2xl">
        <div className="text-center mb-6">
          {authenticatedCustomer.avatarUrl ? (
            <img
              src={authenticatedCustomer.avatarUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-orange-100"
            />
          ) : (
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-orange-100">
              <Phone className="w-7 h-7 text-primary" />
            </div>
          )}
          <h2 className="text-xl font-bold text-text-dark font-title">
            Xin chào {authenticatedCustomer.fullName}!
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Bạn đã đăng nhập bằng Google ({authenticatedCustomer.email}). Vui lòng thêm số điện thoại để
            Mèo Vắng Nhà liên hệ khi chăm sóc bé.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-3.5 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-red-700 text-xs font-semibold">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">Số điện thoại</label>
            <input
              type="tel"
              name="phone"
              required
              autoFocus
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setErrorMessage(''); }}
              placeholder="0987654321"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-primary hover:opacity-95 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Lưu và tiếp tục
          </button>
          <button
            type="button"
            onClick={logoutCustomer}
            className="w-full text-gray-500 hover:text-gray-700 text-sm font-semibold py-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </form>
      </div>
    </div>
  );
};

export default GooglePhonePrompt;
