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
  const displayName = truncateText(productName, 60);

  return (
    <div
      className="flex-shrink-0 w-[125px] md:w-[140px]"
      style={{ scrollSnapAlign: 'start' }}
    >
      <div
        onClick={() => navigate(`/product/${product.id}`)}
        className="village-card paper-texture organic-radius border-none overflow-hidden flex flex-col relative h-full max-h-full cursor-pointer transition-transform active:scale-[0.98]"
      >
        <div className="relative block">
          <div className="w-full h-24 md:h-28 bg-white flex items-center justify-center overflow-hidden relative rounded-t-[20px] border-b border-neutral-100">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-4xl">
                {(product.name || product.productName || '?').charAt(0).toUpperCase()}
              </div>
            )}

            {discount > 0 && (
              <div className="absolute top-1 left-1 z-10 bg-village-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md transform -rotate-12">
                {discount}% OFF
              </div>
            )}

            {/* Rating Badge on Image */}
            <div className="absolute bottom-1 right-1">
              <div className="premium-pill px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <span className="text-[10px] font-bold text-neutral-800">{(product.rating || 4.5).toFixed(1)}</span>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#F59E0B" className="flex-shrink-0">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                </svg>
              </div>
            </div>

            {/* Heart Icon - Top Right */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(e);
              }}
              className="absolute top-1 right-1 z-30 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={isWishlisted ? "#ef4444" : "none"}
                className={isWishlisted ? "text-red-500" : "text-neutral-400"}
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

          </div>
        </div>

        {/* Product Details */}
        <div className="p-2 flex-1 flex flex-col items-start gap-1">
          <h3 className="text-[11px] font-bold text-village-umber line-clamp-2 leading-tight min-h-[1.5rem] max-h-[1.5rem] overflow-hidden">
            {displayName}
          </h3>
          <div className="text-[9px] font-medium text-neutral-500">
            Rs {displayPrice}/{product.pack || 'Unit'}
          </div>
          <div className="mt-0.5 flex flex-col">
            <span className="text-sm font-black text-village-umber">Rs {displayPrice}</span>
            {hasDiscount && (
              <span className="text-[9px] text-neutral-400 line-through">₹{mrp}</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="px-1.5 pb-2">
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
              className={`w-full h-8 organic-radius text-[10px] font-bold shadow-md transition-all active:scale-95 ${product.isAvailable === false
                ? 'bg-neutral-200 text-neutral-400'
                : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
            >
              {product.isAvailable === false ? 'Out' : 'Add'}
            </button>
          ) : (
            <div className="flex items-center justify-between bg-orange-50 px-0.5 py-0.5 rounded-full border border-orange-200 h-7 md:h-8 shadow-inner">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(product.id, inCartQty - 1);
                }}
                className="w-6 h-6 rounded-full bg-white text-orange-600 flex items-center justify-center p-0"
              >−</button>
              <span className="text-[11px] font-bold text-orange-600">{inCartQty}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQuantity(product.id, inCartQty + 1);
                }}
                className="w-6 h-6 rounded-full bg-white text-orange-600 flex items-center justify-center p-0"
              >+</button>
            </div>
          )}
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
      className="relative"
      style={{
        background: `linear-gradient(to bottom, ${theme.primary[3]}, ${theme.primary[3]}, ${theme.secondary[1]}, ${theme.secondary[2]})`,
        marginTop: '0px', // No gap for seamless blend
        paddingTop: '12px',
        paddingBottom: '16px',
      }}
    >
      {/* White Zip/Scalloped Divider at Top - Upward-pointing semicircles */}
      <div className="absolute top-0 left-0 right-0" style={{ height: '30px', zIndex: 10, opacity: 0.95 }}>
        <svg
          viewBox="0 0 1200 30"
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{ display: 'block' }}
        >
          {/* White scalloped pattern with upward semicircles - clearly visible */}
          <path
            d="M0,30 L0,15
               Q25,0 50,15
               T100,15
               T150,15
               T200,15
               T250,15
               T300,15
               T350,15
               T400,15
               T450,15
               T500,15
               T550,15
               T600,15
               T650,15
               T700,15
               T750,15
               T800,15
               T850,15
               T900,15
               T950,15
               T1000,15
               T1050,15
               T1100,15
               T1150,15
               L1200,15
               L1200,30 Z"
            fill="white"
            stroke="white"
            strokeWidth="0"
          />
        </svg>
      </div>

      {/* LOWEST PRICES EVER Banner */}
      <div className="px-4 relative z-10" style={{ marginTop: '30px', marginBottom: '12px' }} data-section="lowest-prices">
        <div className="flex items-center justify-center gap-2 mb-1">
          {/* Left horizontal line */}
          <div className="flex-1 h-px bg-neutral-300"></div>

          <h2
            className="font-black text-center whitespace-nowrap"
            style={{
              fontFamily: '"Poppins", sans-serif',
              fontSize: '28px',
              color: '#8B3D28',
              opacity: fontLoaded ? 1 : 0,
              transition: 'opacity 0.2s ease-in',
              textShadow:
                '-1.5px -1.5px 0 white, 1.5px -1.5px 0 white, -1.5px 1.5px 0 white, 1.5px 1.5px 0 white, ' +
                '-1.5px 0px 0 white, 1.5px 0px 0 white, 0px -1.5px 0 white, 0px 1.5px 0 white, ' +
                '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white, ' +
                '3px 3px 4px rgba(0, 0, 0, 0.5), ' +
                '2px 2px 3px rgba(0, 0, 0, 0.6), ' +
                '1px 1px 2px rgba(0, 0, 0, 0.7), ' +
                '0px 2px 1px rgba(0, 0, 0, 0.4)',
              letterSpacing: '0.8px',
              fontWeight: 900,
              lineHeight: '1.1',
              transform: 'perspective(500px) rotateX(2deg) rotateY(-1deg)',
              transformStyle: 'preserve-3d',
            } as React.CSSProperties}
          >
            LOWEST PRICES EVER
          </h2>

          {/* Right horizontal line */}
          <div className="flex-1 h-px bg-neutral-300"></div>
        </div>
      </div>

      {/* Horizontal Scrollable Product Cards */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-2 overflow-x-auto scrollbar-hide px-4 py-2"
        style={{ scrollSnapType: 'x mandatory' }}
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
    </div>
  );
}

