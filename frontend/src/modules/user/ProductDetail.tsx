import {
  useParams,
  useNavigate,
  useLocation as useRouterLocation,
} from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// import { products } from '../../data/products'; // REMOVED
// import { categories } from '../../data/categories'; // REMOVED
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../hooks/useLocation';
import { useLoading } from '../../context/LoadingContext';
import Button from '../../components/ui/button';
import Badge from '../../components/ui/badge';
import ProductCard from "./components/ProductCard";
import { getProductById } from '../../services/api/customerProductService';
import WishlistButton from '../../components/WishlistButton';
import { calculateProductPrice } from '../../utils/priceUtils';
import { useSubscription } from '../../context/SubscriptionContext';
import { SubscriptionPlanId } from '../../types/subscription';
import DailyServiceSelector from './components/DailyServiceSelector';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation as useGlobalLocation } from 'react-router-dom';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { cart, addToCart, updateQuantity } = useCart();
  const { location } = useLocation();
  const { startLoading, stopLoading } = useLoading();
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [isProductDetailsExpanded, setIsProductDetailsExpanded] =
    useState(false);
  const [isHighlightsExpanded, setIsHighlightsExpanded] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [isSubscriptionMode, setIsSubscriptionMode] = useState(false);
  const { showToast } = useToast();
  const { isAuthenticated, user: authUser } = useAuth();
  const isWholesale = authUser?.customerType === 'wholesale';
  const {
    dailyServiceCart,
    addToDailyServiceCart,
    updateDailyServiceCartQuantity,
    calculateTotalPrice
  } = useSubscription();
  const [product, setProduct] = useState<any>(null);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvailableAtLocation, setIsAvailableAtLocation] =
    useState<boolean>(true);


  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      startLoading();
      try {
        // Check if navigation came from store page
        const fromStore = (routerLocation.state as any)?.fromStore === true;

        // Fetch product details with location
        const response = await getProductById(
          id,
          location?.latitude,
          location?.longitude
        );
        if (response.success && response.data) {
          const productData = response.data as any;

          // Set location availability flag
          setIsAvailableAtLocation(productData.isAvailableAtLocation !== false);

          // Get all images (main + gallery)
          const allImages = [
            productData.mainImage || productData.imageUrl || "",
            ...(productData.galleryImages || productData.galleryImageUrls || []),
          ].filter(Boolean);

          setProduct({
            ...productData,
            // Ensure all critical fields have safe defaults
            id: productData._id || productData.id,
            name: productData.productName || productData.name || "Product",
            imageUrl: productData.mainImage || productData.imageUrl || "",
            allImages: allImages,
            price: productData.price || 0,
            mrp: productData.mrp || productData.price || 0,
            pack: (() => {
              const v = productData.variations?.[0];
              if (!v) return productData.smallDescription || "Standard";
              const vName = (v.name || '').trim();
              const isPlaceholder = !vName || vName.toLowerCase() === 'variation' || vName.toLowerCase() === 'standard';
              return (isPlaceholder ? (v.value || v.title || vName) : vName).trim() || productData.smallDescription || "Standard";
            })(),
          });

          // Reset selected variant and image when product changes
          setSelectedVariantIndex(0);
          setSelectedImageIndex(0);
          setSimilarProducts(response.data.similarProducts || []);


        } else {
          setProduct(null);
          setError(response.message || "Product not found");
        }
      } catch (error: any) {
        console.error("Failed to fetch product", error);
        setProduct(null);
        setError(error.message || "Something went wrong while fetching product details");
      } finally {
        setLoading(false);
        stopLoading();
      }
    };



    fetchProduct();
  }, [id, location?.latitude, location?.longitude]);

  // Get selected variant
  const selectedVariant = product?.variations?.[selectedVariantIndex] || null;
  const { displayPrice: variantPrice, mrp: variantMrp, discount, hasDiscount } = calculateProductPrice(product, selectedVariantIndex);

  const variantStock = selectedVariant?.stock !== undefined ? selectedVariant.stock : (product?.stock || 0);
  const variantTitle = (() => {
    if (!selectedVariant) return product?.pack || "Standard";
    const vName = (selectedVariant.name || '').trim();
    const isPlaceholder = !vName || vName.toLowerCase() === 'variation' || vName.toLowerCase() === 'standard';
    return (isPlaceholder ? (selectedVariant.value || selectedVariant.title || vName) : vName).trim() || product?.pack || "Standard";
  })();
  const isVariantAvailable = selectedVariant?.status !== "Sold out" && (variantStock > 0 || variantStock === 0); // 0 means unlimited

  // Get all images for gallery
  const allImages = product?.allImages || [product?.imageUrl || ""].filter(Boolean);
  const currentImage = allImages[selectedImageIndex] || product?.imageUrl || "";

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Handle touch start
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  // Handle touch move
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  // Handle touch end - perform swipe
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedImageIndex < allImages.length - 1) {
      setIsTransitioning(true);
      setSelectedImageIndex(selectedImageIndex + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }

    if (isRightSwipe && selectedImageIndex > 0) {
      setIsTransitioning(true);
      setSelectedImageIndex(selectedImageIndex - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  // Get quantity in cart - check by product ID and variant if available
  const cartItem = product
    ? cart.items.find(
      (item) => {
        if (!item?.product) return false;
        const itemProductId = item.product.id || item.product._id;
        const productId = product.id || product._id;

        if (itemProductId !== productId) return false;

        // If variant exists, match by variant
        if (selectedVariant) {
          const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
          const itemVariantTitle = (item.product as any).variantTitle || (item.product as any).pack;
          return itemVariantId === selectedVariant._id || itemVariantTitle === variantTitle;
        }

        // If no variant, check that item also has no variant
        const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
        const itemVariantTitle = (item.product as any).variantTitle;
        return !itemVariantId && !itemVariantTitle;
      }
    )
    : null;
  const inCartQty = cartItem?.quantity || 0;

  const currentProductId = product?.id || product?._id;
  const dailyCartItem = product
    ? dailyServiceCart.find(item => item.productId === currentProductId && item.variantId === selectedVariant?._id)
    : null;
  const isDailyInCart = !!dailyCartItem;
  const dailyInCartQty = dailyCartItem?.quantity || 0;

  if (loading && !product) {
    return null; // Let the global IconLoader handle this
  }

  if (error && !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center bg-white">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-[#8B3D28] text-white rounded-full font-black font-poppins hover:bg-[#722F1E] transition-colors"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent px-4 md:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-lg md:text-xl font-semibold text-neutral-900 mb-4">
            Product not found
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Get category info - safe access
  const category =
    product.category && product.category.name
      ? { name: product.category.name, id: product.category._id }
      : null;

  const handleAddToCart = () => {
    if (!isAvailableAtLocation) {
      // Show alert if trying to add item outside delivery area
      alert("This product is not available for delivery at your location.");
      return;
    }
    if (!isVariantAvailable && variantStock !== 0) {
      alert("This variant is currently out of stock.");
      return;
    }

    const minQty = (selectedVariant?.minWholesaleQuantity || product.minWholesaleQuantity || 1);

    if (isWholesale && inCartQty === 0 && minQty > 1) {
      // First time adding to cart, add the minimum quantity
      const productWithVariant = {
        ...product,
        price: variantPrice,
        mrp: variantMrp,
        pack: variantTitle,
        selectedVariant: selectedVariant,
        variantId: selectedVariant?._id,
        variantTitle: variantTitle,
      };

      addToCart(productWithVariant, addButtonRef.current, minQty);
      showToast(`Added minimum wholesale quantity (${minQty}) to cart`, 'success');
      return;
    }

    // Create product with selected variant info
    const productWithVariant = {
      ...product,
      price: variantPrice,
      mrp: variantMrp,
      pack: variantTitle,
      selectedVariant: selectedVariant,
      variantId: selectedVariant?._id,
      variantTitle: variantTitle,
    };
    addToCart(productWithVariant, addButtonRef.current);
  };

  return (
    <div className="min-h-screen bg-transparent pb-16">
      {/* Header with back button and action icons */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-transparent lg:sticky lg:bg-white lg:shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 md:py-4">
          {/* Back button - top left */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-neutral-50 transition-colors lg:border lg:border-neutral-200 lg:bg-transparent lg:shadow-none"
            aria-label="Go back">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="lg:w-6 lg:h-6">
              <path
                d="M15 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Page Title - Desktop only */}
          <h1 className="hidden lg:block text-xl font-black text-village-umber uppercase tracking-tight truncate max-w-md">
            {product.name}
          </h1>

          {/* Action icons - top right */}
          <div className="flex items-center gap-2">
            {/* Heart icon */}
            {product?.id && (
              <WishlistButton
                productId={product.id}
                size="md"
                className="bg-white rounded-full shadow-sm lg:border lg:border-neutral-200 lg:bg-transparent lg:shadow-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="pt-14 lg:pt-0 max-w-7xl mx-auto">
        {/* Location Availability Banner */}
        {!isAvailableAtLocation && (
          <div className="bg-amber-50 border-l-4 border-amber-500 px-4 py-3 mx-4 mt-4 rounded-r-lg">
            <div className="flex items-start gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                className="flex-shrink-0 mt-0.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#f59e0b" />
                <path
                  d="M2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">
                  Not available at your location
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  This product cannot be delivered to your current location. You
                  can browse but cannot add to cart.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Desktop/Tablet Image View Refinement */}
        <div className="hidden lg:block mb-2 px-8 pt-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-neutral-500 font-medium whitespace-nowrap overflow-hidden">
              <li><button onClick={() => navigate('/')} className="hover:text-village-umber transition-colors">Home</button></li>
              <li><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg></li>
              {category && (
                <>
                  <li><button onClick={() => navigate(`/category/${category.id}`)} className="hover:text-village-umber transition-colors">{category.name}</button></li>
                  <li><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg></li>
                </>
              )}
              <li className="text-village-umber font-bold truncate max-w-[200px]">{product.name}</li>
            </ol>
          </nav>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start lg:px-8 lg:pb-10 lg:pt-2">
          <div> {/* Left Column Wrapper */}


            <div className="relative w-full bg-gradient-to-br from-neutral-50 to-neutral-100 overflow-hidden shadow-sm lg:rounded-2xl lg:shadow-xl lg:border lg:border-neutral-200 lg:sticky lg:top-24">
              {/* Main Product Image - Swipeable on mobile */}
              <div
                className="w-full aspect-[4/3] md:aspect-square relative overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                  touchAction: allImages.length > 1 ? 'pan-x' : 'pan-y pinch-zoom',
                  cursor: allImages.length > 1 ? 'grab' : 'default',
                }}
              >
                {/* Image Container with swipe animation - Mobile swipe carousel */}
                <div
                  className="w-full h-full flex transition-transform duration-300 ease-out md:hidden"
                  style={{
                    transform: `translateX(-${selectedImageIndex * 100}%)`,
                  }}
                >
                  {allImages.map((image: string, index: number) => (
                    <div
                      key={index}
                      className="w-full h-full flex-shrink-0 flex items-center justify-center relative"
                      style={{ minWidth: '100%' }}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={`${product.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-6xl">
                          {(product.name || product.productName || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop: Single image display */}
                <div className="hidden md:flex w-full h-full items-center justify-center">
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-6xl">
                      {(product.name || product.productName || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Image Gallery Navigation - Only show if multiple images */}
                {allImages.length > 1 && (
                  <>
                    {/* Previous Image Button - Desktop only */}
                    {selectedImageIndex > 0 && (
                      <button
                        onClick={() => {
                          setIsTransitioning(true);
                          setSelectedImageIndex(selectedImageIndex - 1);
                          setTimeout(() => setIsTransitioning(false), 300);
                        }}
                        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center shadow-md hover:bg-white transition-colors z-10"
                        aria-label="Previous image">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M15 18l-6-6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}

                    {/* Next Image Button - Desktop only */}
                    {selectedImageIndex < allImages.length - 1 && (
                      <button
                        onClick={() => {
                          setIsTransitioning(true);
                          setSelectedImageIndex(selectedImageIndex + 1);
                          setTimeout(() => setIsTransitioning(false), 300);
                        }}
                        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center shadow-md hover:bg-white transition-colors z-10"
                        aria-label="Next image">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M9 18l6-6-6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    )}

                    {/* Image Indicators - Show on both mobile and desktop */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                      {allImages.map((_: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => {
                            setIsTransitioning(true);
                            setSelectedImageIndex(index);
                            setTimeout(() => setIsTransitioning(false), 300);
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${index === selectedImageIndex
                            ? "bg-white w-6"
                            : "bg-white/50 hover:bg-white/75"
                            }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery - Show below main image if multiple images */}
              {allImages.length > 1 && (
                <div className="px-4 py-2 bg-white/50 backdrop-blur-sm mb-4 lg:bg-transparent lg:px-0 lg:my-6">
                  {/* Mobile swipe hint */}
                  <div className="md:hidden flex items-center justify-center gap-1 mb-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-neutral-500">
                      <path d="M7 12l5-5M17 12l-5-5M12 7l-5 5M12 17l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs text-neutral-500">Swipe to view more</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 scroll-smooth lg:justify-center">
                    {allImages.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          setIsTransitioning(true);
                          setSelectedImageIndex(index);
                          setTimeout(() => setIsTransitioning(false), 300);
                        }}
                        className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all group ${index === selectedImageIndex
                          ? "border-village-umber ring-4 ring-village-umber/10 shadow-lg scale-105"
                          : "border-neutral-200 hover:border-neutral-300"
                          }`}>
                        <img
                          src={image}
                          alt={`${product.name} - Image ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Details & CTA */}
          <div className="lg:space-y-8">
            {/* Desktop CTA Card - Hidden on Mobile */}
            <div className="hidden lg:block bg-stone-50 border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1 block">Price</span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-village-umber">{"\u20B9"}{variantPrice.toLocaleString('en-IN')}</span>
                    {hasDiscount && (
                      <span className="text-lg text-neutral-400 line-through">{"\u20B9"}{variantMrp.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </div>
                {hasDiscount && (
                  <div className="bg-village-green text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    {discount}% OFF
                  </div>
                )}
              </div>

              {/* Desktop Add to Cart */}
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="wait">
                    {inCartQty === 0 ? (
                      <button
                        onClick={handleAddToCart}
                        disabled={!isAvailableAtLocation || (!isVariantAvailable && variantStock !== 0)}
                        className={`w-full py-4 text-sm font-black uppercase tracking-widest rounded-xl shadow-xl transition-all active:scale-[0.98] ${!isAvailableAtLocation || (!isVariantAvailable && variantStock !== 0)
                          ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                          : "bg-village-green text-white hover:bg-[#3D664A] shadow-village-green/20"
                          }`}
                      >
                        {!isAvailableAtLocation
                          ? "Unavailable at Location"
                          : !isVariantAvailable && variantStock !== 0
                            ? "Out of Stock"
                            : "Add to cart"}
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-white border border-stone-200 rounded-xl p-2 shadow-inner">
                        <div className="flex items-center gap-4 px-2">
                          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">In Cart</span>
                        </div>
                        <div className="flex items-center gap-4 bg-stone-100/50 rounded-lg p-1">
                          <button
                            onClick={() => {
                              const productId = product.id || product._id;
                              const variantId = selectedVariant?._id;
                              updateQuantity(productId, inCartQty - 1, variantId, variantTitle);
                            }}
                            className="w-10 h-10 flex items-center justify-center text-village-umber font-bold hover:bg-white rounded-lg shadow-sm transition-all border border-stone-200/50 text-xl bg-white"
                          >
                            −
                          </button>
                          <span className="text-lg font-black text-village-umber min-w-[2rem] text-center">
                            {inCartQty}
                          </span>
                          <button
                            onClick={() => {
                              const productId = product.id || product._id;
                              const variantId = selectedVariant?._id;
                              updateQuantity(productId, inCartQty + 1, variantId, variantTitle);
                            }}
                            className="w-10 h-10 flex items-center justify-center text-white font-bold rounded-lg shadow-sm transition-all text-xl bg-village-umber"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Badges/Info */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-stone-200">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Stock</div>
                    <div className="text-xs font-black text-village-umber">{variantStock === 0 ? 'Unlimited' : variantStock > 0 ? `${variantStock} Units` : 'Sold Out'}</div>
                  </div>
                  <div className="text-center border-x border-stone-200">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Pack</div>
                    <div className="text-xs font-black text-village-umber truncate px-1">{variantTitle}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Delivery</div>
                    <div className="text-xs font-black text-village-green">Express</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details Card - White section */}
            <div className="bg-white rounded-t-3xl -mt-6 lg:mt-0 relative z-10 px-4 md:px-6 lg:px-0 pt-2.5 md:pt-4 pb-2 md:pb-4 lg:rounded-none lg:shadow-none lg:bg-transparent">
              {/* Product name */}
              <h2 className="text-xl md:text-3xl font-black text-village-umber mb-2 leading-tight uppercase tracking-tight lg:mb-6">
                {product.name}
              </h2>

              {/* Variant Selection - Only show if multiple variants */}
              {product.variations && product.variations.length > 1 && (
                <div className="mb-2">
                  <label className="block text-xs md:text-sm font-medium text-neutral-700 mb-1.5">
                    Select {product.variationType || "Variant"}:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variations.map((variant: any, index: number) => {
                      const vName = (variant.name || '').trim();
                      const isPlaceholder = !vName || vName.toLowerCase() === 'variation' || vName.toLowerCase() === 'standard';
                      const variantTitle = (isPlaceholder ? (variant.value || variant.title || vName) : vName).trim() || `Variant ${index + 1}`;
                      const isOutOfStock = variant.status === "Sold out" || (variant.stock === 0 && variant.stock !== undefined && variant.stock !== null);
                      const isSelected = index === selectedVariantIndex;

                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedVariantIndex(index)}
                          disabled={isOutOfStock}
                          className={`px-3 py-1.5 rounded-xl text-[10px] md:text-sm font-black transition-all border-2 flex flex-col items-center gap-0.5 min-w-[60px] font-poppins ${isSelected
                            ? "border-[#8B3D28] bg-[#8B3D28]/10 text-[#8B3D28] shadow-sm transform scale-105"
                            : isOutOfStock
                              ? "border-neutral-100 bg-neutral-50 text-neutral-400 cursor-not-allowed"
                              : "border-neutral-200 bg-white text-neutral-600 hover:border-[#8B3D28]/30 hover:bg-[#8B3D28]/5"
                            }`}>
                          <span className="whitespace-nowrap">{variantTitle}</span>
                          <span className={`text-[10px] font-black ${isSelected ? "text-[#8B3D28]" : "text-neutral-500"}`}>
                            {"\u20B9"}{calculateProductPrice(product, index).displayPrice}
                          </span>
                          {isOutOfStock && (
                            <span className="text-[9px] uppercase tracking-tighter opacity-70">Sold Out</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity/Pack */}
              <p className="text-xs md:text-sm font-bold text-neutral-400 uppercase italic tracking-widest mb-4">
                {variantTitle}
              </p>

              {/* Price section - Mobile only */}
              <div className="lg:hidden flex items-center gap-1.5 mb-1.5">
                <span className="text-xl font-black text-village-umber">
                  {"\u20B9"}{variantPrice.toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-sm text-neutral-500 line-through">
                      {"\u20B9"}{variantMrp.toLocaleString('en-IN')}
                    </span>
                    {discount > 0 && (
                      <Badge className="!bg-[#4A7C59] !text-white !border-[#4A7C59] text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-wider">
                        {discount}% OFF
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {/* Wholesale MOQ indicator */}
              {isWholesale && (selectedVariant?.minWholesaleQuantity > 1 || product.minWholesaleQuantity > 1) && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span className="text-xs font-bold text-blue-700">
                    Min. Order Qty: {selectedVariant?.minWholesaleQuantity || product.minWholesaleQuantity || 1}
                  </span>
                </div>
              )}

              {/* Stock Status - Mobile only */}
              {variantStock !== 0 && variantStock !== undefined && variantStock !== null && (
                <p className="lg:hidden text-sm text-neutral-600 mb-1">
                  {variantStock > 0 ? `${variantStock} in stock` : "Out of stock"}
                </p>
              )}

              {/* Divider line */}
              <div className="lg:hidden border-t border-neutral-200 mb-1.5"></div>

              {/* View product details link */}
              <button
                onClick={() =>
                  setIsProductDetailsExpanded(!isProductDetailsExpanded)
                }
                className="flex items-center gap-0.5 text-sm text-[#8B3D28] font-black font-poppins">
                View product details
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`transition-transform ${isProductDetailsExpanded ? "rotate-180" : ""
                    }`}>
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

            </div>

            {/* Expanded Product Details Section */}
            {isProductDetailsExpanded && (
              <div className="mt-1.5">
                {/* Service Guarantees Card */}
                <div className="bg-white rounded-lg p-3 mb-2">
                  <div className="grid grid-cols-3 gap-2">
                    {/* Replacement */}
                    <div className="flex flex-col items-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mb-1">
                        <path
                          d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3M20.49 15a9 9 0 0 1-14.85 3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm font-bold text-neutral-900">
                        48 hours
                      </span>
                      <span className="text-xs text-neutral-600">
                        Replacement
                      </span>
                    </div>

                    {/* Support */}
                    <div className="flex flex-col items-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mb-1">
                        <path
                          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M13 8H7M17 12H7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-sm font-bold text-neutral-900">
                        24/7
                      </span>
                      <span className="text-xs text-neutral-600">Support</span>
                    </div>

                    {/* Delivery */}
                    <div className="flex flex-col items-center">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="mb-1">
                        <path
                          d="M5 17H2l1-7h18l1 7h-3M5 17l-1-5h20l-1 5M5 17v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5M9 22h6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm font-bold text-neutral-900">
                        Fast
                      </span>
                      <span className="text-xs text-neutral-600">Delivery</span>
                    </div>
                  </div>
                </div>

                {/* Highlights Section */}
                <div className="bg-neutral-100 rounded-lg mb-2 overflow-hidden">
                  <button
                    onClick={() => setIsHighlightsExpanded(!isHighlightsExpanded)}
                    className="w-full px-2 py-2.5 flex items-center justify-between bg-neutral-100">
                    <span className="text-sm font-semibold text-neutral-700">
                      Highlights
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`transition-transform ${isHighlightsExpanded ? "rotate-180" : ""
                        }`}>
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {isHighlightsExpanded && (
                    <div className="bg-white px-2 py-2">
                      <div className="space-y-1.5">
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex items-start">
                            <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                              Key Features:
                            </span>
                            <span className="text-xs text-neutral-600">
                              {product.tags.map((tag: string, index: number) => (
                                <span key={tag}>
                                  {tag
                                    .replace(/-/g, " ")
                                    .split(" ")
                                    .map(
                                      (word: string) =>
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                    )
                                    .join(" ")}
                                  {index < (product.tags?.length || 0) - 1
                                    ? ", "
                                    : ""}
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start">
                          <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                            Source:
                          </span>
                          <span className="text-xs text-neutral-600">
                            {product.madeIn || "From India"}
                          </span>
                        </div>
                        {category && (
                          <div className="flex items-start">
                            <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                              Category:
                            </span>
                            <span className="text-xs text-neutral-600">
                              {category.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="bg-neutral-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                    className="w-full px-2 py-2.5 flex items-center justify-between bg-neutral-100">
                    <span className="text-sm font-semibold text-neutral-700">
                      Info
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={`transition-transform ${isInfoExpanded ? "rotate-180" : ""
                        }`}>
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {isInfoExpanded && (
                    <div className="bg-white px-2 py-2">
                      <div className="space-y-1.5">
                        {product.description && (
                          <div className="flex items-start">
                            <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                              Description:
                            </span>
                            <span className="text-xs text-neutral-600 leading-relaxed flex-1">
                              {product.description}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start">
                          <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                            Unit:
                          </span>
                          <span className="text-xs text-neutral-600">
                            {product.pack}
                          </span>
                        </div>
                        {product.fssaiLicNo && (
                          <div className="flex items-start">
                            <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                              FSSAI License:
                            </span>
                            <span className="text-xs text-neutral-600">
                              {product.fssaiLicNo}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start">
                          <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                            Shelf Life:
                          </span>
                          <span className="text-xs text-neutral-600">
                            Refer to package
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                            Disclaimer:
                          </span>
                          <span className="text-xs text-neutral-600 leading-relaxed flex-1">
                            Every effort is made to maintain accuracy of all
                            Information. However, actual product packaging and
                            materials may contain more and/or different information.
                            It is recommended not to solely rely on the information
                            presented.
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                            Customer Care Details:
                          </span>
                          <span className="text-xs text-neutral-600">
                            Email: help@villagebasket.com
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                            Country of Origin:
                          </span>
                          <span className="text-xs text-neutral-600">
                            {product.madeIn || "India"}
                          </span>
                        </div>
                        {product.manufacturer && (
                          <div className="flex items-start">
                            <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                              Manufacturer:
                            </span>
                            <span className="text-xs text-neutral-600 leading-relaxed flex-1">
                              {product.manufacturer}
                            </span>
                          </div>
                        )}
                        {/* Marketer same as manufacturer if not present, or hidden */}

                        <div className="flex items-start">
                          <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                            Return Policy:
                          </span>
                          <span className="text-xs text-neutral-600 leading-relaxed flex-1">
                            {product.isReturnable
                              ? `This product is returnable within ${product.maxReturnDays || 2
                              } days.`
                              : "This product is non-returnable."}
                          </span>
                        </div>
                        {product.sellerId && (
                          <div className="flex items-start">
                            <span className="text-xs font-semibold text-neutral-800 w-[180px] flex-shrink-0">
                              Seller:
                            </span>
                            <span className="text-xs text-neutral-600 leading-relaxed flex-1">
                              Village Basket Partner (
                              {product.sellerId.slice(-6).toUpperCase()})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div> {/* End of Right Column */}
        </div> {/* End of lg:grid */}


        {/* Top products in this category - Centered */}
        {similarProducts.length > 0 && (
          <div className="mt-10 mb-10 px-4 lg:px-8 max-w-7xl mx-auto lg:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h3 className="text-xl md:text-3xl font-black text-village-umber uppercase tracking-tight">
                You May Also Like
              </h3>
              <button
                onClick={() => navigate(`/category/${category?.id}`)}
                className="text-xs font-black text-village-umber uppercase tracking-[0.2em] border-b-2 border-village-umber/20 hover:border-village-umber transition-all w-fit"
              >
                View Category
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {similarProducts.slice(0, 8).map((similarProduct) => (
                <div key={similarProduct.id || similarProduct._id} className="transition-transform hover:scale-[1.02]">
                  <ProductCard
                    product={similarProduct}
                    showHeartIcon={true}
                    showStockInfo={false}
                    showBadge={true}
                    compact={false}
                    categoryStyle={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer - Hidden on Desktop */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-neutral-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="px-4 py-2 flex items-center justify-between min-h-[58px]">
          {/* Left side - Product details */}
          <div className="flex flex-col justify-center">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight leading-none mb-1">
              {variantTitle}
            </span>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-sm font-black text-village-umber">
                {"\u20B9"}{variantPrice.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <span className="text-[9px] text-neutral-400 line-through">
                  {"\u20B9"}{variantMrp.toLocaleString('en-IN')}
                </span>
              )}
              {discount > 0 && (
                <span className="text-[9px] font-black text-village-green uppercase">
                  {discount}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Right side - Add to cart button or Quantity Stepper */}
          <div className="flex items-center">
            <AnimatePresence mode="wait">
              {inCartQty === 0 ? (
                <motion.div
                  key="add-button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center"
                >
                  <button
                    ref={addButtonRef}
                    onClick={handleAddToCart}
                    disabled={!isAvailableAtLocation || (!isVariantAvailable && variantStock !== 0)}
                    className={`px-6 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 ${!isAvailableAtLocation || (!isVariantAvailable && variantStock !== 0)
                      ? "bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-50"
                      : "bg-[#4A7C59] text-white hover:bg-[#3D664A] shadow-lg shadow-village-green/10"
                      }`}
                  >
                    {!isAvailableAtLocation
                      ? "Unavailable"
                      : !isVariantAvailable && variantStock !== 0
                        ? "Out of Stock"
                        : "Add to cart"}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="stepper"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2.5 bg-stone-50 border border-stone-200/50 rounded-xl px-1.5 py-1 h-9 shadow-inner">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const productId = product.id || product._id;
                      const variantId = selectedVariant?._id;
                      updateQuantity(productId, inCartQty - 1, variantId, variantTitle);
                    }}
                    className="w-6 h-6 flex items-center justify-center text-[#8B3D28] font-bold hover:bg-white rounded-lg shadow-sm transition-all border border-stone-200/50 p-0 leading-none text-sm bg-white"
                  >
                    <span>−</span>
                  </motion.button>
                  <motion.span
                    key={inCartQty}
                    initial={{ scale: 1.2, y: -2 }}
                    animate={{ scale: 1, y: 0 }}
                    className="text-xs font-black text-village-umber min-w-[1.25rem] text-center"
                  >
                    {inCartQty}
                  </motion.span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const productId = product.id || product._id;
                      const variantId = selectedVariant?._id;
                      updateQuantity(productId, inCartQty + 1, variantId, variantTitle);
                    }}
                    className="w-6 h-6 flex items-center justify-center text-white font-bold rounded-lg shadow-sm transition-all p-0 leading-none text-sm bg-village-umber"
                  >
                    <span>+</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

