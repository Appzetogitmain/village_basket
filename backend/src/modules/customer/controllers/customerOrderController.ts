import { Request, Response } from "express";
import Order from "../../../models/Order";
import Product from "../../../models/Product";
import OrderItem from "../../../models/OrderItem";
import Customer from "../../../models/Customer";
import Seller from "../../../models/Seller";
import mongoose from "mongoose";
import { calculateDistance } from "../../../utils/locationHelper";
import { notifySellersOfOrderUpdate } from "../../../services/sellerNotificationService";
import { generateDeliveryOtp } from "../../../services/deliveryOtpService";
import AppSettings from "../../../models/AppSettings";
import { getRoadDistances } from "../../../services/mapService";
import Coupon from "../../../models/Coupon";
import Payment from "../../../models/Payment";
import Refund from "../../../models/Refund";
import WalletTransaction from "../../../models/WalletTransaction";
import Return from "../../../models/Return";
import DeliverySlot from "../../../models/DeliverySlot";

import {
    buildOrderPaymentSnapshot,
    createBestEffortPaymentRecord,
    normalizePaymentMethod,
    toLegacyPaymentMethod,
} from "../../../services/codService";

// Create a new order
export const createOrder = async (req: Request, res: Response) => {
    let session: mongoose.ClientSession | null = null;
    try {
        // Only start session if we are on a replica set (required for transactions)
        // For simplicity in local dev, we check and fallback if it fails
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (sessionError) {
            console.warn("MongoDB Transactions not supported or failed to start. Proceeding without transaction.");
            session = null;
        }

        const { items, address, paymentMethod, fees, deliverySlot, couponCode, tipAmount, gstin, walletAmountUsed, donationAmount } = req.body;
        const userId = req.user!.userId;
        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
        const legacyPaymentMethod = toLegacyPaymentMethod(normalizedPaymentMethod);
        const initialOrderStatus = normalizedPaymentMethod === "cash" ? "Pending" : "Received";

        // Determine order type based on delivery date
        const deliveryDate = deliverySlot?.date ? new Date(deliverySlot.date) : new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(deliveryDate);
        targetDate.setHours(0, 0, 0, 0);
        const calculatedOrderType = targetDate > today ? "SCHEDULED" : "INSTANT";

        // Validate slot timing for same-day bookings (prevents booking past slots)
        if (deliverySlot?.slotId) {
            const selectedSlot = await DeliverySlot.findById(deliverySlot.slotId).lean();
            if (!selectedSlot || !selectedSlot.isActive) {
                if (session) await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: "Selected delivery slot is not available",
                });
            }

            const fmtDateIST = (d: Date) =>
                new Intl.DateTimeFormat("en-CA", {
                    timeZone: "Asia/Kolkata",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                }).format(d);

            const deliveryDateKey = fmtDateIST(deliveryDate);
            const todayKey = fmtDateIST(new Date());

            if (deliveryDateKey === todayKey) {
                const [startHour, startMinute] = String(selectedSlot.startTime || "00:00").split(":").map(Number);
                const nowInIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
                const nowMinutes = (nowInIST.getHours() * 60) + nowInIST.getMinutes();
                const slotStartMinutes = ((Number.isNaN(startHour) ? 0 : startHour) * 60) + (Number.isNaN(startMinute) ? 0 : startMinute);

                // Once a slot starts, it can no longer be booked for today
                if (nowMinutes >= slotStartMinutes) {
                    if (session) await session.abortTransaction();
                    return res.status(400).json({
                        success: false,
                        message: "Selected delivery slot has already started for today. Please choose another slot.",
                    });
                }
            }
        }

        // Log incoming request for debugging
        console.log("DEBUG: Order creation request:", {
            userId,
            itemsCount: items?.length,
            hasAddress: !!address,
            addressLat: address?.latitude,
            addressLng: address?.longitude,
            paymentMethod,
        });

        if (!items || items.length === 0) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Order must have at least one item",
            });
        }

        if (!address) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Delivery address is required",
            });
        }

        // Validate required address fields
        if (!address.city || (typeof address.city === 'string' && address.city.trim() === '')) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "City is required in delivery address",
                details: {
                    receivedCity: address.city,
                    addressObject: address
                }
            });
        }

        if (!address.pincode || (typeof address.pincode === 'string' && address.pincode.trim() === '')) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Pincode is required in delivery address",
                details: {
                    receivedPincode: address.pincode,
                    addressObject: address
                }
            });
        }

        // Fetch customer details
        const customer = await Customer.findById(userId);
        if (!customer) {
            if (session) await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        // Validate delivery address location
        // Handle both string and number types, and check for null/undefined (not truthy, since 0 is valid)
        const deliveryLat = address.latitude != null
            ? (typeof address.latitude === 'number' ? address.latitude : parseFloat(address.latitude))
            : null;
        const deliveryLng = address.longitude != null
            ? (typeof address.longitude === 'number' ? address.longitude : parseFloat(address.longitude))
            : null;

        if (deliveryLat == null || deliveryLng == null || isNaN(deliveryLat) || isNaN(deliveryLng)) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Delivery address location (latitude/longitude) is required",
                details: {
                    receivedLatitude: address.latitude,
                    receivedLongitude: address.longitude,
                    parsedLatitude: deliveryLat,
                    parsedLongitude: deliveryLng,
                }
            });
        }

        // Validate coordinates
        if (deliveryLat < -90 || deliveryLat > 90 || deliveryLng < -180 || deliveryLng > 180) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Invalid delivery address coordinates",
            });
        }

        // Initialize Order first to get an ID
        const newOrder = new Order({
            customer: new mongoose.Types.ObjectId(userId),
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            orderType: calculatedOrderType,
            deliveryAddress: {
                address: address.address || address.street || 'N/A',
                city: address.city || 'N/A',
                state: address.state || '',
                pincode: address.pincode || '000000',
                landmark: address.landmark || '',
                latitude: deliveryLat,
                longitude: deliveryLng,
            },
            // Save selected delivery slot if provided
            ...(deliverySlot && {
                deliverySlot: {
                    slotId: deliverySlot.slotId || undefined,
                    date: deliverySlot.date ? new Date(deliverySlot.date) : new Date(),
                    timeRange: deliverySlot.timeRange || deliverySlot.label || '',
                    label: deliverySlot.label || deliverySlot.timeRange || '',
                }
            }),
            paymentMethod: legacyPaymentMethod,
            paymentStatus: 'Pending',
            payment: buildOrderPaymentSnapshot(normalizedPaymentMethod, "pending"),
            status: initialOrderStatus,
            subtotal: 0,
            tax: 0,
            shipping: fees?.deliveryFee || 0,
            platformFee: fees?.platformFee || 0,
            discount: 0,
            total: 0,
            donationAmount: Number(donationAmount) || 0,
            items: []
        });

        let calculatedSubtotal = 0;
        const orderItemIds: mongoose.Types.ObjectId[] = [];
        const sellerIds = new Set<string>(); // Track unique sellers

        for (const item of items) {
            if (!item.product || !item.product.id) {
                throw new Error("Invalid item structure: product.id is missing");
            }

            const qty = Number(item.quantity) || 0;
            if (qty <= 0) {
                throw new Error("Invalid item quantity");
            }

            // Atomically check stock and decrement to prevent race conditions
            let product;
            // The frontend sends variation info as 'variant' or 'variation'
            // In the product model, it's stored in 'variations' array
            const variationValue = item.variant || item.variation;

            if (variationValue) {
                // Try to decrement stock for the specific variation first
                // We check variations._id, variations.value, variations.title, or variations.pack
                product = session
                    ? await Product.findOneAndUpdate(
                        {
                            _id: item.product.id,
                            $or: [
                                { "variations._id": mongoose.isValidObjectId(variationValue) ? variationValue : new mongoose.Types.ObjectId() },
                                { "variations.name": variationValue },
                                { "variations.value": variationValue },
                                { "variations.title": variationValue },
                                { "variations.pack": variationValue }
                            ],
                            "variations.stock": { $gte: qty }
                        },
                        { $inc: { "variations.$.stock": -qty, stock: -qty } },
                        { session, new: true }
                    )
                    : await Product.findOneAndUpdate(
                        {
                            _id: item.product.id,
                            $or: [
                                { "variations._id": mongoose.isValidObjectId(variationValue) ? variationValue : new mongoose.Types.ObjectId() },
                                { "variations.name": variationValue },
                                { "variations.value": variationValue },
                                { "variations.title": variationValue },
                                { "variations.pack": variationValue }
                            ],
                            "variations.stock": { $gte: qty }
                        },
                        { $inc: { "variations.$.stock": -qty, stock: -qty } },
                        { new: true }
                    );
            }

            if (!product) {
                // If we are here, either variationValue wasn't provided, or it didn't match any variation with enough stock.
                // We'll try to find the product first to see if it has variations.
                const checkProduct = await Product.findById(item.product.id);

                if (checkProduct && checkProduct.variations && checkProduct.variations.length > 0) {
                    // Product has variations, but we didn't match one.
                    // If a variation was provided, it means that specific variation is out of stock.
                    if (variationValue && variationValue !== 'Standard') {
                        throw new Error(`Insufficient stock for variation: ${variationValue}`);
                    }

                    // If variationValue is 'Standard' but not found, or not provided,
                    // we'll try to find the product again and decrement from the first variation.
                    // This is handled by falling through to the findOneAndUpdate below.

                    // No variation was provided, but the product has them.
                    // To maintain data consistency, we'll try to decrement from the first variation.
                    product = session
                        ? await Product.findOneAndUpdate(
                            {
                                _id: item.product.id,
                                "variations.0.stock": { $gte: qty }
                            },
                            { $inc: { "variations.0.stock": -qty, stock: -qty } },
                            { session, new: true }
                        )
                        : await Product.findOneAndUpdate(
                            {
                                _id: item.product.id,
                                "variations.0.stock": { $gte: qty }
                            },
                            { $inc: { "variations.0.stock": -qty, stock: -qty } },
                            { new: true }
                        );
                } else {
                    // No variations, just decrement top-level stock
                    product = session
                        ? await Product.findOneAndUpdate(
                            { _id: item.product.id, stock: { $gte: qty } },
                            { $inc: { stock: -qty } },
                            { session, new: true }
                        )
                        : await Product.findOneAndUpdate(
                            { _id: item.product.id, stock: { $gte: qty } },
                            { $inc: { stock: -qty } },
                            { new: true }
                        );
                }
            }

            if (!product) {
                throw new Error(`Insufficient stock or product not found: ${item.product.name || 'ID: ' + item.product.id}${variationValue ? ' (' + variationValue + ')' : ''}`);
            }

            // Track seller IDs to validate location
            if (product.seller) {
                sellerIds.add(product.seller.toString());
            }

            // Determine the price based on variation and discounts
            let selectedVariation;
            if (variationValue && product.variations) {
                selectedVariation = product.variations.find((v: any) =>
                    (v._id && v._id.toString() === variationValue) ||
                    v.name === variationValue ||
                    v.value === variationValue ||
                    v.title === variationValue ||
                    v.pack === variationValue
                );
            }
            if (!selectedVariation && product.variations && product.variations.length > 0) {
                // Fallback to first if no variation spec or not found (consistent with stock fallback)
                selectedVariation = product.variations[0];
            }

            const userType = customer.userType || 'retail';
            const isWholesale = userType === 'wholesale';
            const priceField = isWholesale ? 'wholesalePrice' : 'retailPrice';
            const discPriceField = isWholesale ? 'wholesaleDiscPrice' : 'retailDiscPrice';

            const itemPrice = (selectedVariation?.[discPriceField] && selectedVariation[discPriceField] > 0)
                ? selectedVariation[discPriceField]
                : (product[discPriceField] && Number(product[discPriceField]) > 0)
                    ? product[discPriceField]
                    : (selectedVariation?.[priceField] || product[priceField] || 0);
            const itemTotal = itemPrice * qty;
            calculatedSubtotal += itemTotal;

            // Create OrderItem
            const newOrderItemData = {
                order: newOrder._id,
                product: product._id,
                seller: product.seller,
                productName: product.productName,
                productImage: product.mainImage,
                sku: product.sku,
                unitPrice: itemPrice,
                quantity: qty,
                total: itemTotal,
                variation: variationValue,
                status: 'Pending'
            };

            const newOrderItem = new OrderItem(newOrderItemData);
            if (session) {
                await newOrderItem.save({ session });
            } else {
                await newOrderItem.save();
            }
            orderItemIds.push(newOrderItem._id as mongoose.Types.ObjectId);
        }

        // Validate all sellers can deliver to user's location
        if (sellerIds.size > 0) {
            const uniqueSellerIds = Array.from(sellerIds).map(id => new mongoose.Types.ObjectId(id));

            // Find sellers and check if user is within their service radius
            const sellers = await Seller.find({
                _id: { $in: uniqueSellerIds },
                status: "Approved",
                location: { $exists: true, $ne: null },
            });

            // Check each seller can deliver to user's location
            for (const seller of sellers) {
                if (!seller.location || !seller.location.coordinates) {
                    if (session) await session.abortTransaction();
                    return res.status(403).json({
                        success: false,
                        message: `Seller ${seller.storeName} does not have a valid location. Order cannot be placed.`,
                    });
                }

                const sellerLng = seller.location.coordinates[0];
                const sellerLat = seller.location.coordinates[1];
                const distance = calculateDistance(deliveryLat, deliveryLng, sellerLat, sellerLng);
                const serviceRadius = seller.serviceRadiusKm || 10;

                if (distance > serviceRadius) {
                    if (session) await session.abortTransaction();
                    return res.status(403).json({
                        success: false,
                        message: `Your delivery address is ${distance.toFixed(2)} km away from ${seller.storeName}. They only deliver within ${serviceRadius} km. Please select products from sellers in your area.`,
                    });
                }
            }
        }

        // Apply fees
        const settings = await AppSettings.getSettings();
        let platformFee = Number(fees?.platformFee) || settings?.platformFee || 0;
        let deliveryFee = Number(fees?.deliveryFee) || 0;
        let deliveryDistanceKm = 0;

        // --- Distance-Based Delivery Charge Calculation ---
        try {
            const freeDeliveryThreshold = settings?.freeDeliveryThreshold || 0;

            // Check for Free Delivery eligibility first
            if (freeDeliveryThreshold > 0 && calculatedSubtotal >= freeDeliveryThreshold) {
                deliveryFee = 0;
            }
            // Only recalculate if enabled in settings (and not free delivery)
            else if (settings && settings.deliveryConfig?.isDistanceBased === true) {
                const config = settings.deliveryConfig;

                // Collect seller locations
                const sellerLocations: { lat: number; lng: number }[] = [];
                const uniqueSellerIds = Array.from(sellerIds).map(id => new mongoose.Types.ObjectId(id));
                const sellers = await Seller.find({ _id: { $in: uniqueSellerIds } }).select('location latitude longitude storeName');

                sellers.forEach(seller => {
                    let lat, lng;
                    if (seller.location?.coordinates?.length === 2) {
                        lng = seller.location.coordinates[0];
                        lat = seller.location.coordinates[1];
                    } else if (seller.latitude && seller.longitude) {
                        lat = parseFloat(seller.latitude);
                        lng = parseFloat(seller.longitude);
                    }

                    if (lat && lng) {
                        sellerLocations.push({ lat, lng });
                    }
                });

                if (sellerLocations.length > 0 && deliveryLat && deliveryLng) {
                    // Get distances (Road or Air based on API Key presence)
                    const distances = await getRoadDistances(
                        sellerLocations,
                        { lat: deliveryLat, lng: deliveryLng },
                        config.googleMapsKey
                    );

                    // Take the maximum distance (furthest seller)
                    deliveryDistanceKm = Math.max(...distances);

                    // Calculate Fee
                    // Formula: BaseCharge + (Max(0, Distance - BaseDistance) * KmRate)
                    const extraKm = Math.max(0, deliveryDistanceKm - config.baseDistance);
                    const calculatedDeliveryFee = config.baseCharge + (extraKm * config.kmRate);

                    // Override the delivery fee
                    deliveryFee = Math.ceil(calculatedDeliveryFee);

                    console.log(`DEBUG: Distance Calculation: MaxDistance=${deliveryDistanceKm}km, Fee=${deliveryFee} (Base: ${config.baseCharge}, Rate: ${config.kmRate}/km)`);
                }
            }
        } catch (calcError) {
            console.error("Error calculating distance-based delivery fee:", calcError);
            // Fallback to provided fee or 0
        }

        let discountAmount = 0;
        if (couponCode) {
            try {
                const coupon = await Coupon.findOne({
                    code: couponCode.toUpperCase(),
                    isActive: true,
                    startDate: { $lte: new Date() },
                    endDate: { $gte: new Date() },
                });

                if (coupon) {
                    if (!coupon.minimumPurchase || calculatedSubtotal >= coupon.minimumPurchase) {
                        if (coupon.discountType === "Percentage") {
                            discountAmount = (calculatedSubtotal * coupon.discountValue) / 100;
                            if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
                                discountAmount = coupon.maximumDiscount;
                            }
                        } else {
                            discountAmount = coupon.discountValue;
                        }
                    }
                }
            } catch (error) {
                console.warn("Coupon validation failed during order creation:", error);
            }
        }

        // Recalculate Final Total
        const tip = Number(tipAmount) || 0;
        const donation = Number(donationAmount) || 0;
        const finalTotal = calculatedSubtotal + platformFee + deliveryFee + tip + donation - discountAmount;

        // Update Order with calculated values and items
        newOrder.subtotal = Number(calculatedSubtotal.toFixed(2));
        newOrder.platformFee = platformFee;
        newOrder.discount = discountAmount;
        newOrder.couponCode = couponCode;
        newOrder.customerNotes = tip > 0 ? `Tip: ₹${tip}` : '';
        newOrder.gstin = gstin;
        newOrder.total = Number(Math.max(0, finalTotal).toFixed(2));
        newOrder.items = orderItemIds;
        newOrder.shipping = deliveryFee;
        newOrder.deliveryDistanceKm = deliveryDistanceKm;
        newOrder.payableAmount = newOrder.total; // Start with full total

        // --- Financial Debug Logging ---
        console.log(`[FINANCE DEBUG] Order Calculation for ORD-${newOrder._id}:`, {
            subtotal: newOrder.subtotal,
            platformFee,
            deliveryFee,
            discount: discountAmount,
            tip,
            finalTotalInDB: newOrder.total,
            walletBalance: customer.walletAmount,
            requestedWalletUse: walletAmountUsed
        });

        // --- Partial Wallet Usage Logic ---
        const walletToDebit = Number(walletAmountUsed) || 0;
        let totalDebitedFromWallet = 0;

        if (walletToDebit > 0) {
            const amountToUse = Math.min(walletToDebit, newOrder.total);

            // Check balance first
            if ((customer.walletAmount || 0) < amountToUse) {
                if (session) await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient wallet balance. Balance: ₹${customer.walletAmount || 0}, Requested: ₹${amountToUse}`
                });
            }

            // Atomic debit
            const updatedCustomer = await Customer.findOneAndUpdate(
                { _id: userId, walletAmount: { $gte: amountToUse } },
                { $inc: { walletAmount: -amountToUse } },
                { session, new: true }
            );

            if (!updatedCustomer) {
                if (session) await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: "Failed to debit wallet. Concurrent update or insufficient balance."
                });
            }

            totalDebitedFromWallet = amountToUse;
            newOrder.walletAmountUsed = amountToUse;
            newOrder.payableAmount = Number((newOrder.total - amountToUse).toFixed(2));

            console.log(`[FINANCE DEBUG] Wallet Applied: -₹${amountToUse}, New Payable: ₹${newOrder.payableAmount}`);

            // Create Wallet Transaction record
            const walletTx = new WalletTransaction({
                userId: customer._id,
                userType: 'CUSTOMER',
                amount: amountToUse,
                type: 'Debit',
                description: `Payment for order #${newOrder.orderNumber} ${newOrder.payableAmount === 0 ? '(Full)' : '(Partial)'}`,
                status: 'Completed',
                reference: `PAY_${newOrder._id}_${Date.now()}`,
                relatedOrder: newOrder._id
            });
            await walletTx.save({ session });
        }

        // --- Full Wallet Payment Logic (Override/Fallback) ---
        if (normalizedPaymentMethod === 'wallet') {
            const remaining = newOrder.total - totalDebitedFromWallet;

            if (remaining > 0) {
                if ((customer.walletAmount || 0) < remaining) {
                    if (session) await session.abortTransaction();
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient wallet balance. Total: ₹${newOrder.total}, Used: ₹${totalDebitedFromWallet}, Remaining: ₹${remaining}`
                    });
                }

                const updatedCustomer = await Customer.findOneAndUpdate(
                    { _id: userId, walletAmount: { $gte: remaining } },
                    { $inc: { walletAmount: -remaining } },
                    { session, new: true }
                );

                if (!updatedCustomer) {
                    if (session) await session.abortTransaction();
                    return res.status(400).json({
                        success: false,
                        message: "Failed to debit wallet. Insufficient balance or concurrent update."
                    });
                }

                newOrder.walletAmountUsed = (newOrder.walletAmountUsed || 0) + remaining;
                newOrder.payableAmount = 0; // Everything paid via wallet

                // Create Wallet Transaction record (Full/Remaining)
                const walletTx = new WalletTransaction({
                    userId: customer._id,
                    userType: 'CUSTOMER',
                    amount: remaining,
                    type: 'Debit',
                    description: `Payment for order #${newOrder.orderNumber} (Remaining)`,
                    status: 'Completed',
                    reference: `PAY_R_${newOrder._id}_${Date.now()}`,
                    relatedOrder: newOrder._id
                });
                await walletTx.save({ session });
            }

            // Mark order as paid if totally paid by wallet
            newOrder.paymentStatus = 'Paid';
            newOrder.payment = buildOrderPaymentSnapshot("wallet", "completed");
        }


        if (session) {
            await newOrder.save({ session });
            await session.commitTransaction();
        } else {
            // Validate before saving to catch errors with details
            const validationError = newOrder.validateSync();
            if (validationError) {
                console.error("DEBUG: Order Validation Error:", validationError.errors);
                throw validationError;
            }
            await newOrder.save();
        }

        // Ensure nested payment fields stay aligned for COD and prepaid pending states.
        if (!newOrder.payment) {
            const status = newOrder.paymentStatus === "Paid" ? "completed" : "pending";
            newOrder.payment = buildOrderPaymentSnapshot(normalizedPaymentMethod, status);
            await newOrder.save();
        }

        // Best-effort payment tracking record (non-blocking by design).
        try {
            await createBestEffortPaymentRecord(newOrder);
        } catch (paymentTrackingError) {
            console.error("Best-effort payment tracking failed:", paymentTrackingError);
        }


        // Emit notification to involved sellers
        try {
            // Reload order to ensure orderNumber is set (generated by pre-validate hook) and items are available
            const savedOrder = await Order.findById(newOrder._id).lean();
            if (savedOrder) {
                const orderAny = savedOrder as any;
                
                // Only notify sellers immediately for COD or if fully paid (e.g. via Wallet).
                // For Online/Razorpay payments, we delay notification until verifyPayment or Webhook confirms success.
                const isCod = normalizedPaymentMethod === 'cash';
                const isWallet = normalizedPaymentMethod === 'wallet';
                const isPaid = newOrder.paymentStatus === 'Paid';

                if (isCod || isWallet || isPaid) {
                    const { notifySellersOfNewOrder } = await import('../../../services/sellerNotificationService');
                    await notifySellersOfNewOrder(orderAny);
                } else {
                    console.log(`DEBUG: Order ${orderAny.orderNumber} is ${normalizedPaymentMethod}. Delaying seller notification until payment is verified.`);
                }
            }
        } catch (notificationError) {
            // Log error but don't fail the order creation
            console.error("Error notifying sellers of new order:", notificationError);
        }

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: newOrder,
            razorpay: normalizedPaymentMethod === "cash" ? null : undefined,
        });

    } catch (error: any) {
        if (session) {
            try {
                await session.abortTransaction();
            } catch (abortError) {
                console.error("Error aborting transaction:", abortError);
            }
        }

        console.error("DEBUG: Order Creation Error Detail:", {
            message: error.message,
            name: error.name,
            errors: error.errors ? Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message,
                value: error.errors[key].value
            })) : undefined,
            stack: error.stack,
            body: req.body
        });

        // Return a more informative error message if it's a validation error
        let errorMessage = "Error creating order. " + error.message;
        if (error.name === 'ValidationError') {
            const fields = Object.keys(error.errors).join(', ');
            errorMessage = `Validation failed for fields: ${fields}. ${error.message}`;
        }

        return res.status(500).json({
            success: false,
            message: errorMessage,
            error: error.message,
            details: error.errors,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (session) session.endSession();
    }
};

// Get authenticated customer's orders
export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { status, page = 1, limit = 10 } = req.query;

        const query: any = { customer: userId };

        if (status) {
            query.status = status; // Note: Model field is 'status', not 'orderStatus'
        }

        const skip = (Number(page) - 1) * Number(limit);

        const orders = await Order.find(query)
            .populate({
                path: 'items',
                populate: { path: 'product', select: 'productName mainImage retailPrice retailDiscPrice wholesalePrice wholesaleDiscPrice' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Order.countDocuments(query);

        // Transform orders to match frontend Order type
        const transformedOrders = orders.map(order => {
            const orderObj = order.toObject();
            return {
                ...orderObj,
                id: orderObj._id.toString(),
                totalItems: Array.isArray(orderObj.items) ? orderObj.items.length : 0,
                totalAmount: orderObj.total,
                fees: {
                    platformFee: orderObj.platformFee || 0,
                    deliveryFee: orderObj.shipping || 0
                },
                // Keep original fields for backward compatibility
                subtotal: orderObj.subtotal,
                address: orderObj.deliveryAddress
            };
        });

        return res.status(200).json({
            success: true,
            data: transformedOrders,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Error fetching orders",
            error: error.message,
        });
    }
};

// Get single order details
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        // Find order and ensure it belongs to the user
        const order = await Order.findOne({ _id: id, customer: userId })
            .populate({
                path: 'items',
                populate: [
                    { path: 'product', select: 'productName mainImage pack manufacturer retailPrice retailDiscPrice wholesalePrice wholesaleDiscPrice mrp' },
                    { path: 'seller', select: 'storeName city mobile fssaiLicNo' }
                ]
            })
            .populate('deliveryBoy', 'name phone profileImage vehicleNumber');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Get customer's permanent delivery OTP
        const customer = await Customer.findById(userId).select('deliveryOtp');
        const deliveryOtp = customer?.deliveryOtp;

        // Transform order to match frontend Order type
        const orderObj = order.toObject();
        const transformedOrder = {
            ...orderObj,
            id: orderObj._id.toString(),
            totalItems: Array.isArray(orderObj.items) ? orderObj.items.length : 0,
            totalAmount: orderObj.total,
            fees: {
                platformFee: orderObj.platformFee || 0,
                deliveryFee: orderObj.shipping || 0
            },
            // Keep original fields for backward compatibility
            subtotal: orderObj.subtotal,
            address: orderObj.deliveryAddress,
            // Include invoice enabled flag
            invoiceEnabled: orderObj.invoiceEnabled || false,
            // Include customer's permanent delivery OTP
            deliveryOtp,
            // Map deliveryBoy to deliveryPartner for frontend
            deliveryPartner: orderObj.deliveryBoy
        };

        return res.status(200).json({
            success: true,
            data: transformedOrder,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: "Error fetching order detail",
            error: error.message,
        });
    }
};

/**
 * Refresh Delivery OTP
 */
export const refreshDeliveryOtp = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;

        const order = await Order.findOne({ _id: id, customer: userId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.status === 'Delivered') {
            return res.status(400).json({ success: false, message: "Order is already delivered" });
        }

        // Generate and send new OTP
        const result = await generateDeliveryOtp(id);

        // Emit socket event if needed (customer room)
        const io = (req.app as any).get("io");
        if (io) {
            io.to(`order-${id}`).emit('delivery-otp-refreshed', {
                orderId: id,
                deliveryOtp: order.deliveryOtp, // The service saves it to the order
                expiresAt: order.deliveryOtpExpiresAt
            });
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error refreshing delivery OTP:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to refresh delivery OTP",
            error: error.message
        });
    }
};

// Cancel Order
export const cancelOrder = async (req: Request, res: Response) => {
    let session: mongoose.ClientSession | null = null;
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user!.userId;

        console.log(`DEBUG: Cancellation request for order ${id} by user ${userId} with reason: ${reason}`);

        if (!reason) {
            return res.status(400).json({ success: false, message: "Cancellation reason is required" });
        }

        // Start session for atomic cancellation if possible
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch (sessionError) {
            console.warn("MongoDB Transactions not supported or failed to start. Proceeding without transaction.");
            session = null;
        }

        // Fetch order with items populated to avoid multiple queries
        const order = session
            ? await Order.findOne({ _id: id, customer: userId })
                .populate({
                    path: 'items',
                    populate: { path: 'product' }
                })
                .session(session)
            : await Order.findOne({ _id: id, customer: userId })
                .populate({
                    path: 'items',
                    populate: { path: 'product' }
                });

        if (!order) {
            if (session) await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Status check
        const nonCancellableStatuses = ['Delivered', 'Cancelled', 'Returned', 'Rejected', 'Out for Delivery', 'Shipped'];
        if (nonCancellableStatuses.includes(order.status)) {
            if (session) await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled as it is already ${order.status}`
            });
        }

        // Track seller IDs for notifications
        const sellerIds = new Set<string>();

        // 1. Restore stock and update OrderItems
        if (order.items && Array.isArray(order.items)) {
            for (const item of order.items) {
                // Since we populated, it's either an IOrderItem or null
                const orderItem = item as any;
                if (!orderItem) continue;

                if (orderItem.seller) {
                    sellerIds.add(orderItem.seller.toString());
                }

                if (orderItem.product) {
                    const product = orderItem.product; // Already populated!

                    // Restore variation stock if applicable
                    if (orderItem.variation && product.variations && product.variations.length > 0) {
                        const variationIndex = product.variations.findIndex((v: any) =>
                            (v._id && v._id.toString() === orderItem.variation) ||
                            v.name === orderItem.variation ||
                            v.value === orderItem.variation ||
                            v.title === orderItem.variation ||
                            v.pack === orderItem.variation
                        );

                        if (variationIndex !== -1) {
                            product.variations[variationIndex].stock = (product.variations[variationIndex].stock || 0) + (orderItem.quantity || 0);
                        } else {
                            // If variation not found by string, try to restore to the first one as fallback
                            // or just the main stock if no variations match
                            product.variations[0].stock = (product.variations[0].stock || 0) + (orderItem.quantity || 0);
                        }
                    }

                    // Always restore main product stock
                    product.stock = (product.stock || 0) + (orderItem.quantity || 0);

                    // Ensure required fields like retailPrice are present to avoid validation fail on save
                    // If they are missing in DB (dirty data), we provide a fallback from OrderItem
                    if (product.retailPrice == null) {
                        product.retailPrice = orderItem.unitPrice || 0;
                    }
                    if (product.wholesalePrice == null) {
                        product.wholesalePrice = product.retailPrice || 0;
                    }

                    // Mark variations as modified so Mongoose saves them
                    if (product.variations) {
                        product.markModified('variations');
                    }

                    if (session) {
                        await product.save({ session });
                    } else {
                        await product.save();
                    }
                }

                // Update item status
                orderItem.status = 'Cancelled';
                if (session) {
                    await orderItem.save({ session });
                } else {
                    await orderItem.save();
                }
            }
        }

        // Capture delivery boy ID before clearing if assigned
        const assignedDeliveryBoyId = order.deliveryBoy ? order.deliveryBoy.toString() : null;
        console.log(`DEBUG: Cancellation request for order ${id}. Captured driver ID: ${assignedDeliveryBoyId}`);

        // Clear delivery assignment and OTP if order is cancelled
        order.deliveryBoy = undefined;
        order.deliveryBoyStatus = undefined;
        order.deliveryOtp = undefined;
        order.deliveryOtpExpiresAt = undefined;

        const previousStatus = order.status;

        // Mark as cancelled
        order.status = 'Cancelled';
        order.cancellationReason = reason;
        order.cancelledAt = new Date();

        // Handle cancelledBy safely
        try {
            order.cancelledBy = new mongoose.Types.ObjectId(userId) as any;
        } catch (idErr) {
            console.warn("Could not cast userId to ObjectId for cancelledBy, using as is:", userId);
            (order as any).cancelledBy = userId;
        }

        // Refund Logic:
        // 1. If the order was just 'Pending' (Payment not finished / abandoned), do an INSTANT refund.
        // 2. Otherwise (Received, Accepted, Processed, etc.), we postpone until seller acknowledges.
        const walletUsed = order.walletAmountUsed || 0;
        const totalAmount = order.total;
        let refundAmount = 0;

        let isInstantRefund = ['Pending'].includes(previousStatus);

        if (isInstantRefund) {
            if (order.paymentStatus === 'Paid') {
                refundAmount = totalAmount;
            } else if (walletUsed > 0) {
                refundAmount = walletUsed;
            }
        }

        if (isInstantRefund && refundAmount > 0) {
            console.log(`DEBUG: Instant refund for order ${id} (Status was: ${previousStatus}). Refund: ₹${refundAmount}.`);
        } else {
            console.log(`DEBUG: Cancellation request for order ${id}. Status: ${previousStatus}. Refund postponed for seller approval.`);
            order.isRefunded = false;
        }

        if (refundAmount > 0 && !order.isRefunded && order.paymentMethod !== 'COD') {
            try {
                const updatedCustomer = await Customer.findOneAndUpdate(
                    { _id: order.customer },
                    { $inc: { walletAmount: refundAmount } },
                    { session, new: true }
                );

                if (updatedCustomer) {
                    order.isRefunded = true;
                    if (order.paymentStatus === 'Paid' || refundAmount === totalAmount) {
                        order.paymentStatus = 'Refunded';
                    }

                    // Create Wallet Transaction Record (Credit)
                    const walletTx = new WalletTransaction({
                        userId: order.customer,
                        userType: 'CUSTOMER',
                        amount: refundAmount,
                        type: 'Credit',
                        description: `Refund for cancelled order #${order.orderNumber}`,
                        status: 'Completed',
                        reference: `REFUND_${order._id}_${Date.now()}`,
                        relatedOrder: order._id
                    });
                    await walletTx.save({ session });

                    // 3. Mark Payment Record as Refunded if it exists for bank references
                    const payment = await Payment.findOne({
                        order: order._id,
                        status: { $in: ['Completed', 'Succeeded', 'Authorized'] }
                    }).session(session);

                    if (payment) {
                        payment.status = 'Refunded';
                        payment.refundAmount = refundAmount;
                        payment.refundedAt = new Date();
                        payment.refundReason = reason;
                        await payment.save({ session });

                        // 4. Create separate Refund record for audit
                        const refund = new Refund({
                            order: order._id,
                            payment: payment._id,
                            customer: order.customer,
                            amount: refundAmount,
                            reason: reason,
                            status: 'Completed'
                        });
                        await refund.save({ session });
                    }
                }
            } catch (payErr) {
                console.error("DEBUG: Wallet refund update error (Suppressed):", payErr);
            }
        }

        if (session) {
            await order.save({ session });
            await session.commitTransaction();
        } else {
            await order.save();
        }

        // 3. Notify involved parties (in background)
        try {
            const io = (req.app as any).get("io");
            if (io) {
                // Notify sellers via Socket
                await notifySellersOfOrderUpdate(io, order, 'ORDER_CANCELLED');

                // Notify order room
                io.to(`order-${order._id}`).emit('order-cancelled', {
                    orderId: order._id,
                    status: 'Cancelled',
                    message: "Order has been cancelled"
                });

                // Notify delivery boy if assigned
                if (assignedDeliveryBoyId) {
                    const deliveryBoyIdStr = assignedDeliveryBoyId.toString();
                    io.to(`delivery-${deliveryBoyIdStr}`).emit('order-cancelled', {
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        message: "Order has been cancelled by the customer"
                    });
                }

                // Push Notifications
                const { sendNotification, sendOrderStatusNotification } = await import('../../../services/notificationService');

                // Push to sellers
                for (const sellerId of Array.from(sellerIds)) {
                    await sendNotification("Seller", sellerId, "Order Cancelled", `Customer cancelled order #${order.orderNumber}.`, {
                        type: "Order",
                        idempotencyKey: `cancel_${order._id}_${sellerId}`
                    });
                }

                // Push to Customer (Confirmation)
                await sendOrderStatusNotification(order.orderNumber, order._id.toString(), order.customer.toString(), 'Cancelled', order.total);

                // Push to Delivery Partner (if assigned)
                if (assignedDeliveryBoyId) {
                    console.log(`DEBUG: Sending push notification to delivery partner ${assignedDeliveryBoyId} for order ${order.orderNumber}`);
                    await sendNotification(
                        "Delivery",
                        assignedDeliveryBoyId, // Already stringified
                        "Order Cancelled",
                        `The order #${order.orderNumber} you were assigned to has been cancelled by the customer.`,
                        {
                            type: "Order",
                            priority: "High",
                            data: {
                                type: "ORDER_CANCELLED",
                                id: order._id.toString(),
                                orderNumber: order.orderNumber
                            },
                            idempotencyKey: `cancel_delivery_${order._id}_${assignedDeliveryBoyId}_${Date.now()}` // Unique per attempt
                        }
                    );
                }
            }
        } catch (notifErr) {
            console.error("DEBUG: Cancellation Notification Error (Supressed):", notifErr);
        }

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: {
                id: order._id,
                status: order.status,
                paymentStatus: order.paymentStatus,
                cancelledAt: order.cancelledAt
            }
        });

    } catch (error: any) {
        if (session) {
            try {
                await session.abortTransaction();
            } catch (e) { }
        }
        console.error('ERROR: Fatal error in cancelOrder:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel order",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        if (session) session.endSession();
    }
};

// Update Order Notes (Instructions/Special Requests)
export const updateOrderNotes = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { deliveryInstructions, specialRequests } = req.body;
        const userId = req.user!.userId;

        const order = await Order.findOne({ _id: id, customer: userId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (['Delivered', 'Cancelled', 'Returned'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot update notes for ${order.status} order`
            });
        }

        if (deliveryInstructions !== undefined) order.deliveryInstructions = deliveryInstructions;
        if (specialRequests !== undefined) order.specialRequests = specialRequests;

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order notes updated",
            data: {
                deliveryInstructions: order.deliveryInstructions,
                specialRequests: order.specialRequests
            }
        });
    } catch (error: any) {
        console.error('Error updating order notes:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update order notes",
            error: error.message
        });
    }
};

/**
 * Create return request for an order item
 */
export const createReturnRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user!.userId;
        const { orderItemId, reason, description, quantity, images } = req.body;

        if (!orderItemId) {
            return res.status(400).json({
                success: false,
                message: "Order item is required",
            });
        }

        if (!reason || !String(reason).trim()) {
            return res.status(400).json({
                success: false,
                message: "Return reason is required",
            });
        }

        const order = await Order.findOne({ _id: id, customer: userId }).populate("items");
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (order.status !== "Delivered") {
            return res.status(400).json({
                success: false,
                message: "Return can only be requested for delivered orders",
            });
        }

        const orderItem = await OrderItem.findOne({
            _id: orderItemId,
            order: order._id,
        });

        if (!orderItem) {
            return res.status(404).json({
                success: false,
                message: "Order item not found for this order",
            });
        }

        const requestedQty = Math.max(1, Number(quantity) || 1);
        if (requestedQty > orderItem.quantity) {
            return res.status(400).json({
                success: false,
                message: "Return quantity cannot exceed ordered quantity",
            });
        }

        const existingReturn = await Return.findOne({
            customer: userId,
            order: order._id,
            orderItem: orderItem._id,
            status: { $in: ["Pending", "Approved", "Processing"] },
        });

        if (existingReturn) {
            return res.status(400).json({
                success: false,
                message: "A return request already exists for this item",
            });
        }

        const createdReturn = await Return.create({
            order: order._id,
            orderItem: orderItem._id,
            customer: userId,
            reason: String(reason).trim(),
            description: description ? String(description).trim() : undefined,
            quantity: requestedQty,
            images: Array.isArray(images) ? images : [],
            pickupAddress: {
                address: order.deliveryAddress?.address || "",
                city: order.deliveryAddress?.city || "",
                pincode: order.deliveryAddress?.pincode || "",
            },
        });

        return res.status(201).json({
            success: true,
            message: "Return request submitted successfully",
            data: createdReturn,
        });
    } catch (error: any) {
        console.error("Error creating return request:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create return request",
            error: error.message,
        });
    }
};

/**
 * Get authenticated customer's return requests
 */
export const getMyReturnRequests = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { orderId, status } = req.query;

        const query: any = { customer: userId };
        if (orderId) query.order = orderId;
        if (status) query.status = status;

        const returnRequests = await Return.find(query)
            .populate("order", "orderNumber")
            .populate("orderItem", "productName productImage quantity unitPrice total variation")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: returnRequests,
        });
    } catch (error: any) {
        console.error("Error fetching return requests:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch return requests",
            error: error.message,
        });
    }
};

/**
 * Get single return request detail for authenticated customer
 */
export const getMyReturnRequestById = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { returnId } = req.params;

        const returnRequest = await Return.findOne({ _id: returnId, customer: userId })
            .populate("order", "orderNumber status deliveryAddress")
            .populate("orderItem", "productName productImage quantity unitPrice total variation");

        if (!returnRequest) {
            return res.status(404).json({
                success: false,
                message: "Return request not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: returnRequest,
        });
    } catch (error: any) {
        console.error("Error fetching return request detail:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch return request detail",
            error: error.message,
        });
    }
};

/**
 * Get orders for a specific date range (for calendar strip)
 */
export const getOrdersByDateRange = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "startDate and endDate are required",
            });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        
        // Ensure we cover the full range of the end date
        end.setHours(23, 59, 59, 999);

        const orders = await Order.find({
            customer: userId,
            "deliverySlot.date": {
                $gte: start,
                $lte: end,
            },
            status: { $nin: ["Cancelled", "Rejected"] }
        }).select("deliverySlot.date status orderType orderNumber");

        return res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error: any) {
        console.error("Error fetching orders by date range:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching orders by date range",
            error: error.message,
        });
    }
};

