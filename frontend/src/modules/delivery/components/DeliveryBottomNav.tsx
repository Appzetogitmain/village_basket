import { Link, useLocation } from 'react-router-dom';

export default function DeliveryBottomNav() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  const activeColor = '#8B3D28'; // Terracotta
  const inactiveColor = '#A8A29E'; // Stone-400

  const navItems = [
    {
      path: '/delivery',
      label: 'Home',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" rx="1.5" fill={isActive('/delivery') ? activeColor : inactiveColor} fillOpacity={isActive('/delivery') ? '1' : '0.4'} />
          <rect x="14" y="3" width="7" height="7" rx="1.5" fill={isActive('/delivery') ? activeColor : inactiveColor} fillOpacity={isActive('/delivery') ? '1' : '0.4'} />
          <rect x="3" y="14" width="7" height="7" rx="1.5" fill={isActive('/delivery') ? activeColor : inactiveColor} fillOpacity={isActive('/delivery') ? '1' : '0.4'} />
          <rect x="14" y="14" width="7" height="7" rx="1.5" fill={isActive('/delivery') ? activeColor : inactiveColor} fillOpacity={isActive('/delivery') ? '1' : '0.4'} />
        </svg>
      ),
    },
    {
      path: '/delivery/orders',
      label: 'Orders',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2 17H4L5 12H19L20 17H22M2 17C2 18.1046 2.89543 19 4 19C5.10457 19 6 18.1046 6 17M2 17C2 15.8954 2.89543 15 4 15C5.10457 15 6 15.8954 6 17M22 17C22 18.1046 21.1046 19 20 19C18.8954 19 18 18.1046 18 17M22 17C22 15.8954 21.1046 15 20 15C18.8954 15 18 15.8954 18 17M6 17H18M5 12L4 7H2M20 12L21 7H22"
            stroke={isActive('/delivery/orders') ? activeColor : inactiveColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      path: '/delivery/notifications',
      label: 'Notice',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M18 8A6 6 0 0 0 6 8C6 11.3137 4 14 4 14H20C20 14 18 11.3137 18 8Z"
            stroke={isActive('/delivery/notifications') ? activeColor : inactiveColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10.27 21C10.4458 21.3031 10.6982 21.5547 11.0018 21.7295C11.3054 21.9044 11.6496 21.9965 12 21.9965C12.3504 21.9965 12.6946 21.9044 12.9982 21.7295C13.3019 21.5547 13.5542 21.3031 13.73 21"
            stroke={isActive('/delivery/notifications') ? activeColor : inactiveColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      path: '/delivery/menu',
      label: 'Menu',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 12H21M3 6H21M3 18H21"
            stroke={isActive('/delivery/menu') ? activeColor : inactiveColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-lg border-t border-village-umber/5 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] z-50">
      <div className="flex justify-around items-center h-14 pb-env-bottom">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90"
          >
            <div className="mb-0.5">
              {item.icon}
            </div>
            <span
              className={`text-[9px] font-black uppercase tracking-tight ${
                isActive(item.path) ? 'text-[#8B3D28]' : 'text-stone-400'
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

