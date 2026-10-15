import React from 'react';
import { RiskCategory } from '../../types';

interface RiskScoreGaugeProps {
  score: number;
  category: RiskCategory;
}

export const RiskScoreGauge: React.FC<RiskScoreGaugeProps> = ({ score, category }) => {
  const size = 150;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  let strokeColor = '#15803D'; // Success green
  let textColor = 'text-[#15803D]';

  if (category === 'SUSPICIOUS') {
    strokeColor = '#D97706'; // Amber
    textColor = 'text-[#D97706]';
  } else if (category === 'HIGH RISK') {
    strokeColor = '#DC2626'; // High-risk red
    textColor = 'text-[#DC2626]';
  }

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#DCE9DE"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated active score progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Inner Score Readout */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-extrabold font-mono tracking-tight ${textColor}`}>
            {score}
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#647067]">
            / 100 Risk
          </span>
        </div>
      </div>

      {/* Threshold indicator bar below */}
      <div className="w-full max-w-[200px] mt-2">
        <div className="flex justify-between text-[10px] font-mono text-[#647067] mb-1">
          <span>0 (Low)</span>
          <span>25</span>
          <span>60</span>
          <span>100 (High)</span>
        </div>
        <div className="h-1.5 w-full bg-[#EAF7EC] rounded-full overflow-hidden flex border border-[#DCE9DE]">
          <div className="w-[25%] bg-[#15803D]" />
          <div className="w-[35%] bg-[#D97706]" />
          <div className="w-[40%] bg-[#DC2626]" />
        </div>
      </div>
    </div>
  );
};
