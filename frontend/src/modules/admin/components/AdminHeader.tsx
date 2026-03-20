import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import villageBasketLogo from '@assets/village_basket-removebg-preview.png';

interface AdminHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

// --- Icons ---
const MenuIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const BellIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8C6 11.3137 4 14 4 17H20C20 14 18 11.3137 18 8Z"></path>
        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"></path>
    </svg>
);

const UserIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const LogOutIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);

export default function AdminHeader({ onMenuClick, isSidebarOpen }: AdminHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname.includes(path);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="h-14 bg-white/90 backdrop-blur-md border-b border-[#8B3D28]/10 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 text-[#8B3D28] hover:bg-[#8B3D28]/5 rounded-lg transition-colors"
          aria-label="Toggle Menu"
        >
          <MenuIcon />
        </button>
        
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8B3D28]"></div>
            <span className="text-[11px] font-black text-[#8B3D28] uppercase tracking-[0.2em] font-outfit">Village Admin Panel</span>
          </div>

          <nav className="flex items-center gap-6 border-l border-[#8B3D28]/10 pl-6">
            <button 
                onClick={() => navigate('/admin/orders/all')}
                className={`text-[11px] font-bold uppercase tracking-tighter transition-colors ${isActive('/admin/orders') ? 'text-[#8B3D28]' : 'text-[#8B3D28]/50 hover:text-[#8B3D28]'}`}
            >
                Orders
            </button>
            <button 
                onClick={() => navigate('/admin/manage-customer')}
                className={`text-[11px] font-bold uppercase tracking-tighter transition-colors ${isActive('/admin/manage-customer') ? 'text-[#8B3D28]' : 'text-[#8B3D28]/50 hover:text-[#8B3D28]'}`}
            >
                Manage Customers
            </button>
            <button 
                onClick={() => navigate('/admin/delivery-boy/cash-collection')}
                className={`text-[11px] font-bold uppercase tracking-tighter transition-colors ${isActive('/admin/cash-collection') ? 'text-[#8B3D28]' : 'text-[#8B3D28]/50 hover:text-[#8B3D28]'}`}
            >
                Collect Cash
            </button>
          </nav>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="p-2 text-[#8B3D28]/60 hover:text-[#8B3D28] hover:bg-[#8B3D28]/5 rounded-lg transition-all" aria-label="Search">
            <SearchIcon />
          </button>
          <button className="p-2 text-[#8B3D28]/60 hover:text-[#8B3D28] hover:bg-[#8B3D28]/5 rounded-lg transition-all relative" aria-label="Notifications">
            <BellIcon />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        <div className="h-8 w-[1px] bg-[#8B3D28]/10 mx-1 sm:mx-2 hidden sm:block"></div>

        <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 relative" ref={profileRef}>
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-black text-[#8B3D28] leading-none uppercase font-outfit truncate max-w-[120px]">{user?.name || 'Administrator'}</span>
            <span className="text-[9px] font-bold text-[#8B3D28]/50 uppercase tracking-tighter">Super Sarpanch</span>
          </div>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#A54B31] to-[#8B3D28] flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all active:scale-95 border-2 border-white overflow-hidden"
          >
            <UserIcon />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-12 w-56 glass-card organic-clay-radius p-2 shadow-2xl z-50 animate-slide-up border border-[#8B3D28]/10">
              <div className="px-3 py-2 border-b border-[#8B3D28]/5 mb-1">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest truncate">Logged in as</p>
                <p className="text-xs font-black text-[#8B3D28] uppercase font-outfit truncate">{user?.email || 'user@village.com'}</p>
              </div>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-neutral-600 hover:bg-[#8B3D28]/5 hover:text-[#8B3D28] rounded-xl transition-all">
                <UserIcon /> Profile Settings
              </button>
              <div className="h-[1px] bg-[#8B3D28]/5 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOutIcon /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
