import React from 'react';

/**
 * FloatingContactButtons Component
 * Cung cấp 2 nút liên hệ nổi cố định ở góc dưới bên phải:
 * 1. Zalo: Điều hướng đến số 090 495 75 55 (https://zalo.me/0904957555)
 * 2. Messenger: Điều hướng đến https://www.messenger.com/t/310542365485288
 */
const FloatingContactButtons = () => {
  const zaloPhone = '090 495 75 55';
  const zaloUrl = 'https://zalo.me/0904957555';
  const messengerUrl = 'https://www.messenger.com/t/310542365485288';

  return (
    <aside 
      aria-label="Liên hệ nhanh"
      className="fixed bottom-6 right-5 sm:right-6 z-50 flex flex-col items-end gap-3.5 pointer-events-none"
    >
      {/* 1. Nút Messenger */}
      <div className="relative group flex items-center justify-end pointer-events-auto">
        {/* Tooltip khi hover */}
        <span 
          className="absolute right-[calc(100%+12px)] px-3 py-1.5 rounded-xl bg-gray-900/90 backdrop-blur-sm text-white text-xs font-medium shadow-md whitespace-nowrap opacity-0 translate-x-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 hidden sm:block"
        >
          Chat Messenger Mèo Vắng Nhà
        </span>

        {/* Hiệu ứng xung động (Pulse wave) */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0084FF] to-[#FF5983] opacity-40 animate-ping" />

        {/* Link / Nút Messenger */}
        <a
          id="btn-floating-messenger"
          href={messengerUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat Messenger với Mèo Vắng Nhà"
          title="Chat Messenger Mèo Vắng Nhà"
          className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#0084FF] via-[#A824FB] to-[#FF5983] text-white shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/40 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300"
        >
          <svg 
            viewBox="0 0 24 24" 
            className="w-6 h-6 sm:w-7 sm:h-7 fill-white drop-shadow-sm" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.455 5.517 3.735 7.215V22l3.37-1.85c.915.253 1.887.39 2.895.39 5.523 0 10-4.145 10-9.282C22 6.145 17.523 2 12 2zm1.066 12.445l-2.614-2.79-5.1 2.79 5.607-5.955 2.68 2.79 5.034-2.79-5.607 5.955z" />
          </svg>
        </a>
      </div>

      {/* 2. Nút Zalo */}
      <div className="relative group flex items-center justify-end pointer-events-auto">
        {/* Tooltip khi hover */}
        <span 
          className="absolute right-[calc(100%+12px)] px-3 py-1.5 rounded-xl bg-gray-900/90 backdrop-blur-sm text-white text-xs font-medium shadow-md whitespace-nowrap opacity-0 translate-x-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 hidden sm:block"
        >
          Chat Zalo: {zaloPhone}
        </span>

        {/* Hiệu ứng xung động (Pulse wave) */}
        <span className="absolute inset-0 rounded-full bg-[#0068FF] opacity-40 animate-ping" />

        {/* Link / Nút Zalo */}
        <a
          id="btn-floating-zalo"
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat Zalo qua số ${zaloPhone}`}
          title={`Chat Zalo: ${zaloPhone}`}
          className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0068FF] text-white shadow-lg shadow-blue-500/30 hover:bg-[#0058de] hover:shadow-xl hover:shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          {/* Logo Zalo biểu tượng chính thức với chữ Zalo nổi bật */}
          <svg 
            viewBox="0 0 48 48" 
            className="w-7 h-7 sm:w-8 sm:h-8" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M41.5 4.5L12.5 4.5C4 11.9 1.3 22 9 36.4c.5 1.7-.4 3.4-2 5.1 2.4.3 4.8-.1 6.9-1.3 14 6.3 21.9 2.2 29.6-2.7l.04-31C43.5 5.4 42.6 4.5 41.5 4.5z" 
              fill="white" 
              fillOpacity="0.2"
            />
            {/* Chữ Zalo trắng chuẩn sắc nét */}
            <text 
              x="24" 
              y="29.5" 
              textAnchor="middle" 
              fill="#FFFFFF" 
              fontWeight="900" 
              fontSize="14.5" 
              fontFamily="system-ui, -apple-system, sans-serif" 
              letterSpacing="-0.5px"
            >
              Zalo
            </text>
          </svg>
        </a>
      </div>
    </aside>
  );
};

export default FloatingContactButtons;
