import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment';
import Order from '../models/Order';
import mongoose from 'mongoose';
import {
    createPaymentRecordId,
    getRazorpayCredentials,
    getRazorpayInstanceFromDb,
    verifyRazorpaySignatureFromDb,
} from './codService';

// Initialize Razorpay instance
const getRazorpayInstance = async (): Promise<Razorpay> => getRazorpayInstanceFromDb();

/**
 * Create a Razorpay order
 */
export const createRazorpayOrder = async (
    orderId: string,
    amount: number,
    currency: string = 'INR'
) => {
    try {
        const razorpay = await getRazorpayInstance();
        const { keyId } = await getRazorpayCredentials();

        const options = {
            amount: Math.round(amount * 100), // Amount in paise
            currency,
            receipt: orderId,
            notes: {
                orderId,
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        return {
            success: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                razorpayKey: keyId, // Send key to frontend
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt,
            },
        };
    } catch (error: any) {
        console.error('Error creating Razorpay order:', error);
        return {
            success: false,
            message: error.message || 'Failed to create Razorpay order',
        };
    }
};

/**
 * Verify Razorpay payment signature
 */
export const verifyPaymentSignature = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
): Promise<boolean> => {
    try {
        return verifyRazorpaySignatureFromDb(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );
    } catch (error) {
        console.error('Error verifying payment signature:', error);
        return false;
    }
};

/**
 * Capture payment and update order
 */
export const capturePayment = async (
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Verify signature
        const isValid = await verifyPaymentSignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!isValid) {
            throw new Error('Invalid payment signature');
        }

        let order = await Order.findById(orderId).session(session);

        if (!order) {
            throw new Error('Order not found');
        }

        // Upsert payment record (idempotent)
        const payment = await Payment.findOneAndUpdate(
            { order: orderId },
            {
                $setOnInsert: {
                    paymentId: createPaymentRecordId("PAY"),
                    order: orderId,
                    customer: order.customer,
                    userId: order.customer,
                    currency: "INR",
                    paymentDate: new Date(),
                },
                $set: {
                    method: 'razorpay',
                    paymentMethod: 'Online',
                    paymentGateway: 'Razorpay',
                    razorpayOrderId,
                    razorpayPaymentId,
                    razorpaySignature,
                    amount: order.total,
                    status: 'completed',
                    completedAt: new Date(),
                    paidAt: new Date(),
                    gatewayResponse: {
                        success: true,
                        message: 'Payment captured successfully',
                    },
                },
            },
            {
                upsert: true,
                new: true,
                session,
            }
        );

        // Update order
        order.paymentStatus = 'Paid';
        order.payment = {
            method: 'razorpay',
            status: 'completed',
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            transactionId: razorpayPaymentId,
        };
        (order as any).paymentId = razorpayPaymentId;
        // Change order status from 'Pending' to 'Received' or 'Confirmed' after successful payment
        if (order.status === 'Pending') {
            order.status = 'Received';
        }
        await order.save({ session });

        await session.commitTransaction();
        
        // Notify sellers of the new order now that payment is confirmed
        try {
            const { notifySellersOfNewOrder } = await import('./sellerNotificationService');
            // Fetch the full order with items for notification
            const fullOrder = await Order.findById(orderId).populate('items').lean();
            if (fullOrder) {
                await notifySellersOfNewOrder(fullOrder);
            }
        } catch (notifErr) {
            console.error("Failed to notify sellers after payment capture:", notifErr);
        }

        // Create Pending Commissions (Outside transaction as it has its own logic/logging and failure shouldn't rollback payment)
        try {
            const { createPendingCommissions } = await import('./commissionService');
            await createPendingCommissions(orderId);
        } catch (commError) {
            console.error("Failed to create pending commissions after payment:", commError);
            // Don't fail the request, just log it.
        }

        return {
            success: true,
            message: 'Payment captured successfully',
            data: {
                paymentId: payment?._id,
                orderId: order._id,
            },
        };
    } catch (error: any) {
        await session.abortTransaction();
        console.error('Error capturing payment:', error);
        return {
            success: false,
            message: error.message || 'Failed to capture payment',
        };
    } finally {
        session.endSession();
    }
};

/**
 * Process refund
 */
export const processRefund = async (
    paymentId: string,
    amount?: number,
    reason?: string
) => {
    try {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        if (!payment.razorpayPaymentId) {
            throw new Error('Razorpay payment ID not found');
        }

        const razorpay = await getRazorpayInstance();

        const refundAmount = amount || payment.amount;

        const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: Math.round(refundAmount * 100), // Amount in paise
            notes: {
                reason: reason || 'Order cancelled',
            },
        });

        // Update payment record
        payment.status = 'refunded';
        payment.refundAmount = refundAmount;
        payment.refundedAt = new Date();
        payment.refundReason = reason;
        await payment.save();

        return {
            success: true,
            message: 'Refund processed successfully',
            data: {
                refundId: refund.id,
                amount: refundAmount,
            },
        };
    } catch (error: any) {
        console.error('Error processing refund:', error);
        return {
            success: false,
            message: error.message || 'Failed to process refund',
        };
    }
};

/**
 * Handle Razorpay webhook
 */
export const handleWebhook = async (
    body: any,
    signature: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            throw new Error('Razorpay webhook secret not configured');
        }

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(body))
            .digest('hex');

        if (expectedSignature !== signature) {
            throw new Error('Invalid webhook signature');
        }

        const event = body.event;
        const payload = body.payload.payment.entity;

        // Handle different events
        switch (event) {
            case 'payment.captured':
                // Payment was captured successfully
                await handlePaymentCaptured(payload);
                break;

            case 'payment.failed':
                // Payment failed
                await handlePaymentFailed(payload);
                break;

            case 'refund.created':
                // Refund was created
                await handleRefundCreated(body.payload.refund.entity);
                break;

            default:
                console.log('Unhandled webhook event:', event);
        }

        return {
            success: true,
            message: 'Webhook processed successfully',
        };
    } catch (error: any) {
        console.error('Error handling webhook:', error);
        return {
            success: false,
            message: error.message || 'Failed to process webhook',
        };
    }
};

// Helper functions for webhook events
const handlePaymentCaptured = async (payload: any) => {
    try {
        const razorpayPaymentId = payload.id;
        const razorpayOrderId = payload.order_id;

        // Find payment record
        const payment = await Payment.findOne({ razorpayOrderId });

        if (payment) {
            payment.status = 'completed';
            payment.razorpayPaymentId = razorpayPaymentId;
            payment.paidAt = new Date();
            payment.completedAt = new Date();
            await payment.save();

            // Update order
            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Paid',
                paymentId: razorpayPaymentId,
                payment: {
                    method: 'razorpay',
                    status: 'completed',
                    razorpayOrderId,
                    razorpayPaymentId,
                    transactionId: razorpayPaymentId,
                }
            });

            // Notify sellers of the new order now that payment is confirmed via webhook
            try {
                const { notifySellersOfNewOrder } = await import('./sellerNotificationService');
                const fullOrder = await Order.findById(payment.order).populate('items').lean();
                if (fullOrder) {
                    await notifySellersOfNewOrder(fullOrder);
                }
            } catch (notifErr) {
                console.error("Failed to notify sellers after webhook payment capture:", notifErr);
            }
        }
    } catch (error) {
        console.error('Error handling payment captured:', error);
    }
};

const handlePaymentFailed = async (payload: any) => {
    try {
        const razorpayOrderId = payload.order_id;

        // Find payment record
        const payment = await Payment.findOne({ razorpayOrderId });

        if (payment) {
            payment.status = 'failed';
            payment.gatewayResponse = {
                success: false,
                message: payload.error_description || 'Payment failed',
                rawResponse: payload,
            };
            await payment.save();

            // Update order
            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Failed',
                payment: {
                    method: 'razorpay',
                    status: 'failed',
                    razorpayOrderId,
                }
            });
        }
    } catch (error) {
        console.error('Error handling payment failed:', error);
    }
};

const handleRefundCreated = async (payload: any) => {
    try {
        const razorpayPaymentId = payload.payment_id;

        // Find payment record
        const payment = await Payment.findOne({ razorpayPaymentId });

        if (payment) {
            payment.status = 'refunded';
            payment.refundAmount = payload.amount / 100; // Convert from paise
            payment.refundedAt = new Date();
            await payment.save();

            // Update order
            await Order.findByIdAndUpdate(payment.order, {
                paymentStatus: 'Refunded',
            });
        }
    } catch (error) {
        console.error('Error handling refund created:', error);
    }
};
