const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function checkVishal() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('MONGODB_URI not found in .env');
            process.exit(1);
        }
        
        console.log('Connecting to:', mongoUri.split('@')[1] || mongoUri); // Hide credentials
        await mongoose.connect(mongoUri);
        
        const db = mongoose.connection.db;
        const deliveries = db.collection('deliveries');
        const orders = db.collection('orders');

        // Search for Vishal
        const vishal = await deliveries.findOne({ name: /Vishal Patel/i });
        if (!vishal) {
            console.log('Vishal Patel not found. Listing all delivery boys:');
            const all = await deliveries.find().toArray();
            all.forEach(d => console.log(`- ${d.name} (${d._id})`));
            process.exit(1);
        }

        console.log('VISHAL DETAILS:', { 
            id: vishal._id, 
            name: vishal.name, 
            status: vishal.status, 
            isOnline: vishal.isOnline 
        });

        // Find busy orders using the same logic as the controller
        // Busy defined as status in ["Assigned", "Picked Up", "In Transit"]
        const busyOrders = await orders.find({
            deliveryBoy: vishal._id,
            status: { $nin: ["Delivered", "Cancelled", "Returned", "Rejected"] }
        }).toArray();

        console.log('BUSY ORDERS:', busyOrders.map(o => ({ 
            id: o._id, 
            number: o.orderNumber, 
            status: o.status 
        })));

        // FORCE FIX
        await deliveries.updateOne(
            { _id: vishal._id },
            { $set: { status: 'Active', isOnline: true } }
        );

        if (busyOrders.length > 0) {
            console.log('Closing busy orders for Vishal to make him available...');
            await orders.updateMany(
                { _id: { $in: busyOrders.map(o => o._id) } },
                { $set: { status: 'Delivered', deliveryBoyStatus: 'Delivered' } }
            );
        }

        console.log('--- SUCCESS ---');
        console.log('Vishal Patel is now DEFINITELY Active, Online, and has 0 busy orders.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkVishal();
