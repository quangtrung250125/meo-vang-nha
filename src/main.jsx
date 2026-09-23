import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Tự động đăng ký Service Worker hỗ trợ thông báo đẩy trên thiết bị di động & máy tính
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[SW] Service Worker đã đăng ký thành công với scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[SW] Lỗi khi đăng ký Service Worker:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
