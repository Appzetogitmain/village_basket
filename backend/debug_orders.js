const mongoose = require('mongoose');
require('dotenv').config();

const BOY_ID = '694550f670edfa22e003c6a1';

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const orders = await Order.find({ 
            deliveryBoy: new mongoose.Types.ObjectId(BOY_ID),
            createdAt: { $gte: today }
        });

        console.log(`Found ${orders.length} orders for today:`);
        orders.forEach(o => {
            console.log(`${o.orderNumber} | ${o.status} | ${o.updatedAt}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

check();
