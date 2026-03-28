import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DeliveryBoy from '../models/Delivery';
import Order from '../models/Order';

dotenv.config();

async function fixVishal() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/village-basket';
    console.log('Connecting to', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    // Find Vishal
    const vishal = await DeliveryBoy.findOne({ name: { $regex: /vishal/i } });
    if (!vishal) {
      console.log('Could not find delivery boy with name matching "vishal"');
      process.exit(0);
    }
    console.log(`Found Vishal: ID ${vishal._id}, Name: ${vishal.name}`);

    // Find active orders assigned to Vishal
    const activeOrders = await Order.find({
      deliveryBoy: vishal._id,
      deliveryBoyStatus: { $in: ['Assigned', 'Accepted', 'On The Way'] }
    });

    console.log(`Found ${activeOrders.length} active orders hiding Vishal from list`);

    // Complete them
    for (const order of activeOrders) {
      console.log(`Updating order ${order._id} (${order.orderNumber}) statuses`);
      order.deliveryBoyStatus = 'Delivered';
      if (['Received', 'Accepted', 'Processed', 'Out for Delivery'].includes(order.status as string)) {
         order.status = 'Delivered'; 
      }
      await order.save();
    }
    
    // Check total count now
    const stillActive = await Order.countDocuments({
      deliveryBoy: vishal._id,
      $or: [
        { deliveryBoyStatus: { $in: ['Assigned', 'Accepted', 'Picked Up', 'On The Way'] } },
        { status: { $nin: ['Delivered', 'Cancelled', 'Returned'] }, deliveryBoy: vishal._id }
      ]
    });
    
    console.log(`Still Active: ${stillActive}`);

    // Wait wait, look at the order query for busy delivery boys:
    // backend/src/modules/seller/controllers/orderController.ts -> getDeliveryBoys
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixVishal();
