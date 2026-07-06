import { useNavigate } from 'react-router-dom';
import { useLayoutEffect, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLoading } from '../../../context/LoadingContext';
import { useLocation as useUserLocation } from '../../../hooks/useLocation';
import { useThemeContext } from '../../../context/ThemeContext';
import { appConfig } from '../../../services/configService';
import { getCategories } from '../../../services/api/customerProductService';
import { Category } from '../../../types/domain';
import { getHeaderCategoriesPublic } from '../../../services/api/headerCategoryService';
import { getHomeContent } from '../../../services/api/customerHomeService';
import { getIconByName } from '../../../utils/iconLibrary';
import { apiCache } from '../../../utils/apiCache';
import homeIcon from '@assets/category/home_v2.png';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import brandLogo from '@assets/village_basket-removebg-preview.png';
import FestivalCategoryModule from './FestivalCategoryModule';
import DateTrackerStrip from './DateTrackerStrip';
import HomeBannersCarousel from './HomeBannersCarousel';
import DeliveryEtaBadge from '../../../components/DeliveryEtaBadge';


gsap.registerPlugin(ScrollTrigger);

interface HomeHeroProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  festivalModules?: any[];
  promoBanners?: any[];
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const HOME_TAB: Tab = {
  id: 'all',
  label: 'Home',
  icon: <img src={homeIcon} alt="Home" className="w-full h-full object-contain" />,
};


export default function HomeHero({ activeTab = 'all', onTabChange, festivalModules, promoBanners }: HomeHeroProps) {
  const [tabs, setTabs] = useState<Tab[]>([HOME_TAB]);

  useEffect(() => {
    const fetchHeaderCategories = async () => {
      try {
        // Cache header categories for 10 minutes
        const cats = await apiCache.getOrFetch(
          'header-categories',
          () => getHeaderCategoriesPublic(),
          10 * 60 * 1000
        );
        if (cats && cats.length > 0) {
          const mapped = cats.map((c: any) => {
            if (c.slug === 'all' && !c.image) {
              return { id: c.slug, label: c.name, icon: HOME_TAB.icon };
            }
            return {
              id: c.slug,
              label: c.name,
              icon: c.image ? (
                <img src={c.image} alt={c.name} className="w-full h-full object-contain" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  {getIconByName(c.iconName || '')}
                </div>
              )
            };
          });
          setTabs(mapped);
        }
      } catch (error) {
        // silently fail — HOME_TAB fallback remains
      }
    };
    fetchHeaderCategories();
  }, []);
  const navigate = useNavigate();
  const { location: userLocation } = useUserLocation();
  const heroRef = useRef<HTMLDivElement>(null);
  const topSectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [, setIsSticky] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Format location display text - only show if user has provided location
  const locationDisplayText = useMemo(() => {
    if (userLocation?.address) {
      // Use the full address if available
      return userLocation.address;
    }
    // Fallback to city, state format if available
    if (userLocation?.city && userLocation?.state) {
      return `${userLocation.city}, ${userLocation.state}`;
    }
    // Fallback to city only
    if (userLocation?.city) {
      return userLocation.city;
    }
    // No default - return empty string if no location provided
    return '';
  }, [userLocation]);

  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch categories for search suggestions — cached
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiCache.getOrFetch(
          'categories-list',
          () => getCategories(),
          10 * 60 * 1000
        );
        if (response.success && response.data) {
          setCategories(response.data.map((c: any) => ({ ...c, id: c._id || c.id })));
        }
      } catch (error) {
        // silently fail
      }
    };
    fetchCategories();
  }, []);

  // Search suggestions based on active tab or fetched categories
  const searchSuggestions = useMemo(() => {
    if (activeTab === 'all' && categories.length > 0) {
      // Use real category names for 'all' tab suggestions
      return categories.slice(0, 8).map(c => c.name.toLowerCase());
    }

    switch (activeTab) {
      case 'wedding':
        return ['gift packs', 'dry fruits', 'sweets', 'decorative items', 'wedding cards', 'return gifts'];
      case 'winter':
        return ['woolen clothes', 'caps', 'gloves', 'blankets', 'heater', 'winter wear'];
      case 'electronics':
        return ['chargers', 'cables', 'power banks', 'earphones', 'phone cases', 'screen guards'];
      case 'beauty':
        return ['lipstick', 'makeup', 'skincare', 'kajal', 'face wash', 'moisturizer'];
      case 'grocery':
        return ['atta', 'milk', 'dal', 'rice', 'oil', 'vegetables'];
      case 'fashion':
        return ['clothing', 'shoes', 'accessories', 'watches', 'bags', 'jewelry'];
      case 'sports':
        return ['cricket bat', 'football', 'badminton', 'fitness equipment', 'sports shoes', 'gym wear'];
      default: // 'all'
        return ['atta', 'milk', 'dal', 'coke', 'bread', 'eggs', 'rice', 'oil'];
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        hero,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        }
      );
    }, hero);

    return () => ctx.revert();
  }, []);

  // Animate search suggestions
  useEffect(() => {
    setCurrentSearchIndex(0);
    const interval = setInterval(() => {
      setCurrentSearchIndex((prev) => (prev + 1) % searchSuggestions.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [searchSuggestions.length, activeTab]);

  // Handle scroll — memoized to avoid re-registration on every render
  const handleScroll = useCallback(() => {
    if (topSectionRef.current && stickyRef.current) {
      const lowestPricesSection = document.querySelector('[data-section="lowest-prices"]');
      if (lowestPricesSection) {
        const sectionBottom = lowestPricesSection.getBoundingClientRect().bottom;
        const progress = Math.min(Math.max(1 - (sectionBottom / 200), 0), 1);
        setScrollProgress(progress);
        setIsSticky(sectionBottom <= 100);
      } else {
        const topSectionBottom = topSectionRef.current.getBoundingClientRect().bottom;
        const topSectionHeight = topSectionRef.current.offsetHeight;
        const progress = Math.min(Math.max(1 - (topSectionBottom / topSectionHeight), 0), 1);
        setScrollProgress(progress);
        setIsSticky(topSectionBottom <= 0);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Update tab indicator — single RAF instead of 3 timeouts
  useEffect(() => {
    const updateIndicator = () => {
      const activeTabButton = tabRefs.current.get(activeTab);
      const container = tabsContainerRef.current;
      if (!activeTabButton || !container) return;

      const left = activeTabButton.offsetLeft;
      const width = activeTabButton.offsetWidth;
      if (width > 0) setIndicatorStyle({ left, width });

      const containerScrollLeft = container.scrollLeft;
      const containerWidth = container.offsetWidth;
      const scrollPadding = 20;
      let targetScrollLeft = containerScrollLeft;

      if (left < containerScrollLeft + scrollPadding) {
        targetScrollLeft = left - scrollPadding;
      } else if (left + width > containerScrollLeft + containerWidth - scrollPadding) {
        targetScrollLeft = left + width - containerWidth + scrollPadding;
      }

      if (targetScrollLeft !== containerScrollLeft) {
        container.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
      }
    };

    const rafId = requestAnimationFrame(updateIndicator);
    return () => cancelAnimationFrame(rafId);
  }, [activeTab]);

  const { startRouteLoading } = useLoading();

  const handleSearchClick = () => {
    // Navigate directly - the global useRouteLoader hook handles the transition animation
    navigate('/user/search');
  };

  const handleTabClick = (tabId: string) => {
    // If it's the home/all view, just filter the landing page as traditional tabs
    if (tabId === 'all') {
      onTabChange?.('all');
      return;
    }

    // Find the clicked tab object to access the label for custom routing
    const clickedTab = tabs.find(t => t.id === tabId);
    const label = clickedTab?.label?.toLowerCase() || '';

    // Hardcoded navigation for specific categories as requested
    if (label.includes('biscuits') || label.includes('snacka')) {
      navigate('/user/category/snacks-and-biscuits');
    } else if (label.includes('oil') || label.includes('ghee')) {
      navigate('/user/category/oil-and-ghee');
    } else if (label.includes('rice')) {
      navigate('/user/category/rice');
    } else if (label.includes('vegetables')) {
      navigate('/user/category/vegetables');
    } else if (label.includes('dryfruits') || label.includes('nuts')) {
      navigate('/user/category/dryfruits');
    } else if (label.includes('fruits')) {
      navigate('/user/category/fruits');
    } else if (label.includes('grocery')) {
      navigate('/user/categories');
    } else {
      // Fallback: stay on home page and filter products if no specific route is matched
      onTabChange?.(tabId);
    }
  };

  const { currentTheme } = useThemeContext();
  const { cart } = useCart();
  const { isAuthenticated } = useAuth();
  const theme = currentTheme;
  // Use theme constant instead of hardcoded yellow gradient background

  // Helper to convert RGB to RGBA
  const rgbToRgba = (rgb: string, alpha: number) => {
    return rgb.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
  };

  return (
    <div
      ref={heroRef}
      className="bg-transparent paper-texture"
      style={{
        paddingBottom: 0,
        marginBottom: 0,
      }}
    >
      <div
        className="md:hidden pt-3 pb-3 px-4 relative z-10 overflow-hidden"
        style={{
          backgroundColor: '#8B3D28',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px',
          boxShadow: '0 8px 25px rgba(139, 61, 40, 0.25)'
        }}
      >
        {/* Decorative Warli Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>

        {/* Top Row: Logo, Notifications & Cart */}
        <div className="flex items-center justify-between mb-2.5 relative z-20">
          <div className="flex items-center gap-2">
            <div
              onClick={() => {
                if (window.location.pathname === '/' || window.location.pathname === '/user/home') {
                  window.location.reload();
                } else {
                  navigate('/user/home');
                }
              }}
              className="bg-white p-2 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] border-2 border-white/20 transform hover:scale-105 transition-transform duration-300 cursor-pointer"
            >
              <img
                src={brandLogo}
                alt="Village Basket"
                className="h-7 w-auto object-contain"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Notification Icon */}
            <button
              onClick={() => navigate('/user/notifications')}
              className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center text-white relative active:scale-95 transition-all"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {/* Optional: Unread indicator dot */}
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#8B3D28]"></span>
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => navigate('/user/checkout')}
              className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center text-white relative active:scale-95 transition-all"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {(cart?.itemCount || 0) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#4b7d5a] text-white text-[9px] font-black rounded-lg min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-lg border-2 border-[#8B3D28]">
                  {cart?.itemCount || 0}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mb-3 relative z-20">
          <div
            onClick={handleSearchClick}
            className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.1)] cursor-pointer group active:scale-[0.98] transition-all min-h-[48px]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B3D28" strokeWidth="3" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <div className="flex-1 relative h-5 overflow-hidden">
              {searchSuggestions.map((suggestion, index) => {
                const isActive = index === currentSearchIndex;
                return (
                  <div
                    key={suggestion}
                    className={`absolute inset-0 flex items-center transition-all duration-500 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                  >
                    <span className="text-neutral-400 text-sm font-semibold">Search &quot;{suggestion}&quot;</span>
                  </div>
                );
              })}
            </div>
            {/* Mic Icon for Voice Search Cue */}
            <div className="text-neutral-400 pl-1 border-l border-neutral-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
            </div>
          </div>
        </div>

        {/* Delivery Address + Next Slot */}
        <div className="flex flex-col gap-2 relative z-20">
          <div
            onClick={() => navigate('/user/location')}
            className="flex w-full items-center gap-2 bg-black/10 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-white/5 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full bg-[#4b7d5a] flex items-center justify-center shadow-sm flex-shrink-0">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
              </svg>
            </div>
            <span className="text-[9px] text-white/80 font-black truncate flex-1 uppercase tracking-tight">
              {locationDisplayText || 'Set delivery location'}
            </span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-30 flex-shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
          <DeliveryEtaBadge variant="compact" className="w-full" />
        </div>
      </div>

      {/* Desktop Header removed - Now handled by AppLayout global header */}

      {/* Festival Modules integrated here - Can now render multiple */}
      {festivalModules && festivalModules.length > 0 && (
        <div className="flex flex-col gap-4 relative z-10">
          {festivalModules.map((module) => (
            <FestivalCategoryModule key={module.id || module._id} module={module} />
          ))}
        </div>
      )}

      {/* Sticky section: Search Bar and Category Tabs - Always sticky */}
      <div
        ref={stickyRef}
        className="sticky top-0 z-50"
        style={{
          background: scrollProgress >= 0.1
            ? `rgba(139, 61, 40, ${Math.min(1, scrollProgress * 1.2)})`
            : 'transparent',
          backdropFilter: scrollProgress >= 0.1 ? `blur(${scrollProgress * 8}px)` : 'none',
          boxShadow: scrollProgress >= 0.1 ? `0 4px 15px rgba(0, 0, 0, 0.15)` : 'none',
          transition: 'background 0.3s ease-out, backdrop-filter 0.3s ease-out, box-shadow 0.3s ease-out',
        }}
      >
        {/* Sticky Search Bar - Removed for mobile to reduce clutter */}

        {/* Date Tracker Strip for Future Orders */}
        <div className="pt-4">
          <DateTrackerStrip hideLegend={true} />
        </div>

        {/* Home Carousel Banners */}
        {promoBanners && promoBanners.length > 0 && (
          <div
            className="transition-all duration-300 overflow-hidden"
            style={{
              maxHeight: scrollProgress > 0.05 ? '0px' : '300px',
              opacity: scrollProgress > 0.05 ? 0 : 1,
              transform: `scale(${scrollProgress > 0.05 ? 0.95 : 1})`,
              marginBottom: scrollProgress > 0.05 ? '0px' : '4px'
            }}
          >
            <HomeBannersCarousel banners={promoBanners} />
          </div>
        )}



        {/* Category Tabs Section */}
        <div className="w-full relative" style={{ paddingTop: '12px', paddingBottom: '0px' }}>

          <div className="px-4 md:px-6 lg:px-8 mb-4">
            <h2 className={`text-lg md:text-xl font-bold tracking-tight font-poppins transition-colors ${scrollProgress > 0.5 ? 'text-white' : 'text-village-umber'}`}>
              Popular Categories
            </h2>
          </div>
          <div
            ref={tabsContainerRef}
            className="flex gap-4 md:gap-12 overflow-x-auto scrollbar-hide px-4 md:px-12 lg:px-24 md:justify-center scroll-smooth py-6 md:py-10"
          >

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    if (el) {
                      tabRefs.current.set(tab.id, el);
                    } else {
                      tabRefs.current.delete(tab.id);
                    }
                  }}
                  onClick={() => handleTabClick(tab.id)}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group outline-none"
                  type="button"
                >
                  <div
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-300 ${isActive
                      ? 'bg-white shadow-[0_0_0_3px_#8B3D28,0_4px_12px_rgba(139,61,40,0.25)] scale-110 z-20'
                      : 'bg-white shadow-md border border-neutral-100 hover:shadow-lg group-hover:scale-105'
                      }`}
                  >
                    <div className="w-full h-full transition-all duration-300 p-1">
                      {tab.icon}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] md:text-sm text-center font-bold font-poppins leading-tight max-w-[80px] transition-all duration-300 ${isActive ? 'text-[#8B3D28] scale-105' : 'text-village-umber/70'
                      }`}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

