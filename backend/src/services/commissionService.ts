import Commission from '../models/Commission';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import Seller from '../models/Seller';
import Delivery from '../models/Delivery';
import AppSettings from '../models/AppSettings';
import { creditWallet } from './walletManagementService';
import mongoose from 'mongoose';
import Category from '../models/Category';
import SubCategory from '../models/SubCategory';
import Product from '../models/Product';

/**
 * Get commission rate for a seller
 */
/**
 * Get commission rate for a seller
 */
export const getSellerCommissionRate = async (
    sellerId: string
): Promise<number> => {
    try {
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            throw new Error('Seller not found');
        }

        // Use individual rate if set, otherwise use global default
        if (seller.commissionRate !== undefined && seller.commissionRate !== null) {
            return seller.commissionRate;
        }

        const settings = await AppSettings.findOne();
        // @ts-ignore
        return (settings && settings.globalCommissionRate !== undefined) ? settings.globalCommissionRate : 10;
    } catch (error) {
        console.error('Error getting seller commission rate:', error);
        return 10; // Default fallback
    }
};

/**
 * Get commission rate for a delivery boy
 */
export const getDeliveryBoyCommissionRate = async (
    deliveryBoyId: string
): Promise<number> => {
    try {
        const deliveryBoy = await Delivery.findById(deliveryBoyId);
        if (!deliveryBoy) {
            throw new Error('Delivery boy not found');
        }

        // Use individual rate if set, otherwise use global default
        if (deliveryBoy.commissionRate !== undefined && deliveryBoy.commissionRate !== null) {
            return deliveryBoy.commissionRate;
        }

        return 5; // Default 5%
    } catch (error) {
        console.error('Error getting delivery boy commission rate:', error);
        return 5; // Default fallback
    }
};

/**
 * Calculate commissions for an order
 */
export const calculateOrderCommissions = async (orderId: string) => {
    try {
        const order = await Order.findById(orderId).populate('items');
        if (!order) {
            throw new Error('Order not found');
        }

        const commissions: {
            seller?: {
                sellerId: string;
                amount: number;
                rate: number;
                orderAmount: number;
            }[];
            deliveryBoy?: {
                deliveryBoyId: string;
                amount: number;
                rate: number;
                orderAmount: number;
            };
        } = {};

        // Calculate seller commissions (per item/seller)
        const sellerCommissions = new Map<string, { amount: number; rate: number; orderAmount: number }>();

        for (const itemId of order.items) {
            const orderItem = await OrderItem.findById(itemId);
            if (!orderItem) continue;

            const sellerId = orderItem.seller.toString();
            const itemTotal = orderItem.total;

            // Get commission rate for this seller
            const commissionRate = await getSellerCommissionRate(sellerId);
            const commissionAmount = (itemTotal * commissionRate) / 100;

            if (sellerCommissions.has(sellerId)) {
                const existing = sellerCommissions.get(sellerId)!;
                existing.amount += commissionAmount;
                existing.orderAmount += itemTotal;
            } else {
                sellerCommissions.set(sellerId, {
                    amount: commissionAmount,
                    rate: commissionRate,
                    orderAmount: itemTotal,
                });
            }
        }

        // Convert to array
        commissions.seller = Array.from(sellerCommissions.entries()).map(
            ([sellerId, data]) => ({
                sellerId,
                ...data,
            })
        );

        // Calculate delivery boy commission (on order subtotal OR distance based)
        if (order.deliveryBoy) {
            const deliveryBoyId = order.deliveryBoy.toString();

            // Check for distance based commission
            let commissionAmount = 0;
            let commissionRate = 0;
            let usedDistanceBased = false;

            try {
                // @ts-ignore - getSettings is static on model
                const settings = await AppSettings.getSettings();
                if (settings &&
                    settings.deliveryConfig?.isDistanceBased === true &&
                    settings.deliveryConfig?.deliveryBoyKmRate &&
                    order.deliveryDistanceKm &&
                    order.deliveryDistanceKm > 0
                ) {
                    commissionRate = settings.deliveryConfig.deliveryBoyKmRate;
                    commissionAmount = order.deliveryDistanceKm * commissionRate;
                    usedDistanceBased = true;
                    console.log(`DEBUG: Distance Commission: Dist=${order.deliveryDistanceKm}km, Rate=${commissionRate}/km, Amt=${commissionAmount}`);
                }
            } catch (err) {
                console.error("Error checking settings for commission:", err);
            }

            if (!usedDistanceBased) {
                // Fallback to percentage based logic
                commissionRate = await getDeliveryBoyCommissionRate(deliveryBoyId);
                commissionAmount = (order.subtotal * commissionRate) / 100;
            }

            commissions.deliveryBoy = {
                deliveryBoyId,
                amount: Math.round(commissionAmount * 100) / 100, // Round to 2 decimals
                rate: commissionRate,
                orderAmount: usedDistanceBased ? (order.deliveryDistanceKm || 0) : order.subtotal,
            };
        }

        return {
            success: true,
            data: commissions,
        };
    } catch (error: any) {
        console.error('Error calculating order commissions:', error);
        return {
            success: false,
            message: error.message || 'Failed to calculate commissions',
        };
    }
};

/**
 * Distribute commissions for an order
 */
/**
 * Create Pending Commissions (called on Order Payment)
 */
export const createPendingCommissions = async (orderId: string) => {
    try {
        const order = await Order.findById(orderId).populate('items');
        if (!order) throw new Error('Order not found');

        // Check if commissions already exist
        const existingCommissions = await Commission.find({ order: orderId });
        if (existingCommissions.length > 0) {
            console.log(`[Commission] Commissions already exist for order ${order.orderNumber} (ID: ${orderId})`);
            return;
        }

        const items = order.items;
        // Group items by seller to aggregate earnings (though we store per item mostly)
        // We'll calculate per item as per original logic

        for (const itemId of items) {
            const item = await OrderItem.findById(itemId);
            if (!item) continue;

            const seller = await Seller.findById(item.seller);
            if (!seller) continue;

            // Determine Commission Rate Priority:
            // 1. SubSubCategory (Category Model)
            // 2. SubCategory (SubCategory Model)
            // 3. Category (Category Model)
            // 4. Seller specific rate
            // 5. Global Default (10%)

            let commissionRate = 0;
            let rateSource = "Default";

            const product = await Product.findById(item.product);

            if (product) {
                // 1. Check SubSubCategory
                if (product.subSubCategory) {
                    const subSubCat = await Category.findById(product.subSubCategory);
                    if (subSubCat && subSubCat.commissionRate && subSubCat.commissionRate > 0) {
                        commissionRate = subSubCat.commissionRate;
                        rateSource = `SubSubCategory: ${subSubCat.name}`;
                    }
                }

                // 2. Check SubCategory (only if not found yet)
                if (commissionRate === 0 && product.subcategory) {
                    const subCat = await SubCategory.findById(product.subcategory);
                    if (subCat && subCat.commissionRate && subCat.commissionRate > 0) {
                        commissionRate = subCat.commissionRate;
                        rateSource = `SubCategory: ${subCat.name}`;
                    }
                }

                // 3. Check Category (only if not found yet)
                if (commissionRate === 0 && product.category) {
                    const cat = await Category.findById(product.category);
                    if (cat && cat.commissionRate && cat.commissionRate > 0) {
                        commissionRate = cat.commissionRate;
                        rateSource = `Category: ${cat.name}`;
                    }
                }
            }

            // 4. Check Seller specifc rate
            if (commissionRate === 0 && seller.commission !== undefined && seller.commission > 0) {
                commissionRate = seller.commission;
                rateSource = "Seller";
            }

            // 5. Global Default (fallback if everything else is 0)
            if (commissionRate === 0) {
                // Fetch dynamic global rate from AppSettings
                const settings = await AppSettings.findOne();
                // @ts-ignore
                commissionRate = (settings && settings.globalCommissionRate !== undefined) ? settings.globalCommissionRate : 10;
                rateSource = "Global Default (Settings)";
            }

            const commissionAmount = (item.total * commissionRate) / 100;
            const netEarning = item.total - commissionAmount;

            console.log(`[Commission] Order ${order.orderNumber} - Item: ${product?.productName}, Rate: ${commissionRate}% (${rateSource}), Amount: ${commissionAmount}, Net: ${netEarning}`);

            // Create commission record as PAID immediately
            const commission = await Commission.create({
                order: item.order,
                orderItem: item._id,
                seller: item.seller,
                type: 'SELLER',
                orderAmount: item.total,
                commissionRate,
                commissionAmount,
                status: "Paid", // Set to Paid immediately
                paidAt: new Date()
            });

            // Credit Wallet Immediately
            if (seller) {
                await creditWallet(
                    seller._id.toString(),
                    'SELLER',
                    netEarning,
                    `Sale proceeds from Order #${order.orderNumber}`,
                    item.order.toString(),
                    commission._id.toString()
                );
            }
        }

        console.log(`[Commission] Commissions processed and credited for order ${order.orderNumber}`);

    } catch (error) {
        console.error(`[Commission] Error creating commissions for order ${orderId}:`, error);
        throw error;
    }
};

/**
 * Distribute commissions for an order (Pending -> Paid)
 */
export const distributeCommissions = async (orderId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(orderId).populate('items').session(session);
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }

        // 1. Idempotency Check
        if ((order as any).commissionsProcessed) {
            console.log(`[Commission] Commissions already processed for order ${order.orderNumber}. Skipping.`);
            await session.abortTransaction();
            return { success: true, message: 'Commissions already processed' };
        }

        // 2. Order State Validation
        if (order.status !== 'Delivered') {
            throw new Error(`Order ${order.orderNumber} is not marked as Delivered (Current status: ${order.status})`);
        }

        console.log(`[Commission] Distributing commissions for order ${order.orderNumber}...`);

        // 3. Find existing Pending commissions
        let commissionsToProcess = await Commission.find({ 
            order: orderId, 
            status: 'Pending' 
        }).session(session);

        // 4. Lazy Commission Creation (Fallback for COD/Wallet-paid orders where commissions weren't created on payment)
        if (commissionsToProcess.length === 0) {
            const alreadyProcessed = await Commission.countDocuments({ 
                order: orderId, 
                status: 'Paid' 
            }).session(session);

            if (alreadyProcessed > 0 && !(order as any).commissionsProcessed) {
                console.warn(`[Commission] Paid commissions found for order ${order.orderNumber} but processed flag was false. Fixing flag and continuing.`);
            } else if (alreadyProcessed === 0) {
                console.log(`[Commission] No commission records found for order ${order.orderNumber}. Attempting lazy creation...`);
                
                // --- Lazy Creation Logic for Sellers ---
                for (const itemId of order.items) {
                    const item = await OrderItem.findById(itemId).session(session);
                    if (!item) continue;

                    const seller = await Seller.findById(item.seller).session(session);
                    if (!seller) continue;

                    let commissionRate = 0;
                    const product = await Product.findById(item.product).session(session);

                    if (product) {
                        // Check Category -> SubCategory -> SubSubCategory/Global hierarchy
                        if (product.subSubCategory) {
                             const subSubCat = await Category.findById(product.subSubCategory).session(session);
                             if (subSubCat?.commissionRate && subSubCat.commissionRate > 0) commissionRate = subSubCat.commissionRate;
                        }
                        if (commissionRate === 0 && product.subcategory) {
                             const subCat = await SubCategory.findById(product.subcategory).session(session);
                             if (subCat?.commissionRate && subCat.commissionRate > 0) commissionRate = subCat.commissionRate;
                        }
                        if (commissionRate === 0 && product.category) {
                             const cat = await Category.findById(product.category).session(session);
                             if (cat?.commissionRate && cat.commissionRate > 0) commissionRate = cat.commissionRate;
                        }
                    }

                    if (commissionRate === 0 && seller.commission > 0) commissionRate = seller.commission;
                    if (commissionRate === 0) {
                        const settings = await AppSettings.findOne().session(session);
                        // @ts-ignore
                        commissionRate = settings?.globalCommissionRate || 10;
                    }

                    const commissionAmount = (item.total * commissionRate) / 100;
                    
                    const newComm = await Commission.create([{
                        order: orderId,
                        orderItem: item._id,
                        seller: item.seller,
                        type: 'SELLER',
                        orderAmount: item.total,
                        commissionRate,
                        commissionAmount,
                        status: 'Pending', // Create as pending first, we will mark as paid below
                    }], { session });
                    
                    commissionsToProcess.push(newComm[0]);
                }
            }
        }

        const processedCommissions: any[] = [];
        const sellerEarnings = new Map<string, { netAmount: number, commissionIds: string[] }>();

        // 5. Process grouped commissions for Wallet Credit
        for (const comm of commissionsToProcess) {
            comm.status = 'Paid';
            comm.paidAt = new Date();
            await comm.save({ session });
            processedCommissions.push(comm);

            if (comm.type === 'SELLER' && comm.seller) {
                const sellerId = comm.seller.toString();
                const netAmount = comm.orderAmount - comm.commissionAmount;

                if (!sellerEarnings.has(sellerId)) {
                    sellerEarnings.set(sellerId, { netAmount: 0, commissionIds: [] });
                }
                const data = sellerEarnings.get(sellerId)!;
                data.netAmount += netAmount;
                data.commissionIds.push(comm._id.toString());
            }
        }

        // 6. Credit Seller Wallets
        for (const [sellerId, data] of sellerEarnings.entries()) {
            const creditResult = await creditWallet(
                sellerId,
                'SELLER',
                data.netAmount,
                `Sale proceeds for order ${order.orderNumber}`,
                orderId,
                data.commissionIds[0],
                session
            );
            if (!creditResult.success) {
                throw new Error(`Failed to credit seller wallet (${sellerId}): ${creditResult.message}`);
            }
        }

        // Delivery partners do not receive per-delivery earnings; skip commission credit.

        // 8. Mark Order as Processed (Idempotency Flag)
        (order as any).commissionsProcessed = true;
        await order.save({ session });

        await session.commitTransaction();
        console.log(`[Commission] Successfully distributed commissions for order ${order.orderNumber}`);

        return {
            success: true,
            message: 'Commissions distributed successfully',
            data: {
                commissions: processedCommissions,
            },
        };
    } catch (error: any) {
        await session.abortTransaction();
        console.error(`[Commission] CRITICAL FAILURE for order ${orderId}:`, error);
        return {
            success: false,
            message: error.message || 'Failed to distribute commissions',
        };
    } finally {
        session.endSession();
    }
};

/**
 * Get commission summary for a user
 */
export const getCommissionSummary = async (
    userId: string,
    userType: 'SELLER' | 'DELIVERY_BOY'
) => {
    try {
        if (userType === 'DELIVERY_BOY') {
            return {
                success: true,
                data: {
                    total: 0,
                    paid: 0,
                    pending: 0,
                    count: 0,
                    commissions: [],
                },
            };
        }

        const query = { seller: userId };

        const commissions = await Commission.find(query).sort({ createdAt: -1 });

        const summary = {
            total: 0,
            paid: 0,
            pending: 0,
            count: commissions.length,
            commissions: commissions.map((c) => ({
                id: c._id,
                orderId: c.order,
                amount: c.commissionAmount,
                rate: c.commissionRate,
                orderAmount: c.orderAmount,
                status: c.status,
                paidAt: c.paidAt,
                createdAt: c.createdAt,
            })),
        };

        commissions.forEach((c) => {
            // For Sellers, earning is Order Amount - Commission Amount
            // For Delivery Boys, earning is the Commission Amount itself
            const earningAmount = userType === 'SELLER'
                ? (c.orderAmount - c.commissionAmount)
                : c.commissionAmount;

            summary.total += earningAmount;
            if (c.status === 'Paid') {
                summary.paid += earningAmount;
            } else if (c.status === 'Pending') {
                summary.pending += earningAmount;
            }
        });

        return {
            success: true,
            data: summary,
        };
    } catch (error: any) {
        console.error(`[Commission] Error getting commission summary for user ${userId}:`, error);
        return {
            success: false,
            message: error.message || 'Failed to get commission summary',
        };
    }
};

/**
 * Reverse commissions for a cancelled/returned order
 */
export const reverseCommissions = async (orderId: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const commissions = await Commission.find({ order: orderId }).session(session);

        if (commissions.length === 0) {
            // No commissions to reverse
            return {
                success: true,
                message: 'No commissions to reverse',
            };
        }

        for (const commission of commissions) {
            // Only reverse if status is Paid
            if (commission.status === 'Paid') {
                commission.status = 'Cancelled';
                await commission.save({ session });

                // Debit from wallet
                const userId = commission.type === 'SELLER' ? commission.seller : commission.deliveryBoy;
                const userType = commission.type;

                if (userId) {
                    const { debitWallet } = await import('./walletManagementService');
                    await debitWallet(
                        userId.toString(),
                        userType,
                        commission.commissionAmount,
                        `Commission reversal for cancelled order`,
                        orderId,
                        session
                    );
                }
            }
        }

        await session.commitTransaction();

        return {
            success: true,
            message: 'Commissions reversed successfully',
        };
    } catch (error: any) {
        await session.abortTransaction();
        console.error(`[Commission] Error reversing commissions for order ${orderId}:`, error);
        return {
            success: false,
            message: error.message || 'Failed to reverse commissions',
        };
    } finally {
        session.endSession();
    }
};
