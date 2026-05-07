import Order from "../models/Order";
import { sendNotification } from "./notificationService";

/**
 * Sends a reminder notification to delivery boys for orders scheduled for today.
 */
export const sendScheduledReminders = async () => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Find orders scheduled for today that are assigned but not delivered/cancelled
        // We focus on statuses before "Delivered"
        const orders = await Order.find({
            "deliverySlot.date": { $gte: todayStart, $lte: todayEnd },
            deliveryBoy: { $exists: true, $ne: null },
            status: { $in: ["Accepted", "Ready for pickup", "Assigned", "Processed"] }
        });

        console.log(`⏰ [ReminderService] Found ${orders.length} scheduled orders for today's reminders.`);

        for (const order of orders) {
            if (order.deliveryBoy) {
                const slotInfo = order.deliverySlot?.label || order.deliverySlot?.timeRange || 'today';
                
                await sendNotification(
                    "Delivery",
                    order.deliveryBoy.toString(),
                    "📅 Delivery Reminder",
                    `You have a scheduled delivery #${order.orderNumber} for ${slotInfo}. Don't forget to complete it!`,
                    {
                        type: "Order",
                        link: `/delivery/orders/${order._id}`,
                        priority: "High",
                        data: { type: "REMINDER", id: order._id.toString() },
                        // Use date-specific idempotency key so it only sends once per day per order
                        idempotencyKey: `reminder_${order._id}_${todayStart.toISOString().split('T')[0]}`
                    }
                );
            }
        }
    } catch (error) {
        console.error("❌ [ReminderService] Error sending scheduled reminders:", error);
    }
};
