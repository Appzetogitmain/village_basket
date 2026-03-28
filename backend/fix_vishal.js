const mongoose = require('mongoose');
const Delivery = require('./src/models/Delivery');

async function fixVishal() {
    await mongoose.connect('mongodb://localhost:27017/village_basket');
    let vishal = await Delivery.findOne({ name: /Vishal Patel/i });
    if (vishal) {
        console.log('Current Vishal:', { name: vishal.name, status: vishal.status, isOnline: vishal.isOnline });
        vishal.status = 'Active';
        vishal.isOnline = true;
        await vishal.save();
        console.log('Fixed Vishal:', { name: vishal.name, status: vishal.status, isOnline: vishal.isOnline });
    } else {
        console.log('Vishal not found');
    }
    process.exit(0);
}

fixVishal();
