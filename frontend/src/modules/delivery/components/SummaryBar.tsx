import { ReactNode } from 'react';

interface SummaryBarProps {
  leftIcon: ReactNode;
  leftLabel: string;
  leftValue: string;
  rightIcon: ReactNode;
  rightLabel: string;
  rightValue: string;
  accentColor: string;
}

export default function SummaryBar({
  leftIcon,
  leftLabel,
  leftValue,
  rightIcon,
  rightLabel,
  rightValue,
  accentColor,
}: SummaryBarProps) {
  return (
    <div className="village-card paper-texture organic-radius p-3 flex items-center justify-between border-none transition-all">
      {/* Left Section */}
      <div className="flex items-center gap-2.5 flex-1">
        <div style={{ color: accentColor }} className="opacity-80 scale-90">
          {leftIcon}
        </div>
        <div className="flex flex-col">
          <span className="text-stone-500 text-[8px] font-black uppercase tracking-[0.15em] leading-none mb-1">{leftLabel}</span>
          <span className="text-village-umber text-sm font-black tracking-tight leading-none">{leftValue}</span>
        </div>
      </div>

      <div className="h-8 w-px bg-village-umber/5 mx-2"></div>

      {/* Right Section */}
      <div className="flex items-center gap-2.5 flex-1 justify-end">
        <div className="flex flex-col items-end text-right">
          <span className="text-stone-500 text-[8px] font-black uppercase tracking-[0.15em] leading-none mb-1">{rightLabel}</span>
          <span className="text-village-umber text-sm font-black tracking-tight leading-none">{rightValue}</span>
        </div>
        <div style={{ color: accentColor }} className="opacity-80 scale-90">
          {rightIcon}
        </div>
      </div>
    </div>
  );
}




