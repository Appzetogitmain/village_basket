import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingCartPill from './FloatingCartPill';
import { useLocation as useLocationContext } from '../hooks/useLocation';
import LocationPermissionRequest from './LocationPermissionRequest';
import { useThemeContext } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import brandLogo from '@assets/village_basket-removebg-preview.png';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mainRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [categoriesRotation, setCategoriesRotation] = useState(0);
  const [prevCategoriesActive, setPrevCategoriesActive] = useState(false);
  const { isLocationEnabled, isLocationLoading, location: userLocation } = useLocationContext();
  const [showLocationRequest, setShowLocationRequest] = useState(false);
  const [showLocationChangeModal, setShowLocationChangeModal] = useState(false);
  const { currentTheme } = useThemeContext();
  const { cart } = useCart();

  const isActive = (path: string) => location.pathname === path;

  // Check if location is required for current route
  const requiresLocation = () => {
    const publicRoutes = ['/user/login', '/seller/login', '/seller/signup', '/delivery/login', '/delivery/signup', '/admin/login'];
    // Don't require location on login/signup pages
    if (publicRoutes.includes(location.pathname)) {
      return false;
    }
    // Require location for ALL routes (not just authenticated users)
    // This ensures location is mandatory for everyone visiting the platform
    return true;
  };

  // ALWAYS show location request modal on app load if location is not enabled
  // This ensures modal appears on every app open, regardless of browser permission state
  useEffect(() => {
    // Wait for initial loading to complete
    if (isLocationLoading) {
      return;
    }

    // If location is enabled, hide modal
    if (isLocationEnabled) {
      setShowLocationRequest(false);
      return;
    }

    // If location is NOT enabled and route requires location, ALWAYS show modal
    // This will trigger on every app open until user explicitly confirms location
    if (!isLocationEnabled && requiresLocation()) {
      setShowLocationRequest(true);
    } else {
      setShowLocationRequest(false);
    }
  }, [isLocationLoading, isLocationEnabled, location.pathname]);

  // Update search query when URL params change
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
  }, [searchParams]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (location.pathname === '/user/search') {
      // Update URL params when on search page
      if (value.trim()) {
        setSearchParams({ q: value });
      } else {
        setSearchParams({});
      }
    } else {
      // Navigate to search page with query
      if (value.trim()) {
        navigate(`/user/search?q=${encodeURIComponent(value)}`);
      }
    }
  };


  const SCROLL_POSITION_KEY = 'home-scroll-position';

  // Reset scroll position when navigating to any page (smooth, no flash)
  // BUT skip for Home page if there's a saved scroll position to restore
  useEffect(() => {
    const isHomePage = location.pathname === '/user' || location.pathname === '/user/home' || location.pathname === '/user/';

    // Home page handles its own scroll restoration and reset logic
    if (isHomePage) {
      return;
    }

    // Use requestAnimationFrame to prevent visual flash
    requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      // Also reset window scroll smoothly
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
  }, [location.pathname]);

  // Track categories active state for rotation
  const isCategoriesActive = isActive('/user/categories') || location.pathname.startsWith('/user/category/');

  useEffect(() => {
    if (isCategoriesActive && !prevCategoriesActive) {
      // Rotate clockwise when clicked (becoming active)
      setCategoriesRotation(prev => prev + 360);
      setPrevCategoriesActive(true);
    } else if (!isCategoriesActive && prevCategoriesActive) {
      // Rotate counter-clockwise when unclicked (becoming inactive)
      setCategoriesRotation(prev => prev - 360);
      setPrevCategoriesActive(false);
    }
  }, [isCategoriesActive, prevCategoriesActive]);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isProductDetailPage = location.pathname.startsWith('/user/product/');
  const isSearchPage = location.pathname === '/user/search';
  const isCheckoutPage = location.pathname === '/user/checkout' || location.pathname.startsWith('/user/checkout/') || location.pathname === '/user/daily-service/checkout' || location.pathname.startsWith('/user/daily-service/checkout');
  const isHomePage = location.pathname === '/user' || location.pathname === '/user/' || location.pathname === '/user/home';
  const showHeader = !isCheckoutPage;
  const showSearchBar = isSearchPage;
  const showFooter = !isCheckoutPage && !isProductDetailPage;

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden md:bg-transparent">
      {/* Desktop Container Wrapper */}
      <div className="md:w-full md:bg-transparent md:min-h-screen overflow-x-hidden">
        <div className="md:w-full md:min-h-screen md:flex md:flex-col overflow-x-hidden md:bg-transparent">
          {/* Sticky Desktop Header - Dynamic Transition */}
          {showHeader && (
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 hidden md:block px-4 md:px-8 ${isScrolled ? 'bg-[#8B3D28]/95 backdrop-blur-md shadow-xl py-3 border-b border-white/5' : 'bg-transparent py-5'}`}>
              <div className="max-w-[1550px] mx-auto flex items-center justify-between gap-6 lg:gap-12">
                
                {/* Logo & Location Side-by-Side */}
                <div className="flex items-center gap-6 lg:gap-10">
                  <Link to="/user" className="flex-shrink-0 transition-all hover:scale-105 active:scale-95 duration-300">
                    <div className={`${isScrolled ? 'bg-white' : 'bg-white shadow-xl'} rounded-2xl px-5 py-2 transition-all duration-500 border-2 border-white/10 flex items-center justify-center`}>
                      <img
                        src={brandLogo}
                        alt="Village Basket"
                        className={`${isScrolled ? 'h-8 lg:h-9' : 'h-9 lg:h-11'} w-auto object-contain transition-all duration-500`}
                      />
                    </div>
                  </Link>
                  
                  {/* Delivery Location - Styled like the image */}
                  <button
                    onClick={() => navigate('/user/location')}
                    className="flex items-center gap-3 group transition-all"
                  >
                    <div className={`w-10 h-10 rounded-2xl ${isScrolled ? 'bg-white/10' : 'bg-black/20 backdrop-blur-md'} flex items-center justify-center border border-white/10 group-hover:bg-[#4b7d5a] group-hover:border-[#4b7d5a] transition-all`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#4b7d5a] group-hover:text-white transition-colors">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black text-[#4b7d5a] uppercase tracking-tighter leading-none mb-1">Deliver to</span>
                      <span className={`text-xs lg:text-sm font-bold max-w-[140px] lg:max-w-[200px] truncate leading-tight group-hover:text-[#4b7d5a] transition-colors ${isScrolled ? 'text-white' : 'text-village-umber'}`}>
                        {userLocation?.address || userLocation?.city || 'Set Location'}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Central Premium Search Bar */}
                <div className="flex-1 max-w-3xl">
                  <div 
                    onClick={() => navigate('/user/search')}
                    className="relative w-full group cursor-pointer"
                  >
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B3D28]/60 transition-colors group-hover:text-[#8B3D28]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      readOnly
                      placeholder='Search for "farm fresh vegetables"'
                      className={`w-full bg-white text-village-umber rounded-2xl py-3 px-12 text-sm lg:text-base font-medium placeholder:text-village-umber/40 border border-transparent transition-all cursor-pointer group-hover:shadow-lg ${isScrolled ? 'shadow-md ring-1 ring-white/10' : 'shadow-xl'}`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B3D28]/40">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Desktop Menu - Styled like the image */}
                <div className="flex items-center gap-1 lg:gap-4 ml-4">
                  {/* Home */}
                  <Link
                    to="/user"
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all ${isActive('/user') || isActive('/user/') || isActive('/user/home') ? 'bg-[#FFCC00] text-[#8B3D28] shadow-lg scale-105' : `hover:bg-white/10 ${isScrolled ? 'text-white/80 hover:text-white' : 'text-village-umber/80 hover:text-village-umber'}`}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="text-sm font-bold">Home</span>
                  </Link>

                  {/* Orders */}
                  <Link
                    to="/user/order-again"
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all ${isActive('/user/order-again') ? 'bg-[#FFCC00] text-[#8B3D28] shadow-lg scale-105' : `hover:bg-white/10 ${isScrolled ? 'text-white/80 hover:text-white' : 'text-village-umber/80 hover:text-village-umber'}`}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <span className="text-sm font-bold">Orders</span>
                  </Link>

                  {/* Categories */}
                  <Link
                    to="/user/categories"
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all ${isActive('/user/categories') || location.pathname.startsWith('/user/category/') ? 'bg-[#FFCC00] text-[#8B3D28] shadow-lg scale-105' : `hover:bg-white/10 ${isScrolled ? 'text-white/80 hover:text-white' : 'text-village-umber/80 hover:text-village-umber'}`}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    <span className="text-sm font-bold">Categories</span>
                  </Link>

                  {/* Profile */}
                  <Link
                    to="/user/account"
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all ${isActive('/user/account') ? 'bg-[#FFCC00] text-[#8B3D28] shadow-lg scale-105' : `hover:bg-white/10 ${isScrolled ? 'text-white/80 hover:text-white' : 'text-village-umber/80 hover:text-village-umber'}`}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="text-sm font-bold">Profile</span>
                  </Link>

                  {/* Cart Indicator */}
                  {(cart?.itemCount || 0) > 0 && (
                    <button
                      onClick={() => navigate('/user/checkout')}
                      className={`ml-2 w-10 h-10 rounded-2xl flex items-center justify-center relative hover:bg-white/30 transition-all font-bold shadow-inner ${isScrolled ? 'bg-white/20 text-white' : 'bg-black/10 text-village-umber'}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                      <span className={`absolute -top-1.5 -right-1.5 bg-[#4b7d5a] text-white text-[10px] font-black rounded-lg min-w-[20px] h-[20px] flex items-center justify-center shadow-lg border-2 ${isScrolled ? 'border-[#8B3D28]' : 'border-white'}`}>
                        {cart?.itemCount}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </header>
          )}

          {/* Scrollable Main Content */}
          <main ref={mainRef} className="flex-1 md:pt-24 overflow-x-hidden md:bg-transparent pb-24 md:pb-8">
            <div className="w-full max-w-[1550px] mx-auto">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-full max-w-full"
                  style={{ minHeight: '100%' }}
                  onAnimationComplete={() => {
                    const isHomePage = location.pathname === '/user' || location.pathname === '/user/' || location.pathname === '/user/home';

                    // Home page handles its own scroll (either restoration or starting from top)
                    if (isHomePage) {
                      return;
                    }

                    if (mainRef.current) {
                      mainRef.current.scrollTop = 0;
                    }
                    window.scrollTo(0, 0);
                  }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Floating Cart Pill - Desktop (hidden on mobile to prevent duplicate keys/animations) */}
          <div className="hidden md:block">
            <FloatingCartPill />
          </div>

          {/* Location Permission Request Modal - Mandatory for all users */}
          {showLocationRequest && (
            <LocationPermissionRequest
              onLocationGranted={() => setShowLocationRequest(false)}
              skipable={false}
              title="Location Access Required"
              description="We need your location to show you products available near you and enable delivery services. Location access is required to continue."
            />
          )}

          {/* Location Change Modal */}
          {showLocationChangeModal && (
            <LocationPermissionRequest
              onLocationGranted={() => setShowLocationChangeModal(false)}
              skipable={true}
              title="Change Location"
              description="Update your location to see products available near you."
            />
          )}

          {/* Fixed Bottom Navigation - Mobile Only, Premium Floating Design */}
          {showFooter && (
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-4 flex flex-col gap-2 pointer-events-none">
              {/* Restore original FloatingCartPill experience */}
              <div className="pointer-events-auto">
                <FloatingCartPill />
              </div>

              <motion.nav
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pointer-events-auto h-[74px] bg-[#8B3D28]/95 backdrop-blur-md rounded-2xl shadow-[0_8px_35px_rgba(0,0,0,0.4)] border border-white/10 flex items-center justify-around px-2 relative overflow-hidden"
              >
                {/* Active Indicator Layer (Sliding Pill) */}
                <div className="absolute inset-0 px-2 flex items-center justify-around pointer-events-none">
                  {['home', 'orders', 'categories', 'account'].map((tab) => {
                    const isTabActive =
                      (tab === 'home' && (isActive('/user') || isActive('/user/'))) ||
                      (tab === 'orders' && isActive('/user/order-again')) ||
                      (tab === 'categories' && isCategoriesActive) ||
                      (tab === 'account' && isActive('/user/account'));

                    return (
                      <div key={tab} className="flex-1 flex items-center justify-center relative">
                        {isTabActive && (
                          <motion.div
                            layoutId="mobileActiveTab"
                            className="w-[61px] h-[61px] bg-[#FFF9F0] shadow-2xl rounded-[18px]"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Home */}
                <Link to="/user" className="flex-1 h-full z-10 flex flex-col items-center justify-center relative touch-none no-underline">
                  <motion.div
                    animate={{
                      scale: (isActive('/user') || isActive('/user/')) ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={(isActive('/user') || isActive('/user/')) ? '#8B3D28' : '#FFFFFF'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300">
                      <path d="M3 9.5L12 3l9 6.5V20c0 1-1 2-2 2H5c-1 0-2-1-2-2V9.5z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </motion.div>
                  <span className={`text-[9px] mt-1 font-black font-poppins tracking-tighter transition-colors duration-300 ${(isActive('/user') || isActive('/user/')) ? 'text-[#8B3D28]' : 'text-white/40'}`}>
                    HOME
                  </span>
                </Link>

                {/* Orders */}
                <Link to="/user/order-again" className="flex-1 h-full z-10 flex flex-col items-center justify-center relative touch-none no-underline">
                  <motion.div
                    animate={{
                      scale: isActive('/user/order-again') ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive('/user/order-again') ? '#8B3D28' : '#FFFFFF'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                  </motion.div>
                  <span className={`text-[9px] mt-1 font-black font-poppins tracking-tighter transition-colors duration-300 ${isActive('/user/order-again') ? 'text-[#8B3D28]' : 'text-white/40'}`}>
                    ORDERS
                  </span>
                </Link>

                {/* Categories */}
                <Link to="/user/categories" className="flex-1 h-full z-10 flex flex-col items-center justify-center relative touch-none no-underline">
                  <motion.div
                    animate={{
                      scale: isCategoriesActive ? 1.05 : 1,
                      rotate: categoriesRotation
                    }}
                    transition={{
                      rotate: { duration: 0.5, ease: "backOut" },
                      scale: { duration: 0.2 }
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isCategoriesActive ? '#8B3D28' : '#FFFFFF'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </motion.div>
                  <span className={`text-[9px] mt-1 font-black font-poppins tracking-tighter transition-colors duration-300 ${isCategoriesActive ? 'text-[#8B3D28]' : 'text-white/40'}`}>
                    CATEGORIES
                  </span>
                </Link>

                {/* Profile */}
                <Link to="/user/account" className="flex-1 h-full z-10 flex flex-col items-center justify-center relative touch-none no-underline">
                  <motion.div
                    animate={{
                      scale: isActive('/user/account') ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive('/user/account') ? '#8B3D28' : '#FFFFFF'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </motion.div>
                  <span className={`text-[9px] mt-1 font-black font-poppins tracking-tighter transition-colors duration-300 ${isActive('/user/account') ? 'text-[#8B3D28]' : 'text-white/40'}`}>
                    ACCOUNT
                  </span>
                </Link>
              </motion.nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

