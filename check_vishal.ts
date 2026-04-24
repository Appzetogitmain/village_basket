import mongoose from 'mongoose';
import Order from './backend/src/models/Order';
import Delivery from './backend/src/models/Delivery';

const URI = 'mongodb+srv://palakpatel0342_db_user:Ankit@cluster0.hhamzo3.mongodb.net/ApnaSabjiWala';

async function checkVishal() {
  try {
    await mongoose.connect(URI);
    const vishal = await Delivery.findOne({ name: /Vishal Patel/i });
    if (!vishal) {
      console.log('Vishal not found');
    } else {
      console.log('Vishal Details:', JSON.stringify({
        name: vishal.name,
        status: vishal.status,
        isOnline: vishal.isOnline,
        _id: vishal._id
      }, null, 2));

      const activeOrders = await Order.find({
        deliveryBoy: vishal._id,
        deliveryBoyStatus: { $in: ['Assigned', 'Picked Up', 'In Transit'] },
        status: { $nin: ['Delivered', 'Cancelled', 'Returned', 'Rejected'] }
      });

      console.log('Active Orders count:', activeOrders.length);
      if (activeOrders.length > 0) {
        console.log('Active Orders Number:', activeOrders.map(o => o.orderNumber));
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkVishal();
