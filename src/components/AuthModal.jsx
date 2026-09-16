import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './AuthModal.css';

export default function AuthModal({ isOpen, onClose }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [message, setMessage] = useState({ text: '', type: '' });

  if (!isOpen) return null;

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          }
        }
      });

      if (error) throw error;

      setMessage({ 
        text: '🎉 Tạo tài khoản thành công! Bạn có thể đăng nhập ngay.', 
        type: 'success' 
      });

      setTimeout(() => {
        setIsLoginTab(true);
        setMessage({ text: '', type: '' });
      }, 1500);

    } catch (error) {
      setMessage({ text: error.message || 'Đăng ký thất bại!', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      setMessage({ text: 'Đăng nhập thành công!', type: 'success' });
      setTimeout(() => {
        onClose();
      }, 500);

    } catch (error) {
      setMessage({ text: error.message || 'Email hoặc mật khẩu không đúng!', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        <div className="auth-header">
          <span className="pet-icon">🐾</span>
          <h2>{isLoginTab ? 'Đăng Nhập Khách Hàng' : 'Đăng Ký Tài Khoản'}</h2>
          <p>{isLoginTab ? 'Chào mừng bạn đến với Mèo Vắng Nhà' : 'Tạo tài khoản Pet Hotel an toàn & bảo mật'}</p>
        </div>

        <div className="auth-tabs">
          <button 
            type="button"
            className={'tab-btn ' + (isLoginTab ? 'active' : '')}
            onClick={() => { setIsLoginTab(true); setMessage({ text: '', type: '' }); }}
          >
            Đăng Nhập
          </button>
          <button 
            type="button"
            className={'tab-btn ' + (!isLoginTab ? 'active' : '')}
            onClick={() => { setIsLoginTab(false); setMessage({ text: '', type: '' }); }}
          >
            Đăng Ký
          </button>
        </div>

        {message.text && (
          <div className={'auth-alert ' + message.type}>
            {message.text}
          </div>
        )}

        {isLoginTab ? (
          <form onSubmit={handleSignIn} className="auth-form">
            <div className="input-group">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="customer@gmail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Mật khẩu</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="auth-form">
            <div className="input-group">
              <label>Họ và Tên</label>
              <input 
                type="text" 
                placeholder="Nguyễn Văn A" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Số điện thoại</label>
              <input 
                type="tel" 
                placeholder="0987654321" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="customer@gmail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label>Mật khẩu</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Tối thiểu 6 ký tự..." 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Tài Khoản'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
