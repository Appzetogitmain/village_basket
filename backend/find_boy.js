const mongoose = require('mongoose');
require('dotenv').config();

async function findBoy() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Delivery = mongoose.model('Delivery', new mongoose.Schema({}, { strict: false }), 'deliveries');
        const boy = await Delivery.findOne({ mobile: '9111966732' });
        console.log('BOY:', boy);
        
        if (boy) {
            const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');
            const orders = await Order.find({ deliveryBoy: boy._id });
            console.log('TOTAL_ORDERS_FOR_BOY:', orders.length);
            orders.forEach(o => console.log(o.orderNumber, o.status, o.createdAt));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

findBoy();
