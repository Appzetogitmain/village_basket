const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function mimicApi() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        await mongoose.connect(mongoUri);
        
        const db = mongoose.connection.db;
        const orders = db.collection('orders');
        const deliveries = db.collection('deliveries');

        // Logic from seller/orderController.ts
        const busyDeliveryBoys = await orders.distinct("deliveryBoy", {
            deliveryBoyStatus: { $in: ["Assigned", "Picked Up", "In Transit"] },
            status: { $nin: ["Delivered", "Cancelled", "Returned", "Rejected"] }
        });

        console.log('--- BUSY IDs ---');
        console.log(busyDeliveryBoys.map(id => id.toString()));

        const availableBoys = await deliveries.find({
            status: "Active",
            isOnline: true,
            _id: { $nin: busyDeliveryBoys }
        }).toArray();

        console.log('\n--- AVAILABLE BOYS ---');
        availableBoys.forEach(b => console.log(`- ${b.name} (${b._id}) online=${b.isOnline} status=${b.status}`));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

mimicApi();
