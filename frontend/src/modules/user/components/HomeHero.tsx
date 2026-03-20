import { useNavigate } from 'react-router-dom';
import { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react';
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
import homeIcon from '@assets/category/home_v2.png';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import brandLogo from '@assets/village_basket-removebg-preview.png';

gsap.registerPlugin(ScrollTrigger);

interface HomeHeroProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const HOME_TAB: Tab = {
  id: 'all',
  label: 'Home',
  icon: <img src={`${homeIcon}?v=${Date.now()}`} alt="Home" className="w-full h-full object-contain" />,
};


export default function HomeHero({ activeTab = 'all', onTabChange }: HomeHeroProps) {
  const [tabs, setTabs] = useState<Tab[]>([HOME_TAB]);

  useEffect(() => {
    const fetchHeaderCategories = async () => {
      try {
        const cats = await getHeaderCategoriesPublic();
        if (cats && cats.length > 0) {
          const mapped = cats.map(c => {
            if (c.slug === 'all' && !c.image) {
              return {
                id: c.slug,
                label: c.name,
                icon: HOME_TAB.icon
              };
            }
            return {
              id: c.slug,
              label: c.name,
              icon: c.image ? (
                <img src={c.image} alt={c.name} className="w-full h-full object-contain" />
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
        console.error('Failed to fetch header categories', error);
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

  // Fetch categories for search suggestions
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        if (response.success && response.data) {
          setCategories(response.data.map((c: any) => ({
            ...c,
            id: c._id || c.id
          })));
        }
      } catch (error) {
        console.error("Error fetching categories for suggestions:", error);
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

  // Handle scroll to detect when "LOWEST PRICES EVER" section is out of view
  useEffect(() => {
    const handleScroll = () => {
      if (topSectionRef.current && stickyRef.current) {
        // Find the "LOWEST PRICES EVER" section
        const lowestPricesSection = document.querySelector('[data-section="lowest-prices"]');

        if (lowestPricesSection) {
          const sectionBottom = lowestPricesSection.getBoundingClientRect().bottom;
          // When the section has scrolled up past the viewport, transition to white
          const progress = Math.min(Math.max(1 - (sectionBottom / 200), 0), 1);
          setScrollProgress(progress);
          setIsSticky(sectionBottom <= 100);
        } else {
          // Fallback to original logic if section not found
          const topSectionBottom = topSectionRef.current.getBoundingClientRect().bottom;
          const topSectionHeight = topSectionRef.current.offsetHeight;
          const progress = Math.min(Math.max(1 - (topSectionBottom / topSectionHeight), 0), 1);
          setScrollProgress(progress);
          setIsSticky(topSectionBottom <= 0);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update sliding indicator position when activeTab changes and scroll to active tab
  useEffect(() => {
    const updateIndicator = (shouldScroll = true) => {
      const activeTabButton = tabRefs.current.get(activeTab);
      const container = tabsContainerRef.current;

      if (activeTabButton && container) {
        try {
          // Use offsetLeft for position relative to container (not affected by scroll)
          // This ensures the indicator stays aligned even when container scrolls
          const left = activeTabButton.offsetLeft;
          const width = activeTabButton.offsetWidth;

          // Ensure valid values
          if (width > 0) {
            setIndicatorStyle({ left, width });
          }

          // Scroll the container to bring the active tab into view (only when tab changes)
          if (shouldScroll) {
            const containerScrollLeft = container.scrollLeft;
            const containerWidth = container.offsetWidth;
            const buttonLeft = left;
            const buttonWidth = width;
            const buttonRight = buttonLeft + buttonWidth;

            // Calculate scroll position to center the button or keep it visible
            const scrollPadding = 20; // Padding from edges
            let targetScrollLeft = containerScrollLeft;

            // If button is on the left side and partially or fully hidden
            if (buttonLeft < containerScrollLeft + scrollPadding) {
              targetScrollLeft = buttonLeft - scrollPadding;
            }
            // If button is on the right side and partially or fully hidden
            else if (buttonRight > containerScrollLeft + containerWidth - scrollPadding) {
              targetScrollLeft = buttonRight - containerWidth + scrollPadding;
            }

            // Smooth scroll to the target position
            if (targetScrollLeft !== containerScrollLeft) {
              container.scrollTo({
                left: Math.max(0, targetScrollLeft),
                behavior: 'smooth'
              });
            }
          }
        } catch (error) {
          console.warn('Error updating indicator:', error);
        }
      }
    };

    // Update immediately with scroll
    updateIndicator(true);

    // Also update after delays to handle any layout shifts and ensure smooth animation
    const timeout1 = setTimeout(() => updateIndicator(true), 50);
    const timeout2 = setTimeout(() => updateIndicator(true), 150);
    const timeout3 = setTimeout(() => updateIndicator(false), 300); // Last update without scroll to avoid conflicts

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [activeTab]);

  const { startRouteLoading } = useLoading();

  const handleSearchClick = () => {
    // Navigate directly - the global useRouteLoader hook handles the transition animation
    navigate('/search');
  };

  const handleTabClick = (tabId: string) => {
    onTabChange?.(tabId);
    // Don't scroll - keep page at current position
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
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>

        {/* Top Row: Logo & Cart */}
        <div className="flex items-center justify-between mb-2.5 relative z-20">
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] border-2 border-white/20 transform hover:scale-105 transition-transform duration-300">
              <img
                src={brandLogo}
                alt="Village Basket"
                className="h-7 w-auto object-contain"
              />
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-lg flex items-center justify-center text-white relative active:scale-95 transition-all"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {(cart?.itemCount || 0) > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#4A7C59] text-white text-[9px] font-black rounded-lg min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-lg border-2 border-[#8B3D28]">
                {cart?.itemCount || 0}
              </span>
            )}
          </button>
        </div>

        <div className="mb-2.5 relative z-20">
          <div
            onClick={handleSearchClick}
            className="w-full bg-white rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)] cursor-pointer group active:scale-[0.98] transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B3D28" strokeWidth="3" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <div className="flex-1 relative h-4 overflow-hidden">
              {searchSuggestions.map((suggestion, index) => {
                const isActive = index === currentSearchIndex;
                return (
                  <div
                    key={suggestion}
                    className={`absolute inset-0 flex items-center transition-all duration-500 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                  >
                    <span className="text-neutral-400 text-[12px] font-bold">Search &quot;{suggestion}&quot;</span>
                  </div>
                );
              })}
            </div>
            {/* Mic Icon for Voice Search Cue */}
            <div className="text-neutral-400 pl-1 border-l border-neutral-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Delivery Address Pill */}
        <div 
          onClick={() => navigate('/location')}
          className="flex items-center gap-2 bg-black/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/5 active:scale-[0.98] transition-all cursor-pointer relative z-20"
        >
          <div className="w-4 h-4 rounded-full bg-[#4A7C59] flex items-center justify-center shadow-sm">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
            </svg>
          </div>
          <span className="text-[9px] text-white/80 font-black truncate flex-1 uppercase tracking-tight">
            {locationDisplayText || 'Set delivery location'}
          </span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>

      {/* Legacy/Desktop Header - Hidden on Mobile */}
      <div className="hidden md:block">
        <div ref={topSectionRef} className="px-4 md:px-6 lg:px-8 pt-2 md:pt-3 pb-0">
          <div className="flex items-start justify-between mb-2 md:mb-2">
            {/* Left: Text content */}
            <div className="flex-1 pr-2">
              {/* Service name & Logo */}
              <div className="mb-0.5 flex flex-col items-start gap-1">
                <img src={brandLogo} alt="Village Basket" className="h-[38px] md:h-[46px] object-contain" />
              </div>
              {/* Delivery time - large, bold, dark grey/black */}
              
              {/* Location with dropdown indicator - only show if location is provided */}
              {locationDisplayText && (
                <div className="text-neutral-700 text-[10px] md:text-xs flex items-center gap-0.5 leading-tight">
                  <span className="line-clamp-1" title={locationDisplayText}>{locationDisplayText}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
        <div className="px-4 md:px-6 lg:px-8 pt-2 md:pt-2 pb-2 md:pb-2 hidden md:block">
          {/* Desktop Search Bar Only - Animated Search moved into Top Row for Mobile */}
          <div
            onClick={handleSearchClick}
            className={`w-full md:w-auto md:max-w-xl md:mx-auto rounded-2xl shadow-lg px-3 py-2 md:px-3 md:py-1.5 flex items-center gap-2 cursor-pointer hover:shadow-xl transition-all duration-300 mb-2 md:mb-1.5 ${scrollProgress > 0.5 ? 'bg-white shadow-inner' : 'bg-white'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" className="text-neutral-400">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span className="flex-1 text-neutral-400 font-medium text-sm">Search for products...</span>
            <div className="text-neutral-300 ml-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Category Tabs Section */}
        <div className="w-full relative" style={{ paddingTop: '12px', paddingBottom: '24px' }}>
          <div className="px-4 md:px-6 lg:px-8 mb-4">
            <h2 className={`text-lg md:text-xl font-bold tracking-tight font-poppins transition-colors ${scrollProgress > 0.5 ? 'text-white' : 'text-village-umber'}`}>
              Popular Categories
            </h2>
          </div>
          <div
            ref={tabsContainerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-4 md:px-6 lg:px-8 md:justify-center scroll-smooth py-4"
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

