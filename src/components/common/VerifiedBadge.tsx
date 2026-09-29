import React from 'react';
import { IconVerifiedBadge, IconClock, IconShield } from '../icons.tsx';

export interface VerifiedBadgeProps {
  isVerified?: boolean;
  role?: 'student' | 'admin';
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  notes?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified = true,
  role = 'student',
  showLabel = false,
  size = 'sm',
  className = '',
  notes
}) => {
  if (!isVerified) {
    if (!showLabel) return null;
    return (
      <span
        title={notes || 'Student ID verification pending campus administrator review'}
        className={`inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-800 border border-amber-200/80 rounded-full select-none ${
          size === 'xs'
            ? 'px-1.5 py-0.2 text-[9px]'
            : size === 'sm'
            ? 'px-2 py-0.5 text-[10px]'
            : 'px-2.5 py-1 text-xs'
        } ${className}`}
      >
        <IconClock className="w-3 h-3 text-amber-600" />
        <span>Verification Pending</span>
      </span>
    );
  }

  const isRoleAdmin = role === 'admin';
  const tooltip = notes || (isRoleAdmin
    ? 'Official Administrator • Authenticated University Authority'
    : 'Verified Student • ID authenticated & approved by Campus Administrator');

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const currentIconSize = iconSizes[size] || iconSizes.sm;

  if (!showLabel) {
    return (
      <span
        title={tooltip}
        className={`inline-flex items-center justify-center align-middle shrink-0 cursor-help transition-transform hover:scale-110 ${
          isRoleAdmin ? 'text-amber-500' : 'text-[#0071e3]'
        } ${className}`}
        aria-label={tooltip}
      >
        <IconVerifiedBadge className={currentIconSize} />
      </span>
    );
  }

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 font-bold rounded-full select-none cursor-help transition-shadow ${
        isRoleAdmin
          ? 'bg-[#1d1d1f] text-white border border-slate-700'
          : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
      } ${
        size === 'xs'
          ? 'px-1.5 py-0.2 text-[9px]'
          : size === 'sm'
          ? 'px-2 py-0.5 text-[10px]'
          : 'px-2.5 py-1 text-xs'
      } ${className}`}
    >
      {isRoleAdmin ? (
        <IconShield className="w-3 h-3 text-emerald-400" />
      ) : (
        <IconVerifiedBadge className="w-3 h-3 text-emerald-600" />
      )}
      <span>{isRoleAdmin ? 'Verified Admin' : 'Verified Student'}</span>
    </span>
  );
};
