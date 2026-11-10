import React, { useEffect, useRef, useState } from 'react';
import vvip from '../assets/images/room-cam/vvip.jpg';
import vip from '../assets/images/room-cam/vip.jpg';
import deluxe1 from '../assets/images/room-cam/deluxe1.jpg';
import deluxe2 from '../assets/images/room-cam/deluxe2.jpg';

const ROOM_IMAGES = { vvip, vip, deluxe1, deluxe2 };

// "VVIP-02" / "P101 (VIP)" / "DELUXE-3" -> khoá ảnh phòng
export function roomKeyFromRoom(...parts) {
  const s = parts.filter(Boolean).join(' ').toUpperCase();
  if (s.includes('VVIP')) return 'vvip';
  if (s.includes('DELUXE')) {
    const n = Number((s.match(/(\d+)\s*$/) || [])[1] || 1);
    return n % 2 === 0 ? 'deluxe2' : 'deluxe1';
  }
  if (s.includes('VIP')) return 'vip';
  return 'vvip';
}

const pad = (n) => String(n).padStart(2, '0');
const stamp = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/**
 * Chế độ DEMO: giả lập góc nhìn camera từ ảnh phòng thật của quán (lia chậm, nhiễu hạt, đồng hồ chạy).
 * Chỉ dùng để trình diễn, luôn gắn nhãn "Hình minh hoạ" và không có nhãn LIVE.
 */
const DemoRoomFeed = ({ room = 'vvip' }) => {
  const canvasRef = useRef(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const W = 960, H = 540;
    canvas.width = W;
    canvas.height = H;
    const img = new Image();
    let raf;
    let ready = false;
    const noise = document.createElement('canvas');
    noise.width = 240; noise.height = 135;
    const nctx = noise.getContext('2d');
    const nData = nctx.createImageData(240, 135);
    const start = performance.now();
    let last = 0;

    const draw = (ts) => {
      raf = requestAnimationFrame(draw);
      if (!ready || ts - last < 66) return; // ~15 khung hình/giây như camera thật
      last = ts;
      const t = (ts - start) / 1000;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const zoom = 1.12 + 0.05 * Math.sin(t / 9);
      let vw = iw / zoom;
      let vh = (vw * 9) / 16;
      if (vh > ih / zoom) { vh = ih / zoom; vw = (vh * 16) / 9; }
      const maxX = iw - vw, maxY = ih - vh;
      // lia chậm qua lại, thêm rung nhẹ như gió
      const px = 0.5 + 0.5 * Math.sin(t / 17 + 1);
      const py = 0.5 + 0.5 * Math.sin(t / 23);
      const sx = maxX * px + Math.sin(t * 1.7) * 0.6;
      const sy = maxY * py + Math.cos(t * 1.3) * 0.6;
      ctx.filter = `brightness(${0.97 + 0.03 * Math.sin(t * 2.1)}) contrast(1.04) saturate(0.92)`;
      ctx.drawImage(img, sx, sy, vw, vh, 0, 0, W, H);
      ctx.filter = 'none';
      // nhiễu hạt
      for (let i = 0; i < nData.data.length; i += 4) {
        const v = Math.random() * 255;
        nData.data[i] = nData.data[i + 1] = nData.data[i + 2] = v;
        nData.data[i + 3] = 18;
      }
      nctx.putImageData(nData, 0, 0);
      ctx.drawImage(noise, 0, 0, W, H);
      // tối góc ống kính
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    };

    img.onload = () => { ready = true; };
    img.src = ROOM_IMAGES[room] || ROOM_IMAGES.vvip;
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [room]);

  return (
    <div className="relative w-full h-full" data-testid="demo-room-feed">
      <canvas ref={canvasRef} className="w-full h-full object-cover" />
      <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
        HÌNH MINH HOẠ · DEMO
      </div>
      <div className="absolute top-2 right-2 text-white/90 text-[11px] font-mono drop-shadow" style={{ textShadow: '0 1px 2px rgba(0,0,0,.8)' }}>
        {stamp(now)}
      </div>
    </div>
  );
};

export default DemoRoomFeed;
