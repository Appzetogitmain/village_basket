import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import OrderItem from '../models/OrderItem';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        const item = await OrderItem.findOne().populate('order');
        if (item) {
            console.log('Fields Check:');
            console.log('- seller field:', item.seller ? 'EXISTS' : 'MISSING');
            console.log('- order field:', item.order ? 'EXISTS' : 'MISSING');
            console.log('- total field:', item.total !== undefined ? 'EXISTS' : 'MISSING');
            console.log('- status field:', item.status);
        } else {
            console.log('No OrderItems found.');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkFields();
