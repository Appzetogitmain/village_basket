import { ReactNode } from 'react';

interface DashboardCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  accentColor: string;
  onClick?: () => void;
}

export default function DashboardCard({ icon, title, value, accentColor, onClick }: DashboardCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`village-card paper-texture organic-radius p-3 flex flex-col items-center justify-center min-h-[100px] border-none transition-all active:scale-95 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="mb-2 opacity-80 scale-90" style={{ color: accentColor }}>
        {icon}
      </div>
      <p className="text-stone-500 text-[8px] font-black uppercase tracking-[0.15em] text-center mb-1 leading-tight">{title}</p>
      <p className="text-village-umber text-sm font-black tracking-tight">{value}</p>
    </div>
  );
}




