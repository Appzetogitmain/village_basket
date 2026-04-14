import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import OrderItem from '../models/OrderItem';
import Order from '../models/Order';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected.');

        const allItems = await OrderItem.find({});
        console.log(`Total OrderItems in DB: ${allItems.length}`);
        
        const statuses = await OrderItem.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        console.log('OrderItem status distribution:', statuses);

        const orderStatuses = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        console.log('Order status distribution:', orderStatuses);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
