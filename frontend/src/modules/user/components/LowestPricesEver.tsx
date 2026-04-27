import { useRef, useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts } from '../../../services/api/customerProductService';

import { calculateProductPrice } from '../../../utils/priceUtils';
import { useThemeContext } from '../../../context/ThemeContext';
import { useCart } from '../../../context/CartContext';
import { Product } from '../../../types/domain';
import { useWishlist } from '../../../hooks/useWishlist';
import VariationSelectionModal from './VariationSelectionModal';

interface LowestPricesEverProps {
  activeTab?: string;
  products?: Product[]; // Admin-selected products from home data
}

// Helper function to truncate text to a maximum length
const truncateText = (text: string, maxLength: number = 60): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Product Card Component - Defined outside to prevent recreation on every render
const ProductCard = memo(({
  product,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity
}: {
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product, element?: HTMLElement | null) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}) => {
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useWishlist(product.id);
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Get Price and MRP using utility
  const { displayPrice, mrp, discount, hasDiscount } = calculateProductPrice(product);

  // Use cartQuantity from props
  const inCartQty = cartQuantity;

  // Get product name, clean it (remove description suffixes), and truncate if needed
  let productName = product.name || product.productName || '';
  // Remove common description patterns like " - Fresh & Quality Assured", " - Premium Quality", etc.
  productName = productName.replace(/\s*-\s*(Fresh|Quality|Assured|Premium|Best|Top|Hygienic|Carefully|Selected).*$/i, '').trim();
  const displayName = truncateText(productName, 40);

  return (
    <div
      className="flex-shrink-0 w-[140px] md:w-[155px]"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div
        className="village-card white-paper-texture organic-radius overflow-hidden flex flex-col relative h-full bg-white shadow-[0_8px_16px_rgba(0,0,0,0.06)] border border-neutral-100/50 transition-all md:hover:-translate-y-2 md:hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] duration-300"
        onClick={() => navigate(`/user/product/${product.id}`)}
      >
        {/* Image Section */}
        <div className="relative w-full aspect-square bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center p-2">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-50 text-neutral-300 text-3xl font-black">
              {(product.name || product.productName || '?').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-0 z-10 bg-[#4b7d5a] text-white text-[8px] md:text-[12px] font-black px-2 py-0.5 md:px-4 md:py-1.5 rounded-r-full shadow-md uppercase tracking-tighter">
              {discount}% OFF
            </div>
          )}



          {/* Wishlist Button */}
          <div className="absolute bottom-2 right-2 z-20">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(e);
              }}
              className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center border border-neutral-50 active:scale-90 transition-transform"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill={isWishlisted ? "#ef4444" : "none"}
                className={isWishlisted ? "text-red-500" : "text-neutral-400"}
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 flex flex-col flex-1">
          <div className="flex flex-col gap-0.5 mb-2">
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-[10px] font-black text-village-umber uppercase tracking-tight line-clamp-1 flex-1">
                {displayName}
              </h3>
              {/* Rating Display */}
              <div className="flex items-center gap-0.5 bg-amber-50 px-1 rounded flex-shrink-0">
                <span className="text-[8px] font-black text-amber-700">{(product.rating || 4.5).toFixed(1)}</span>
                <svg width="7" height="7" viewBox="0 0 24 24" fill="#F59E0B">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>
            <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wider italic">
              Pack: {(() => {
                  let packValue = (product.pack || '').trim();
                  
                  // Format numeric-only pack values (e.g., 500 becomes 500g)
                  if (packValue && /^\d+$/.test(packValue)) {
                    const num = parseInt(packValue);
                    if (num >= 500 && num < 1000) return `${num}g`;
                    if (num >= 1000) return `${num/1000}kg`;
                    return `${num}g`;
                  }
                  
                  return packValue || 'Standard';
                })()}
            </span>
          </div>

          <div className="mt-auto flex flex-col pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-village-umber">{"\u20B9"}{displayPrice}</span>
              {hasDiscount && (
                <span className="text-[8px] text-neutral-400 line-through font-bold">{"\u20B9"}{mrp}</span>
              )}
            </div>

            <div className="mt-2">
              {inCartQty === 0 ? (
                <button
                  ref={addButtonRef}
                  disabled={product.isAvailable === false}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (product.variations && product.variations.length > 1) {
                      setIsVariationModalOpen(true);
                    } else {
                      onAddToCart(product, e.currentTarget);
                    }
                  }}
                  className={`w-full h-8 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${product.isAvailable === false
                    ? 'bg-neutral-100 text-neutral-400'
                    : 'bg-[#4b7d5a] text-white md:bg-white md:border-[1.5px] md:border-[#4b7d5a] md:text-[#4b7d5a] md:shadow-none md:hover:bg-[#4b7d5a] md:hover:text-white'
                    }`}
                >
                  {product.isAvailable === false ? 'Out' : 'Add'}
                </button>
              ) : (
                <div className="flex items-center justify-between bg-[#4b7d5a]/5 rounded-xl border border-[#4b7d5a]/10 h-8 px-1 shadow-inner">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(product.id, inCartQty - 1);
                    }}
                    className="w-6 h-6 rounded-lg bg-white text-[#4b7d5a] shadow-sm flex items-center justify-center font-bold"
                  >−</button>
                  <span className="text-[11px] font-black text-[#4b7d5a] w-8 text-center">{inCartQty}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(product.id, inCartQty + 1);
                    }}
                    className="w-6 h-6 rounded-lg bg-[#4b7d5a] text-white shadow-md flex items-center justify-center font-bold"
                  >+</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <VariationSelectionModal
        product={product}
        open={isVariationModalOpen}
        onOpenChange={setIsVariationModalOpen}
        sourceElement={addButtonRef.current}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if the product ID or cart quantity changes
  // Functions are stable references, so we don't need to compare them
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.cartQuantity === nextProps.cartQuantity
  );
});

ProductCard.displayName = 'ProductCard';

export default function LowestPricesEver({ activeTab = 'all', products: adminProducts }: LowestPricesEverProps) {
  const { currentTheme } = useThemeContext();
  const theme = currentTheme;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { cart } = useCart();
  const [fontLoaded, setFontLoaded] = useState(false);

  // Preload and wait for font to load to prevent FOUT
  useEffect(() => {
    if (document.fonts && document.fonts.check) {
      // Check if font is already loaded
      if (document.fonts.check('1em "Poppins"')) {
        setFontLoaded(true);
        return;
      }

      // Wait for font to load
      const checkFont = async () => {
        try {
          await document.fonts.load('1em "Poppins"');
          setFontLoaded(true);
        } catch (e) {
          // Fallback: show after timeout
          setTimeout(() => setFontLoaded(true), 300);
        }
      };

      checkFont();
    } else {
      // Fallback for browsers without Font Loading API
      setTimeout(() => setFontLoaded(true), 300);
    }
  }, []);

  // Memoize cart items lookup for performance
  const cartItemsMap = useMemo(() => {
    const map = new Map();
    cart.items.forEach(item => {
      if (item?.product) {
        map.set(item.product.id, item.quantity);
      }
    });
    return map;
  }, [cart.items]);

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Use admin-selected products if provided
    if (adminProducts && adminProducts.length > 0) {
      const mappedProducts = adminProducts.map((p: any) => {
        // Get product name and remove any description-like suffixes
        let productName = p.productName || p.name || '';
        // Remove common description patterns like " - Fresh & Quality Assured"
        productName = productName.replace(/\s*-\s*(Fresh|Quality|Assured|Premium|Best|Top|Hygienic|Carefully|Selected).*$/i, '').trim();

        // Get pack without description
        let packValue = (() => {
          const v = p.variations?.[0];
          if (!v) return (p.pack || p.smallDescription || '').trim();
          const vName = (v.name || '').trim();
          const isPlaceholder = !vName || vName.toLowerCase() === 'variation' || vName.toLowerCase() === 'standard';
          return (isPlaceholder ? (v.value || v.title || vName) : vName).trim() || (p.pack || p.smallDescription || '').trim();
        })();
        // Remove description from pack if it contains it
        if (packValue && packValue.includes(' - ')) {
          packValue = packValue.split(' - ')[0].trim();
        }

        return {
          ...p,
          id: p._id || p.id || p.id,
          name: productName,
          imageUrl: p.mainImage || p.imageUrl || p.mainImage,
          mrp: p.mrp || p.price,
          pack: packValue
        };
      });
      setProducts(mappedProducts);
    } else {
      setProducts([]);
    }
  }, [adminProducts]);

  // Get products for this section
  // If using admin-selected products, use them directly (already filtered and ordered)
  // Otherwise, filter by activeTab and discount
  const getFilteredProducts = () => {
    // We strictly trust the backend (adminProducts) to provide the correct 
    // filtered list of products for the currently active tab. 
    // Note: The backend already handles the fallback to HOME items if nothing is explicitly set.
    if (adminProducts && adminProducts.length > 0) {
      return products.slice(0, 20);
    }

    // Fallback if network fails completely or no products are configured anywhere
    return [];
  };

  const discountedProducts = getFilteredProducts();

  // Get cart functions once at parent level
  const { addToCart, updateQuantity } = useCart();

  // Memoize callbacks to prevent ProductCard re-renders
  const handleAddToCart = useCallback((product: Product, element?: HTMLElement | null) => {
    addToCart(product, element);
  }, [addToCart]);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  }, [updateQuantity]);

  if (!discountedProducts || discountedProducts.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden bg-[#FFF9F5] md:bg-[#FFF9F5] md:mt-8 md:w-screen md:relative md:left-1/2 md:-translate-x-1/2 md:mx-0 md:rounded-none md:shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
      style={{
        paddingTop: '32px',
        paddingBottom: '24px',
      }}
    >
      {/* Paper Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>

      {/* Decorative Wavy Border at Top */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-white/40 md:hidden">
        <svg viewBox="0 0 1200 24" preserveAspectRatio="none" className="w-full h-full fill-white">
          <path d="M0,0 C150,24 400,24 600,0 C800,24 1050,24 1200,0 L1200,24 L0,24 Z" />
        </svg>
      </div>

      {/* Premium Banner Section */}
      <div className="px-4 relative z-10 flex flex-col items-center mb-6 max-w-[1550px] mx-auto">
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="h-[1px] w-8 bg-[#8B3D28]/20"></div>
          <span className="text-[10px] md:text-xs font-black text-[#4b7d5a] tracking-[0.2em] uppercase">Special Curated Deal</span>
          <div className="h-[1px] w-8 bg-[#8B3D28]/20"></div>
        </div>

        <h2
          className="text-center italic"
          style={{
            fontFamily: '"Outfit", sans-serif',
            fontSize: window.innerWidth >= 1024 ? '48px' : '32px',
            color: '#8B3D28',
            fontStyle: 'italic',
            fontWeight: 900,
            lineHeight: '1',
            letterSpacing: '-0.02em'
          }}
        >
          LOWEST PRICES EVER
        </h2>

        <div className="mt-2 h-1 w-12 bg-[#8B3D28] rounded-full opacity-20"></div>
      </div>

      {/* Horizontal Scroll Carousel */}
      <div className="relative group/carousel max-w-[1550px] mx-auto">
        {/* Left Arrow - Desktop Only */}
        <button
          onClick={() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
            }
          }}
          className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm border border-neutral-100 shadow-xl items-center justify-center text-[#8B3D28] hover:bg-[#8B3D28] hover:text-white transition-all z-30 opacity-0 group-hover/carousel:opacity-100 active:scale-90"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3 md:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide px-4 md:px-16 lg:px-24 pb-8 md:pb-12 no-scrollbar"
          style={{ scrollSnapType: 'x proximity' }}
        >
          {discountedProducts.map((product) => {
            const cartQuantity = cartItemsMap.get(product.id) || 0;
            return (
              <ProductCard
                key={product.id}
                product={product}
                cartQuantity={cartQuantity}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
              />
            );
          })}
        </div>

        {/* Right Arrow - Desktop Only */}
        <button
          onClick={() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
            }
          }}
          className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/95 backdrop-blur-sm border border-neutral-100 shadow-xl items-center justify-center text-[#8B3D28] hover:bg-[#8B3D28] hover:text-white transition-all z-30 opacity-0 group-hover/carousel:opacity-100 active:scale-90"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Bottom fade shadow for depth */}
      <div className="h-4 bg-gradient-to-b from-[#FFF9F5] to-transparent pointer-events-none"></div>
    </div>
  );
}

