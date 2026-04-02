import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../hooks/useOrders';
import { useLocation as useLocationContext } from '../../hooks/useLocation';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// import { products } from '../../data/products'; // Removed
import { OrderAddress, Order, DeliveryShift } from '../../types/order';
import PartyPopper from './components/PartyPopper';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '../../components/ui/sheet';
import WishlistButton from '../../components/WishlistButton';

import { getCoupons, validateCoupon, Coupon as ApiCoupon } from '../../services/api/customerCouponService';
import { appConfig } from '../../services/configService';
import { getAddresses, updateAddress } from '../../services/api/customerAddressService';
import { getActiveDeliverySlots } from '../../services/api/admin/adminDeliverySlotService';
import type { DeliverySlotSelection } from '../../types/order';
import GoogleMapsLocationPicker from '../../components/GoogleMapsLocationPicker';
import { getProducts } from '../../services/api/customerProductService';
import { useWishlist } from '../../context/WishlistContext';
import { getProfile, updateProfile } from '../../services/api/customerService';
import { calculateProductPrice } from '../../utils/priceUtils';
import QuantityInput from '../../components/ui/QuantityInput';
import RazorpayCheckout from '../../components/RazorpayCheckout';
import ProductCard from '../user/components/ProductCard';

// const STORAGE_KEY = 'saved_address'; // Removed

// Similar products helper removed - using API


export default function Checkout() {
  const { cart, updateQuantity, clearCart, addToCart, removeFromCart, refreshCart, loading: cartLoading } = useCart();
  const { addOrder } = useOrders();
  const { location: userLocation } = useLocationContext();
  const { showToast: showGlobalToast } = useToast();
  const { user, updateUser } = useAuth();
  const { addToWishlist: contextAddToWishlist } = useWishlist();
  const navigate = useNavigate();
  const [tipAmount, setTipAmount] = useState<number | null>(null);
  const [customTipAmount, setCustomTipAmount] = useState<number>(0);
  const [showCustomTipInput, setShowCustomTipInput] = useState(false);
  const [savedAddress, setSavedAddress] = useState<OrderAddress | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<OrderAddress | null>(null);
  const [showCouponSheet, setShowCouponSheet] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<ApiCoupon | null>(null);
  const [showPartyPopper, setShowPartyPopper] = useState(false);
  const [hasAppliedCouponBefore, setHasAppliedCouponBefore] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  // Refresh cart delivery fee when selected address changes
  useEffect(() => {
    if (selectedAddress?.latitude && selectedAddress?.longitude) {
      refreshCart(selectedAddress.latitude, selectedAddress.longitude);
    }
  }, [selectedAddress]);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<ApiCoupon[]>([]);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatedDiscount, setValidatedDiscount] = useState<number>(0);
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [showGstinSheet, setShowGstinSheet] = useState(false);
  const [gstin, setGstin] = useState<string>('');
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false);
  const [giftPackaging, setGiftPackaging] = useState<boolean>(false);
  const [useWalletBalance, setUseWalletBalance] = useState<boolean>(false);
  const [hasAutoAppliedWallet, setHasAutoAppliedWallet] = useState<boolean>(false);

  // Profile completion modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: '', email: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Map Picker State
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapLocation, setMapLocation] = useState<{ lat: number, lng: number, address?: any } | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isMapSelected, setIsMapSelected] = useState(false);

  // Razorpay Payment State
  const [showRazorpayCheckout, setShowRazorpayCheckout] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI' | 'Wallet'>('UPI');

  // Delivery Slot State
  const [availableSlots, setAvailableSlots] = useState<Array<{ _id: string; name: string; label: string; startTime: string; endTime: string }>>([]);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlotSelection | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);


  // Check if user has placeholder data (needs profile completion)
  const isPlaceholderUser = user?.name === 'User' || user?.email?.endsWith('@villagebasket.temp');

  // Redirect if empty
  useEffect(() => {
    if (!cartLoading && cart.items.length === 0 && !showOrderSuccess) {
      navigate('/user');
    }
  }, [cart.items.length, cartLoading, navigate, showOrderSuccess]);

  // Load addresses and coupons
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [addressResponse, couponResponse, profileResponse] = await Promise.all([
          getAddresses(),
          getCoupons(),
          getProfile()
        ]);

        // Update user profile globally to refresh wallet amount
        if (profileResponse.success) {
          updateUser(profileResponse.data);

          // Auto-apply wallet by default if they have balance and it hasn't been set yet
          if (profileResponse.data.walletAmount > 0 && !hasAutoAppliedWallet) {
            setUseWalletBalance(true);
            setHasAutoAppliedWallet(true);
          }
        }

        if (addressResponse.success && Array.isArray(addressResponse.data) && addressResponse.data.length > 0) {
          const defaultAddr = addressResponse.data.find((a: any) => a.isDefault) || addressResponse.data[0];
          const mappedAddress: OrderAddress = {
            name: defaultAddr.fullName,
            phone: defaultAddr.phone,
            flat: '',
            street: defaultAddr.address,
            city: defaultAddr.city,
            state: defaultAddr.state,
            pincode: defaultAddr.pincode,
            landmark: defaultAddr.landmark || '',
            latitude: defaultAddr.latitude,
            longitude: defaultAddr.longitude,
            id: defaultAddr._id,
            _id: defaultAddr._id
          };
          setSavedAddress(mappedAddress);
          setSelectedAddress(mappedAddress);
        }

        if (couponResponse.success) {
          setAvailableCoupons(couponResponse.data);
        }
      } catch (error) {
        console.error('Error loading checkout data:', error);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch active delivery slots
  useEffect(() => {
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await getActiveDeliverySlots();
        if (res.success) {
          // Sort slots based on the order: Early morning, morning, afternoon, evening, night
          const getSlotPriority = (name: string) => {
            const n = (name || '').toLowerCase();
            if (n.includes('early')) return 0;
            if (n.includes('morning')) return 1;
            if (n.includes('afternoon') || n.includes('noon')) return 2;
            if (n.includes('evening')) return 3;
            if (n.includes('night')) return 4;
            return 5;
          };

          const sortedSlots = [...res.data].sort((a, b) => {
            const priorityA = getSlotPriority(a.name);
            const priorityB = getSlotPriority(b.name);
            if (priorityA !== priorityB) return priorityA - priorityB;
            // Fallback to startTime if names have the same priority
            return (a.startTime || '').localeCompare(b.startTime || '');
          });

          setAvailableSlots(sortedSlots);
        }
      } catch (e) {
        console.error('Failed to load delivery slots', e);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, []);

  // Fetch similar products dynamically
  useEffect(() => {
    const fetchSimilar = async () => {
      const items = (cart?.items || []).filter(item => item && item.product);
      if (items.length === 0) return;

      const cartItem = items[0];
      try {
        let response;
        if (cartItem && cartItem.product) {
          // Try to fetch by category of the first item
          let catId = '';
          const product = cartItem.product;

          if (product.categoryId) {
            catId = typeof product.categoryId === 'string'
              ? product.categoryId
              : (product.categoryId as any)._id || (product.categoryId as any).id;
          }

          if (catId) {
            response = await getProducts({ category: catId, limit: 10 });
          } else {
            response = await getProducts({ limit: 10, sort: 'popular' });
          }
        } else {
          response = await getProducts({ limit: 10, sort: 'popular' });
        }

        if (response && response.data) {
          // Filter out items already in cart
          const itemsInCartIds = new Set((cart?.items || []).map(i => i.product?.id || i.product?._id).filter(Boolean));
          const filtered = response.data
            .filter((p: any) => !itemsInCartIds.has(p.id || p._id))
            .map((p: any) => {
              const { displayPrice, mrp } = calculateProductPrice(p);
              return {
                ...p,
                id: p._id || p.id,
                name: p.productName || p.name || 'Product',
                imageUrl: p.mainImage || p.imageUrl || p.mainImageUrl || '',
                price: displayPrice,
                mrp: mrp,
                pack: (() => {
                  const v = p.variations?.[0];
                  if (!v) return (p.pack || 'Standard').trim();
                  const vName = (v.name || '').trim();
                  const isPlaceholder = !vName || vName.toLowerCase() === 'variation' || vName.toLowerCase() === 'standard';
                  return (isPlaceholder ? (v.value || v.title || vName) : vName).trim() || (p.pack || 'Standard').trim();
                })(),
              };
            })
            .slice(0, 6);
          setSimilarProducts(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch similar products", err);
      }
    };
    fetchSimilar();
  }, [cart?.items?.length]);

  if (cartLoading || ((cart?.items?.length || 0) === 0 && !showOrderSuccess)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#8B3D28] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-neutral-600 font-poppins">
            {cartLoading ? 'Loading checkout...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  const displayItems = (cart?.items || []).filter(item => item && item.product);
  const displayCart = {
    ...cart,
    items: displayItems,
    itemCount: displayItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    total: displayItems.reduce((sum, item) => {
      const { displayPrice } = calculateProductPrice(item.product, item.variant);
      return sum + displayPrice * (item.quantity || 0);
    }, 0)
  };

  const freeDeliveryThreshold = cart.freeDeliveryThreshold ?? appConfig.freeDeliveryThreshold;
  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - (displayCart.total || 0));
  const cartItem = displayItems[0];

  /* DEBUG: Display Backend Configuration */
  const dbgConfig = (cart as any).debug_config;

  const itemsTotal = displayItems.reduce((sum, item) => {
    if (!item?.product) return sum;
    const { mrp } = calculateProductPrice(item.product, item.variant);
    return sum + (mrp * (item.quantity || 0));
  }, 0);

  const discountedTotal = displayCart.total;
  const savedAmount = itemsTotal - discountedTotal;
  const handlingCharge = cart.platformFee ?? appConfig.platformFee;

  // Use dynamic delivery fee if available (and valid), otherwise fallback to static config
  const deliveryCharge = (displayCart.estimatedDeliveryFee !== undefined)
    ? displayCart.estimatedDeliveryFee
    : (displayCart.total >= freeDeliveryThreshold ? 0 : appConfig.deliveryFee);

  // Recalculate or use validated discount
  // If we have a selected coupon, we should re-validate if cart total changes,
  // but for simplicity, we'll re-calculate locally if possible or trust the previous validation if acceptable (better to re-validate)
  const subtotalBeforeCoupon = discountedTotal + handlingCharge + deliveryCharge;

  // Local calculation for immediate feedback, relying on backend validation on Apply
  let currentCouponDiscount = 0;
  if (selectedCoupon) {
    // Logic mirrors backend for UI update purposes
    if (selectedCoupon.minOrderValue && subtotalBeforeCoupon < selectedCoupon.minOrderValue) {
      // Invalid now
    } else {
      if (selectedCoupon.discountType === 'percentage') {
        currentCouponDiscount = Math.round((subtotalBeforeCoupon * selectedCoupon.discountValue) / 100);
        if (selectedCoupon.maxDiscountAmount && currentCouponDiscount > selectedCoupon.maxDiscountAmount) {
          currentCouponDiscount = selectedCoupon.maxDiscountAmount;
        }
      } else {
        currentCouponDiscount = selectedCoupon.discountValue;
      }
    }
  }

  const finalTipAmount = showCustomTipInput ? customTipAmount : (tipAmount || 0);
  const giftPackagingFee = giftPackaging ? 30 : 0;
  const billTotal = Math.max(0, discountedTotal + handlingCharge + deliveryCharge + finalTipAmount + giftPackagingFee - currentCouponDiscount);
  const walletAmountToUse = useWalletBalance ? Math.min(user?.walletAmount || 0, billTotal) : 0;
  const grandTotal = billTotal - walletAmountToUse;

  const handleApplyCoupon = async (coupon: ApiCoupon) => {
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const result = await validateCoupon(coupon.code, subtotalBeforeCoupon);
      if (result.success && result.data?.isValid) {
        const isFirstTime = !hasAppliedCouponBefore;
        setSelectedCoupon(coupon);
        setValidatedDiscount(result.data.discountAmount);
        setShowCouponSheet(false);
        if (isFirstTime) {
          setHasAppliedCouponBefore(true);
          setShowPartyPopper(true);
        }
      } else {
        setCouponError(result.message || 'Invalid coupon');
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setSelectedCoupon(null);
    setValidatedDiscount(0);
    setCouponError(null);
  };

  const handleMoveToWishlist = async (product: any) => {
    if (!product?.id && !product?._id) return;
    const productId = product.id || product._id;

    try {
      // Add to wishlist using context
      await contextAddToWishlist(productId);
      // Remove from cart
      await removeFromCart(productId);
      // Show success message
      showGlobalToast('Item moved to wishlist');
    } catch (error: any) {
      console.error('Failed to move to wishlist:', error);
      const msg = error.message || 'Failed to move item to wishlist';
      showGlobalToast(msg, 'error');
    }
  };

  const handlePlaceOrder = async (arg?: any) => {
    // Only bypass if explicitly passed true (handles event objects from onClick)
    const bypassProfileCheck = arg === true;

    if (!selectedAddress || cart.items.length === 0) {
      return;
    }

    // Check if delivery shift is selected
    if (!selectedSlot) {
      showGlobalToast('Please select a delivery slot', 'error');
      return;
    }

    // Check if user needs to complete their profile first
    if (!bypassProfileCheck && isPlaceholderUser) {
      setProfileFormData({ name: user?.name === 'User' ? '' : (user?.name || ''), email: user?.email?.endsWith('@villagebasket.temp') ? '' : (user?.email || '') });
      setShowProfileModal(true);
      return;
    }

    // Validate required address fields
    if (!selectedAddress.city || !selectedAddress.pincode) {
      console.error("Address is missing required fields (city or pincode)");
      alert("Please ensure your address has city and pincode.");
      return;
    }

    // Use user's current location as fallback if address doesn't have coordinates
    const finalLatitude = selectedAddress.latitude ?? userLocation?.latitude;
    const finalLongitude = selectedAddress.longitude ?? userLocation?.longitude;

    // Validate that we have location data (either from address or user's current location)
    if (finalLatitude == null || finalLongitude == null) {
      console.error("Address is missing location data (latitude/longitude) and user location is not available");
      alert("Location is required for delivery. Please ensure your address has location data or enable location access.");
      return;
    }

    // Create address object with location data (use fallback if needed)
    const addressWithLocation: OrderAddress = {
      ...selectedAddress,
      latitude: finalLatitude,
      longitude: finalLongitude,
    };

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const order: Order = {
      id: orderId,
      items: cart.items,
      totalItems: cart.itemCount || 0,
      subtotal: discountedTotal,
      fees: {
        platformFee: handlingCharge,
        deliveryFee: deliveryCharge,
      },
      totalAmount: grandTotal,
      address: addressWithLocation,
      status: paymentMethod === 'COD' ? 'Received' : 'Pending', // COD is received immediately, UPI is pending until payment
      paymentMethod: paymentMethod, // Pass selected payment method
      createdAt: new Date().toISOString(),
      tipAmount: finalTipAmount,
      gstin: gstin || undefined,
      couponCode: selectedCoupon?.code || undefined,
      giftPackaging: giftPackaging,
      deliverySlot: selectedSlot || undefined,
      walletAmountUsed: walletAmountToUse,
    };

    try {
      // Create the order
      const placedId = await addOrder(order);
      if (placedId) {
        // If order is fully covered by wallet or is COD/Wallet payment
        if (paymentMethod === 'COD' || paymentMethod === 'Wallet' || grandTotal <= 0) {
          // Success is immediate
          setPlacedOrderId(placedId);
          setShowOrderSuccess(true);
          clearCart();
          showGlobalToast(grandTotal <= 0 ? 'Order paid via Wallet!' : 'Order placed successfully!', 'success');

          // Refresh user profile to reflect balance deduction
          const updatedProfile = await getProfile();
          if (updatedProfile.success) {
            updateUser(updatedProfile.data);
          }
        } else {
          // For UPI with remaining balance, trigger Razorpay
          setPendingOrderId(placedId);
          setShowRazorpayCheckout(true);
        }
      }
    } catch (error: any) {
      console.error("Order placement failed", error);
      // Show user-friendly error message
      const errorMessage = error.message || error.response?.data?.message || "Failed to place order. Please try again.";
      alert(errorMessage);
    }
  };



  const handleGoToOrders = () => {
    if (placedOrderId) {
      navigate(`/user/orders/${placedOrderId}`);
    } else {
      navigate('/user/orders');
    }
  };

  const handleUpdateLocation = async () => {
    if (!selectedAddress?.id || !mapLocation) return;
    setIsUpdatingLocation(true);
    try {
      // Prepare update payload
      const updatePayload: any = {
        latitude: mapLocation.lat,
        longitude: mapLocation.lng
      };

      // If address details are available from map, update them too
      if (mapLocation.address) {
        if (mapLocation.address.street) updatePayload.address = mapLocation.address.street;
        if (mapLocation.address.city) updatePayload.city = mapLocation.address.city;
        if (mapLocation.address.state) updatePayload.state = mapLocation.address.state;
        if (mapLocation.address.pincode) updatePayload.pincode = mapLocation.address.pincode;
        if (mapLocation.address.landmark) updatePayload.landmark = mapLocation.address.landmark;
      }

      // Update the address in backend
      await updateAddress(selectedAddress.id, updatePayload);

      // Update local state
      const updated = {
        ...selectedAddress,
        latitude: mapLocation.lat,
        longitude: mapLocation.lng,
        street: mapLocation.address?.street || selectedAddress.street,
        city: mapLocation.address?.city || selectedAddress.city,
        state: mapLocation.address?.state || selectedAddress.state,
        pincode: mapLocation.address?.pincode || selectedAddress.pincode,
        landmark: mapLocation.address?.landmark || selectedAddress.landmark,
      };
      setSelectedAddress(updated);
      setSavedAddress(updated); // Sync
      setShowMapPicker(false);
      setIsMapSelected(true); // Mark map as selected
      showGlobalToast('Location and address updated successfully!');
    } catch (err) {
      console.error(err);
      // showGlobalToast('Failed to update location');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // Handle profile completion submission
  const handleProfileSubmit = async () => {
    if (!profileFormData.name.trim() || !profileFormData.email.trim()) {
      setProfileError('Please enter both name and email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileFormData.email)) {
      setProfileError('Please enter a valid email address');
      return;
    }

    setIsUpdatingProfile(true);
    setProfileError(null);

    try {
      const response = await updateProfile({
        name: profileFormData.name.trim(),
        email: profileFormData.email.trim(),
      });

      if (response.success) {
        // Update local user data
        updateUser({
          ...user,
          id: user?.id || '',
          name: response.data.name,
          email: response.data.email,
        });

        setShowProfileModal(false);
        showGlobalToast('Profile updated successfully!');

        // Directly trigger order placement, bypassing the profile check
        handlePlaceOrder(true);
      }
    } catch (error: any) {
      setProfileError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };


  return (
    <div
      className="bg-transparent min-h-screen flex flex-col opacity-100"
      style={{ opacity: 1 }}
    >


      {/* Party Popper Animation */}
      <PartyPopper
        show={showPartyPopper}
        onComplete={() => setShowPartyPopper(false)}
      />

      {/* Profile Completion Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Complete Your Profile</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Please provide your name and email to continue with your order.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileFormData.name}
                    onChange={(e) => setProfileFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#8B3D28] transition-colors"
                    disabled={isUpdatingProfile}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileFormData.email}
                    onChange={(e) => setProfileFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#8B3D28] transition-colors"
                    disabled={isUpdatingProfile}
                  />
                </div>

                {profileError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{profileError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                    disabled={isUpdatingProfile}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileSubmit}
                    disabled={isUpdatingProfile || !profileFormData.name.trim() || !profileFormData.email.trim()}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${isUpdatingProfile || !profileFormData.name.trim() || !profileFormData.email.trim()
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : 'bg-[#8B3D28] text-white hover:bg-[#722F1E]'
                      }`}
                  >
                    {isUpdatingProfile ? 'Saving...' : 'Save & Continue'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Picker Modal */}
      <AnimatePresence>
        {showMapPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowMapPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl overflow-hidden w-full max-w-lg shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-neutral-900">Pin Delivery Location</h3>
                <button onClick={() => setShowMapPicker(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <GoogleMapsLocationPicker
                initialLat={mapLocation?.lat || userLocation?.latitude || selectedAddress?.latitude || 0}
                initialLng={mapLocation?.lng || userLocation?.longitude || selectedAddress?.longitude || 0}
                onLocationSelect={(lat, lng, address) => setMapLocation({ lat, lng, address })}
                height="300px"
              />

              <div className="p-4 bg-white border-t">
                <p className="text-xs text-neutral-500 mb-3 text-center">
                  Move the map to set your exact delivery location
                </p>
                <button
                  onClick={handleUpdateLocation}
                  disabled={isUpdatingLocation}
                  className="w-full py-3 bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isUpdatingLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : 'Confirm Location'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Success Celebration Page */}
      {showOrderSuccess && (
        <div
          className="fixed inset-0 z-[70] bg-white flex flex-col items-center justify-center h-screen w-screen overflow-hidden"
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          {/* Confetti Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Animated confetti pieces */}
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
                  animation: `confettiFall ${2 + Math.random() * 2}s linear ${Math.random() * 2}s infinite`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            ))}
          </div>

          {/* Success Content */}
          <div className="relative z-10 flex flex-col items-center px-6">
            {/* Success Tick Circle */}
            <div
              className="relative mb-8"
              style={{ animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' }}
            >
              {/* Outer ring animation */}
              <div
                className="absolute inset-0 w-32 h-32 rounded-full border-4 border-[#8B3D28]"
                style={{
                  animation: 'ringPulse 1.5s ease-out infinite',
                  opacity: 0.3
                }}
              />
              {/* Main circle */}
              <div className="w-32 h-32 bg-gradient-to-br from-[#8B3D28] to-[#722F1E] rounded-full flex items-center justify-center shadow-2xl">
                <svg
                  className="w-16 h-16 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: 'checkDraw 0.5s ease-out 0.5s both' }}
                >
                  <path d="M5 12l5 5L19 7" className="check-path" />
                </svg>
              </div>
              {/* Sparkles */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    animation: `sparkle 0.6s ease-out ${0.3 + i * 0.1}s both`,
                    transform: `rotate(${i * 60}deg) translateY(-80px)`,
                  }}
                />
              ))}
            </div>

            {/* Location Info */}
            <div
              className="text-center"
              style={{ animation: 'slideUp 0.5s ease-out 0.6s both' }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-5 h-5 text-red-500">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedAddress?.city || "Your Location"}
                </h2>
              </div>
              <p className="text-gray-500 text-base">
                {selectedAddress ? `${selectedAddress.street}, ${selectedAddress.city}` : "Delivery Address"}
              </p>
            </div>

            {/* Order Placed Message with Details */}
            <div
              className="mt-12 text-center"
              style={{ animation: 'slideUp 0.5s ease-out 0.8s both' }}
            >
              <div className="flex flex-col items-center gap-2 mb-4">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] bg-neutral-50 px-3 py-1 rounded-full border border-neutral-100">
                  ID: {placedOrderId}
                </span>
                <div className={`px-4 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm border-b-4 ${paymentMethod === 'COD'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                  Payment: {paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'}
                </div>
              </div>
              <h3 className="text-3xl font-black font-poppins text-[#8B3D28] mb-2 tracking-tight">Order Placed!</h3>
              <p className="text-gray-500 font-medium italic">"Your organic harvest is on its way to you..."</p>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGoToOrders}
              className="mt-10 bg-[#8B3D28] hover:bg-[#722F1E] text-white font-bold font-poppins py-4 px-12 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105"
              style={{ animation: 'slideUp 0.5s ease-out 1s both' }}
            >
              Track Your Order
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="px-4 md:px-6 lg:px-8 py-2 md:py-3 flex items-center justify-between">
          {/* Back Arrow */}
          <button
            onClick={() => navigate(-1)}
            className="w-7 h-7 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Title */}
          <h1 className="text-base font-black text-neutral-900 font-poppins">Checkout</h1>

          {/* Spacer to maintain layout */}
          <div className="w-7 h-7"></div>
        </div>
      </div>

      {/* Ordering for someone else */}
      <div className="px-4 md:px-6 lg:px-8 py-2 md:py-3 bg-neutral-50 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-700">Ordering for someone else?</span>
          <button
            onClick={() => navigate('/user/checkout/address', {
              state: {
                editAddress: savedAddress
              }
            })}
            className="text-xs text-[#8B3D28] font-bold hover:text-[#722F1E] transition-colors font-poppins"
          >
            Add details
          </button>
        </div>
      </div>

      {/* Saved Address Section */}
      {savedAddress && (
        <div className="px-4 md:px-6 lg:px-8 py-2 md:py-3 border-b border-neutral-200">
          <div className="mb-2">
            <h3 className="text-xs font-semibold text-neutral-900 mb-0.5">Delivery Address</h3>
            <p className="text-[10px] text-neutral-600">Select or edit your saved address</p>
          </div>

          <div
            className={`border rounded-lg p-2.5 cursor-pointer transition-all ${selectedAddress && !isMapSelected ? 'border-[#8B3D28] bg-[#8B3D28]/10' : 'border-neutral-300 bg-white'
              }`}
            onClick={() => {
              setSelectedAddress(savedAddress);
              setIsMapSelected(false);
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddress && !isMapSelected ? 'border-[#8B3D28] bg-[#8B3D28]' : 'border-neutral-400'
                    }`}>
                    {selectedAddress && !isMapSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-neutral-900">{savedAddress.name}</span>
                </div>
                <p className="text-[10px] text-neutral-600 mb-0.5">{savedAddress.phone}</p>
                <p className="text-[10px] text-neutral-600">
                  {savedAddress.flat ? `${savedAddress.flat}, ` : ''}{savedAddress.street}
                  {savedAddress.landmark ? <>, <span className="font-bold text-[#8B3D28]">Near {savedAddress.landmark}</span></> : ''}
                  , {savedAddress.city} - {savedAddress.pincode}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/user/checkout/address', {
                    state: {
                      editAddress: savedAddress
                    }
                  });
                }}
                className="text-xs text-[#8B3D28] font-bold ml-2 font-poppins"
              >
                Edit
              </button>
            </div>
          </div>
          {/* Set Location on Map Button */}
          <div className="mt-2.5">
            <button
              onClick={() => {
                // Prioritize current GPS location (matches homepage header), then saved address
                setMapLocation({
                  lat: userLocation?.latitude || selectedAddress?.latitude || 0,
                  lng: userLocation?.longitude || selectedAddress?.longitude || 0
                });
                setShowMapPicker(true);
              }}

              className={`flex items-center gap-3 text-base font-black px-5 py-4 rounded-xl w-full justify-center transition-colors font-poppins ${isMapSelected
                ? 'text-[#8B3D28] bg-[#8B3D28]/10 border-2 border-[#8B3D28] ring-2 ring-[#8B3D28]/30'
                : 'text-[#8B3D28] hover:text-[#722F1E] bg-[#8B3D28]/5 border-2 border-[#8B3D28]/20 hover:border-[#8B3D28]/40'
                }`}
            >
              {isMapSelected ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {isMapSelected ? 'Precise Location Selected' : (selectedAddress?.latitude ? 'Update Precise Location on Map' : 'Set Exact Location on Map')}
            </button>
          </div>
        </div>
      )}

      {/* Main Product Card */}
      <div className="px-4 md:px-6 lg:px-8 py-2 md:py-3 bg-white border-b border-neutral-200">
        <div className="bg-white rounded-lg border border-neutral-200 p-2.5">
          <p className="text-[10px] text-neutral-600 mb-2.5">Shipment of {displayCart.itemCount || 0} {(displayCart.itemCount || 0) === 1 ? 'item' : 'items'}</p>

          {/* Cart Items */}
          <div className="space-y-2.5">
            {displayItems.filter(item => item && item.product).map((item) => (
              <div key={(item.product?.id || item.product?._id) || Math.random().toString()} className="flex gap-2">
                {/* Product Image */}
                <div className="w-12 h-12 bg-neutral-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product?.imageUrl ? (
                    <img
                      src={item.product?.imageUrl}
                      alt={item.product?.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      {(item.product?.name || '').charAt(0)}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-neutral-900 mb-0.5 line-clamp-2">
                    {item.product?.name}
                  </h3>
                  <p className="text-[10px] text-neutral-600 mb-0.5">
                    {item.quantity} × {item.variant || (item.product as any).variantTitle || (item.product as any).pack || item.product?.pack}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveToWishlist(item.product);
                    }}
                    className="text-[10px] text-[#8B3D28] font-bold mb-1.5 hover:text-[#722F1E] transition-colors font-poppins"
                  >
                    Move to wishlist
                  </button>

                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1.5 bg-white border-2 border-[#8B3D28] rounded-full px-1.5 py-0.5">
                      <button
                        onClick={() => updateQuantity((item.product?.id || item.product?._id) as string, item.quantity - 1, item.variant || (item.product as any).variantId, (item.product as any).variantTitle || (item.product as any).pack)}
                        className="w-5 h-5 flex items-center justify-center text-[#8B3D28] font-bold hover:bg-[#8B3D28]/10 rounded-full transition-colors text-xs"
                      >
                        −
                      </button>
                      <QuantityInput
                        value={item.quantity}
                        min={0}
                        onChange={(val) => updateQuantity((item.product?.id || item.product?._id) as string, val, item.variant || (item.product as any).variantId, (item.product as any).variantTitle || (item.product as any).pack)}
                        className="text-xs font-bold text-[#8B3D28] w-8 text-center font-poppins bg-transparent border-none focus:outline-none"
                      />
                      <button
                        onClick={() => updateQuantity((item.product?.id || item.product?._id) as string, item.quantity + 1, item.variant || (item.product as any).variantId, (item.product as any).variantTitle || (item.product as any).pack)}
                        className="w-5 h-5 flex items-center justify-center text-[#8B3D28] font-bold hover:bg-[#8B3D28]/10 rounded-full transition-colors text-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    {(() => {
                      const { displayPrice, mrp, hasDiscount } = calculateProductPrice(item.product, item.variant);
                      return (
                        <div className="flex items-center gap-1.5">
                          {hasDiscount && (
                            <span className="text-[10px] text-neutral-500 line-through">
                              ₹{mrp}
                            </span>
                          )}
                          <span className="text-sm font-bold text-neutral-900">
                            ₹{displayPrice}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delivery Time Slot Selection */}
      <div className="px-4 md:px-6 lg:px-8 py-4 bg-white border-b border-neutral-200">
        <h2 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Choose Delivery Time Slot
          {availableSlots.length > 0 && <span className="text-red-500 font-bold">*</span>}
        </h2>

        {slotsLoading ? (
          <div className="flex items-center gap-2 py-3">
            <div className="w-4 h-4 border-2 border-[#8B3D28] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-neutral-500">Loading available slots...</span>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <p className="text-xs text-neutral-500 font-medium">No delivery slots available. We'll deliver at the earliest!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {availableSlots.map(slot => {
              const isSelected = selectedSlot?.slotId === slot._id;
              const getIcon = (name: string) => {
                const n = (name || '').toLowerCase();
                if (n.includes('morning') || n.includes('early')) return '🌅';
                if (n.includes('afternoon') || n.includes('noon')) return '☀️';
                if (n.includes('evening')) return '🌆';
                if (n.includes('night')) return '🌙';
                return '🕐';
              };
              return (
                <button
                  key={slot._id}
                  onClick={() => setSelectedSlot({
                    slotId: slot._id,
                    name: slot.name,
                    label: slot.label,
                    timeRange: slot.label,
                  })}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${isSelected
                      ? 'border-[#8B3D28] bg-[#8B3D28]/10 text-[#8B3D28]'
                      : 'border-neutral-100 bg-neutral-50 text-neutral-600 hover:border-neutral-200'
                    }`}
                >
                  <span className="text-xl">{getIcon(slot.name)}</span>
                  <span className="text-xs font-bold font-poppins text-center leading-tight">{slot.name || 'Delivery Slot'}</span>
                  <span className="text-[10px] opacity-80 font-medium">{slot.label}</span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#8B3D28]">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {availableSlots.length > 0 && !selectedSlot && (
          <p className="text-[10px] text-amber-600 mt-2 font-medium">Please select a delivery time slot to proceed</p>
        )}
        {selectedSlot && (
          <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span className="text-xs text-green-700 font-semibold">
              Slot: {selectedSlot.name} · {selectedSlot.label}
            </span>
          </div>
        )}
      </div>

      {/* You might also like */}
      <div className="px-4 md:px-6 lg:px-8 py-2.5 md:py-3 border-b border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-900 mb-2">You might also like</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3" style={{ scrollSnapType: 'x mandatory' }}>
          {similarProducts.map((p) => (
            <div
              key={p.id || p._id}
              className="flex-shrink-0 w-36"
              style={{ scrollSnapAlign: 'start' }}
            >
              <ProductCard
                product={p}
                compact={true}
                showBadge={true}
                showHeartIcon={true}
                categoryStyle={true}
                className="!bg-white !shadow-none !border-neutral-100"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Get FREE delivery banner */}
      {deliveryCharge > 0 && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-2 mb-1.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13h14M5 13l4-4m-4 4l4 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="18" cy="5" r="2" fill="#3b82f6" />
            </svg>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700">Get FREE delivery</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18l6-6-6-6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[10px] text-blue-600 mt-0.5">Add products worth ₹{amountNeededForFreeDelivery} more</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.min(100, ((199 - amountNeededForFreeDelivery) / 199) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Coupon Section */}
      {selectedCoupon ? (
        <div className="px-4 py-1.5 border-b border-neutral-200">
          <div className="flex items-center justify-between bg-[#8B3D28]/5 rounded-lg p-2 border border-[#8B3D28]/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#8B3D28] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[#8B3D28] truncate font-poppins">{selectedCoupon.code}</p>
                <p className="text-[10px] text-[#8B3D28]/80 truncate font-medium">{selectedCoupon.title}</p>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-xs text-[#8B3D28] font-black ml-2 flex-shrink-0 font-poppins"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-1.5 flex justify-end border-b border-neutral-200">
          <button
            onClick={() => setShowCouponSheet(true)}
            className="text-xs text-neutral-600 flex items-center gap-1"
          >
            See all coupons
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Payment Method Selection */}
      <div className="px-4 md:px-6 lg:px-8 py-4 border-b border-neutral-200 bg-stone-50/30">
        <h2 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          Payment Method
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {/* UPI Option */}
          <button
            onClick={() => setPaymentMethod('UPI')}
            className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative overflow-hidden ${paymentMethod === 'UPI'
                ? 'border-[#8B3D28] bg-white text-[#8B3D28] shadow-sm'
                : 'border-neutral-100 bg-white text-neutral-500 opacity-80'
              }`}
          >
            <div className={`p-2 rounded-full ${paymentMethod === 'UPI' ? 'bg-[#8B3D28]/10 text-[#8B3D28]' : 'bg-neutral-50 text-neutral-400'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xs font-black font-poppins uppercase tracking-wider">UPI / Online</span>
            <p className="text-[9px] font-medium opacity-60">Pay via App / Card</p>
            {paymentMethod === 'UPI' && (
              <div className="absolute top-0 right-0 p-1">
                <div className="bg-[#8B3D28] text-white rounded-bl-lg p-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              </div>
            )}
          </button>

          {/* COD Option */}
          <button
            onClick={() => setPaymentMethod('COD')}
            className={`p-3.5 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative overflow-hidden ${paymentMethod === 'COD'
                ? 'border-[#8B3D28] bg-white text-[#8B3D28] shadow-sm'
                : 'border-neutral-100 bg-white text-neutral-500 opacity-80'
              }`}
          >
            <div className={`p-2 rounded-full ${paymentMethod === 'COD' ? 'bg-[#8B3D28]/10 text-[#8B3D28]' : 'bg-neutral-50 text-neutral-400'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
            </div>
            <span className="text-xs font-black font-poppins uppercase tracking-wider">Cash on Delivery</span>
            <p className="text-[9px] font-medium opacity-60">Pay at your doorstep</p>
            {paymentMethod === 'COD' && (
              <div className="absolute top-0 right-0 p-1">
                <div className="bg-[#8B3D28] text-white rounded-bl-lg p-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              </div>
            )}
          </button>

        </div>
        {/* Use Wallet Balance Toggle */}
        {(user?.walletAmount ?? 0) > 0 && paymentMethod !== 'Wallet' && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <button
              onClick={() => setUseWalletBalance(!useWalletBalance)}
              className={`w-full flex items-center justify-between rounded-xl p-3.5 transition-all ${useWalletBalance
                  ? 'bg-[#8B3D28]/5 border-2 border-[#8B3D28] shadow-sm'
                  : 'bg-white border-2 border-neutral-100 hover:border-neutral-200'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${useWalletBalance ? 'bg-[#8B3D28] text-white' : 'bg-neutral-100 text-neutral-400'
                  }`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    {useWalletBalance ? <path d="M20 6L9 17l-5-5" /> : <rect x="3" y="3" width="18" height="18" rx="2" />}
                  </svg>
                </div>
                <div className="text-left">
                  <p className={`text-xs font-black font-poppins uppercase tracking-wide ${useWalletBalance ? 'text-[#8B3D28]' : 'text-neutral-900'}`}>
                    Use Village Wallet Balance
                  </p>
                  <p className="text-[10px] font-medium text-neutral-500">
                    {useWalletBalance
                      ? `Remaining: ₹${(user?.walletAmount ?? 0) - walletAmountToUse}`
                      : `Available: ₹${user?.walletAmount || 0}`}
                  </p>
                </div>
              </div>
              {useWalletBalance && (
                <span className="text-xs font-black text-[#8B3D28] font-poppins">-₹{walletAmountToUse}</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Bill details */}
      <div className="px-4 md:px-6 lg:px-8 py-2.5 md:py-3 border-b border-neutral-200">
        <h2 className="text-base font-bold text-neutral-900 mb-2.5">Bill details</h2>

        <div className="space-y-2">
          {/* Items total */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-700">Items total</span>
              {savedAmount > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                  Saved ₹{savedAmount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {itemsTotal > discountedTotal && (
                <span className="text-xs text-neutral-500 line-through">₹{itemsTotal}</span>
              )}
              <span className="text-xs font-medium text-neutral-900">₹{discountedTotal}</span>
            </div>
          </div>

          {/* Handling charge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <span className="text-xs text-neutral-700">Handling charge</span>
            </div>
            <span className="text-xs font-medium text-neutral-900">₹{handlingCharge}</span>
          </div>

          {/* Delivery charge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="5.5" cy="18.5" r="1.5" fill="currentColor" />
                <circle cx="18.5" cy="18.5" r="1.5" fill="currentColor" />
              </svg>
              <span className="text-xs text-neutral-700">Delivery charge</span>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-xs font-black font-poppins ${deliveryCharge === 0 ? 'text-[#8B3D28]' : 'text-neutral-900'}`}>
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </span>
              {deliveryCharge > 0 && (
                null
              )}
            </div>
          </div>

          {/* Coupon discount */}
          {selectedCoupon && currentCouponDiscount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs text-neutral-700">Coupon discount</span>
                <span className="text-[10px] bg-[#8B3D28]/10 text-[#8B3D28] px-1.5 py-0.5 rounded-full font-bold font-poppins">
                  {selectedCoupon.code}
                </span>
              </div>
              <span className="text-xs font-black text-[#8B3D28] font-poppins">-₹{currentCouponDiscount.toLocaleString('en-IN')}</span>
            </div>
          )}

          {/* Tip amount */}
          {finalTipAmount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs text-neutral-700">Tip to delivery partner</span>
              </div>
              <span className="text-xs font-medium text-neutral-900">₹{finalTipAmount}</span>
            </div>
          )}

          {/* Gift Packaging */}
          {giftPackaging && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
                <span className="text-xs text-neutral-700">Gift Packaging</span>
              </div>
              <span className="text-xs font-medium text-neutral-900">₹{giftPackagingFee}</span>
            </div>
          )}

          {/* Delivery Shift */}
          {selectedSlot && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="text-xs text-neutral-700">Delivery Slot</span>
              </div>
              <span className="text-xs font-bold text-[#8B3D28] font-poppins uppercase">
                {selectedSlot.name}
              </span>
            </div>
          )}

          {/* Wallet Discount (if partial) */}
          {useWalletBalance && walletAmountToUse > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B3D28" strokeWidth="2.5">
                  <path d="M19 5H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" />
                </svg>
                <span className="text-xs text-[#8B3D28] font-bold">Wallet Applied</span>
              </div>
              <span className="text-xs font-black text-[#8B3D28] font-poppins">-₹{walletAmountToUse}</span>
            </div>
          )}

          {/* Grand total */}
          <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
            <span className="text-sm font-bold text-neutral-900">Grand total</span>
            <span className="text-sm font-bold text-neutral-900">₹{Math.max(0, grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Add GSTIN */}
      <div className="px-4 py-2 border-b border-neutral-200">
        <button
          onClick={() => setShowGstinSheet(true)}
          className="w-full flex items-center justify-between bg-neutral-50 rounded-lg p-2 hover:bg-neutral-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">%</span>
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-neutral-900">Add GSTIN</p>
              <p className="text-[10px] text-neutral-600">
                {gstin ? `GSTIN: ${gstin}` : 'Claim GST input credit up to 18% on your order'}
              </p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>


      {/* Tip your delivery partner */}
      <div className="px-4 py-2 border-b border-neutral-200">
        <h3 className="text-sm font-bold text-neutral-900 mb-0.5">Tip your delivery partner</h3>
        <p className="text-xs text-neutral-600 mb-2">Your kindness means a lot! 100% of your tip will go directly to your delivery partner.</p>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1.5">
          <button
            onClick={() => {
              setTipAmount(20);
              setShowCustomTipInput(false);
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg border-2 font-bold text-xs font-poppins ${tipAmount === 20 && !showCustomTipInput
              ? 'border-[#8B3D28] bg-[#8B3D28]/10 text-[#8B3D28]'
              : 'border-neutral-300 bg-white text-neutral-700'
              }`}
          >
            😊 ₹20
          </button>
          <button
            onClick={() => {
              setTipAmount(30);
              setShowCustomTipInput(false);
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg border-2 font-bold text-xs font-poppins ${tipAmount === 30 && !showCustomTipInput
              ? 'border-[#8B3D28] bg-[#8B3D28]/10 text-[#8B3D28]'
              : 'border-neutral-300 bg-white text-neutral-700'
              }`}
          >
            🤩 ₹30
          </button>
          <button
            onClick={() => {
              setTipAmount(50);
              setShowCustomTipInput(false);
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg border-2 font-bold text-xs font-poppins ${tipAmount === 50 && !showCustomTipInput
              ? 'border-[#8B3D28] bg-[#8B3D28]/10 text-[#8B3D28]'
              : 'border-neutral-300 bg-white text-neutral-700'
              }`}
          >
            😍 ₹50
          </button>
          <button
            onClick={() => {
              setShowCustomTipInput(true);
              setTipAmount(null);
            }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg border-2 font-bold text-xs font-poppins ${showCustomTipInput
              ? 'border-[#8B3D28] bg-[#8B3D28]/10 text-[#8B3D28]'
              : 'border-neutral-300 bg-white text-neutral-700'
              }`}
          >
            🎁 Custom
          </button>
        </div>

        {/* Custom Tip Input */}
        {showCustomTipInput && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              value={customTipAmount || ''}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 0) {
                  setCustomTipAmount(val);
                }
              }}
              onBlur={(e) => {
                const val = Number(e.target.value);
                if (val < 0) {
                  setCustomTipAmount(0);
                }
              }}
              placeholder="Enter custom tip amount"
              className="flex-1 px-3 py-1.5 bg-white border-2 border-[#8B3D28] rounded-lg text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-[#8B3D28]"
              min="0"
              step="1"
            />
            <button
              onClick={() => {
                setShowCustomTipInput(false);
                setCustomTipAmount(0);
                setTipAmount(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Gift Packaging */}
      <div className="px-4 py-2 border-b border-neutral-200">
        <button
          onClick={() => setGiftPackaging(!giftPackaging)}
          className={`w-full flex items-center justify-between rounded-lg p-2 transition-colors ${giftPackaging
            ? 'bg-[#8B3D28]/5 border-2 border-[#8B3D28]'
            : 'bg-neutral-50 border-2 border-transparent hover:bg-neutral-100'
            }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${giftPackaging
              ? 'border-[#8B3D28] bg-[#8B3D28]'
              : 'border-neutral-400 bg-white'
              }`}>
              {giftPackaging && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <div className="text-left">
              <p className={`text-xs font-black font-poppins ${giftPackaging ? 'text-[#8B3D28]' : 'text-neutral-900'}`}>
                Gift Packaging
              </p>
              <p className="text-[10px] text-neutral-600">
                {giftPackaging ? 'Add ₹30 for gift packaging' : 'Add ₹30 for elegant gift packaging'}
              </p>
            </div>
          </div>
          {giftPackaging && (
            <span className="text-xs font-black text-[#8B3D28] font-poppins">₹30</span>
          )}
        </button>
      </div>

      {/* Cancellation Policy */}
      <div className="px-4 py-2">
        <button
          onClick={() => setShowCancellationPolicy(true)}
          className="text-xs text-neutral-700 hover:text-neutral-900 transition-colors"
        >
          Cancellation Policy
        </button>
      </div>

      {/* Made with love by Village Basket */}
      <div className="px-4 py-2">
        <div className="w-full flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <span className="text-[10px] font-medium">Made with</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              className="text-red-500 text-sm"
            >
              ❤️
            </motion.span>
            <span className="text-[10px] font-medium">by</span>
            <span className="text-[10px] font-black text-[#8B3D28] font-poppins underline decoration-[#8B3D28]/30 underline-offset-2">Village Basket</span>
          </div>
        </div>
      </div>

      {/* GSTIN Sheet Modal */}
      <Sheet open={showGstinSheet} onOpenChange={setShowGstinSheet}>
        <SheetContent side="bottom" className="max-h-[50vh]">
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between mb-2">
              <SheetTitle className="text-base font-bold text-neutral-900">Add GSTIN</SheetTitle>
              <SheetClose onClick={() => setShowGstinSheet(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="px-4 pb-4 mt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                GSTIN Number
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (value.length <= 15) {
                    setGstin(value);
                  }
                }}
                placeholder="Enter 15-character GSTIN"
                className="w-full px-4 py-3 bg-white border-2 border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                maxLength={15}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Format: 15 characters (e.g., 27AAAAA0000A1Z5)
              </p>
            </div>
            <button
              onClick={() => {
                if (gstin.length === 15) {
                  setShowGstinSheet(false);
                } else {
                  alert('Please enter a valid 15-character GSTIN');
                }
              }}
              className="w-full bg-[#8B3D28] text-white py-3 px-4 font-black text-sm uppercase tracking-widest hover:bg-[#722F1E] transition-colors rounded-lg font-poppins"
            >
              Save GSTIN
            </button>
            {gstin && (
              <button
                onClick={() => {
                  setGstin('');
                  setShowGstinSheet(false);
                }}
                className="w-full mt-2 bg-neutral-100 text-neutral-700 py-2 px-4 font-medium text-sm hover:bg-neutral-200 transition-colors rounded-lg"
              >
                Remove GSTIN
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancellation Policy Sheet Modal */}
      <Sheet open={showCancellationPolicy} onOpenChange={setShowCancellationPolicy}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between mb-2">
              <SheetTitle className="text-base font-bold text-neutral-900">Cancellation Policy</SheetTitle>
              <SheetClose onClick={() => setShowCancellationPolicy(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="px-4 pb-4 overflow-y-auto max-h-[calc(85vh-80px)]">
            <div className="space-y-4 mt-4 text-sm text-neutral-700">
              <div>
                <h3 className="font-bold text-neutral-900 mb-2">Order Cancellation</h3>
                <p className="mb-2">
                  You can cancel your order before it is confirmed by the seller. Once confirmed, cancellation may not be possible.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-neutral-900 mb-2">Refund Policy</h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Refunds will be processed within 5-7 business days</li>
                  <li>Refund amount will be credited to your original payment method</li>
                  <li>Delivery charges are non-refundable</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-neutral-900 mb-2">Partial Cancellation</h3>
                <p>
                  Partial cancellation of items in an order is not allowed. You can cancel the entire order or contact customer support for assistance.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-neutral-900 mb-2">Contact Support</h3>
                <p>
                  For any cancellation requests or queries, please contact our customer support team at support@villagebasket.com or call +91-XXXXX-XXXXX
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Coupon Sheet Modal */}
      <Sheet open={showCouponSheet} onOpenChange={setShowCouponSheet}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between mb-2">
              <SheetTitle className="text-base font-bold text-neutral-900">Available Coupons</SheetTitle>
              <SheetClose onClick={() => setShowCouponSheet(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="px-4 pb-4 overflow-y-auto max-h-[calc(85vh-80px)]">
            <div className="space-y-2.5 mt-2">
              {availableCoupons.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <p>No coupons available at the moment.</p>
                </div>
              ) : (
                availableCoupons.map((coupon) => {
                  const subtotalBeforeCoupon = discountedTotal + handlingCharge + deliveryCharge;
                  const meetsMinOrder = !coupon.minOrderValue || subtotalBeforeCoupon >= coupon.minOrderValue;
                  const isSelected = selectedCoupon?._id === coupon._id;

                  return (
                    <div
                      key={coupon._id}
                      className={`border-2 rounded-lg p-2.5 transition-all ${isSelected
                        ? 'border-[#8B3D28] bg-[#8B3D28]/10'
                        : meetsMinOrder
                          ? 'border-neutral-200 bg-white'
                          : 'border-neutral-200 bg-neutral-50 opacity-60'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-[#8B3D28] font-poppins">{coupon.code}</span>
                            <span className="text-xs font-bold text-neutral-900 font-poppins">{coupon.title}</span>
                          </div>
                          <p className="text-[10px] text-neutral-600 mb-1">{coupon.description}</p>
                          {coupon.minOrderValue && (
                            <p className="text-[10px] text-neutral-500">
                              Min. order: ₹{coupon.minOrderValue}
                            </p>
                          )}
                        </div>
                        {isSelected ? (
                          <div className="flex items-center gap-1 text-[#8B3D28]">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-xs font-bold font-poppins">Applied</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => meetsMinOrder && handleApplyCoupon(coupon)}
                            disabled={!meetsMinOrder || isValidatingCoupon}
                            className={`px-3 py-1 rounded text-xs font-black uppercase transition-colors font-poppins shadow-sm ${meetsMinOrder
                              ? 'bg-[#8B3D28] text-white hover:bg-[#722F1E]'
                              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                              }`}
                          >
                            {isValidatingCoupon ? '...' : 'Apply'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom Sticky Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-[60] shadow-lg">
        {selectedAddress ? (
          <button
            onClick={handlePlaceOrder}
            disabled={cart.items.length === 0}
            className={`w-full py-4 px-4 font-black font-poppins text-base uppercase tracking-widest transition-all ${cart.items.length > 0
              ? 'bg-[#8B3D28] text-white hover:bg-[#722F1E] active:scale-95'
              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              }`}
          >
            Place Order
          </button>
        ) : (
          <button
            onClick={() => navigate('/user/checkout/address', {
              state: {
                editAddress: savedAddress
              }
            })}
            className="w-full bg-[#8B3D28] text-white py-4 px-4 font-black font-poppins text-base uppercase tracking-widest hover:bg-[#722F1E] transition-all active:scale-95"
          >
            Choose address
          </button>
        )}
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes checkDraw {
          0% {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
          }
        }

        @keyframes ringPulse {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.3);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }

        @keyframes sparkle {
          0% {
            transform: rotate(var(--rotation, 0deg)) translateY(0) scale(0);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--rotation, 0deg)) translateY(-80px) scale(1);
            opacity: 0;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }

        .check-path {
          stroke-dasharray: 100;
          stroke-dashoffset: 0;
        }
      `}</style>

      {/* Razorpay Checkout Modal */}
      {showRazorpayCheckout && pendingOrderId && user && (
        <RazorpayCheckout
          orderId={pendingOrderId}
          amount={grandTotal}
          customerDetails={{
            name: user.name || 'Customer',
            email: user.email || '',
            phone: user.phone || '',
          }}
          onSuccess={(paymentId) => {
            setShowRazorpayCheckout(false);
            setPlacedOrderId(pendingOrderId);
            setPendingOrderId(null);
            clearCart();
            setShowOrderSuccess(true);
            showGlobalToast('Payment successful!', 'success');

            // Refresh user profile for updated wallet balance
            getProfile().then(res => {
              if (res.success) {
                updateUser(res.data);
              }
            });
          }}
          onFailure={(error) => {
            setShowRazorpayCheckout(false);
            setPendingOrderId(null);
            showGlobalToast(error || 'Payment failed. Please try again.', 'error');
          }}
        />
      )}
    </div>
  );
}

