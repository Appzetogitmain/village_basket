import { useWishlist as useWishlistContext } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook for managing wishlist state and toggle functionality for a specific product
 * @param productId - The product ID to check/manage in wishlist
 * @returns Object with isWishlisted state and toggleWishlist function
 */
export function useWishlist(productId?: string) {
  const { 
    isWishlisted: contextIsWishlisted, 
    addToWishlist, 
    removeFromWishlist 
  } = useWishlistContext();
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isWishlisted = productId ? contextIsWishlisted(productId) : false;

  const toggleWishlist = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      if ('preventDefault' in e) e.preventDefault();
      if ('stopPropagation' in e) e.stopPropagation();
    }

    if (!isAuthenticated) {
      navigate('/user/login');
      return;
    }

    if (!productId) {
      console.error('Product ID is required to toggle wishlist');
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(productId);
        showToast('Removed from wishlist');
      } else {
        await addToWishlist(productId);
        showToast('Added to wishlist');
      }
    } catch (error: any) {
      console.error('Failed to toggle wishlist:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update wishlist';
      showToast(errorMessage, 'error');
    }
  };

  return { isWishlisted, toggleWishlist };
}

