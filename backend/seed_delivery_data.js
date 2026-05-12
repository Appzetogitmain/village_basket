const mongoose = require('mongoose');
require('dotenv').config();

const BOY_ID = '694550f670edfa22e003c6a1';
const CUSTOMER_ID = '6945939ab5c923e6c75cbdb9';
const SELLER_ID = '6957da3ccf26a48558c0247e';

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');
        const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }), 'notifications');

        // Helper to generate order number
        const genOrderNum = () => Math.floor(10000000 + Math.random() * 90000000).toString();

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const ordersToCreate = [
            // Today's Pending (Ready for pickup)
            {
                orderNumber: genOrderNum(),
                customer: new mongoose.Types.ObjectId(CUSTOMER_ID),
                customerName: 'Test Customer',
                customerEmail: 'test@example.com',
                customerPhone: '9999999999',
                deliveryBoy: new mongoose.Types.ObjectId(BOY_ID),
                status: 'Ready for pickup',
                deliveryAddress: { address: '123 Village St', city: 'Village City', pincode: '110001' },
                total: 500,
                payableAmount: 500,
                paymentMethod: 'COD',
                paymentStatus: 'Pending',
                orderDate: today,
                createdAt: today,
                updatedAt: today,
                sellerPickups: [{ seller: new mongoose.Types.ObjectId(SELLER_ID) }]
            },
            {
                orderNumber: genOrderNum(),
                customer: new mongoose.Types.ObjectId(CUSTOMER_ID),
                customerName: 'Test Customer 2',
                customerEmail: 'test2@example.com',
                customerPhone: '9999999998',
                deliveryBoy: new mongoose.Types.ObjectId(BOY_ID),
                status: 'Ready for pickup',
                deliveryAddress: { address: '456 Farm Rd', city: 'Village City', pincode: '110001' },
                total: 750,
                payableAmount: 750,
                paymentMethod: 'Online',
                paymentStatus: 'Paid',
                orderDate: today,
                createdAt: today,
                updatedAt: today,
                sellerPickups: [{ seller: new mongoose.Types.ObjectId(SELLER_ID) }]
            },

            // In Possession (Picked up)
            {
                orderNumber: genOrderNum(),
                customer: new mongoose.Types.ObjectId(CUSTOMER_ID),
                customerName: 'Test Customer 3',
                customerEmail: 'test3@example.com',
                customerPhone: '9999999997',
                deliveryBoy: new mongoose.Types.ObjectId(BOY_ID),
                status: 'Picked up',
                deliveryAddress: { address: '789 Market Lane', city: 'Village City', pincode: '110001' },
                total: 1200,
                payableAmount: 1200,
                paymentMethod: 'COD',
                paymentStatus: 'Pending',
                orderDate: today,
                createdAt: today,
                updatedAt: today,
                sellerPickups: [{ seller: new mongoose.Types.ObjectId(SELLER_ID), pickedUpAt: today, pickedUpBy: new mongoose.Types.ObjectId(BOY_ID) }]
            },
            {
                orderNumber: genOrderNum(),
                customer: new mongoose.Types.ObjectId(CUSTOMER_ID),
                customerName: 'Test Customer 4',
                customerEmail: 'test4@example.com',
                customerPhone: '9999999996',
                deliveryBoy: new mongoose.Types.ObjectId(BOY_ID),
                status: 'Out for Delivery',
                deliveryAddress: { address: '101 Pine Dr', city: 'Village City', pincode: '110001' },
                total: 300,
                payableAmount: 300,
                paymentMethod: 'Online',
                paymentStatus: 'Paid',
                orderDate: today,
                createdAt: today,
                updatedAt: today,
                sellerPickups: [{ seller: new mongoose.Types.ObjectId(SELLER_ID), pickedUpAt: today, pickedUpBy: new mongoose.Types.ObjectId(BOY_ID) }]
            },

            // History (Delivered)
            {
                orderNumber: genOrderNum(),
                customer: new mongoose.Types.ObjectId(CUSTOMER_ID),
                customerName: 'Old Customer 1',
                customerEmail: 'old1@example.com',
                customerPhone: '9999999995',
                deliveryBoy: new mongoose.Types.ObjectId(BOY_ID),
                status: 'Delivered',
                deliveryAddress: { address: 'Past St 1', city: 'Village City', pincode: '110001' },
                total: 450,
                payableAmount: 450,
                paymentMethod: 'COD',
                paymentStatus: 'Paid',
                orderDate: yesterday,
                createdAt: yesterday,
                updatedAt: yesterday,
                deliveredAt: today,
                sellerPickups: [{ seller: new mongoose.Types.ObjectId(SELLER_ID), pickedUpAt: yesterday, pickedUpBy: new mongoose.Types.ObjectId(BOY_ID) }]
            },

            // Returns today (Returned)
            {
                orderNumber: genOrderNum(),
                customer: new mongoose.Types.ObjectId(CUSTOMER_ID),
                customerName: 'Return Customer 1',
                customerEmail: 'ret1@example.com',
                customerPhone: '9999999993',
                deliveryBoy: new mongoose.Types.ObjectId(BOY_ID),
                status: 'Returned',
                deliveryAddress: { address: 'Return Rd 1', city: 'Village City', pincode: '110001' },
                total: 150,
                payableAmount: 150,
                paymentMethod: 'Online',
                paymentStatus: 'Refunded',
                orderDate: today,
                createdAt: today,
                updatedAt: today,
                sellerPickups: [{ seller: new mongoose.Types.ObjectId(SELLER_ID) }]
            }
        ];

        console.log('Inserting orders...');
        await Order.insertMany(ordersToCreate);
        console.log('Orders seeded successfully!');

        const notificationsToCreate = [
            {
                recipientType: 'Delivery',
                recipientId: new mongoose.Types.ObjectId(BOY_ID),
                title: 'New Assignment',
                message: 'You have been assigned 2 new orders for today.',
                type: 'Order',
                priority: 'High',
                isRead: false,
                createdAt: today,
                updatedAt: today
            }
        ];

        console.log('Inserting notifications...');
        await Notification.insertMany(notificationsToCreate);
        console.log('Notifications seeded successfully!');

    } catch (err) {
        console.error('Seed failed:', err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

seed();
