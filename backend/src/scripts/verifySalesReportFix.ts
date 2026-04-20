import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import OrderItem from '../models/OrderItem';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function verify() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected.');

        // 1. Find a delivered order item
        const item = await OrderItem.findOne({ status: 'Delivered' }).populate('order');
        if (!item) {
            console.log('No delivered order items found to test with.');
            // Let's create one if possible or just log failure
            return;
        }

        const sellerId = item.seller;
        console.log(`Testing with Seller ID: ${sellerId}`);

        // 2. Mock the query from the controller
        const query = { 
            seller: sellerId,
            status: 'Delivered'
        };

        const orderItems = await OrderItem.find(query)
            .populate({
                path: "order",
                select: "orderId createdAt"
            });

        console.log(`Found ${orderItems.length} delivered items for this seller.`);

        if (orderItems.length > 0) {
            const first = orderItems[0];
            console.log('Sample Item Data:');
            console.log('- Order Number (from Order model):', (first.order as any)?.orderId);
            console.log('- Total:', first.total);
            console.log('- Product:', first.productName);
            
            if ((first.order as any)?.orderId && first.total !== undefined) {
                console.log('SUCCESS: Mapping works and Delivered items are fetched.');
            } else {
                console.log('FAILURE: Some data is missing in the mapping.');
            }
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
