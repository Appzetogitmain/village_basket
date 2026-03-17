import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { Product } from '../../../types/domain';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from '../../../hooks/useLocation';
import { useToast } from '../../../context/ToastContext'; // Import useToast
import { addToWishlist, removeFromWishlist, getWishlist } from '../../../services/api/customerWishlistService';
import Button from '../../../components/ui/button';
import Badge from '../../../components/ui/badge';
import StarRating from '../../../components/ui/StarRating';
import { calculateProductPrice } from '../../../utils/priceUtils';
import { getVariationColor } from '../../../utils/variationUtils';
import VariationSelectionModal from './VariationSelectionModal';

interface ProductCardProps {
  product: Product;
  showBadge?: boolean;
  badgeText?: string;
  showPackBadge?: boolean;
  showStockInfo?: boolean;
  showHeartIcon?: boolean;
  showRating?: boolean;
  showVegetarianIcon?: boolean;
  showOptionsText?: boolean;
  optionsCount?: number;
  compact?: boolean;
  categoryStyle?: boolean;
  overrideQuantity?: number;
  onAdd?: (product: Product) => void;
  onDecrease?: (product: Product) => void;
  onIncrease?: (product: Product) => void;
  className?: string;
}


export default function ProductCard({
  product,
  showBadge = false,
  badgeText,
  showPackBadge = false,
  showStockInfo = false,
  showHeartIcon = false,
  showRating = false,
  showVegetarianIcon = false,
  showOptionsText = false,
  optionsCount = 2,
  compact = false,
  categoryStyle = false,
  overrideQuantity,
  onAdd,
  onDecrease,
  onIncrease,
  className = '',
}: ProductCardProps) {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { location } = useLocation();
  const { showToast } = useToast(); // Get toast function
  const imageRef = useRef<HTMLImageElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  // Single ref to track any cart operation in progress for this product
  const isOperationPendingRef = useRef(false);

  useEffect(() => {
    // Only check wishlist if user is authenticated
    if (!isAuthenticated) {
      setIsWishlisted(false);
      return;
    }

    const checkWishlist = async () => {
      try {
        const res = await getWishlist({
          latitude: location?.latitude,
          longitude: location?.longitude
        });
        if (res.success && res.data && res.data.products) {
          const targetId = String((product as any).id || product._id);
          const exists = res.data.products.some(p => String(p._id || (p as any).id) === targetId);
          setIsWishlisted(exists);
        }
      } catch (e) {
        // Silently fail if not logged in
        setIsWishlisted(false);
      }
    };
    checkWishlist();
  }, [product.id, product._id, isAuthenticated, location?.latitude, location?.longitude]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const targetId = String((product as any).id || product._id);
    const previousState = isWishlisted;

    try {
      if (isWishlisted) {
        // Optimistic update
        setIsWishlisted(false);
        await removeFromWishlist(targetId);
        showToast('Removed from wishlist');
      } else {
        if (!location?.latitude || !location?.longitude) {
          showToast('Location is required to add items to wishlist', 'error');
          return;
        }
        // Optimistic update
        setIsWishlisted(true);
        await addToWishlist(
          targetId,
          location?.latitude,
          location?.longitude
        );
        showToast('Added to wishlist');
      }
    } catch (e: any) {
      console.error('Failed to toggle wishlist:', e);
      setIsWishlisted(previousState);
      const errorMessage = e.response?.data?.message || e.message || 'Failed to update wishlist';
      showToast(errorMessage, 'error');
    }
  };

  // Get quantity in cart - properly matching the default variation for this card
  const cartItem = cart.items.find((item) => {
    if (!item?.product) return false;
    const itemProductId = item.product.id || item.product._id;
    const productId = (product as any).id || product._id;
    if (itemProductId !== productId) return false;

    // If product has variations, the card defaults to the first one
    if (product.variations && product.variations.length > 0) {
      const defaultVariant = product.variations[0];
      const defaultVariantId = defaultVariant?._id || (defaultVariant as any).id || (defaultVariant as any).name || "Standard";
      const itemVariant = (item.product as any).variantId || (item.product as any).selectedVariant?._id || (item.product as any).variantTitle || (item.product as any).pack;
      return itemVariant === defaultVariantId;
    }
    return true;
  });
  const inCartQty = cartItem?.quantity || 0;

  // Get Price and MRP using utility
  const { displayPrice, mrp, discount } = calculateProductPrice(product);

  const handleCardClick = () => {
    navigate(`/product/${((product as any).id || product._id) as string}`);
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Check if product is available in user's location
    if (product.isAvailable === false) {
      return;
    }

    // Prevent any operation while another is in progress
    if (isOperationPendingRef.current) {
      return;
    }

    isOperationPendingRef.current = true;

    try {
      if (product.variations && product.variations.length > 1) {
        setIsVariationModalOpen(true);
        return;
      }
      await addToCart(product, addButtonRef.current);
    } finally {
      // Reset the flag after the operation truly completes
      isOperationPendingRef.current = false;
    }
  };

  const handleDecrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Prevent any operation while another is in progress
    if (isOperationPendingRef.current || inCartQty <= 0) {
      return;
    }

    isOperationPendingRef.current = true;

    try {
      await updateQuantity(((product as any).id || product._id) as string, inCartQty - 1);
    } finally {
      // Reset the flag after the operation truly completes
      isOperationPendingRef.current = false;
    }
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Check if product is available in user's location
    if (product.isAvailable === false) {
      return;
    }

    // Prevent any operation while another is in progress
    if (isOperationPendingRef.current) {
      return;
    }

    isOperationPendingRef.current = true;

    try {
      if (product.variations && product.variations.length > 1) {
        setIsVariationModalOpen(true);
        return;
      }

      if (onIncrease) {
        onIncrease(product);
        return;
      }
      if (inCartQty > 0) {
        await updateQuantity(((product as any).id || product._id) as string, inCartQty + 1);
      } else {
        await addToCart(product, addButtonRef.current);
      }
    } finally {
      // Reset the flag after the operation truly completes
      isOperationPendingRef.current = false;
    }
  };

  const currentQty = overrideQuantity !== undefined ? overrideQuantity : inCartQty;

  const handleCustomAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // If there is more than 1 variation, we must show the modal first
    if (product.variations && product.variations.length > 1) {
      setIsVariationModalOpen(true);
      return;
    }

    if (onAdd) {
      onAdd(product);
    } else {
      handleAdd(e);
    }
  };

  const handleCustomDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDecrease) {
      onDecrease(product);
    } else {
      handleDecrease(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={`village-card paper-texture organic-radius overflow-hidden flex flex-col h-full relative ${className}`}
    >
      <div 
        onClick={handleCardClick}
        className="cursor-pointer relative z-10"
      >
        <div className={`organic-image-container w-full ${compact ? 'h-24 md:h-32' : 'h-32 md:h-44'} flex items-center justify-center overflow-hidden relative border-b border-neutral-100 bg-white rounded-t-[20px]`}>
          {product.imageUrl || product.mainImage ? (
            <img
              ref={imageRef}
              src={product.imageUrl || product.mainImage}
              alt={product.name || product.productName || 'Product'}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.fallback-icon')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-2xl fallback-icon';
                  fallback.textContent = (product.name || product.productName || '?').charAt(0).toUpperCase();
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 text-4xl">
              {(product.name || product.productName || '?').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Discount Badge - Top Left */}
          {discount > 0 && (
            <div className="absolute top-1.5 left-1.5 z-20 bg-[#E53935] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg transform -rotate-3 border border-white/20">
              {discount}% OFF
            </div>
          )}

          {/* Heart Button - Top Right */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(e);
            }}
            className="absolute top-1.5 right-1.5 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-sm border border-neutral-100"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={isWishlisted ? "#E53935" : "none"}
              className={isWishlisted ? "text-red-500" : "text-neutral-400"}
              xmlns="http://www.w3.org/2000/svg"
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

          {/* Rating Badge on Image - Bottom Right */}
          <div className="absolute bottom-1.5 right-1.5 z-20">
            <div className="premium-pill px-2 py-0.5 rounded-lg flex items-center gap-1 border border-neutral-100">
              <span className="text-xs font-black text-neutral-800">{(product.rating || 4.5).toFixed(1)}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div 
        onClick={handleCardClick}
        className="px-2 pb-1.5 flex-1 flex flex-col cursor-pointer z-10"
      >
        <h3 className="text-[13px] md:text-[15px] font-bold text-village-umber line-clamp-1 leading-tight mb-0.5 font-poppins">
          {product.name || product.productName || ''}
        </h3>

        <div className="mb-0.5">
          <span className="text-[10px] md:text-[11px] font-medium text-neutral-400 tracking-wide font-nunito block">
            Rs {displayPrice}/{(() => {
                const v = product.variations?.[0];
                if (!v) return (product.pack || 'Standard').trim();
                const vName = (v.name || '').trim();
                const isPlaceholder = !vName || vName.toLowerCase() === 'variation' || vName.toLowerCase() === 'standard';
                return (isPlaceholder ? (v.value || v.title || vName) : vName).trim() || (product.pack || 'Standard').trim();
              })()}
          </span>
        </div>

        <div className="flex flex-col mt-auto">
          <div className="flex items-baseline gap-1 font-nunito">
            <span className="text-base md:text-xl font-bold text-village-umber">Rs {displayPrice}</span>
          </div>
          {mrp && mrp > displayPrice && (
            <span className="text-[9px] md:text-[11px] text-neutral-400 line-through -mt-0.5">
              ₹{mrp}
            </span>
          )}
        </div>
      </div>

      {/* Action Button Section */}
      <div className="px-2 pb-2 relative z-20">
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
                handleAdd(e); // Use handleAdd from existing logic
              }
            }}
            className={`w-full h-8 md:h-10 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-md md:shadow-lg transition-all active:scale-95 flex items-center justify-center font-poppins ${product.isAvailable === false
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 border border-orange-300/30'
              }`}
          >
            {product.isAvailable === false ? 'Out of Range' : 'Add'}
          </button>
        ) : (
          <div className="flex items-center justify-between bg-orange-50 px-1 py-0.5 rounded-full border border-orange-200 h-8 md:h-10 shadow-inner">
            <button
              onClick={handleCustomDecrease}
              className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold text-lg hover:shadow-sm active:scale-90 transition-all"
            >
              −
            </button>
            <span className="text-xs md:text-sm font-black text-village-umber">{currentQty}</span>
            <button
              onClick={handleIncrease}
              className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold text-lg hover:shadow-sm active:scale-90 transition-all"
            >
              +
            </button>
          </div>
        )}
      </div>

      <VariationSelectionModal
        product={product}
        open={isVariationModalOpen}
        onOpenChange={setIsVariationModalOpen}
        sourceElement={addButtonRef.current}
        onAdd={onAdd}
      />
    </motion.div>
  );
}
