import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Video, Loader2, RefreshCw, VideoOff } from 'lucide-react';
import { getAuthHeaders } from '../services/crossDeviceSync';
import cameraFeed from '../assets/images/camera_feed.png';

// Link HLS của Imou hết hạn sau một thời gian -> xin link mới định kỳ khi đang xem
const REFRESH_MS = 8 * 60 * 1000;

/**
 * Ô "Camera trực tiếp" trong Theo dõi lưu trú: phát camera Imou thật của phòng bé đang ở.
 * Server (/api/camera/live) giữ AppId/AppSecret Imou và chỉ trả link khi khách đúng là chủ đơn đang ở.
 */
const ImouLiveCamera = ({ booking, isDemo = false }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [state, setState] = useState({ status: isDemo ? 'demo' : 'loading', hls: null, cover: null, message: '' });
  const code = booking?.code || booking?.id;

  const load = useCallback(async () => {
    if (isDemo || !code) return;
    setState((s) => ({ ...s, status: s.hls ? s.status : 'loading' }));
    try {
      const res = await fetch(`/api/camera/live?code=${encodeURIComponent(code)}`, { headers: await getAuthHeaders() });
      const json = await res.json().catch(() => ({}));
      if (json.success && json.hls) {
        setState({ status: 'ready', hls: json.hls, cover: json.cover || null, message: '' });
      } else {
        setState({ status: 'error', hls: null, cover: null, message: json.message || 'Không mở được camera lúc này.' });
      }
    } catch {
      setState({ status: 'error', hls: null, cover: null, message: 'Không mở được camera lúc này.' });
    }
  }, [code, isDemo]);

  useEffect(() => {
    load();
    if (isDemo) return undefined;
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load, isDemo]);

  // Gắn link HLS vào thẻ video (Safari/iPhone phát trực tiếp, trình duyệt khác dùng hls.js)
  useEffect(() => {
    const video = videoRef.current;
    if (state.status !== 'ready' || !state.hls || !video) return undefined;
    let cancelled = false;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = state.hls;
      video.play().catch(() => {});
    } else {
      import('hls.js').then(({ default: Hls }) => {
        if (cancelled || !Hls.isSupported()) return;
        hlsRef.current?.destroy();
        const hls = new Hls({ liveDurationInfinity: true });
        hlsRef.current = hls;
        hls.loadSource(state.hls);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data?.fatal) setState((s) => ({ ...s, status: 'error', message: 'Camera đang tạm mất kết nối.' }));
        });
      });
    }
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [state.status, state.hls]);

  const isLive = state.status === 'ready' || state.status === 'demo';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm" data-testid="live-camera">
      <h3 className="font-bold text-text-dark mb-4 flex items-center gap-2">
        <Video className="w-4 h-4 text-primary" />
        Camera trực tiếp
      </h3>

      <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-sm font-medium ${
        isLive ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-500'
      }`}>
        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-primary animate-pulse' : 'bg-gray-400'}`} />
        {state.status === 'loading' ? 'Đang kết nối camera...' : isLive ? 'Camera đang hoạt động' : 'Camera chưa sẵn sàng'}
      </div>

      <div className="relative rounded-xl overflow-hidden mb-4 bg-gray-900 aspect-video flex items-center justify-center border border-gray-200">
        {isLive && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 z-10">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
            LIVE
          </div>
        )}
        {state.status === 'demo' && <img src={cameraFeed} alt="Camera live" className="w-full h-full object-cover" />}
        {state.status === 'ready' && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover bg-black"
            poster={state.cover || undefined}
            muted
            autoPlay
            playsInline
            controls
          />
        )}
        {state.status === 'loading' && <Loader2 className="w-8 h-8 text-white/70 animate-spin" />}
        {state.status === 'error' && (
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <VideoOff className="w-8 h-8 text-white/60" />
            <p className="text-white/80 text-xs leading-relaxed">{state.message}</p>
            <button
              onClick={load}
              className="mt-1 flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Thử lại
            </button>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-gray-500 font-medium">
        ✅ Camera đã bao gồm trong gói dịch vụ
      </div>
    </div>
  );
};

export default ImouLiveCamera;
