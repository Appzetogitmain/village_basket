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
                customerName: 'Anita Gupta',
                customerEmail: 'anita@example.com',
                customerPhone: '9876543210',
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
                customerName: 'Rahul Kumar',
                customerEmail: 'rahul@example.com',
                customerPhone: '9876543211',
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
                customerName: 'Sunita Devi',
                customerEmail: 'sunita@example.com',
                customerPhone: '9876543212',
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
                customerName: 'Pooja Sharma',
                customerEmail: 'pooja@example.com',
                customerPhone: '9876543213',
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
                customerName: 'Ramesh Singh',
                customerEmail: 'ramesh@example.com',
                customerPhone: '9876543214',
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
                customerName: 'Priya Verma',
                customerEmail: 'priya@example.com',
                customerPhone: '9876543215',
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
            },

            // Scheduled Orders
            {
                orderNumber: genOrderNum(),
                customer: new mongoose.Types.ObjectId(CUSTOMER_ID),
                customerName: 'Vikram Singh',
                customerEmail: 'vikram@example.com',
                customerPhone: '9876543216',
                deliveryBoy: new mongoose.Types.ObjectId(BOY_ID),
                status: 'Accepted',
                orderType: 'SCHEDULED',
                deliverySlot: {
                    date: new Date(new Date().setDate(new Date().getDate() + 1)),
                    timeRange: '10:00 AM - 01:00 PM',
                    label: 'Morning Slot'
                },
                deliveryAddress: { address: 'Vikram House, Block A', city: 'Village City', pincode: '110005' },
                total: 800,
                payableAmount: 800,
                paymentMethod: 'Online',
                paymentStatus: 'Paid',
                orderDate: today,
                createdAt: today,
                updatedAt: today,
                sellerPickups: [{ seller: new mongoose.Types.ObjectId(SELLER_ID) }]
            },
            {
                orderNumber: genOrderNum(),
                customer: new mongoose.Types.ObjectId(CUSTOMER_ID),
                customerName: 'Neha Kapur',
                customerEmail: 'neha@example.com',
                customerPhone: '9876543217',
                deliveryBoy: new mongoose.Types.ObjectId(BOY_ID),
                status: 'Ready for pickup',
                orderType: 'SCHEDULED',
                deliverySlot: {
                    date: new Date(new Date().setDate(new Date().getDate() + 2)),
                    timeRange: '04:00 PM - 07:00 PM',
                    label: 'Evening Slot'
                },
                deliveryAddress: { address: 'Neha Villa, Sector 4', city: 'Village City', pincode: '110005' },
                total: 450,
                payableAmount: 450,
                paymentMethod: 'COD',
                paymentStatus: 'Pending',
                orderDate: today,
                createdAt: today,
                updatedAt: today,
                sellerPickups: [{ seller: new mongoose.Types.ObjectId(SELLER_ID) }]
            }
        ];

        console.log('Cleaning up existing data...');
        await Order.deleteMany({ deliveryBoy: new mongoose.Types.ObjectId(BOY_ID) });
        await Notification.deleteMany({ recipientId: new mongoose.Types.ObjectId(BOY_ID) });

        console.log('Inserting orders...');
        await Order.insertMany(ordersToCreate);
        console.log('Orders seeded successfully!');

        const notificationsToCreate = [
            {
                recipientType: 'Delivery',
                recipientId: new mongoose.Types.ObjectId(BOY_ID),
                title: 'New Assignment',
                message: 'You have been assigned new orders for today.',
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
