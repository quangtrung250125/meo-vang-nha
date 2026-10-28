import React, { useEffect, useRef } from 'react';
import { RADAR_LABELS } from './seoData';


const SeoRadarChart = ({ scores, size = 320 }) => {
  const categories = Object.keys(scores);
  const n = categories.length;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = (size / 2) * 0.70;
  const levels = 5;

  const angleStep = (2 * Math.PI) / n;
  const angle = (i) => -Math.PI / 2 + i * angleStep;

  const point = (i, ratio) => ({
    x: cx + maxR * ratio * Math.cos(angle(i)),
    y: cy + maxR * ratio * Math.sin(angle(i)),
  });


  const dataPoints = categories.map((cat, i) =>
    point(i, scores[cat] / 100)
  );
  const dataPath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ') + ' Z';


  const gridPolygon = (levelRatio) =>
    categories.map((_, i) => point(i, levelRatio))
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ') + ' Z';


  const labelPoint = (i) => {
    const p = point(i, 1.22);
    return p;
  };


  const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / n;
  const fillColor = avgScore >= 80 ? '#10b981' : avgScore >= 60 ? '#f59e0b' : '#f43f5e';

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      style={{ maxWidth: size, margin: '0 auto', display: 'block' }}
      role="img"
      aria-label="Biểu đồ radar SEO"
    >

      {Array.from({ length: levels }).map((_, lvl) => {
        const ratio = (lvl + 1) / levels;
        return (
          <path
            key={lvl}
            d={gridPolygon(ratio)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={lvl === levels - 1 ? 1.5 : 1}
            opacity={0.8}
          />
        );
      })}

      {categories.map((_, i) => {
        const outer = point(i, 1);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x.toFixed(2)} y2={outer.y.toFixed(2)}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        );
      })}

      <path
        d={dataPath}
        fill={fillColor}
        fillOpacity={0.18}
        stroke={fillColor}
        strokeWidth={2.5}
        strokeLinejoin="round"
        style={{ transition: 'all 0.6s ease' }}
      />


      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x.toFixed(2)}
          cy={p.y.toFixed(2)}
          r={5}
          fill={fillColor}
          stroke="#fff"
          strokeWidth={2}
        />
      ))}

      {categories.map((cat, i) => {
        const lp = labelPoint(i);
        const score = scores[cat];
        const scoreC = score >= 80 ? '#10b981' : score >= 60 ? '#d97706' : '#f43f5e';
        return (
          <g key={cat}>
            <text
              x={lp.x.toFixed(2)}
              y={(lp.y - 6).toFixed(2)}
              textAnchor="middle"
              dominantBaseline="auto"
              fontSize="11"
              fontWeight="700"
              fill="#374151"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {RADAR_LABELS[cat]}
            </text>
            <text
              x={lp.x.toFixed(2)}
              y={(lp.y + 10).toFixed(2)}
              textAnchor="middle"
              dominantBaseline="auto"
              fontSize="12"
              fontWeight="800"
              fill={scoreC}
              fontFamily="Inter, system-ui, sans-serif"
            >
              {score}
            </text>
          </g>
        );
      })}


      {Array.from({ length: levels }).map((_, lvl) => {
        const ratio = (lvl + 1) / levels;
        return (
          <text
            key={lvl}
            x={(cx + 4).toFixed(2)}
            y={(cy - maxR * ratio + 3).toFixed(2)}
            fontSize="9"
            fill="#9ca3af"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {Math.round(ratio * 100)}
          </text>
        );
      })}
    </svg>
  );
};

export default SeoRadarChart;
