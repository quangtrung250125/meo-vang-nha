import React, { useEffect, useState } from 'react';
import cameraSan from '../assets/images/room-cam/camera-phong.jpg';

const pad = (n) => String(n).padStart(2, '0');
// Giống dấu giờ của camera Imou: DD-MM-YYYY HH:MM:SS
const stamp = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/**
 * Chế độ DEMO (chỉ để trình diễn nội bộ): giữ nguyên khung hình camera sân, chỉ có đồng hồ chạy theo giờ thật.
 * Mặc định có nhãn nhỏ "Hình minh hoạ"; chỉ ẩn khi máy chủ đặt IMOU_DEMO_HIDE_LABEL=1.
 */
const DemoCameraFeed = ({ showLabel = true }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full h-full" data-testid="demo-camera-feed">
      <img src={cameraSan} alt="Camera" className="w-full h-full object-cover" draggable={false} />
      <div
        className="absolute top-[6%] right-[3%] text-white text-[11px] sm:text-xs font-medium tabular-nums"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,.7)' }}
      >
        {stamp(now)}
      </div>
      {showLabel && (
        <div className="absolute bottom-2 left-2 bg-black/45 text-white/90 text-[10px] font-medium px-2 py-0.5 rounded-full">
          Hình minh hoạ
        </div>
      )}
    </div>
  );
};

export default DemoCameraFeed;
