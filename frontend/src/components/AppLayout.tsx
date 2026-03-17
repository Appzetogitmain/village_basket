import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingCartPill from './FloatingCartPill';
import { useLocation as useLocationContext } from '../hooks/useLocation';
import LocationPermissionRequest from './LocationPermissionRequest';
import { useThemeContext } from '../context/ThemeContext';
import brandLogo from '../assets/village_basket-removebg-preview.png';

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
  const isCartPage = location.pathname === '/cart';
  const isTomorrowBookingPage = location.pathname === '/tomorrow-veg-booking';
  const showHeader = !isCheckoutPage && !isCartPage;
  const showSearchBar = isSearchPage;
  const showFooter = !isCheckoutPage && !isProductDetailPage && !isTomorrowBookingPage;

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

          {/* Sticky Header - Show on search page and other non-home pages, excluding account page */}
          {showHeader && (
            <header className="sticky top-0 z-50 bg-[#8B3D28] shadow-lg md:top-[60px] border-b border-white/10">
              {/* Delivery info line */}
              <div className="px-4 md:px-6 lg:px-8 py-1 bg-white/10 text-white text-[9px] uppercase font-black tracking-widest text-center">
                 VILLAGE FRESH GOODS | Delivering in 10–15 mins
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
                    onClick={() => navigate('/cart')}
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

          {/* Fixed Bottom Navigation - Mobile Only, Hidden on checkout pages */}
          {showFooter && (
            <nav
              className="fixed bottom-0 left-0 right-0 shadow-[0_-8px_20px_rgba(0,0,0,0.15)] z-50 md:hidden pb-safe"
              style={{ 
                height: '68px', 
                borderTopLeftRadius: '24px', 
                borderTopRightRadius: '24px',
                backgroundColor: '#8B3D28',
                opacity: 1
              }}
            >
              <div className="flex justify-around items-center h-full px-2">
                {/* Home */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="flex-1 h-full"
                >
                  <Link
                    to="/"
                    className="flex flex-col items-center justify-center h-full relative"
                  >
                    <div className="flex flex-col items-center justify-center relative">
                      <motion.svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        animate={isActive('/') ? {
                          scale: [1, 1.1, 1],
                        } : {}}
                      >
                        <path 
                          d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" 
                          stroke={isActive('/') ? '#FFCC00' : '#FFFFFF'} 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          fill={isActive('/') ? '#FFCC00' : 'none'} 
                          fillOpacity={isActive('/') ? '0.2' : '0'}
                        />
                      </motion.svg>
                    </div>
                    <span className={`text-[10px] mt-1.5 font-black font-poppins uppercase tracking-wider ${isActive('/') ? 'text-[#FFCC00]' : 'text-white'}`}>
                      HOME
                    </span>
                  </Link>
                </motion.div>

                {/* Order Again */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="flex-1 h-full"
                >
                  <Link
                    to="/order-again"
                    className="flex flex-col items-center justify-center h-full relative"
                  >
                    <div className="flex flex-col items-center justify-center relative">
                      <motion.svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        animate={isActive('/order-again') ? {
                          scale: [1, 1.1, 1],
                        } : {}}
                      >
                        <path 
                          d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm3 0V7a6 6 0 1112 0v2" 
                          stroke={isActive('/order-again') ? '#FFCC00' : '#FFFFFF'} 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          fill={isActive('/order-again') ? '#FFCC00' : 'none'} 
                          fillOpacity={isActive('/order-again') ? '0.2' : '0'}
                        />
                      </motion.svg>
                    </div>
                    <span className={`text-[10px] mt-1.5 font-black font-poppins uppercase tracking-wider ${isActive('/order-again') ? 'text-[#FFCC00]' : 'text-white'}`}>
                      ORDERS
                    </span>
                  </Link>
                </motion.div>

                {/* Tomorrow */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="flex-1 h-full"
                >
                  <Link
                    to="/tomorrow-veg-booking"
                    className="flex flex-col items-center justify-center h-full relative"
                  >
                    <div className="flex flex-col items-center justify-center relative">
                      <motion.svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        animate={isActive('/tomorrow-veg-booking') ? {
                          scale: [1, 1.1, 1],
                        } : {}}
                      >
                        <path 
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                          stroke={isActive('/tomorrow-veg-booking') ? '#FFCC00' : '#FFFFFF'} 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          fill={isActive('/tomorrow-veg-booking') ? '#FFCC00' : 'none'} 
                          fillOpacity={isActive('/tomorrow-veg-booking') ? '0.2' : '0'}
                        />
                      </motion.svg>
                    </div>
                    <span className={`text-[10px] mt-1.5 font-black font-poppins uppercase tracking-wider ${isActive('/tomorrow-veg-booking') ? 'text-[#FFCC00]' : 'text-white'}`}>
                      TOMORROW
                    </span>
                  </Link>
                </motion.div>

                {/* Categories */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="flex-1 h-full"
                >
                  <Link
                    to="/categories"
                    className="flex flex-col items-center justify-center h-full relative"
                  >
                    <div className="flex flex-col items-center justify-center relative">
                      <motion.svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        animate={{
                          rotate: categoriesRotation,
                          scale: (isActive('/categories') || location.pathname.startsWith('/category/')) ? 1.1 : 1
                        }}
                        transition={{
                          duration: 0.5,
                          ease: "easeInOut"
                        }}
                        style={{ transformOrigin: 'center' }}
                      >
                        <path 
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
                          stroke={(isActive('/categories') || location.pathname.startsWith('/category/')) ? '#FFCC00' : '#FFFFFF'} 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          fill={(isActive('/categories') || location.pathname.startsWith('/category/')) ? '#FFCC00' : 'none'} 
                          fillOpacity={(isActive('/categories') || location.pathname.startsWith('/category/')) ? '0.2' : '0'}
                        />
                      </motion.svg>
                    </div>
                    <span className={`text-[10px] mt-1.5 font-black font-poppins uppercase tracking-wider ${(isActive('/categories') || location.pathname.startsWith('/category/')) ? 'text-[#FFCC00]' : 'text-white'}`}>
                      SHRENI
                    </span>
                  </Link>
                </motion.div>

                {/* Profile */}
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                  className="flex-1 h-full"
                >
                  <Link
                    to="/account"
                    className="flex flex-col items-center justify-center h-full relative"
                  >
                    <div className="flex flex-col items-center justify-center relative">
                      <motion.svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        animate={isActive('/account') ? {
                          scale: [1, 1.1, 1]
                        } : {}}
                      >
                        <path 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 2.239-8 5v2h16v-2c0-2.761-3.582-5-8-5z" 
                          stroke={isActive('/account') ? '#FFCC00' : '#FFFFFF'} 
                          strokeWidth="2.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          fill={isActive('/account') ? '#FFCC00' : 'none'} 
                          fillOpacity={isActive('/account') ? '0.2' : '0'}
                        />
                      </motion.svg>
                    </div>
                    <span className={`text-[10px] mt-1.5 font-black font-poppins uppercase tracking-wider ${isActive('/account') ? 'text-[#FFCC00]' : 'text-white'}`}>
                      ACCOUNT
                    </span>
                  </Link>
                </motion.div>
              </div>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

