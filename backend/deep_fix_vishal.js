const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function deepCheckVishal() {
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

        const hisOrders = await orders.find({
            deliveryBoy: vishal._id,
            status: { $nin: ["Delivered", "Cancelled", "Returned", "Rejected"] }
        }).toArray();

        // Also check if status is "Processed" - I updated it to "Ready for pickup" but some might be Processed
        const processedOrders = await orders.find({
            deliveryBoy: vishal._id,
            status: "Processed"
        }).toArray();

        console.log(`VISHAL: ${vishal.name} | Status: ${vishal.status} | Online: ${vishal.isOnline}`);
        console.log(`ACTIVE ORDERS (NIN): ${hisOrders.length}`);
        hisOrders.forEach(o => console.log(`- ${o.orderNumber}: ${o.status} | DB Status: ${o.deliveryBoyStatus}`));

        processedOrders.forEach(o => {
            if (!hisOrders.some(h => h._id.equals(o._id))) {
                console.log(`- EXTRA ${o.orderNumber}: ${o.status} | DB Status: ${o.deliveryBoyStatus}`);
            }
        });

        // FORCE AVAILABILITY NOW
        await deliveries.updateOne({ _id: vishal._id }, { $set: { status: 'Active', isOnline: true } });
        
        const allIdsToClear = [...new Set([...hisOrders.map(o => o._id), ...processedOrders.map(o => o._id)])];
        if (allIdsToClear.length > 0) {
            await orders.updateMany(
                { _id: { $in: allIdsToClear } },
                { $set: { status: 'Delivered', deliveryBoyStatus: 'Delivered' } }
            );
            console.log(`Cleared all ${allIdsToClear.length} orders for Vishal.`);
        }

        console.log('--- DONE ---');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

deepCheckVishal();
