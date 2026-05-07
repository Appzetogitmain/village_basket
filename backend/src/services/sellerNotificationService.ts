import { getIO } from '../socket/socketService';
import { sendNewOrderNotification } from './notificationService';
import OrderItem from '../models/OrderItem';
import mongoose from 'mongoose';

/**
 * High-level helper to notify sellers about a new order via all channels (Socket + Push)
 */
export async function notifySellersOfNewOrder(order: any): Promise<void> {
    try {
        const io = getIO();
        
        // 1. Send Socket Notification
        await notifySellersOfOrderUpdate(io, order, 'NEW_ORDER');

        // 2. Send Push Notification
        const sellerIdsInOrder = [...new Set(order.items.map((i: any) => i.seller?.toString()).filter((id: any) => id))];
        for (const sellerId of sellerIdsInOrder) {
            await sendNewOrderNotification(
                sellerId as string, 
                order._id.toString(), 
                order.orderNumber, 
                order.total
            );
        }
    } catch (error) {
        console.error('Error in notifySellersOfNewOrder:', error);
    }
}

/**
 * Notify all sellers involved in an order about a new order or status change
 */
export async function notifySellersOfOrderUpdate(
    io: any,
    order: any,
    type: 'NEW_ORDER' | 'STATUS_UPDATE' | 'ORDER_CANCELLED'
): Promise<void> {
    try {
        if (!io) {
            console.error('Socket.io server not provided to notifySellersOfOrderUpdate');
            return;
        }

        // Get all unique seller IDs from order items
        // If items are populated, we can get them directly, otherwise we need to query
        let orderItems = order.items;

        // If items are just IDs, fetch the full OrderItem details to get seller IDs
        if (orderItems.length > 0 && typeof orderItems[0] === 'string' || orderItems[0] instanceof mongoose.Types.ObjectId) {
            orderItems = await OrderItem.find({ order: order._id });
        }

        const sellerIds = [...new Set(orderItems.map((item: any) => item.seller.toString()))];

        console.log(`🔔 Notifying ${sellerIds.length} sellers about ${type} for order ${order.orderNumber}`);

        for (const sellerId of sellerIds) {
            // Get only items belonging to this seller
            const sellerSpecificItems = orderItems.filter((item: any) => item.seller.toString() === sellerId);

            const notificationData = {
                type,
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                status: order.status,
                paymentStatus: order.paymentStatus,
                cancellationReason: order.cancellationReason,
                customer: {
                    name: order.customerName,
                    email: order.customerEmail,
                    phone: order.customerPhone,
                    address: order.deliveryAddress
                },
                items: sellerSpecificItems.map((item: any) => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.unitPrice,
                    total: item.total,
                    variation: item.variation
                })),
                totalAmount: sellerSpecificItems.reduce((acc: number, item: any) => acc + item.total, 0),
                deliverySlot: order.deliverySlot ? {
                    date: order.deliverySlot.date,
                    timeRange: order.deliverySlot.timeRange,
                    label: order.deliverySlot.label
                } : undefined,
                timestamp: new Date()
            };

            // Emit to seller-specific room
            io.to(`seller-${sellerId}`).emit('seller-notification', notificationData);
            console.log(`📤 Emitted notification to seller-${sellerId}`);
        }
    } catch (error) {
        console.error('Error in notifySellersOfOrderUpdate:', error);
    }
}
