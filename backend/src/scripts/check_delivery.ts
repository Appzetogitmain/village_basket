import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Delivery from '../models/Delivery';
import Order from '../models/Order';

dotenv.config();

async function checkDeliveryBoys() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/village-basket';
    await mongoose.connect(mongoUri);
    
    const vishal = await Delivery.findOne({ name: { $regex: /vishal/i } });
    if (vishal) {
      console.log('Vishal ID:', vishal._id);
      
      const orders = await Order.find({ deliveryBoy: vishal._id });
      console.log(`Vishal has ${orders.length} orders assigned.`);
      
      for (const order of orders) {
         if (!['Delivered', 'Cancelled', 'Returned', 'Rejected', 'Failed'].includes(order.status as string) || 
             !['Delivered', 'Failed', 'Cancelled'].includes(order.deliveryBoyStatus as string)) {
             
             console.log(`Active Order Found! ID: ${order._id}, Status: ${order.status}, DeliveryBoyStatus: ${order.deliveryBoyStatus}`);
             
             // FORCE CLOSE
             console.log('Forcing closed...');
             order.status = 'Delivered';
             order.deliveryBoyStatus = 'Delivered';
             await order.save();
         }
      }
    }
    
    const busyDeliveryBoys = await Order.distinct("deliveryBoy", {
      deliveryBoyStatus: { $in: ["Assigned", "Picked Up", "In Transit", "On the Way"] },
      status: { $nin: ["Delivered", "Cancelled", "Returned", "Rejected"] }
    });

    console.log("Busy IDs:", busyDeliveryBoys);

    const deliveryBoys = await Delivery.find({
      status: "Active",
      isOnline: true,
      _id: { $nin: busyDeliveryBoys }
    }).select("name");

    console.log("Available Delivery Boys:", deliveryBoys.map(b => b.name));
    
    if (vishal && vishal.isOnline !== true) {
       console.log("Vishal offline, setting online");
       vishal.isOnline = true;
       await vishal.save();
    }
    if (vishal && vishal.status !== "Active") {
       console.log("Vishal inactive, setting active");
       vishal.status = "Active";
       await vishal.save();
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDeliveryBoys();
