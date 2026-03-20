import { ReactNode } from 'react';

interface AlertCardProps {
  icon: ReactNode;
  title: string;
  value: number;
  accentColor: string;
}

export default function AlertCard({ icon, title, value, accentColor }: AlertCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white p-3 sm:p-4 hover:shadow-md transition-all overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
      <div className="flex items-center gap-3 sm:gap-4 relative z-10">
        <div className="p-2 sm:p-2.5 rounded-xl flex-shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
          <div style={{ color: accentColor }} className="w-6 h-6 sm:w-7 sm:h-7">{icon}</div>
        </div>
        <div>
          <h3 className="text-neutral-600 text-[10px] sm:text-xs font-bold uppercase tracking-wide leading-tight mb-1">{title}</h3>
          <p className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: accentColor }}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

