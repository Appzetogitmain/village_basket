const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Delivery = require('./src/models/Delivery');

async function checkBusyBoys() {
    await mongoose.connect('mongodb://localhost:27017/village_basket');
    
    // Busy definition:status not terminal
    const busyOrders = await Order.find({
        status: { $nin: ['Delivered', 'Cancelled', 'Returned', 'Rejected', 'Return Requested', 'Refund Initialized', 'Refund Completed'] }
    }).populate('deliveryBoy');
    
    console.log('--- BUSY ORDERS AND BOYS ---');
    busyOrders.forEach(o => {
        if (o.deliveryBoy) {
            console.log(`Order: ${o.orderNumber} | Status: ${o.status} | DB Status: ${o.deliveryBoyStatus} | Boy: ${o.deliveryBoy.name} (${o.deliveryBoy._id})`);
        } else {
            console.log(`Order: ${o.orderNumber} | Status: ${o.status} | (No Delivery Boy Assigned)`);
        }
    });

    // Also check getDeliveryBoys logic results
    const busyDeliveryBoys = await Order.distinct("deliveryBoy", {
      deliveryBoyStatus: { $in: ["Assigned", "Picked Up", "In Transit"] },
      status: { $nin: ["Delivered", "Cancelled", "Returned", "Rejected"] }
    });
    
    const availableBoys = await Delivery.find({
      status: "Active",
      isOnline: true,
      _id: { $nin: busyDeliveryBoys }
    }).select("name mobile status isOnline");

    console.log('\n--- AVAILABLE BOYS ---');
    availableBoys.forEach(b => {
        console.log(`Boy: ${b.name} | Offline/Online: ${b.isOnline ? 'Online' : 'Offline'} | Status: ${b.status}`);
    });

    process.exit(0);
}

checkBusyBoys();
