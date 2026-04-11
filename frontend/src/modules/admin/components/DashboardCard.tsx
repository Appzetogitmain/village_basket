import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardCardProps {
  icon: ReactNode;
  title: string;
  value: number | string;
  accentColor: string;
  path?: string;
}

export default function DashboardCard({ icon, title, value, accentColor, path }: DashboardCardProps) {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => path && navigate(path)}
      className={`glass-card organic-clay-radius p-3 sm:p-4 transition-all card-hover font-poppins relative overflow-hidden group border border-[#8B3D28]/5 ${path ? 'cursor-pointer active:scale-95' : ''}`}
    >
      {/* Village Brand Accent - Organic Shape Overlay */}
      <div 
        className="absolute -top-4 -right-4 w-16 h-16 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none rounded-full"
        style={{ backgroundColor: accentColor || '#8B3D28' }}
      ></div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div 
            className="p-2.5 rounded-2xl shadow-inner transition-transform group-hover:scale-110" 
            style={{ backgroundColor: `${accentColor}10` }}
        >
          <div style={{ color: accentColor }} className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full opacity-80">{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-neutral-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] mb-1 truncate font-outfit opacity-60 group-hover:opacity-100 transition-opacity">{title}</h3>
          <p className="text-sm sm:text-base md:text-lg font-black text-neutral-800 tracking-tight group-hover:text-[#8B3D28] transition-colors">{value}</p>
        </div>
      </div>
    </div>
  );
}




