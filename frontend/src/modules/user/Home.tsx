import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HomeHero from "./components/HomeHero";

import PromoStrip from "./components/PromoStrip";
import LowestPricesEver from "./components/LowestPricesEver";
import CategoryTileSection from "./components/CategoryTileSection";
import FeaturedThisWeek from "./components/FeaturedThisWeek";
import BestsellerCards from "./components/BestsellerCards";
import FestivalCategoryModule from "./components/FestivalCategoryModule";
import ProductCard from "./components/ProductCard";

import { getHomeContent } from "../../services/api/customerHomeService";
import { getHeaderCategoriesPublic } from "../../services/api/headerCategoryService";
import { useLocation } from "../../hooks/useLocation";
import { useLoading } from "../../context/LoadingContext";
import PageLoader from "../../components/PageLoader";

import { useThemeContext } from "../../context/ThemeContext";

export default function Home() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { activeCategory, setActiveCategory, currentTheme: theme } = useThemeContext();
  const { startRouteLoading, stopRouteLoading } = useLoading();
  const activeTab = activeCategory; // mapping for existing code compatibility
  const setActiveTab = setActiveCategory;


  const contentRef = useRef<HTMLDivElement>(null);
  const scrollHandledRef = useRef(false);
  const SCROLL_POSITION_KEY = 'home-scroll-position';
  const bestsellersScrollRef = useRef<HTMLDivElement>(null);

  // State for dynamic data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<any>({
    bestsellers: [],
    categories: [],
    subcategories: [], // Tab-specific subcategories
    homeSections: [], // Dynamic sections created by admin
    shops: [],
    promoBanners: [],
    trending: [],
    cookingIdeas: [],
    bestsellerCards: [],
    festivalModule: null,
  });


  const [products, setProducts] = useState<any[]>([]);

  // Function to save scroll position before navigation
  const saveScrollPosition = () => {
    const mainElement = document.querySelector('main');
    const scrollPos = Math.max(
      mainElement ? mainElement.scrollTop : 0,
      window.scrollY || 0,
      document.documentElement.scrollTop || 0
    );
    if (scrollPos > 0) {
      sessionStorage.setItem(SCROLL_POSITION_KEY, scrollPos.toString());
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        startRouteLoading();
        setLoading(true);
        setError(null);
        // Pass the activeTab as the headerCategorySlug
        const response = await getHomeContent(
          activeTab,
          location?.latitude,
          location?.longitude,
          true,            // useCache
          5 * 60 * 1000,   // TTL
          false,           // skipLoader
          true             // persist: Keep in sessionStorage
        );
        if (response.success && response.data) {
          setHomeData(response.data);

          if (response.data.bestsellers) {
            setProducts(response.data.bestsellers);
          }
        } else {
          setError("Failed to load content. Please try again.");
        }
      } catch (error) {
        console.error("Failed to fetch home content", error);
        setError("Network error. Please check your connection.");
      } finally {
        setLoading(false);
        stopRouteLoading();
      }
    };

    fetchData();

    // Preload PromoStrip data for all header categories in the background
    // This ensures instant loading when users switch tabs
    const preloadHeaderCategories = async () => {
      try {
        // Wait a bit after initial load to not interfere with main content
        await new Promise(resolve => setTimeout(resolve, 1000));

        const headerCategories = await getHeaderCategoriesPublic(true);
        // Preload data for each header category (including 'all')
        const slugsToPreload = ['all', ...headerCategories.map(cat => cat.slug)];

        // Preload in batches to avoid overwhelming the network
        const batchSize = 2;
        for (let i = 0; i < slugsToPreload.length; i += batchSize) {
          const batch = slugsToPreload.slice(i, i + batchSize);
          await Promise.all(
            batch.map(slug =>
              getHomeContent(
                slug,
                location?.latitude,
                location?.longitude,
                true,
                5 * 60 * 1000,
                true,
                true // PERSIST: Keep in sessionStorage
              ).catch(err => {
                // Silently fail - this is just preloading
                console.debug(`Failed to preload data for ${slug}:`, err);
              })
            )
          );
          // Small delay between batches
          if (i + batchSize < slugsToPreload.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } catch (error) {
        // Silently fail - preloading is optional
        console.debug("Failed to preload header categories:", error);
      }
    };

    preloadHeaderCategories();
  }, [location?.latitude, location?.longitude, activeTab]);

  // Restore scroll position when returning to this page
  useEffect(() => {
    // Only restore scroll after data has loaded
    if (!loading && homeData.shops) {
      // Use a ref to ensure we only handle initial scroll once per mount
      if (scrollHandledRef.current) return;
      scrollHandledRef.current = true;

      const savedScrollPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
      if (savedScrollPosition) {
        const scrollY = parseInt(savedScrollPosition, 10);

        const performScroll = () => {
          const mainElement = document.querySelector('main');
          if (mainElement) {
            mainElement.scrollTop = scrollY;
          }
          window.scrollTo(0, scrollY);
        };

        // Try multiple times to ensure scroll is applied even if content is still rendering
        requestAnimationFrame(() => {
          performScroll();
          requestAnimationFrame(() => {
            performScroll();
            // Final fallback after a small delay for any late-rendering content
            setTimeout(performScroll, 100);
            setTimeout(performScroll, 300);
          });
        });

        // Clear the saved position after some time to ensure AppLayout can also see it if needed
        // but Home.tsx is the primary restorer now.
        setTimeout(() => {
          sessionStorage.removeItem(SCROLL_POSITION_KEY);
        }, 1000);
      } else {
        // No saved position, ensure we start at the top
        const performReset = () => {
          const mainElement = document.querySelector('main');
          if (mainElement) {
            mainElement.scrollTop = 0;
          }
          window.scrollTo(0, 0);
        };
        requestAnimationFrame(performReset);
        setTimeout(performReset, 100);
      }
    }
  }, [loading, homeData.shops]);

  // Global click/touch listener to save scroll position before any navigation
  useEffect(() => {
    const handleNavigationEvent = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // If clicking a link, button, or any element with cursor-pointer (like product cards/store tiles)
      if (target.closest('a') || target.closest('button') || target.closest('[role="button"]') || target.closest('.cursor-pointer')) {
        saveScrollPosition();
      }
    };

    window.addEventListener('click', handleNavigationEvent, { capture: true });
    window.addEventListener('touchstart', handleNavigationEvent, { capture: true, passive: true });
    return () => {
      window.removeEventListener('click', handleNavigationEvent, { capture: true });
      window.removeEventListener('touchstart', handleNavigationEvent, { capture: true });
    };
  }, []);

  // Removed duplicate saveScrollPosition
  // Scroll helper for Bestsellers section
  const scrollBestsellers = (direction: 'left' | 'right') => {
    if (bestsellersScrollRef.current) {
      const scrollAmount = 400;
      bestsellersScrollRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getFilteredProducts = (tabId: string) => {
    if (tabId === "all") {
      return products;
    }
    return products.filter(
      (p) =>
        p.categoryId === tabId ||
        (p.category && (p.category._id === tabId || p.category.slug === tabId))
    );
  };

  const filteredProducts = useMemo(
    () => getFilteredProducts(activeTab),
    [activeTab, products]
  );

  if (loading && !products.length && !homeData.homeSections?.length) {
    return <PageLoader />; // Let the global IconLoader handle the initial loading state
  }

  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  return (
    <div className="bg-transparent min-h-screen pb-32 md:pb-8 font-poppins relative" ref={contentRef}>
      {/* Page Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] z-0"></div>

      {/* Hero Header with Gradient, Tabs, and Festival Module integrated */}
      <HomeHero 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        festivalModules={homeData.festivalModules} 
      />


      {/* Promo Strip */}
      <div className="relative z-10">
        <PromoStrip activeTab={activeTab} />
      </div>


      {/* LOWEST PRICES EVER Section */}
      <div className="bg-transparent pt-2 relative z-10">
        <LowestPricesEver activeTab={activeTab} products={homeData.lowestPrices} />
      </div>

      {/* Dynamic spacing between hero sections */}
      <div className="h-4 relative z-10"></div>

      {/* Main content */}
      <div
        className="pt-1 space-y-6 md:space-y-10 md:pt-4 md:px-6 lg:px-12 xl:px-24 relative z-10"
      >


        {/* Featured This Week Section */}
        {/* <FeaturedThisWeek /> */}

        {/* Bestseller Category Cards (2x2 Grid) */}
        {homeData.bestsellerCards && homeData.bestsellerCards.length > 0 && (
          <BestsellerCards cards={homeData.bestsellerCards} />
        )}

        {/* Dynamic Home Sections - Render sections created by admin (For ALL tabs) */}
        {homeData.homeSections && homeData.homeSections.length > 0 && (
          <>
            {homeData.homeSections.map((section: any) => {
              const columnCount = Number(section.columns) || 4;

              if (section.displayType === "products" && section.data && section.data.length > 0) {
                const gridClass = {
                  2: "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
                  3: "grid-cols-3 md:grid-cols-6 lg:grid-cols-9",
                  4: "grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10",
                  6: "grid-cols-6 md:grid-cols-8 lg:grid-cols-12",
                  8: "grid-cols-8 md:grid-cols-10 lg:grid-cols-14"
                }[columnCount] || "grid-cols-4 md:grid-cols-8 lg:grid-cols-12";

                const isCompact = columnCount >= 4;
                const gapClass = columnCount >= 4 ? "gap-2" : "gap-3 md:gap-6 lg:gap-8";

                return (
                  <div key={section.id} className="mt-6 mb-6 md:mt-8 md:mb-8">
                    {section.title && (
                      <h2 className="text-xl md:text-4xl font-black text-village-umber mb-4 md:mb-10 px-4 md:px-6 lg:px-8 tracking-tighter font-poppins capitalize">
                        {section.title}
                      </h2>
                    )}
                    <div className="px-4 md:px-6 lg:px-8">
                      <div className={`grid ${gridClass} ${gapClass}`}>
                        {section.data.map((product: any) => (
                          <ProductCard
                            key={product.id || product._id}
                            product={product}
                            categoryStyle={true}
                            showBadge={true}
                            showPackBadge={false}
                            showStockInfo={false}
                            compact={isCompact}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <CategoryTileSection
                  key={section.id}
                  title={section.title}
                  tiles={section.data || []}
                  columns={columnCount as 2 | 3 | 4 | 6 | 8}
                  showProductCount={false}
                />
              );
            })}
          </>
        )}

        {/* Bestsellers Section (Dynamic) */}
        {homeData.bestsellers && homeData.bestsellers.length > 0 && (
          <div className="mt-6 mb-6 md:mt-8 md:mb-8">
            <h2 className="text-lg md:text-2xl font-bold text-village-umber mb-3 md:mb-6 px-4 md:px-6 lg:px-8 tracking-tight font-poppins">
              Bestsellers
            </h2>
            <div className="px-4 md:px-6 lg:px-8 relative group">
              {/* Left Arrow - Web View Only */}
              <button
                onClick={() => scrollBestsellers('left')}
                className="hidden md:flex absolute left-0 md:left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm border border-neutral-100 shadow-xl items-center justify-center text-village-umber hover:bg-[#8B3D28] hover:text-white transition-all z-30 opacity-0 group-hover:opacity-100 active:scale-95"
                title="Previous"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div
                ref={bestsellersScrollRef}
                className="flex items-stretch gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-2 no-scrollbar"
                style={{ scrollSnapType: 'x mandatory' }}
              >
                {homeData.bestsellers.map((product: any) => (
                  <div
                    key={product.id || product._id}
                    className="flex-shrink-0 w-[130px] md:w-[180px]"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <ProductCard
                      product={product}
                      categoryStyle={true}
                      showBadge={true}
                    />
                  </div>
                ))}
              </div>

              {/* Right Arrow - Web View Only */}
              <button
                onClick={() => scrollBestsellers('right')}
                className="hidden md:flex absolute right-0 md:right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm border border-neutral-100 shadow-xl items-center justify-center text-village-umber hover:bg-[#8B3D28] hover:text-white transition-all z-30 opacity-0 group-hover:opacity-100 active:scale-95"
                title="Next"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Root Category Tiles - Showing main categories at the top of 'All' tab */}
        {activeTab === "all" && homeData.categories && homeData.categories.length > 0 && (
          <div className="mt-2 md:mt-4">
            <CategoryTileSection
              title="Shop by Category"
              tiles={homeData.categories}
              columns={4}
              showProductCount={false}
            />
          </div>
        )}

        {/* Subcategory Tiles - Showing sub-collections for specific header tabs (Simple Mode) */}
        {activeTab !== "all" && homeData.subcategories && homeData.subcategories.length > 0 && (
          <div className="mt-2 md:mt-4">
            <CategoryTileSection
              title={`Explore ${activeTab.replace('-', ' ')}`}
              tiles={homeData.subcategories}
              columns={4}
              showProductCount={false}
            />
          </div>
        )}

        {/* Shop by Store Section removed for cleaner UI */}
      </div>
    </div>
  );
}
