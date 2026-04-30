import { createContext, useContext, useState, ReactNode, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useLocation } from '../hooks/useLocation';
import { Cart, CartItem } from '../types/cart';
import { Product } from '../types/domain';
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart
} from '../services/api/customerCartService';
import { calculateProductPrice } from '../utils/priceUtils';

const CART_STORAGE_KEY = 'saved_cart';

interface AddToCartEvent {
  product: Product;
  sourcePosition?: { x: number; y: number };
}

interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, sourceElement?: HTMLElement | null, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string, variant?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string, variantTitle?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: (latitude?: number, longitude?: number) => Promise<void>;
  lastAddEvent: AddToCartEvent | null;
  loading: boolean;
  isInitialized: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Extended interface to include Cart Item ID
interface ExtendedCartItem extends CartItem {
  id?: string;
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage for persistence on refresh
  const [items, setItems] = useState<ExtendedCartItem[]>(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filter out items with null/undefined products (corrupted localStorage data)
        return Array.isArray(parsed) ? parsed.filter((item: any) => item?.product) : [];
      } catch (e) {
        console.error("Failed to parse saved cart", e);
      }
    }
    return [];
  });
  const [lastAddEvent, setLastAddEvent] = useState<AddToCartEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const pendingOperationsRef = useRef<Set<string>>(new Set());
  const fetchIdRef = useRef(0);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchedLocationRef = useRef<{ lat?: number; lng?: number }>({});

  const { isAuthenticated, user } = useAuth();
  const isWholesale = user?.customerType === 'wholesale';
  const { location } = useLocation();
  const { showToast } = useToast();

  // Helper to map API cart items to internal CartItem structure
  const mapApiItemsToState = (apiItems: any[]): ExtendedCartItem[] => {
    return apiItems
      .filter((item: any) => item.product) // Safety filter
      .map((item: any) => ({
        id: String(item._id || ''), // Store CartItem ID as string
        product: {
          id: String(item.product._id || item.product.id || ''),
          name: item.product.productName || item.product.name,
          price: item.product.price,
          mrp: item.product.mrp,
          discPrice: item.product.discPrice,
          variations: item.product.variations,
          imageUrl: item.product.mainImage || item.product.imageUrl,
          pack: item.product.pack || '1 unit',
          categoryId: String(item.product.category || ''),
          description: item.product.description,
          minWholesaleQuantity: item.product.minWholesaleQuantity,
          variantId: item.variation // Preserving variation ID/value
        },
        quantity: item.quantity,
        variant: item.variation // Also preserve it here for order placement
      }));
  };

  // Sync to localStorage — debounced to avoid blocking main thread
  const localStorageDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (localStorageDebounceRef.current) clearTimeout(localStorageDebounceRef.current);
    localStorageDebounceRef.current = setTimeout(() => {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }, 300);
  }, [items]);

  // Helper to sync cart from API
  const fetchCart = async (lat?: number, lng?: number) => {
    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);
    if (!isAuthenticated || user?.userType !== 'Customer') {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
        setIsInitialized(true);
      }
      return;
    }

    try {
      // Use provided coordinates or fallback to current location
      const queryLat = lat !== undefined ? lat : location?.latitude;
      const queryLng = lng !== undefined ? lng : location?.longitude;

      const response = await getCart({
        latitude: queryLat,
        longitude: queryLng
      });
      
      if (currentFetchId !== fetchIdRef.current) return;

      if (response && response.data && response.data.items) {
        setItems(mapApiItemsToState(response.data.items));
        setEstimatedFee(response.data.estimatedDeliveryFee);
        setPlatformFee(response.data.platformFee);
        setFreeDeliveryThreshold(response.data.freeDeliveryThreshold);
        (items as any).debug_config = response.data.debug_config; // Hack to pass it through
        (items as any).backendTotal = response.data.backendTotal; // Hack to pass backend total
      } else {
        setItems([]);
        setEstimatedFee(undefined);
        setPlatformFee(undefined);
        setFreeDeliveryThreshold(undefined);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
        setIsInitialized(true);
      }
    }
  };

  // Load cart on auth change — debounce location changes to avoid excessive fetches
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setIsInitialized(true);
      return;
    }

    const lat = location?.latitude;
    const lng = location?.longitude;

    // If only location changed, check if it moved significantly (>0.01 deg ≈ 1km)
    const lastLat = lastFetchedLocationRef.current.lat;
    const lastLng = lastFetchedLocationRef.current.lng;
    const locationChangedSignificantly =
      lastLat === undefined ||
      lastLng === undefined ||
      Math.abs((lat ?? 0) - lastLat) > 0.01 ||
      Math.abs((lng ?? 0) - lastLng) > 0.01;

    if (!locationChangedSignificantly && isInitialized) return;

    // Debounce location-triggered fetches by 500ms
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    locationDebounceRef.current = setTimeout(() => {
      lastFetchedLocationRef.current = { lat, lng };
      fetchCart();
    }, 500);

    return () => {
      if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    };
  }, [isAuthenticated, user?.userType, location?.latitude, location?.longitude]);

  // State for estimate delivery fee
  const [estimatedFee, setEstimatedFee] = useState<number | undefined>(undefined);
  const [platformFee, setPlatformFee] = useState<number | undefined>(undefined);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | undefined>(undefined);

  const cart: Cart = useMemo(() => {
    // Filter out any items with null products before computing totals
    const validItems = items.filter(item => item?.product);
    const total = validItems.reduce((sum, item) => {
      const { displayPrice } = calculateProductPrice(item.product, item.variant);
      return sum + displayPrice * (item.quantity || 0);
    }, 0);
    const itemCount = validItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    return {
      items: validItems,
      total,
      itemCount,
      estimatedDeliveryFee: estimatedFee,
      platformFee,
      freeDeliveryThreshold,
      debug_config: (items as any).debug_config,
      backendTotal: (items as any).backendTotal
    };
  }, [items, estimatedFee, platformFee, freeDeliveryThreshold]);

  const addToCart = async (product: Product, sourceElement?: HTMLElement | null, quantity?: number) => {
    // Get consistent product ID - MongoDB returns _id, frontend expects id
    const productId = product._id || product.id;
    if (!productId) return;

    // Prevent concurrent operations on the same product
    if (pendingOperationsRef.current.has(productId)) {
      return;
    }
    pendingOperationsRef.current.add(productId);

    // Normalize product to always have 'id' property for consistency
    const normalizedProduct: Product = {
      ...product,
      id: productId,
      name: product.name || product.productName || 'Product',
      imageUrl: product.imageUrl || product.mainImage,
    };

    // Determine the variant info for matching
    const variantId = (product as any).variantId || (product as any).selectedVariant?._id;
    const variantTitle = (product as any).variantTitle || (product as any).pack;

    // Check if the item already exists in the cart
    const existingItem = items.find((item) => {
      if (!item?.product) return false;
      const itemProductId = item.product.id || item.product._id;
      const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
      const itemVariantTitle = (item.product as any).variantTitle || (item.product as any).pack;

      if (variantId || variantTitle) {
        return itemProductId === productId && (itemVariantId === variantId || itemVariantTitle === variantTitle);
      }
      return itemProductId === productId && !itemVariantId && !itemVariantTitle;
    });

    // Calculate quantity to add
    let qtyToAdd = quantity || 1;
    
    // For wholesale users, if the item is NOT in the cart, add the minimum wholesale quantity
    if (isWholesale && !existingItem && !quantity) {
      qtyToAdd = product.minWholesaleQuantity || 1;
    }

    // Optimistic Update
    // Get source position if element is provided
    let sourcePosition: { x: number; y: number } | undefined;
    if (sourceElement) {
      const rect = sourceElement.getBoundingClientRect();
      sourcePosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    setLastAddEvent({ product: normalizedProduct, sourcePosition });
    setTimeout(() => setLastAddEvent(null), 800);

    // Optimistically update state
    const previousItems = [...items];
    setItems((prevItems) => {
      const validItems = prevItems.filter(item => item?.product);
      
      if (existingItem) {
        return validItems.map((item) => {
          const itemProductId = item.product.id || item.product._id;
          const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
          const itemVariantTitle = (item.product as any).variantTitle || (item.product as any).pack;

          const isMatch = variantId || variantTitle
            ? itemProductId === productId && (itemVariantId === variantId || itemVariantTitle === variantTitle)
            : itemProductId === productId && !itemVariantId && !itemVariantTitle;

          return isMatch
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item;
        });
      }
      return [...validItems, { product: normalizedProduct, quantity: qtyToAdd }];
    });

    // Only sync to API if user is authenticated
    if (isAuthenticated && user?.userType === 'Customer') {
      try {
        // Pass variation info to API if available
        const variation = variantId || variantTitle;
        const response = await apiAddToCart(
          productId,
          qtyToAdd,
          variation,
          location?.latitude,
          location?.longitude
        );
        if (response && response.data && response.data.items) {
          // Atomic update from server response
          setItems(mapApiItemsToState(response.data.items));
          setEstimatedFee(response.data.estimatedDeliveryFee);
          setPlatformFee(response.data.platformFee);
          setFreeDeliveryThreshold(response.data.freeDeliveryThreshold);
        }
      } catch (error: any) {
        console.error("Add to cart failed", error);
        // Show error toast
        showToast(error.response?.data?.message || "Failed to add to cart", 'error');
        // Revert on error
        setItems(previousItems);
      } finally {
        // Remove from pending operations
        pendingOperationsRef.current.delete(productId);
      }
    } else {
      // For unregistered users, the optimistic update is already saved to localStorage
      pendingOperationsRef.current.delete(productId);
    }
  };

  const removeFromCart = async (productId: string, variant?: string) => {
    if (!productId) return;

    // Unique key for pending operations
    const operationKey = variant ? `${productId}-${variant}` : productId;

    // Prevent concurrent operations
    if (pendingOperationsRef.current.has(operationKey)) {
      return;
    }
    pendingOperationsRef.current.add(operationKey);

    // Find item matching product ID and variant
    const itemToRemove = items.find(item => {
      if (!item?.product) return false;
      const itemProductId = item.product.id || item.product._id;
      const itemVariant = item.variant || (item.product as any).variantId || (item.product as any).selectedVariant?._id || (item.product as any).variantTitle || (item.product as any).pack;
      return itemProductId === productId && (itemVariant === variant || !variant);
    });

    const previousItems = [...items];
    setItems((prevItems) => prevItems.filter((item) => {
      if (!item?.product) return true;
      const itemProductId = item.product.id || item.product._id;
      const itemVariant = item.variant || (item.product as any).variantId || (item.product as any).selectedVariant?._id || (item.product as any).variantTitle || (item.product as any).pack;

      if (variant) {
        return !(itemProductId === productId && itemVariant === variant);
      }
      return itemProductId !== productId;
    }));

    // Only sync to API if user is authenticated and item has CartItemID
    if (isAuthenticated && user?.userType === 'Customer' && itemToRemove?.id) {
      try {
        const response = await apiRemoveFromCart(
          itemToRemove.id,
          location?.latitude,
          location?.longitude
        );
        if (response && response.data && response.data.items) {
          setItems(mapApiItemsToState(response.data.items));
          setEstimatedFee(response.data.estimatedDeliveryFee);
          setPlatformFee(response.data.platformFee);
          setFreeDeliveryThreshold(response.data.freeDeliveryThreshold);
        }
      } catch (error) {
        console.error("Remove from cart failed", error);
        setItems(previousItems);
      } finally {
        // Remove from pending operations
        pendingOperationsRef.current.delete(operationKey);
      }
    } else {
      // For unregistered users, remove from pending operations immediately
      pendingOperationsRef.current.delete(operationKey);
    }
  };

  const updateQuantity = async (productId: string, quantity: number, variantId?: string, variantTitle?: string) => {
    if (!productId) return;

    // Create a unique operation key for this product/variant combination
    const operationKey = variantId ? `${productId}-${variantId}` : (variantTitle ? `${productId}-${variantTitle}` : productId);

    // Prevent concurrent operations on the same product
    if (pendingOperationsRef.current.has(operationKey)) {
      return;
    }
    pendingOperationsRef.current.add(operationKey);

    // Find item matching product ID and variant (if variant info provided)
    const itemToUpdate = items.find(item => {
      if (!item?.product) return false;
      const itemProductId = item.product.id || item.product._id;
      if (itemProductId !== productId) return false;

      // If variant info provided, match by variant
      if (variantId || variantTitle) {
        const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
        const itemVariantTitle = (item.product as any).variantTitle || (item.product as any).pack;
        return itemVariantId === variantId || itemVariantTitle === variantTitle;
      }

      // If no variant info, match items without variants
      const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
      const itemVariantTitle = (item.product as any).variantTitle;
      return !itemVariantId && !itemVariantTitle;
    });

    // Wholesale MOQ check: If decreasing below MOQ, force removal (jump to 0) 
    // This allows wholesalers to remove items they no longer want without getting stuck at the MOQ.
    let finalQuantity = quantity;
    if (isWholesale && itemToUpdate && quantity > 0) {
      // Find variation-specific MOQ if applicable
      const variantKey = (itemToUpdate.product as any).variantId;
      let minQty = itemToUpdate.product.minWholesaleQuantity || 1;

      if (variantKey && itemToUpdate.product.variations?.length) {
        const variation = itemToUpdate.product.variations.find((v: any) => 
          (v._id && v._id.toString() === variantKey.toString()) || 
          v._id === variantKey || 
          v.id === variantKey || 
          v.name === variantKey || 
          v.value === variantKey || 
          v.title === variantKey
        );
        if (variation && (variation as any).minWholesaleQuantity) {
          minQty = (variation as any).minWholesaleQuantity;
        }
      }

      if (quantity < minQty) {
        finalQuantity = 0; // Force total removal
      }
    }

    if (finalQuantity <= 0) {
      // Release lock before calling another locked function
      pendingOperationsRef.current.delete(operationKey);
      await removeFromCart(productId, variantId || variantTitle);
      return;
    }

    const previousItems = [...items];
    setItems((prevItems) =>
      prevItems.filter(item => item?.product).map((item) => {
        const itemProductId = item.product.id || item.product._id;
        if (itemProductId !== productId) return item;

        // If variant info provided, match by variant
        if (variantId || variantTitle) {
          const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
          const itemVariantTitle = (item.product as any).variantTitle || (item.product as any).pack;
          if (itemVariantId === variantId || itemVariantTitle === variantTitle) {
            return { ...item, quantity };
          }
        } else {
          // If no variant info, match items without variants
          const itemVariantId = (item.product as any).variantId || (item.product as any).selectedVariant?._id;
          const itemVariantTitle = (item.product as any).variantTitle;
          if (!itemVariantId && !itemVariantTitle) {
            return { ...item, quantity };
          }
        }
        return item;
      })
    );

    // Only sync to API if user is authenticated and item has CartItemID
    if (isAuthenticated && user?.userType === 'Customer' && itemToUpdate?.id) {
      try {
        const response = await apiUpdateCartItem(
          itemToUpdate.id,
          quantity,
          location?.latitude,
          location?.longitude
        );
        if (response && response.data && response.data.items) {
          setItems(mapApiItemsToState(response.data.items));
          setEstimatedFee(response.data.estimatedDeliveryFee);
          setPlatformFee(response.data.platformFee);
          setFreeDeliveryThreshold(response.data.freeDeliveryThreshold);
        }
      } catch (error) {
        console.error("Update quantity failed", error);
        setItems(previousItems);
      } finally {
        // Remove from pending operations
        pendingOperationsRef.current.delete(operationKey);
      }
    } else {
      // For unregistered users, remove from pending operations immediately
      pendingOperationsRef.current.delete(operationKey);
    }
  };


  const clearCart = async () => {
    setItems([]);
    try {
      await apiClearCart();
    } catch (error) {
      console.error("Clear cart failed", error);
      await fetchCart();
    }
  };

  const refreshCart = async (latitude?: number, longitude?: number) => {
    await fetchCart(latitude, longitude);
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, refreshCart, lastAddEvent, loading, isInitialized }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}


