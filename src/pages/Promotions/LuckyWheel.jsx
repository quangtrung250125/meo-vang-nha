import React, { useState, useRef } from 'react';
import { Sparkles, Trophy, Gift, Copy, Check, ArrowRight, RotateCw, PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { luckyWheelPrizes } from '../../mockData/promotionsData';

const LuckyWheel = ({ onClaimPrize }) => {
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(3);

  const numSegments = luckyWheelPrizes.length;
  const segmentAngle = 360 / numSegments;

  const handleSpin = () => {
    if (spinning) return;
    if (spinsLeft <= 0) {
      toast.error('Bạn đã hết lượt quay miễn phí hôm nay!');
      return;
    }

    setSpinning(true);
    setWonPrize(null);

    // Pick random prize index
    const prizeIndex = Math.floor(Math.random() * numSegments);
    const selectedPrize = luckyWheelPrizes[prizeIndex];

    // Calculate angle:
    // Arrow is at the top (270 deg or 0 deg). Let's calibrate:
    // Top arrow points to segment at (360 - (prizeIndex * segmentAngle + segmentAngle / 2))
    const extraRounds = 5 + Math.floor(Math.random() * 3); // 5 to 7 full rotations
    const targetAngle = 360 * extraRounds + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));
    
    // Add to current rotation
    const newTotalRotation = rotation + targetAngle;
    setRotation(newTotalRotation);

    setTimeout(() => {
      setSpinning(false);
      setWonPrize(selectedPrize);
      setShowPrizeModal(true);
      setSpinsLeft((prev) => Math.max(0, prev - 1));

      if (onClaimPrize) {
        onClaimPrize(selectedPrize);
      }
    }, 4500);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(`Đã sao chép mã ${code}!`, {
      icon: '🎁',
      style: { borderRadius: '12px', background: '#10B981', color: '#fff' }
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="minigame-section" className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent text-xs font-extrabold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            Minigame Tương Tác Có Thưởng
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-title mb-2 tracking-tight">
            Vòng Quay May Mắn - Boss Vui Sen Nhàn
          </h2>
          <p className="text-emerald-100/80 text-xs sm:text-sm">
            Quay 100% trúng quà! Nhận ngay voucher giảm giá phòng lên đến 20%, quà tặng pate và dịch vụ spa miễn phí.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-300 font-semibold bg-white/10 px-3.5 py-1 rounded-full border border-white/10">
            <span>Bạn còn:</span>
            <span className="font-extrabold text-white bg-accent px-2 py-0.5 rounded-md">{spinsLeft} lượt</span>
            <span>quay hôm nay</span>
          </div>
        </div>

        {/* Wheel & Prize list grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          
          {/* Wheel Container */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
            
            {/* Top Pointer Needle */}
            <div className="z-30 -mb-5 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-amber-400 drop-shadow-md animate-bounce"></div>
            </div>

            {/* Rotating SVG Wheel */}
            <div className="relative w-72 h-72 sm:w-84 sm:h-84 md:w-96 md:h-96 rounded-full p-2.5 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-2xl shadow-emerald-950/60 border-4 border-amber-300">
              <div 
                className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none'
                }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {luckyWheelPrizes.map((prize, idx) => {
                    const startAngle = idx * segmentAngle;
                    const endAngle = (idx + 1) * segmentAngle;

                    // Convert polar to cartesian
                    const rad1 = (startAngle - 90) * (Math.PI / 180);
                    const rad2 = (endAngle - 90) * (Math.PI / 180);
                    const x1 = 50 + 50 * Math.cos(rad1);
                    const y1 = 50 + 50 * Math.sin(rad1);
                    const x2 = 50 + 50 * Math.cos(rad2);
                    const y2 = 50 + 50 * Math.sin(rad2);

                    const midAngle = startAngle + segmentAngle / 2;
                    const textRad = (midAngle - 90) * (Math.PI / 180);
                    const textX = 50 + 32 * Math.cos(textRad);
                    const textY = 50 + 32 * Math.sin(textRad);

                    return (
                      <g key={prize.id}>
                        <path
                          d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                          fill={prize.color}
                          stroke="#ffffff"
                          strokeWidth="0.8"
                        />
                        <text
                          x={textX}
                          y={textY}
                          fill={prize.textColor}
                          fontSize="4"
                          fontWeight="bold"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                          className="select-none font-sans"
                        >
                          {prize.shortName}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Center Spin Button Hub */}
              <button
                type="button"
                onClick={handleSpin}
                disabled={spinning || spinsLeft <= 0}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 border-4 border-white shadow-xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform disabled:opacity-75 disabled:cursor-not-allowed group z-20"
              >
                <RotateCw className={`w-5 h-5 text-text-dark ${spinning ? 'animate-spin' : 'group-hover:rotate-45'} transition-transform`} />
                <span className="text-[11px] sm:text-xs font-black text-text-dark uppercase tracking-tight mt-0.5">
                  {spinning ? 'Đang quay' : 'QUAY'}
                </span>
              </button>
            </div>

          </div>

          {/* Prize Table List */}
          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Cơ cấu giải thưởng
            </h4>
            
            <div className="space-y-2">
              {luckyWheelPrizes.map((p) => (
                <div 
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs border border-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-medium text-gray-200">{p.text}</span>
                  </div>
                  <span className="font-mono text-amber-300 font-bold bg-white/10 px-2 py-0.5 rounded">
                    {p.code}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-emerald-200/70 pt-2 border-t border-white/10 leading-relaxed">
              * Quà tặng sẽ được áp dụng trực tiếp khi thanh toán hoặc khi làm thủ tục check-in cho bé tại khách sạn.
            </p>
          </div>

        </div>
      </div>

      {/* Winning Prize Modal */}
      {showPrizeModal && wonPrize && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white text-text-dark rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl relative border-4 border-amber-300 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <PartyPopper className="w-8 h-8" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Chúc mừng bạn đã trúng
            </span>

            <h3 className="text-2xl font-extrabold font-title text-text-dark mt-3 mb-2">
              {wonPrize.text}
            </h3>

            <p className="text-xs text-gray-500 mb-6">
              {wonPrize.description}
            </p>

            {/* Voucher Box */}
            <div className="bg-bg-cream border-2 border-dashed border-primary/40 rounded-2xl p-4 mb-6">
              <span className="text-[11px] text-gray-400 uppercase font-bold tracking-wider block mb-1">
                Mã ưu đãi của bạn
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-xl sm:text-2xl font-black text-primary tracking-wider">
                  {wonPrize.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(wonPrize.code)}
                  className="p-2 rounded-xl bg-primary text-white hover:bg-secondary transition-colors cursor-pointer"
                  title="Sao chép mã"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowPrizeModal(false);
                  navigate('/booking');
                }}
                className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-colors shadow-md shadow-accent/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Dùng ngay khi đặt phòng</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowPrizeModal(false)}
                className="w-full py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng & tiếp tục xem ưu đãi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LuckyWheel;
