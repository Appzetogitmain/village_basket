import { ReactNode } from 'react';

interface DashboardCardProps {
  icon: ReactNode;
  title: string;
  value: number | string;
  accentColor: string;
  onClick?: () => void;
}

export default function DashboardCard({ icon, title, value, accentColor, onClick }: DashboardCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white p-2.5 sm:p-3 md:p-4 hover:shadow-md transition-all overflow-hidden relative ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('/assets/natural-paper.png')]"></div>
      <div className="flex flex-col relative z-10">
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
          <div className="p-1.5 sm:p-2 rounded-xl" style={{ backgroundColor: `${accentColor}15` }}>
            <div style={{ color: accentColor }} className="w-5 h-5 sm:w-6 sm:h-6">{icon}</div>
          </div>
          <h3 className="text-neutral-600 text-[10px] sm:text-xs font-bold uppercase tracking-wide leading-tight line-clamp-2">{title}</h3>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-village-umber px-1 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

