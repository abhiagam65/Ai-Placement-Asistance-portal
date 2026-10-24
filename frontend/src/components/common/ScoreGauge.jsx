import React from 'react';

export const ScoreGauge = ({ score = 0, size = 160, strokeWidth = 12 }) => {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let colorGradient = {
    start: '#ef4444',
    end: '#f97316',
    label: 'Needs Work',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
  };

  if (normalizedScore >= 80) {
    colorGradient = {
      start: '#10b981',
      end: '#06b6d4',
      label: 'Placement Ready (Tier 1)',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };
  } else if (normalizedScore >= 65) {
    colorGradient = {
      start: '#6366f1',
      end: '#8b5cf6',
      label: 'Competitive Pace',
      badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    };
  } else if (normalizedScore >= 50) {
    colorGradient = {
      start: '#f59e0b',
      end: '#eab308',
      label: 'Developing',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={`gaugeGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorGradient.start} />
              <stop offset="100%" stopColor={colorGradient.end} />
            </linearGradient>
          </defs>

          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Animated score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#gaugeGradient-${size})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tight text-white">
            {normalizedScore}
            <span className="text-sm font-semibold text-slate-400">%</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">
            Readiness
          </span>
        </div>
      </div>

      <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${colorGradient.badgeClass}`}>
        {colorGradient.label}
      </div>
    </div>
  );
};
