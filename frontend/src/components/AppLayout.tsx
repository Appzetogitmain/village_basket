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
    const publicRoutes = ['/login', '/signup', '/seller/login', '/seller/signup', '/delivery/login', '/delivery/signup', '/admin/login'];
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
    if (location.pathname === '/search') {
      // Update URL params when on search page
      if (value.trim()) {
        setSearchParams({ q: value });
      } else {
        setSearchParams({});
      }
    } else {
      // Navigate to search page with query
      if (value.trim()) {
        navigate(`/search?q=${encodeURIComponent(value)}`);
      }
    }
  };


  const SCROLL_POSITION_KEY = 'home-scroll-position';

  // Reset scroll position when navigating to any page (smooth, no flash)
  // BUT skip for Home page if there's a saved scroll position to restore
  useEffect(() => {
    const isHomePage = location.pathname === '/' || location.pathname === '/user/home';

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
  const isCategoriesActive = isActive('/categories') || location.pathname.startsWith('/category/');

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

  const isProductDetailPage = location.pathname.startsWith('/product/');
  const isSearchPage = location.pathname === '/search';
  const isCheckoutPage = location.pathname === '/checkout' || location.pathname.startsWith('/checkout/');
  const isHomePage = location.pathname === '/' || location.pathname === '/user/home';
  const showHeader = !isCheckoutPage;
  const showSearchBar = isSearchPage;
  const showFooter = !isCheckoutPage && !isProductDetailPage;

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
      {/* Desktop Container Wrapper */}
      <div className="md:w-full md:bg-transparent md:min-h-screen overflow-x-hidden">
        <div className="md:w-full md:min-h-screen md:flex md:flex-col overflow-x-hidden">
          {/* Top Navigation Bar - Desktop Only */}
          {showFooter && (
            <nav
              className="hidden md:flex items-center justify-center gap-8 px-6 lg:px-8 py-4 shadow-lg bg-[#8B3D28] border-b border-white/10 transition-all duration-300 relative overflow-hidden"
            >
              {/* Subtle Decorative Warli Pattern (Top Edge) */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-30"></div>
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>

              {/* Home */}
              <Link
                to="/"
                className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${isActive('/')
                  ? 'bg-white/20 text-[#FFCC00] shadow-md font-bold scale-105'
                  : 'hover:bg-white/10 text-white/90'
                  }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {isActive('/') ? (
                    <>
                      <path d="M2 12L12 4L22 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="white" fillOpacity="0.2" />
                      <rect x="4" y="12" width="16" height="8" fill="white" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12L12 4L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      <rect x="4" y="12" width="16" height="8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
                    </>
                  )}
                </svg>
                <span className="font-medium text-sm">Home</span>
              </Link>

              {/* Order Again */}
              <Link
                to="/order-again"
                className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${isActive('/order-again')
                  ? 'bg-white/20 text-[#FFCC00] shadow-md font-bold scale-105'
                  : 'hover:bg-white/10 text-white/90'
                  }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {isActive('/order-again') ? (
                    <path d="M5 8V6C5 4.34315 6.34315 3 8 3H16C17.6569 3 19 4.34315 19 6V8H21C21.5523 8 22 8.44772 22 9V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V9C2 8.44772 2.44772 8 3 8H5Z" fill="white" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                  ) : (
                    <path d="M5 8V6C5 4.34315 6.34315 3 8 3H16C17.6569 3 19 4.34315 19 6V8H21C21.5523 8 22 8.44772 22 9V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V9C2 8.44772 2.44772 8 3 8H5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" />
                  )}
                </svg>
                <span className="font-medium text-sm">Order Again</span>
              </Link>

              {/* Categories */}
              <Link
                to="/categories"
                className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${(isActive('/categories') || location.pathname.startsWith('/category/'))
                  ? 'bg-white/20 text-[#FFCC00] shadow-md font-bold scale-105'
                  : 'hover:bg-white/10 text-white/90'
                  }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {(isActive('/categories') || location.pathname.startsWith('/category/')) ? (
                    <>
                      <circle cx="7" cy="7" r="2.5" fill="white" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
                      <circle cx="17" cy="7" r="2.5" fill="white" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
                      <circle cx="7" cy="17" r="2.5" fill="white" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
                      <circle cx="17" cy="17" r="2.5" fill="white" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
                    </>
                  ) : (
                    <>
                      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="17" cy="7" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="7" cy="17" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="17" cy="17" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
                    </>
                  )}
                </svg>
                <span className="font-medium text-sm">Categories</span>
              </Link>

              {/* Profile */}
              <Link
                to="/account"
                className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${isActive('/account')
                  ? 'bg-white/20 text-[#FFCC00] shadow-md font-bold scale-105'
                  : 'hover:bg-white/10 text-white/90'
                  }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {isActive('/account') ? (
                    <>
                      <circle cx="12" cy="8" r="4" fill="white" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
                      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="white" fillOpacity="0.2" />
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </>
                  )}
                </svg>
                <span className="font-medium text-sm">Profile</span>
              </Link>
            </nav>
          )}

          {/* Sticky Header - Global Desktop Header, Hidden on Mobile */}
          {showHeader && (
            <header className={`sticky top-0 z-50 bg-[#8B3D28] shadow-lg md:top-[60px] border-b border-white/10 hidden md:block`}>
              {/* Delivery info line */}
              <div className="px-4 md:px-6 lg:px-8 py-1 bg-white/10 text-white text-[9px] uppercase font-black tracking-widest text-center">
                VILLAGE FRESH GOODS
              </div>

              {/* Main Header Row */}
              <div className="px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link to="/" className="flex-shrink-0">
                  <img
                    src={brandLogo}
                    alt="Village Basket"
                    className="h-10 md:h-12 w-auto object-contain filter brightness-125 drop-shadow-md"
                  />
                </Link>

                {/* Desktop Search - Hidden on mobile in this row */}
                <div className="hidden md:flex flex-1 max-w-xl">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search for Desi Products..."
                      className="w-full px-4 py-2 pl-10 bg-white/20 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#FFCC00] transition-all"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">🔍</span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate('/search')}
                    className="md:hidden text-white p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigate('/checkout')}
                    className="text-white p-1 hover:bg-white/10 rounded-full transition-colors relative"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigate('/account')}
                    className="hidden md:flex text-white p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Location line - only show if user has provided location */}
              {userLocation && (userLocation.address || userLocation.city) && (
                <div className="px-4 md:px-6 lg:px-8 py-2 flex items-center justify-between text-[11px] bg-black/10 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-white/90">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                    </svg>
                    <span className="line-clamp-1 italic font-medium">
                      Delivering to: {userLocation?.address || userLocation?.city || 'Your Location'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLocationChangeModal(true)}
                    className="text-[#FFCC00] font-black uppercase tracking-tighter hover:text-white transition-colors flex-shrink-0 ml-2 font-poppins text-[10px]"
                  >
                    Change
                  </button>
                </div>
              )}
            </header>
          )}

          {/* Scrollable Main Content */}
          <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-24 md:pb-8">
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
                  const isHomePage = location.pathname === '/' || location.pathname === '/user/home';

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
          </main>

          {/* Floating Cart Pill */}
          <FloatingCartPill />

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
                className="pointer-events-auto h-[54px] bg-[#8B3D28]/95 backdrop-blur-md rounded-2xl shadow-[0_8px_25px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-around px-2 relative"
              >
                {/* Home */}
                <Link to="/" className="flex-1 h-full z-10 flex flex-col items-center justify-center relative touch-none no-underline">
                  <motion.div animate={{ scale: isActive('/') ? 1.1 : 1, y: isActive('/') ? -1 : 0 }} transition={{ duration: 0.2 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isActive('/') ? 'white' : 'none'} stroke={isActive('/') ? 'white' : '#FFFFFF'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9.5L12 3l9 6.5V20c0 1-1 2-2 2H5c-1 0-2-1-2-2V9.5z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </motion.div>
                  <span className={`text-[8px] mt-1 font-black font-poppins tracking-tighter ${isActive('/') ? 'text-white' : 'text-white/50'}`}>
                    HOME
                  </span>
                </Link>

                {/* Orders */}
                <Link to="/order-again" className="flex-1 h-full z-10 flex flex-col items-center justify-center relative touch-none no-underline">
                  <motion.div animate={{ scale: isActive('/order-again') ? 1.1 : 1, y: isActive('/order-again') ? -1 : 0 }} transition={{ duration: 0.2 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isActive('/order-again') ? 'white' : 'none'} stroke={isActive('/order-again') ? 'white' : '#FFFFFF'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                  </motion.div>
                  <span className={`text-[8px] mt-1 font-black font-poppins tracking-tighter ${isActive('/order-again') ? 'text-white' : 'text-white/50'}`}>
                    ORDERS
                  </span>
                </Link>

                {/* Categories */}
                <Link to="/categories" className="flex-1 h-full z-10 flex flex-col items-center justify-center relative touch-none no-underline">
                  <motion.div
                    animate={{
                      scale: isCategoriesActive ? 1.1 : 1,
                      y: isCategoriesActive ? -1 : 0,
                      rotate: categoriesRotation
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isCategoriesActive ? 'white' : 'none'} stroke={isCategoriesActive ? 'white' : '#FFFFFF'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </motion.div>
                  <span className={`text-[8px] mt-1 font-black font-poppins tracking-tighter ${isCategoriesActive ? 'text-white' : 'text-white/50'}`}>
                    CATEGORIES
                  </span>
                </Link>

                {/* Profile */}
                <Link to="/account" className="flex-1 h-full z-10 flex flex-col items-center justify-center relative touch-none no-underline">
                  <motion.div animate={{ scale: isActive('/account') ? 1.1 : 1, y: isActive('/account') ? -1 : 0 }} transition={{ duration: 0.2 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isActive('/account') ? 'white' : 'none'} stroke={isActive('/account') ? 'white' : '#FFFFFF'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </motion.div>
                  <span className={`text-[8px] mt-1 font-black font-poppins tracking-tighter ${isActive('/account') ? 'text-white' : 'text-white/50'}`}>
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

