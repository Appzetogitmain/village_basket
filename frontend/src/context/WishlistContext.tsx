import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useLocation } from '../hooks/useLocation';
import { getWishlist, addToWishlist as apiAddToWishlist, removeFromWishlist as apiRemoveFromWishlist } from '../services/api/customerWishlistService';
import { Product } from '../types/domain';

interface WishlistContextType {
  wishlistItems: Product[];
  wishlistProductIds: Set<string>;
  loading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { location } = useLocation();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [wishlistProductIds, setWishlistProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const locationRef = useRef(location);

  // Keep locationRef in sync without triggering re-fetches
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      setWishlistProductIds(new Set());
      setHasFetched(false);
      return;
    }

    try {
      setLoading(true);
      const loc = locationRef.current;
      const res = await getWishlist({
        latitude: loc?.latitude,
        longitude: loc?.longitude
      });
      if (res.success && res.data) {
        const products = (res.data.products || []).map(p => ({
          ...p,
          id: p._id || (p as any).id,
          name: p.productName || (p as any).name,
          pack: (p as any).pack || 'Standard',
        })) as any as Product[];
        setWishlistItems(products);
        setWishlistProductIds(new Set(products.map(p => String(p.id || (p as any)._id))));
        setHasFetched(true);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]); // No location dependency — uses ref instead

  useEffect(() => {
    if (isAuthenticated && !hasFetched) {
      fetchWishlist();
    } else if (!isAuthenticated) {
      setWishlistItems([]);
      setWishlistProductIds(new Set());
      setHasFetched(false);
    }
  }, [isAuthenticated, hasFetched, fetchWishlist]);

  const addToWishlist = async (productId: string) => {
    if (!location?.latitude || !location?.longitude) {
      throw new Error('Location is required');
    }
    await apiAddToWishlist(productId, location.latitude, location.longitude);
    // Refresh to get full product data if needed, or just update IDs
    setWishlistProductIds(prev => new Set([...prev, productId]));
    fetchWishlist(); // Refresh to keep data in sync
  };

  const removeFromWishlist = async (productId: string) => {
    await apiRemoveFromWishlist(productId);
    setWishlistProductIds(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
    setWishlistItems(prev => prev.filter(p => String(p._id || (p as any).id) !== productId));
  };

  const isWishlisted = (productId: string) => {
    return wishlistProductIds.has(String(productId));
  };

  return (
    <WishlistContext.Provider value={{ 
      wishlistItems, 
      wishlistProductIds, 
      loading, 
      addToWishlist, 
      removeFromWishlist, 
      isWishlisted,
      refreshWishlist: fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
