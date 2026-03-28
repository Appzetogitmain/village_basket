const mongoose = require('mongoose');

async function checkVishal() {
    try {
        await mongoose.connect('mongodb://localhost:27017/village_basket');
        
        // Use connection.db to query directly (bypass model issues)
        const db = mongoose.connection.db;
        const deliveries = db.collection('deliveries');
        const orders = db.collection('orders');

        const vishal = await deliveries.findOne({ name: /Vishal Patel/i });
        if (!vishal) {
            console.log('Vishal Patel not found in deliveries collection');
            process.exit(1);
        }

        console.log('VISHAL DETAILS:', { 
            id: vishal._id, 
            name: vishal.name, 
            status: vishal.status, 
            isOnline: vishal.isOnline 
        });

        // Check if he has busy orders
        const busyOrders = await orders.find({
            deliveryBoy: vishal._id,
            status: { $nin: ["Delivered", "Cancelled", "Returned", "Rejected"] }
        }).toArray();

        console.log('BUSY ORDERS:', busyOrders.map(o => ({ 
            id: o._id, 
            number: o.orderNumber, 
            status: o.status, 
            dbStatus: o.deliveryBoyStatus 
        })));

        // FORCE FIX
        await deliveries.updateOne(
            { _id: vishal._id },
            { $set: { status: 'Active', isOnline: true } }
        );

        if (busyOrders.length > 0) {
            console.log('Closing busy orders for Vishal...');
            await orders.updateMany(
                { _id: { $in: busyOrders.map(o => o._id) } },
                { $set: { status: 'Delivered', deliveryBoyStatus: 'Delivered' } }
            );
        }

        console.log('Vishal Patel is now DEFINITELY available.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkVishal();
