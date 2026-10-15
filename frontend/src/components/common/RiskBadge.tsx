import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, HelpCircle } from 'lucide-react';
import { RiskCategory } from '../../types';

interface RiskBadgeProps {
  category: RiskCategory | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, size = 'md', showIcon = true }) => {
  const norm = (category || '').toUpperCase();

  let colorClasses = 'bg-gray-100 text-[#647067] border-gray-300';
  let Icon = HelpCircle;
  let label = category || 'UNKNOWN';

  if (norm === 'LOW RISK') {
    colorClasses = 'bg-[#EAF7EC] text-[#15803D] border-[#DCE9DE] font-semibold';
    Icon = ShieldCheck;
    label = 'LOW RISK';
  } else if (norm === 'SUSPICIOUS') {
    colorClasses = 'bg-amber-50 text-[#D97706] border-amber-200 font-semibold';
    Icon = AlertTriangle;
    label = 'SUSPICIOUS';
  } else if (norm === 'HIGH RISK') {
    colorClasses = 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]/30 font-bold';
    Icon = ShieldAlert;
    label = 'HIGH RISK';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 13,
    md: 15,
    lg: 18,
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border uppercase tracking-wider font-mono ${sizeClasses} ${colorClasses}`}
    >
      {showIcon && <Icon size={iconSizes} className="shrink-0" />}
      <span>{label}</span>
    </span>
  );
};
