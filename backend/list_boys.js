const mongoose = require('mongoose');

async function listBoys() {
    await mongoose.connect('mongodb://localhost:27017/village_basket');
    const db = mongoose.connection.db;
    const deliveries = await db.collection('deliveries').find().toArray();
    console.log('--- ALL DELIVERY BOYS ---');
    deliveries.forEach(d => {
        console.log(`Name: ${d.name} | ID: ${d._id} | Status: ${d.status} | Online: ${d.isOnline}`);
    });
    process.exit(0);
}

listBoys();
