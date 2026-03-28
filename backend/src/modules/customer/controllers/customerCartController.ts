
import { Request, Response } from 'express';
import Cart from '../../../models/Cart';
import CartItem from '../../../models/CartItem';
import Product from '../../../models/Product';
import { findSellersWithinRange } from '../../../utils/locationHelper';
import mongoose from 'mongoose';
import AppSettings from '../../../models/AppSettings';
import { getRoadDistances } from '../../../services/mapService';
import Seller from '../../../models/Seller';

// Helper to calculate item price matching frontend logic
const calculateItemPrice = (product: any, variationSelector: any, customerType: string = 'retail') => {
    let variation = null;
    let variationId = variationSelector;
    const isWholesale = customerType === 'wholesale';

    const priceField = isWholesale ? 'wholesalePrice' : 'retailPrice';
    const discPriceField = isWholesale ? 'wholesaleDiscPrice' : 'retailDiscPrice';

    // Handle if variationSelector is an object
    if (variationSelector && typeof variationSelector === 'object' && variationSelector._id) {
        variationId = variationSelector._id;
    }

    if (variationId && product.variations?.length) {
        variation = product.variations.find((v: any) =>
            (v._id && v._id.toString() === variationId.toString()) ||
            (v.id && v.id === variationId) ||
            (v.name === variationId) ||
            (v.value === variationId) ||
            (v.title === variationId) ||
            (v.pack === variationId)
        );

        if (!variation && variationId === 'Standard' && product.variations.length > 0) {
            variation = product.variations[0];
        }
    }

    // Default to retail fields if wholesale fields are somehow missing
    let finalPrice = variation?.[priceField] || product[priceField] || variation?.retailPrice || product.retailPrice || 0;

    if (variation?.[discPriceField] && variation[discPriceField] > 0) {
        finalPrice = variation[discPriceField];
    } else if (product[discPriceField] && product[discPriceField] > 0) {
        finalPrice = product[discPriceField];
    }

    console.log(`[DEBUG Price] User: ${customerType}, VarId: ${variationId}, Final: ${finalPrice}`);
    return finalPrice;
};

// Helper to calculate cart total with location filtering
const calculateCartTotal = async (cartId: any, nearbySellerIds: mongoose.Types.ObjectId[] = [], userType: string = 'retail') => {
    const items = await CartItem.find({ cart: cartId }).populate({
        path: 'product',
        select: 'productName retailPrice retailDiscPrice wholesalePrice wholesaleDiscPrice mainImage stock pack mrp category seller status publish variations minWholesaleQuantity compareAtPrice'
    });

    let total = 0;
    for (const item of items) {
        const product = item.product as any;
        if (product && product.status === 'Active' && product.publish) {
            // Check if seller is in range
            const isAvailable = nearbySellerIds.some(id => id.toString() === product.seller.toString());
            if (isAvailable) {
                const price = calculateItemPrice(product, item.variation, userType);
                total += price * item.quantity;
            }
        }
    }
    return total;
};

// Helper to calculate delivery fee
const calculateDeliveryStuff = async (total: number, items: any[], userLat: number | null, userLng: number | null) => {
    let estimatedDeliveryFee = 0;
    let platformFee = 0;
    let freeDeliveryThreshold = 0;

    try {
        const settings = await AppSettings.getSettings();
        platformFee = settings.platformFee || 0;
        freeDeliveryThreshold = settings.freeDeliveryThreshold || 0;

        // Check free delivery threshold
        if (freeDeliveryThreshold > 0 && total >= freeDeliveryThreshold) {
            estimatedDeliveryFee = 0;
        } else if (settings) {
            // If distance based is enabled
            if (settings.deliveryConfig?.isDistanceBased === true) {
                const config = settings.deliveryConfig;
                // Default to base charge to ensure we don't accidentally give free delivery
                estimatedDeliveryFee = config.baseCharge || 0;

                if (userLat && userLng) {
                    // Get all sellers involved in the cart
                    const sellerIds = new Set<string>();
                    items.forEach((item: any) => {
                        if (item.product?.seller) {
                            sellerIds.add(item.product.seller.toString());
                        }
                    });

                    if (sellerIds.size > 0) {
                        const uniqueSellerIds = Array.from(sellerIds).map(id => new mongoose.Types.ObjectId(id));
                        const sellers = await Seller.find({ _id: { $in: uniqueSellerIds } }).select('location latitude longitude');

                        const sellerLocations: { lat: number; lng: number }[] = [];
                        sellers.forEach(seller => {
                            let lat, lng;
                            if (seller.location?.coordinates?.length === 2) {
                                lng = seller.location.coordinates[0];
                                lat = seller.location.coordinates[1];
                            } else if (seller.latitude && seller.longitude) {
                                lat = parseFloat(seller.latitude);
                                lng = parseFloat(seller.longitude);
                            }
                            if (lat && lng) sellerLocations.push({ lat, lng });
                        });

                        if (sellerLocations.length > 0) {
                            const distances = await getRoadDistances(
                                sellerLocations,
                                { lat: userLat, lng: userLng },
                                config.googleMapsKey
                            );

                            if (distances && distances.length > 0) {
                                const maxDistance = Math.max(...distances);
                                const extraKm = Math.max(0, maxDistance - config.baseDistance);
                                estimatedDeliveryFee = Math.ceil(config.baseCharge + (extraKm * config.kmRate));
                            }
                        }
                    }
                }
            } else {
                // Fixed charge
                estimatedDeliveryFee = settings.deliveryCharges || 0;
            }
        }
    } catch (err) {
        console.error("Error calculating delivery stuff:", err);
    }
    return {
        estimatedDeliveryFee,
        platformFee,
        freeDeliveryThreshold
    };
};

// Get current user's cart
export const getCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { latitude, longitude } = req.query;

        // Parse location
        const userLat = latitude ? parseFloat(latitude as string) : null;
        const userLng = longitude ? parseFloat(longitude as string) : null;

        // Strictly enforce location
        if (userLat === null || userLng === null || isNaN(userLat) || isNaN(userLng)) {
            return res.status(200).json({
                success: true,
                message: 'Location required to view available items',
                data: { items: [], total: 0 }
            });
        }

        const nearbySellerIds = await findSellersWithinRange(userLat, userLng);

        let cart = await Cart.findOne({ customer: userId }).populate({
            path: 'items',
            populate: {
                path: 'product',
                select: 'productName retailPrice retailDiscPrice wholesalePrice wholesaleDiscPrice mainImage stock pack mrp category seller status publish variations minWholesaleQuantity compareAtPrice'
            }
        });

        if (!cart) {
            cart = await Cart.create({ customer: userId, items: [], total: 0 });
            return res.status(200).json({ success: true, data: cart });
        }

        // Filter items based on location availability and update total
        const filteredItems = [];
        let total = 0;

        for (const item of (cart.items as any)) {
            const product = item.product;
            if (product && product.status === 'Active' && product.publish) {
                const isAvailable = nearbySellerIds.some(id => id.toString() === product.seller.toString());
                if (isAvailable) {
                    filteredItems.push(item);
                    const userType = req.user?.customerType || 'retail';
                    const price = calculateItemPrice(product, item.variation, userType);
                    total += price * item.quantity;
                    console.log(`[DEBUG CartLoop] Item: ${product.productName}, Price: ${price}, Qty: ${item.quantity}, RunningTotal: ${total}`);
                }
            }
        }

        // Update cart total in DB if it changed
        if (cart.total !== total) {
            cart.total = total;
            await cart.save();
        }

        // Calculate fees
        const fees = await calculateDeliveryStuff(total, filteredItems, userLat, userLng);

        const userType = req.user?.customerType || 'retail';
        const priceField = userType === 'wholesale' ? 'wholesalePrice' : 'retailPrice';
        
        // Map items to include generic price and mrp fields
        const mappedItems = filteredItems.map((item: any) => {
            const prod = item.product;
            if (!prod) return item;
            
            const itemPrice = calculateItemPrice(prod, item.variation, userType);

            return {
                ...item.toObject(),
                product: {
                    ...prod.toObject(),
                    price: itemPrice,
                    mrp: prod.mrp || prod.compareAtPrice || prod[priceField] || 0,
                    minWholesaleQuantity: prod.minWholesaleQuantity
                },
                price: itemPrice // Field at item level for cart
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                ...cart.toObject(),
                items: mappedItems,
                total,
                ...fees
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message
        });
    }
};

// Add item to cart
export const addToCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { productId, quantity = 1, variation } = req.body;
        const { latitude, longitude } = req.query;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required' });
        }

        // Parse location
        const userLat = latitude ? parseFloat(latitude as string) : null;
        const userLng = longitude ? parseFloat(longitude as string) : null;

        if (userLat === null || userLng === null || isNaN(userLat) || isNaN(userLng)) {
            return res.status(400).json({
                success: false,
                message: 'Location is required to add items to cart'
            });
        }

        // Verify product exists and is available at location
        const product = await Product.findOne({ _id: productId, status: 'Active', publish: true }).populate('seller');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found or unavailable' });
        }

        // Check if seller's shop is open
        const seller = product.seller as any;
        if (seller && seller.isShopOpen === false) {
            return res.status(400).json({
                success: false,
                message: 'Seller is not available at this moment'
            });
        }

        const nearbySellerIds = await findSellersWithinRange(userLat, userLng);
        const isAvailable = nearbySellerIds.some(id => id.toString() === (seller._id || seller).toString());

        if (!isAvailable) {
            return res.status(403).json({
                success: false,
                message: 'This product is not available in your current location'
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ customer: userId });
        if (!cart) {
            cart = await Cart.create({ customer: userId, items: [], total: 0 });
        }

        // Check if item already exists in cart
        let cartItem = await CartItem.findOne({
            cart: cart._id,
            product: productId,
            variation: variation || null
        });
        
        // Enforce Minimum Wholesale Quantity
        const userType = req.user?.customerType || 'retail';
        if (userType === 'wholesale') {
            let minQty = product.minWholesaleQuantity || 1;
            
            // Check if variation has a specific MOQ
            if (variation && product.variations?.length) {
                let variationId = variation;
                if (typeof variation === 'object' && (variation as any)._id) {
                    variationId = (variation as any)._id;
                }
                
                const varObj = product.variations.find((v: any) => 
                    (v._id && v._id.toString() === variationId.toString()) || 
                    v.title === variationId || 
                    v.name === variationId
                );
                if (varObj && varObj.minWholesaleQuantity) {
                    minQty = varObj.minWholesaleQuantity;
                }
            }

            const currentQty = cartItem ? cartItem.quantity : 0;
            const newTotalQty = currentQty + quantity;

            if (newTotalQty < minQty) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum order quantity for this product is ${minQty}`,
                    minWholesaleQuantity: minQty
                });
            }
        }

        if (cartItem) {
            // Update quantity
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            // Create new cart item
            cartItem = await CartItem.create({
                cart: cart._id,
                product: productId,
                quantity,
                variation
            });
            cart.items.push(cartItem._id as any);
        }

        // Update total with location filtering
        // Use already defined userType
        cart.total = await calculateCartTotal(cart._id, nearbySellerIds, userType);
        await cart.save();

        // Return updated cart with filtering
        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items',
            populate: {
                path: 'product',
                select: 'productName retailPrice retailDiscPrice wholesalePrice wholesaleDiscPrice mainImage stock pack mrp category seller status publish variations minWholesaleQuantity compareAtPrice'
            }
        });

        const filteredItems = (updatedCart?.items as any[] || []).filter(item => {
            const prod = item.product;
            return prod && nearbySellerIds.some(id => id.toString() === prod.seller.toString());
        });

        // Calculate fees
        const fees = await calculateDeliveryStuff(cart.total, filteredItems, userLat, userLng);

        const priceField = userType === 'wholesale' ? 'wholesalePrice' : 'retailPrice';
        
        const mappedItems = filteredItems.map((item: any) => {
            const prod = item.product;
            if (!prod) return item;
            const itemPrice = calculateItemPrice(prod, item.variation, userType);
            return {
                ...item.toObject(),
                product: {
                    ...prod.toObject(),
                    price: itemPrice,
                    mrp: prod.mrp || prod.compareAtPrice || prod[priceField] || 0
                },
                price: itemPrice
            };
        });

        return res.status(200).json({
            success: true,
            message: 'Item added to cart',
            data: {
                ...updatedCart?.toObject(),
                items: mappedItems,
                total: cart.total,
                ...fees
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error adding to cart',
            error: error.message
        });
    }
};

// Update item quantity
export const updateCartItem = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params;
        const { quantity } = req.body;
        const { latitude, longitude } = req.query;

        if (quantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        }

        // Parse location
        const userLat = latitude ? parseFloat(latitude as string) : null;
        const userLng = longitude ? parseFloat(longitude as string) : null;

        if (userLat === null || userLng === null || isNaN(userLat) || isNaN(userLng)) {
            return res.status(400).json({
                success: false,
                message: 'Location is required to update cart'
            });
        }

        const nearbySellerIds = await findSellersWithinRange(userLat, userLng);

        const cart = await Cart.findOne({ customer: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const cartItem = await CartItem.findOne({ _id: itemId, cart: cart._id }).populate('product');
        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        // Verify item is still available at location
        const product = cartItem.product as any;
        const isAvailable = product && nearbySellerIds.some(id => id.toString() === product.seller.toString());

        if (!isAvailable) {
            return res.status(403).json({
                success: false,
                message: 'This item is no longer available in your location'
            });
        }

        // Enforce Minimum Wholesale Quantity
        const userType = req.user?.customerType || 'retail';
        if (userType === 'wholesale') {
            let minQty = product.minWholesaleQuantity || 1;
            
            // Check if variation has a specific MOQ
            if (cartItem.variation && product.variations?.length) {
                let variationId = cartItem.variation;
                if (typeof variationId === 'object' && (variationId as any)._id) {
                    variationId = (variationId as any)._id;
                }
                
                const varObj = product.variations.find((v: any) => 
                    (v._id && v._id.toString() === variationId.toString()) || 
                    v.title === variationId || 
                    v.name === variationId
                );
                if (varObj && varObj.minWholesaleQuantity) {
                    minQty = varObj.minWholesaleQuantity;
                }
            }

            if (quantity < minQty) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum order quantity for this product is ${minQty}`,
                    minWholesaleQuantity: minQty
                });
            }
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        // Use already defined userType
        cart.total = await calculateCartTotal(cart._id, nearbySellerIds, userType);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items',
            populate: {
                path: 'product',
                select: 'productName retailPrice retailDiscPrice wholesalePrice wholesaleDiscPrice mainImage stock pack mrp category seller status publish variations minWholesaleQuantity compareAtPrice'
            }
        });

        const filteredItems = (updatedCart?.items as any[] || []).filter(item => {
            const prod = item.product;
            return prod && nearbySellerIds.some(id => id.toString() === prod.seller.toString());
        });

        // Calculate fees
        const fees = await calculateDeliveryStuff(cart.total, filteredItems, userLat, userLng);

        const priceField = userType === 'wholesale' ? 'wholesalePrice' : 'retailPrice';
        const mappedItems = filteredItems.map((item: any) => {
            const prod = item.product;
            if (!prod) return item;
            const itemPrice = calculateItemPrice(prod, item.variation, userType);
            return {
                ...item.toObject(),
                product: {
                    ...prod.toObject(),
                    price: itemPrice,
                    mrp: prod.mrp || prod.compareAtPrice || prod[priceField] || 0
                },
                price: itemPrice
            };
        });

        return res.status(200).json({
            success: true,
            message: 'Cart updated',
            data: {
                ...updatedCart?.toObject(),
                items: mappedItems,
                total: cart.total,
                ...fees
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error updating cart item',
            error: error.message
        });
    }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const { itemId } = req.params;
        const { latitude, longitude } = req.query;

        // Parse location
        const userLat = latitude ? parseFloat(latitude as string) : null;
        const userLng = longitude ? parseFloat(longitude as string) : null;

        const cart = await Cart.findOne({ customer: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        await CartItem.findOneAndDelete({ _id: itemId, cart: cart._id });

        // Remove from cart array
        cart.items = cart.items.filter(id => id.toString() !== itemId);

        // Calculate total with location if provided
        let nearbySellerIds: mongoose.Types.ObjectId[] = [];
        if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
            nearbySellerIds = await findSellersWithinRange(userLat, userLng);
        }

        const userType = req.user?.customerType || 'retail';
        cart.total = await calculateCartTotal(cart._id, nearbySellerIds, userType);
        await cart.save();

        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items',
            populate: {
                path: 'product',
                select: 'productName retailPrice retailDiscPrice wholesalePrice wholesaleDiscPrice mainImage stock pack mrp category seller status publish variations minWholesaleQuantity compareAtPrice'
            }
        });

        const filteredItems = (updatedCart?.items as any[] || []).filter(item => {
            const prod = item.product;
            if (nearbySellerIds.length > 0) {
                return prod && nearbySellerIds.some(id => id.toString() === prod.seller.toString());
            }
            return true; // If no location provided for removal, just return all (though getCart will filter)
        });

        // Calculate fees
        const fees = await calculateDeliveryStuff(cart.total, filteredItems, userLat, userLng);

        const priceField = userType === 'wholesale' ? 'wholesalePrice' : 'retailPrice';
        const mappedItems = filteredItems.map((item: any) => {
            const prod = item.product;
            if (!prod) return item;
            const itemPrice = calculateItemPrice(prod, item.variation, userType);
            return {
                ...item.toObject(),
                product: {
                    ...prod.toObject(),
                    price: itemPrice,
                    mrp: prod[priceField] || 0
                },
                price: itemPrice
            };
        });

        return res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: {
                ...updatedCart?.toObject(),
                items: mappedItems,
                total: cart.total,
                ...fees
            }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error removing from cart',
            error: error.message
        });
    }
};

// Clear cart
export const clearCart = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        const cart = await Cart.findOne({ customer: userId });

        if (cart) {
            await CartItem.deleteMany({ cart: cart._id });
            cart.items = [];
            cart.total = 0;
            await cart.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Cart cleared',
            data: { items: [], total: 0 }
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
};
