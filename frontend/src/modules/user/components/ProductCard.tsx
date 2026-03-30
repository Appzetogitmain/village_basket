import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { Product } from '../../../types/domain';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from '../../../hooks/useLocation';
import { useToast } from '../../../context/ToastContext';
import { useWishlist } from '../../../hooks/useWishlist';
import Button from '../../../components/ui/button';
import Badge from '../../../components/ui/badge';
import StarRating from '../../../components/ui/StarRating';
import { calculateProductPrice } from '../../../utils/priceUtils';
import { getVariationColor } from '../../../utils/variationUtils';
import VariationSelectionModal from './VariationSelectionModal';
import QuantityInput from '../../../components/ui/QuantityInput';


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
  onWishlistToggle?: (productId: string, isWishlisted: boolean) => void;
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
  onWishlistToggle,
  className = '',
}: ProductCardProps) {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { location } = useLocation();
  const { showToast } = useToast(); // Get toast function
  const imageRef = useRef<HTMLImageElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
  const targetId = String((product as any).id || product._id);
  const { isWishlisted, toggleWishlist } = useWishlist(targetId);

  // Single ref to track any cart operation in progress for this product
  const isOperationPendingRef = useRef(false);

  // Helper to extract string ID from MongoDB format if needed
  const getIdStr = (id: any): string => {
    if (!id) return "";
    if (typeof id === "string") return id;
    if (id.$oid) return id.$oid;
    return String(id);
  };

  // Pre-calculate default variation info if available
  const defaultVariation = product.variations && product.variations.length > 0 ? product.variations[0] : null;
  const defaultVarId = defaultVariation ? getIdStr(defaultVariation._id || (defaultVariation as any).id) : null;
  const defaultVarTitle = defaultVariation ? (defaultVariation.value || defaultVariation.name || defaultVariation.title) : (product.pack || null);


  // Get quantity in cart - properly matching the default variation for this card
  const cartItem = cart.items.find((item) => {
    if (!item?.product) return false;
    const itemProductId = getIdStr(item.product.id || item.product._id);
    const productId = getIdStr((product as any).id || product._id);
    if (itemProductId !== productId) return false;

    // If product has variations, the card defaults to the first one
    if (product.variations && product.variations.length > 0) {
      const itemVariantId = getIdStr((item.product as any).variantId || (item.product as any).selectedVariant?._id);
      const itemVariantValue = String((item.product as any).variantTitle || (item.product as any).pack || item.variant || "");
      
      // Match by ID OR by value/title (name) to be extra robust
      return (defaultVarId && itemVariantId === defaultVarId) || 
             (defaultVarTitle && itemVariantValue === defaultVarTitle) ||
             (defaultVarId && itemVariantValue === defaultVarId); // Case where ID was stored in 'variation' field as string
    }
    return true;
  });
  const inCartQty = cartItem?.quantity || 0;

  // Get Price and MRP using utility
  const { displayPrice, mrp, discount } = calculateProductPrice(product, undefined, user?.customerType);

  const handleCardClick = () => {
    navigate(`/user/product/${((product as any).id || product._id) as string}`);
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
      
      const isWholesale = user?.customerType === 'wholesale';
      const minQty = defaultVariation?.minWholesaleQuantity || product.minWholesaleQuantity || 1;

      // Pass variation info for consistency if available, even for single variation products
      if (defaultVarId || defaultVarTitle) {
        const productWithVariation = {
          ...product,
          variantId: defaultVarId,
          variantTitle: defaultVarTitle
        };
        await addToCart(productWithVariation, addButtonRef.current);
      } else {
        await addToCart(product, addButtonRef.current);
      }

      if (isWholesale && minQty > 1) {
        showToast(`Added minimum wholesale quantity (${minQty})`, 'success');
      }
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
      const productId = getIdStr((product as any).id || product._id);
      const variant = defaultVarId || defaultVarTitle || undefined;
      const variantTitle = defaultVarTitle || undefined;
      await updateQuantity(productId, inCartQty - 1, variant, variantTitle);
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
        const productId = getIdStr((product as any).id || product._id);
        const variant = defaultVarId || defaultVarTitle || undefined;
        const variantTitle = defaultVarTitle || undefined;
        await updateQuantity(productId, inCartQty + 1, variant, variantTitle);
      } else {
        // Fallback to handleAdd logic for first time add
        await handleAdd(e);
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
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
      className={`village-card white-paper-texture organic-radius overflow-hidden flex flex-col relative h-full bg-white shadow-[0_8px_16px_rgba(0,0,0,0.06)] border border-neutral-100/50 transition-all hover:shadow-xl active:scale-[0.98] ${className}`}
    >
      <div
        onClick={handleCardClick}
        className="cursor-pointer relative"
      >
        <div className={`relative w-full ${compact ? 'aspect-square p-2' : 'h-32 md:h-44 p-3'} bg-gradient-to-b from-neutral-50 to-white flex items-center justify-center overflow-hidden rounded-t-[20px]`}>
          {product.imageUrl || product.mainImage ? (
            <img
              ref={imageRef}
              src={product.imageUrl || product.mainImage}
              alt={product.name || product.productName || 'Product'}
              className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-50 text-neutral-300 text-3xl font-black">
              {(product.name || product.productName || '?').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <div className={`absolute top-2 left-0 z-10 ${categoryStyle ? 'bg-[#1b4332]' : 'bg-[#4b7d5a]'} text-white text-[10px] md:text-[12px] font-black px-3 py-1 md:px-4 md:py-1.5 rounded-r-full shadow-md uppercase tracking-tighter`}>
              {discount}% OFF
            </div>
          )}



          {/* Wishlist Button */}
          <div className="absolute top-2 right-2 z-20">
            <button
              onClick={toggleWishlist}
              className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center border border-neutral-100/50 active:scale-90 transition-transform"
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

          {/* ADD Button Overlay for Category Style */}
          {categoryStyle && (
            <div className="absolute bottom-2 right-2 z-20">
              <AnimatePresence mode="wait">
                {inCartQty === 0 ? (
                  <motion.button
                    key="add-overlay"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    ref={addButtonRef}
                    disabled={product.isAvailable === false}
                    onClick={handleCustomAdd}
                    className="bg-white/95 backdrop-blur-sm text-[#4b7d5a] border-2 border-[#4b7d5a] text-[10px] font-black px-3 py-1 rounded shadow-md hover:bg-white transition-colors uppercase tracking-wider"
                  >
                    Add
                  </motion.button>
                ) : (
                  <motion.div
                    key="stepper-overlay"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1 bg-[#4b7d5a] rounded px-1.5 py-1 shadow-md"
                  >
                    <button
                      onClick={handleCustomDecrease}
                      className="w-4 h-4 flex items-center justify-center text-white font-bold text-lg active:scale-90 transition-transform leading-none"
                    >−</button>
                    <QuantityInput
                      value={currentQty}
                      min={0}
                      onChange={(val) => {
                        const productId = getIdStr((product as any).id || product._id);
                        const variant = defaultVarId || defaultVarTitle || undefined;
                        const variantTitle = defaultVarTitle || undefined;
                        updateQuantity(productId, val, variant, variantTitle);
                      }}
                      className="text-white font-bold w-6 text-center bg-transparent border-none focus:outline-none text-xs"
                    />
                    <button
                      onClick={handleIncrease}
                      className="w-4 h-4 flex items-center justify-center text-white font-bold text-lg active:scale-90 transition-transform leading-none"
                    >+</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Product Content */}
      <div
        onClick={handleCardClick}
        className="p-3 flex flex-col flex-1 cursor-pointer"
      >
        <div className="flex flex-col gap-0.5 mb-2">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-[11px] md:text-[13px] font-black text-village-umber uppercase tracking-tight line-clamp-1 flex-1">
              {product.name || product.productName || ''}
            </h3>
            {/* Rating Display */}
            <div className="flex items-center gap-0.5 bg-amber-50 px-1 rounded flex-shrink-0">
              <span className="text-[9px] font-black text-amber-700">{(product.rating || 4.5).toFixed(1)}</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="#F59E0B">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
          <span className="text-[8px] md:text-[10px] font-bold text-neutral-400 uppercase tracking-wider italic">
            Pack: {(() => {
                const v = product.variations?.[0];
                let packValue = '';
                
                if (v) {
                  const vName = (v.name || '').trim();
                  const isPlaceholder = !vName || vName.toLowerCase() === 'variation' || vName.toLowerCase() === 'standard';
                  packValue = (isPlaceholder ? (v.value || v.title || vName) : vName).trim();
                } else {
                  packValue = (product.pack || 'Standard').trim();
                }

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
            <span className="text-sm md:text-base font-black text-village-umber">₹{displayPrice}</span>
            {mrp && mrp > displayPrice && (
              <span className="text-[9px] md:text-[10px] text-neutral-400 line-through font-bold">₹{mrp}</span>
            )}
          </div>

          {!categoryStyle && (
            <div className="mt-3">
              {inCartQty === 0 ? (
                <button
                  ref={addButtonRef}
                  disabled={product.isAvailable === false}
                  onClick={handleCustomAdd}
                  className={`w-full h-8 md:h-10 rounded-xl text-[10px] md:text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${product.isAvailable === false
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed uppercase border-none'
                    : 'bg-[#4b7d5a] text-white md:bg-white md:border-[1.5px] md:border-[#4b7d5a] md:text-[#4b7d5a] md:shadow-none md:hover:bg-[#4b7d5a] md:hover:text-white translate-z-0'
                    }`}
                >
                  {product.isAvailable === false ? 'Out' : 'Add'}
                </button>
              ) : (
                <div className="flex items-center justify-between bg-[#4b7d5a]/5 rounded-xl border border-[#4b7d5a]/10 h-8 md:h-10 px-1 shadow-inner">
                  <button
                    onClick={handleCustomDecrease}
                    className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-white text-[#4b7d5a] shadow-sm flex items-center justify-center font-bold text-lg active:scale-90 transition-transform"
                  >−</button>
                  <QuantityInput
                    value={currentQty}
                    min={0}
                    onChange={(val) => {
                      const productId = getIdStr((product as any).id || product._id);
                      const variant = defaultVarId || defaultVarTitle || undefined;
                      const variantTitle = defaultVarTitle || undefined;
                      updateQuantity(productId, val, variant, variantTitle);
                    }}
                    className="text-[11px] md:text-sm font-black text-[#4b7d5a] w-8 text-center bg-transparent border-none focus:outline-none"
                  />
                  <button
                    onClick={handleIncrease}
                    className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-[#4b7d5a] text-white shadow-md flex items-center justify-center font-bold text-lg active:scale-90 transition-transform"
                  >+</button>
                </div>
              )}
            </div>
          )}
        </div>
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
