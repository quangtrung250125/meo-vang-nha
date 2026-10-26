import React, { useEffect, useState } from 'react';
import { scoreColor, SCORE_HISTORY } from './seoData';


const SeoScoreCard = ({ score }) => {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timeout);
  }, [score]);

  const R = 54;
  const circumference = 2 * Math.PI * R;
  const offset = circumference - (animated / 100) * circumference;
  const col = scoreColor(score);

  const maxVal = Math.max(...SCORE_HISTORY.map(h => h.score));

  return (
    <div className="flex flex-col items-center gap-6">

      <div className="relative flex items-center justify-center">
        <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>

          <circle cx={70} cy={70} r={R} fill="none" stroke="#f3f4f6" strokeWidth={12} />
          <circle
            cx={70} cy={70} r={R}
            fill="none"
            stroke={col.hex}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-black ${col.text}`}>{score}</span>
          <span className="text-xs font-bold text-gray-400">/100</span>
        </div>
      </div>


      <div className="text-center">
        <p className="font-extrabold text-gray-800 text-base">Điểm SEO Tổng quan</p>
        <p className={`text-sm font-bold mt-0.5 ${col.text}`}>
          {score >= 80 ? '🟢 Tốt' : score >= 60 ? '🟡 Cần cải thiện' : '🔴 Nguy hiểm'}
        </p>
      </div>


      <div className="w-full">
        <p className="text-xs font-bold text-gray-500 mb-3 text-center">Lịch sử điểm 6 tháng</p>
        <div className="flex items-end justify-center gap-2 h-16">
          {SCORE_HISTORY.map((h, i) => {
            const heightPct = (h.score / maxVal) * 100;
            const isLast = i === SCORE_HISTORY.length - 1;
            return (
              <div key={h.month} className="flex flex-col items-center gap-1 flex-1">
                <span className={`text-[10px] font-bold ${isLast ? col.text : 'text-gray-400'}`}>
                  {h.score}
                </span>
                <div
                  className="w-full rounded-t-md transition-all duration-700"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: isLast ? col.hex : '#e5e7eb',
                    minHeight: 4,
                  }}
                />
                <span className="text-[10px] text-gray-400 font-medium">{h.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeoScoreCard;
