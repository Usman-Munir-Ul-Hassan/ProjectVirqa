import React from 'react';

const ScoreRing = ({ score, size = 32, strokeWidth = 10, colorClass = "text-emerald-500", trackClass = "text-slate-100" }) => {
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (score || 0) / 100);

  return (
    <div className={`relative w-[${size}px] h-[${size}px] flex items-center justify-center`} style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90 absolute top-0 left-0">
        <circle 
          cx={size/2} cy={size/2} r={radius} 
          strokeWidth={strokeWidth} 
          fill="transparent" 
          className={trackClass} 
          stroke="currentColor" 
        />
        <circle
          cx={size/2} cy={size/2} r={radius} 
          strokeWidth={strokeWidth} 
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          className={colorClass}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="text-center z-10 flex flex-col items-center">
        <span className="text-3xl font-black text-slate-900 leading-none">{score != null ? score : '—'}</span>
        {score != null && <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Score</span>}
      </div>
    </div>
  );
};

export default ScoreRing;
