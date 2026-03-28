const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkVishal() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        
        const db = mongoose.connection.db;
        const deliveries = db.collection('deliveries');
        const orders = db.collection('orders');

        const vishal = await deliveries.findOne({ name: /Vishal Patel/i });
        if (!vishal) {
            console.log('Vishal not found');
            process.exit(1);
        }

        const busyOrders = await orders.find({
            deliveryBoy: vishal._id,
            status: { $nin: ["Delivered", "Cancelled", "Returned", "Rejected"] }
        }).toArray();

        console.log('VISHAL:', { name: vishal.name, status: vishal.status, isOnline: vishal.isOnline });
        console.log('BUSY ORDERS COUNT:', busyOrders.length);
        busyOrders.forEach(o => console.log(`- ${o.orderNumber}: ${o.status}`));

        // Ensure he is Active and Online
        if (vishal.status !== 'Active' || !vishal.isOnline) {
            await deliveries.updateOne({ _id: vishal._id }, { $set: { status: 'Active', isOnline: true } });
            console.log('Forced status to Active and Online');
        }

        // Ensure he has NO busy orders
        if (busyOrders.length > 0) {
            await orders.updateMany(
                { _id: { $in: busyOrders.map(o => o._id) } },
                { $set: { status: 'Delivered', deliveryBoyStatus: 'Delivered' } }
            );
            console.log(`Cleared ${busyOrders.length} busy orders.`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkVishal();
