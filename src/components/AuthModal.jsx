import React, { useState } from 'react';
import { PawPrint, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AuthModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('register'); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'register') {
      if (!formData.password || !formData.confirmPassword) {
        toast.error('Vui lòng nhập đầy đủ mật khẩu và xác nhận mật khẩu!');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Mật khẩu và Nhập lại mật khẩu không trùng khớp!');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Mật khẩu phải có tối thiểu 6 ký tự!');
        return;
      }
      toast.success('Tạo tài khoản thành công!');
      onClose();
    } else {
      if (!formData.email || !formData.password) {
        toast.error('Vui lòng điền email và mật khẩu!');
        return;
      }
      toast.success('Đăng nhập thành công!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md mx-4 p-8 relative shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button 
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
              <PawPrint className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-text-dark font-title">
            {activeTab === 'register' ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập Tài Khoản'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {activeTab === 'register' ? 'Tạo tài khoản Pet Hotel an toàn & bảo mật' : 'Đăng nhập Pet Hotel an toàn & bảo mật'}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'login' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('login')}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'register' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('register')}
          >
            Đăng Ký
          </button>
        </div>

        {/* Form */}
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
            </>
          )}
          
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-primary hover:opacity-95 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-orange-200 mt-2"
          >
            {activeTab === 'register' ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
