import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function repair() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected.');

        // 1. Repair Delivered Orders
        console.log('Searching for Delivered orders with Pending items...');
        const deliveredOrders = await Order.find({ status: 'Delivered' });
        console.log(`Found ${deliveredOrders.length} delivered orders.`);

        let deliveredItemsCount = 0;
        for (const order of deliveredOrders) {
            const result = await OrderItem.updateMany(
                { order: order._id, status: 'Pending' },
                { status: 'Delivered' }
            );
            deliveredItemsCount += result.modifiedCount;
        }
        console.log(`Updated ${deliveredItemsCount} items to 'Delivered' status.`);

        // 2. Repair Cancelled Orders (Optional but good for consistency)
        console.log('Searching for Cancelled orders with Pending items...');
        const cancelledOrders = await Order.find({ status: 'Cancelled' });
        console.log(`Found ${cancelledOrders.length} cancelled orders.`);

        let cancelledItemsCount = 0;
        for (const order of cancelledOrders) {
            const result = await OrderItem.updateMany(
                { order: order._id, status: 'Pending' },
                { status: 'Cancelled' }
            );
            cancelledItemsCount += result.modifiedCount;
        }
        console.log(`Updated ${cancelledItemsCount} items to 'Cancelled' status.`);

        console.log('REPAIR COMPLETE.');

    } catch (error) {
        console.error('Error during repair:', error);
    } finally {
        await mongoose.disconnect();
    }
}

repair();
