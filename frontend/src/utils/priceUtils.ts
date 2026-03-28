import { Product } from '../types/domain';

export interface CalculatedPrice {
  displayPrice: number;
  mrp: number;
  discount: number;
  hasDiscount: boolean;
}

import { getUserData } from '../services/api/config';

export const calculateProductPrice = (product: any, variationSelector?: number | string, accountType?: string): CalculatedPrice => {
  if (!product) {
    return {
      displayPrice: 0,
      mrp: 0,
      discount: 0,
      hasDiscount: false
    };
  }

  // Auto-detect account type if not provided
  const userData = getUserData('customer');
  const effectiveAccountType = (accountType || userData?.customerType || userData?.accountType || 'retail').toLowerCase();
  const isWholesale = effectiveAccountType.includes('wholesale');

  let variation;
  if (typeof variationSelector === 'number') {
    variation = product.variations?.[variationSelector];
  } else if (typeof variationSelector === 'string') {
    variation = product.variations?.find((v: any) =>
      v._id === variationSelector ||
      v.id === variationSelector ||
      v.name === variationSelector ||
      v.value === variationSelector ||
      v.title === variationSelector ||
      v.pack === variationSelector
    );

    // Fallback for 'Standard' to first variation if no exact match
    if (!variation && variationSelector === 'Standard' && product.variations?.length > 0) {
      variation = product.variations[0];
    }
  }

  // Fallback to first variation if no specific one selected/found but variations exist
  if (!variation && product.variations?.length > 0 && variationSelector === undefined) {
    variation = product.variations[0];
  }

  // Pick correct fields based on account type
  const targetPriceField = isWholesale ? 'wholesalePrice' : 'retailPrice';
  const targetDiscPriceField = isWholesale ? 'wholesaleDiscPrice' : 'retailDiscPrice';

  // Base price (MRP equivalent)
  const mrp = variation?.[targetPriceField] 
    || product[targetPriceField] 
    || variation?.price 
    || product.mrp 
    || product.compareAtPrice 
    || product.price 
    || 0;

  // Discounted price
  const displayPrice = (variation?.[targetDiscPriceField] && variation[targetDiscPriceField] > 0)
    ? variation[targetDiscPriceField]
    : (product[targetDiscPriceField] && product[targetDiscPriceField] > 0)
      ? product[targetDiscPriceField]
      : (variation?.discPrice && variation.discPrice > 0)
        ? variation.discPrice
        : (product.discPrice && product.discPrice > 0)
          ? product.discPrice
          : mrp;

  const hasDiscount = mrp > displayPrice;
  const discount = hasDiscount ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;

  return {
    displayPrice,
    mrp,
    discount,
    hasDiscount
  };
};
