const mongoose = require('mongoose');

async function listCols() {
    await mongoose.connect('mongodb://localhost:27017/village_basket');
    const cols = await mongoose.connection.db.listCollections().toArray();
    console.log('--- COLLECTIONS ---');
    cols.forEach(c => console.log(c.name));
    process.exit(0);
}

listCols();
