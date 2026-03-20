import { useLayoutEffect, useRef, useState, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { Link, useNavigate } from "react-router-dom";
import { getTheme } from "../../../utils/themes";
import { getHomeContent } from "../../../services/api/customerHomeService";
import { getSubcategories } from "../../../services/api/categoryService";
import { apiCache } from "../../../utils/apiCache";
import { useLocation } from "../../../hooks/useLocation";
import { calculateProductPrice } from "../../../utils/priceUtils";
import { useThemeContext } from "../../../context/ThemeContext";

interface PromoCard {
  id: string;
  badge: string;
  title: string;
  imageUrl?: string;
  categoryId?: string;
  slug?: string;
  bgColor?: string;
  subcategoryImages?: string[]; // Array of subcategory image URLs
  type?: 'subcategory' | 'product';
  productId?: string;
}

// Icon mappings for each category
const getCategoryIcons = (categoryId: string) => {
  const iconMap: Record<string, string[]> = {
    "personal-care": ["🧴", "💧", "🧼", "💄"],
    "breakfast-instant": ["🍜", "☕", "🥛", "🍞"],
    "atta-rice": ["🌾", "🍚", "🫘", "🫒"],
    household: ["🧹", "🧽", "🧼", "🧴"],
    "home-office": ["🏠", "💼", "📦", "🎁"],
    fashion: ["👕", "👗", "👠", "👜"],
    electronics: ["📱", "💻", "⌚", "🎧"],
    "fruits-veg": ["🥬", "🥕", "🍅", "🥒"],
    "dairy-breakfast": ["🥛", "🧀", "🍞", "🥚"],
    snacks: ["🍿", "🍪", "🥨", "🍫"],
    sports: ["⚽", "🏀", "🏋️", "🎾"],
  };
  return iconMap[categoryId] || ["📦", "📦", "📦", "📦"];
};

interface PromoStripProps {
  activeTab?: string;
}

export default function PromoStrip({ activeTab = "all" }: PromoStripProps) {
  const { location } = useLocation();
  const { currentTheme } = useThemeContext();
  const theme = currentTheme;
  const navigate = useNavigate();
  const [categoryCards, setCategoryCards] = useState<PromoCard[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [headingText, setHeadingText] = useState(theme.bannerText);
  const [saleTextValue, setSaleTextValue] = useState(theme.saleText);
  const [dateRange, setDateRange] = useState("");
  const [crazyDealsTitle, setCrazyDealsTitle] = useState("CRAZY DEALS");
  const [subcategoryImagesMap, setSubcategoryImagesMap] = useState<Record<string, string[]>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const snowflakesRef = useRef<HTMLDivElement>(null);
  const housefullRef = useRef<HTMLDivElement>(null);
  const saleRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const priceContainerRef = useRef<HTMLDivElement>(null);
  const productNameRef = useRef<HTMLDivElement>(null);
  const productImageRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  // Fetch subcategory images for category cards - DEFERRED for faster initial load
  const fetchSubcategoryImages = useCallback(async (cards: PromoCard[]) => {
    // Defer subcategory image fetching to not block initial render
    // Load them after a short delay to prioritize main content
    setTimeout(async () => {
      const imagesMap: Record<string, string[]> = {};

      // Fetch images in batches to avoid overwhelming the network
      const batchSize = 2;
      for (let i = 0; i < cards.length; i += batchSize) {
        const batch = cards.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (card) => {
            const categoryId = card.categoryId;
            if (!categoryId) return;

            try {
              const response = await getSubcategories(categoryId, { limit: 4 });
              if (response.success && response.data) {
                const images = response.data
                  .filter((subcat) => subcat.subcategoryImage)
                  .map((subcat) => subcat.subcategoryImage!)
                  .slice(0, 4);

                if (images.length > 0) {
                  imagesMap[card.id] = images;
                }
              }
            } catch (error) {
              // Silently fail - emoji fallback will be used
              console.error(`Error fetching subcategories for category ${categoryId}:`, error);
            }
          })
        );
        // Small delay between batches to prevent network congestion
        if (i + batchSize < cards.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      setSubcategoryImagesMap(imagesMap);
    }, 300); // 300ms delay - allows main content to render first
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // Check cache first before showing loading state
      const cacheKey = `home-content-${activeTab || 'all'}`;
      const cachedData = apiCache.getSync(cacheKey);

      // Only show loading if data is not cached
      if (!cachedData) {
        setLoading(true);
      }

      try {
        // Pass activeTab (header category slug) and location to filter categories
        // Use cache with 5 minute TTL for faster loading
        const response = await getHomeContent(
          activeTab,
          location?.latitude,
          location?.longitude,
          true,
          5 * 60 * 1000
        );

        // Reset current product index when fetching new data
        setCurrentProductIndex(0);

        let fetchedCards: PromoCard[] = [];
        let fetchedProducts: any[] = [];
        let newHeadingText = theme.bannerText;
        let newSaleTextValue = theme.saleText;
        let newDateRange = "";

        if (response.success && response.data) {
          // 1. Check for PromoStrip data from backend (highest priority)
          if (response.data.promoStrip && response.data.promoStrip.isActive) {
            const promoStrip = response.data.promoStrip;
            newHeadingText = promoStrip.heading || newHeadingText;
            newSaleTextValue = promoStrip.saleText || newSaleTextValue;
            // Set CRAZY DEALS title from PromoStrip
            if (promoStrip.crazyDealsTitle) {
              setCrazyDealsTitle(promoStrip.crazyDealsTitle);
            } else {
              setCrazyDealsTitle("CRAZY DEALS");
            }

            // Format date range
            if (promoStrip.startDate && promoStrip.endDate) {
              const start = new Date(promoStrip.startDate);
              const end = new Date(promoStrip.endDate);
              newDateRange = `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}`;
            }

            // Map category cards from PromoStrip
            if (promoStrip.categoryCards && promoStrip.categoryCards.length > 0) {
              fetchedCards = promoStrip.categoryCards
                .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                .map((card: any) => {
                  const subCategory = typeof card.subCategoryId === 'object' ? card.subCategoryId : null;
                  const categoryId = card.subCategoryId?._id || card.subCategoryId;
                  const product = typeof card.productId === 'object' ? card.productId : null;
                  const productId = card.productId?._id || card.productId;

                  return {
                    id: card._id || categoryId || productId,
                    badge: card.badge || `Save ${card.discountPercentage || 0}%`,
                    title: card.title || product?.productName || subCategory?.subcategoryName || subCategory?.name || "",
                    categoryId: categoryId,
                    productId: productId,
                    subcategoryImages: card.images || [], // Explicitly map backend images
                    slug: product ? `product/${productId}` : (subCategory?.slug || categoryId), // Use product path or category path
                    imageUrl: product?.mainImage || subCategory?.image || subCategory?.subcategoryImage,
                    bgColor: "bg-white",
                    type: product ? 'product' : 'category'
                  };
                });
            }

            // Map featured products from PromoStrip
            if (promoStrip.featuredProducts && promoStrip.featuredProducts.length > 0) {
              fetchedProducts = promoStrip.featuredProducts.map((p: any) => {
                const product = typeof p === 'object' ? p : null;
                const price = Number(product?.price) || 0;
                const mrp = Number(product?.mrp) || Number(product?.compareAtPrice) || 0;
                const originalPrice = mrp > 0 ? mrp : (price > 0 ? Math.round(price * 1.2) : 999);
                const discountedPrice = price > 0 ? price : 499;

                // Try multiple image field names and fallbacks
                const imageUrl =
                  product?.mainImage ||
                  product?.mainImageUrl ||
                  product?.image ||
                  product?.imageUrl ||
                  (product?.galleryImageUrls && product.galleryImageUrls.length > 0 ? product.galleryImageUrls[0] : null) ||
                  (product?.galleryImages && product.galleryImages.length > 0 ? product.galleryImages[0] : null) ||
                  null;

                // Always prioritize productName to avoid showing category names
                const productName = product?.productName || product?.name || "Product";

                return {
                  id: product?._id || p,
                  _id: product?._id || p,
                  name: productName,
                  productName: productName, // Always use productName, never category name
                  price: price,
                  mrp: mrp,
                  originalPrice: isNaN(originalPrice) ? 999 : originalPrice,
                  discountedPrice: isNaN(discountedPrice) ? 499 : discountedPrice,
                  imageUrl: imageUrl,
                };
              });
            }
          }
          // 2. Fallback to promoCards if no PromoStrip
          else if (response.data.promoCards && response.data.promoCards.length > 0) {
            fetchedCards = response.data.promoCards;
          }
          // 3. Fallback to categories if no promo cards
          else if (
            response.data.categories &&
            response.data.categories.length > 0
          ) {
            fetchedCards = response.data.categories
              .slice(0, 4)
              .map((c: any) => ({
                id: c._id || c.id,
                badge: "Up to 50% OFF",
                title: c.name,
                categoryId: c.slug || c._id,
                subcategoryImages: c.image ? [c.image] : [],
                bgColor: c.color || "bg-yellow-50",
              }));
          }

          // Fallback: Map bestsellers to FeaturedProducts if no PromoStrip featured products
          if (fetchedProducts.length === 0 && response.data.bestsellers && response.data.bestsellers.length > 0) {
            fetchedProducts = response.data.bestsellers.map((p: any) => {
              const price = Number(p.price) || 0;
              const mrp = Number(p.mrp) || 0;
              const originalPrice = mrp > 0 ? mrp : (price > 0 ? Math.round(price * 1.2) : 999);
              const discountedPrice = price > 0 ? price : 499;

              // Try multiple image field names and fallbacks
              const imageUrl =
                p.mainImage ||
                p.mainImageUrl ||
                p.image ||
                p.imageUrl ||
                (p.galleryImageUrls && p.galleryImageUrls.length > 0 ? p.galleryImageUrls[0] : null) ||
                (p.galleryImages && p.galleryImages.length > 0 ? p.galleryImages[0] : null) ||
                (p.productImages && p.productImages.length > 0 ? p.productImages[0] : null) ||
                null;

              // Always prioritize productName to avoid showing category names
              const productName = p.productName || p.name || "Product";

              return {
                id: p._id,
                _id: p._id,
                name: productName,
                productName: productName, // Always use productName, never category name
                price: price,
                mrp: mrp,
                originalPrice: isNaN(originalPrice) ? 999 : originalPrice,
                discountedPrice: isNaN(discountedPrice) ? 499 : discountedPrice,
                imageUrl: imageUrl,
              };
            });
          }
        }

        setCategoryCards(fetchedCards);
        setFeaturedProducts(fetchedProducts);
        setHeadingText(newHeadingText);
        setSaleTextValue(newSaleTextValue);
        setDateRange(newDateRange);
        // Reset CRAZY DEALS title if no PromoStrip data
        if (!response.data?.promoStrip || !response.data.promoStrip.isActive) {
          setCrazyDealsTitle("CRAZY DEALS");
        }
        setHasData(fetchedCards.length > 0 || fetchedProducts.length > 0);

        // Fetch subcategory images AFTER setting hasData to true
        // This allows the main content to render immediately
        if (fetchedCards.length > 0) {
          fetchSubcategoryImages(fetchedCards);
        }
      } catch (error) {
        console.error("Error fetching home content for PromoStrip:", error);
        setCategoryCards([]);
        setFeaturedProducts([]);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // REMOVED: Polling every 30 seconds causes unnecessary re-renders and API calls
    // If real-time updates are needed, consider using WebSockets or Server-Sent Events
    // For now, data will only refresh when activeTab changes

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, theme.bannerText, theme.saleText]);

  // Reset product index when activeTab changes or featuredProducts change
  useEffect(() => {
    setCurrentProductIndex(0);
  }, [activeTab, featuredProducts.length]);

  useLayoutEffect(() => {
    if (!hasData) return;
    const container = containerRef.current;
    if (!container) return;

    let ctx: gsap.Context | null = null;

    // Defer card animation to prioritize content rendering
    const timeoutId = setTimeout(() => {
      ctx = gsap.context(() => {
        const cards = container.querySelectorAll(".promo-card");
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.4, // Reduced duration
              stagger: 0.05, // Reduced stagger
              ease: "power2.out", // Simpler easing
            }
          );
        }
      }, container);
    }, 100); // Start animation 100ms after render

    return () => {
      clearTimeout(timeoutId);
      if (ctx) {
        ctx.revert();
      }
    };
  }, [hasData]);

  // Snowflake animation - DEFERRED for faster initial load
  useLayoutEffect(() => {
    if (!hasData) return;
    const snowflakesContainer = snowflakesRef.current;
    if (!snowflakesContainer) return;

    // Defer animation start to prioritize content rendering
    const timeoutId = setTimeout(() => {
      const snowflakes = snowflakesContainer.querySelectorAll(".snowflake");

      snowflakes.forEach((snowflake, index) => {
        const delay = index * 0.3;
        const duration = 3 + Math.random() * 2; // 3-5 seconds
        const xOffset = (Math.random() - 0.5) * 40; // Random horizontal drift

        gsap.set(snowflake, {
          y: -20,
          x: xOffset,
          opacity: 0.8 + Math.random() * 0.2, // 0.8-1.0 opacity for better visibility
          scale: 0.6 + Math.random() * 0.4, // 0.6-1.0 scale for better visibility
        });

        gsap.to(snowflake, {
          y: "+=200",
          x: `+=${xOffset}`,
          duration: duration,
          delay: delay,
          ease: "none",
          repeat: -1,
        });
      });
    }, 200); // Start animation 200ms after render

    return () => {
      clearTimeout(timeoutId);
      const snowflakes = snowflakesContainer.querySelectorAll(".snowflake");
      snowflakes.forEach((snowflake) => {
        gsap.killTweensOf(snowflake);
      });
    };
  }, [hasData]);

  // HOUSEFULL SALE animation - SIMPLIFIED and DEFERRED for faster load
  useLayoutEffect(() => {
    if (!hasData) return;
    const housefullContainer = housefullRef.current;
    const saleText = saleRef.current;
    const dateText = dateRef.current;
    if (!housefullContainer) return;

    // Defer animation start to prioritize content rendering
    const timeoutId = setTimeout(() => {
      const letters = housefullContainer.querySelectorAll(".housefull-letter");

      // Simplified animation - single entrance animation instead of loop
      gsap.set([housefullContainer, saleText, dateText], {
        scale: 0.8,
        opacity: 0,
      });

      gsap.to([housefullContainer, saleText, dateText], {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(1.7)",
      });

      // Simplified letter animation - only run once
      gsap.to(letters, {
        y: -10,
        duration: 0.15,
        stagger: 0.04,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
      });
    }, 150); // Start animation 150ms after render

    return () => {
      clearTimeout(timeoutId);
      const letters = housefullContainer.querySelectorAll(".housefull-letter");
      gsap.killTweensOf([housefullContainer, saleText, dateText, letters]);
    };
  }, [hasData]);

  // Product rotation animation
  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  // Reset product index when featuredProducts change
  useEffect(() => {
    if (featuredProducts.length > 0 && currentProductIndex >= featuredProducts.length) {
      setCurrentProductIndex(0);
    }
  }, [featuredProducts.length, currentProductIndex]);

  // Animate product change
  useEffect(() => {
    const elements = [
      priceContainerRef.current,
      productNameRef.current,
      productImageRef.current,
    ];
    if (elements.some((el) => !el)) return;

    const tween = gsap.to(elements, {
      opacity: 0,
      x: -30,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        const currentElements = [
          priceContainerRef.current,
          productNameRef.current,
          productImageRef.current,
        ];
        if (currentElements.some((el) => !el)) return;

        gsap.set(currentElements, {
          x: 30,
          opacity: 0,
        });

        gsap.to(currentElements, {
          opacity: 1,
          x: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      },
    });

    return () => {
      tween.kill();
    };
  }, [currentProductIndex]);

  const currentProduct = featuredProducts.length > 0 ? featuredProducts[currentProductIndex] : null;

  // Show minimal loading state - render faster
  if (loading) {
    return (
      <div
        className="relative"
        style={{
          background: `linear-gradient(to bottom, ${theme.primary[0]}, ${theme.primary[1]}, ${theme.primary[2]}, ${theme.primary[3]}, ${theme.primary[3]})`,
          paddingTop: "12px",
          paddingBottom: "0px",
          marginTop: 0,
          minHeight: "200px"
        }}>
        <div className="h-[200px] w-full bg-transparent animate-pulse rounded-lg mx-0 mt-4" />
      </div>
    );
  }

  // Show "No active promotions" only if there are no cards AND no products
  if (!hasData || (categoryCards.length === 0 && featuredProducts.length === 0)) {
    return (
      <div className="text-center py-6 text-neutral-400 text-sm">
        No active promotions
      </div>
    );
  }

  // If no featured products but we have category cards, use a fallback product
  const displayProduct = currentProduct || {
    id: 'fallback',
    name: 'Special Offers',
    originalPrice: 999,
    discountedPrice: 499,
    imageUrl: undefined,
  };

  // Calculate prices from actual product data using utility
  const { displayPrice, mrp } = calculateProductPrice(displayProduct);

  // Fallback prices if product data is incomplete
  const finalDiscountedPrice = displayPrice > 0 ? displayPrice : (Number.isFinite(displayProduct.discountedPrice) ? displayProduct.discountedPrice : 499);
  const finalOriginalPrice = mrp > 0 ? mrp : (Number.isFinite(displayProduct.originalPrice) ? displayProduct.originalPrice : 999);

  // Ensure prices are valid numbers
  const safeOriginalPrice = Number.isFinite(finalOriginalPrice) ? Math.round(finalOriginalPrice) : 999;
  const safeDiscountedPrice = Number.isFinite(finalDiscountedPrice) ? Math.round(finalDiscountedPrice) : 499;

  // Helper function to handle product navigation
  const handleProductClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Get product ID - handle both string and ObjectId formats
    const productId = displayProduct?.id || displayProduct?._id;

    if (productId && productId !== 'fallback') {
      // Convert to string if it's an object
      const idString = typeof productId === 'string' ? productId : String(productId);
      if (idString && idString !== 'fallback' && idString.length > 0) {
        navigate(`/product/${idString}`);
      }
    }
  };

  return (
    <div
      className="relative overflow-hidden bg-[#893826]"
      style={{
        paddingTop: "12px",
        paddingBottom: "16px",
        marginTop: 0,
        marginBottom: 0
      }}>
      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
      
      {/* Ultra-Slim Header Ribbon */}
      <div className="px-4 mb-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
          <h1 className="text-white font-black text-xs tracking-wider uppercase font-poppins">
            {headingText}
          </h1>
          <div className="h-3 w-[1px] bg-white/20"></div>
          <span className="text-[10px] font-bold text-white/50 uppercase">
            {saleTextValue}
          </span>
        </div>
        
        {dateRange && (
          <div className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
            <span className="text-white/60 text-[8px] font-black uppercase tracking-widest">{dateRange.split('-')[1] || dateRange}</span>
          </div>
        )}
      </div>

      {/* Horizontal Scrolling Deals Ribbon */}
      <div className="relative z-10">
        <div 
          ref={containerRef}
          className="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide no-scrollbar"
        >
          {/* Featured "Deal of Day" Card */}
          <div className="flex-shrink-0 w-[140px] promo-card">
            <div
              onClick={handleProductClick}
              className="h-[140px] bg-white rounded-[1.5rem] p-3 flex flex-col justify-between relative overflow-hidden shadow-lg active:scale-[0.98] transition-all cursor-pointer border border-white/5"
            >
              <div className="flex flex-col">
                <div className="bg-[#4A7C59] text-white text-[7px] font-black px-1.5 py-0.5 rounded-full inline-block uppercase tracking-tighter mb-1.5 self-start ring-2 ring-[#4A7C59]/10">
                   {crazyDealsTitle}
                </div>
                <div className="text-village-umber font-black text-[10px] leading-tight line-clamp-2 uppercase tracking-tighter">
                  {displayProduct.productName || displayProduct.name}
                </div>
              </div>

              <div
                ref={productImageRef}
                className="flex items-center justify-center -my-1 mx-auto"
                style={{ height: "55px", width: "100%" }}>
                  <div className="absolute w-12 h-12 bg-[#8B3D28]/5 rounded-full blur-xl"></div>
                  {displayProduct.imageUrl ? (
                    <img
                      src={displayProduct.imageUrl}
                      alt=""
                      className="max-w-full max-h-full object-contain drop-shadow-lg relative z-10"
                    />
                  ) : (
                    <span className="text-2xl relative z-10">📦</span>
                  )}
              </div>

              <div className="w-full bg-[#8B3D28] rounded-xl py-1 px-2 flex items-center justify-center gap-1.5 shadow-md">
                <span className="text-white/40 text-[7px] font-black line-through">₹{safeOriginalPrice}</span>
                <span className="text-white text-[10px] font-black">₹{safeDiscountedPrice}</span>
              </div>
            </div>
          </div>

          {/* Regular Promotion Cards */}
          {categoryCards.map((card, index) => {
            const subcategoryImages = subcategoryImagesMap[card.id] || card.subcategoryImages || [];
            const hasSubcategoryImages = subcategoryImages.length > 0;
            const categoryIcons = getCategoryIcons(card.categoryId || "");

            return (
              <div key={`${card.id || 'promo'}-${index}`} className="flex-shrink-0 w-[125px] promo-card">
                <Link
                  to={card.type === 'product' ? `/product/${card.productId}` : (card.slug || card.categoryId ? `/category/${card.slug || card.categoryId}` : "#")}
                  className="h-[140px] bg-white rounded-[1.5rem] p-3 flex flex-col overflow-hidden relative shadow-md no-underline group active:scale-[0.98] transition-all"
                >
                  <div className="bg-[#4A7C59] text-white text-[7px] font-black px-1.5 py-0.5 rounded-full inline-block uppercase tracking-tighter mb-2 self-start ring-2 ring-[#4A7C59]/10">
                    {card.badge}
                  </div>

                  <div className="text-village-umber font-black text-[9px] leading-tight line-clamp-2 uppercase italic tracking-tighter mb-1">
                    {card.title}
                  </div>

                  <div className="mt-auto flex items-center justify-center w-full relative h-[55px]">
                    <div className="absolute inset-x-0 bottom-0 h-[35px] bg-[#8B3D28]/5 rounded-xl"></div>
                    <div className="flex -space-x-2 relative z-10">
                      {hasSubcategoryImages
                        ? subcategoryImages.slice(0, 3).map((imageUrl, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 bg-white rounded-full overflow-hidden border-2 border-white shadow-sm"
                            style={{ zIndex: 3 - idx }}>
                             <img
                              src={imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML =`<div class="w-full h-full flex items-center justify-center text-[10px] font-bold bg-neutral-50">${categoryIcons[idx] || "📦"}</div>`;
                                }
                              }}
                            />
                          </div>
                        ))
                        : categoryIcons.slice(0, 2).map((icon, idx) => (
                          <div key={idx} className="w-8 h-8 bg-neutral-50 rounded-full border-2 border-white flex items-center justify-center text-[10px]">
                            {icon}
                          </div>
                        ))}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
