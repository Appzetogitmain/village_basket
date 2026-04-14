import Order from '../models/Order';
import Customer from '../models/Customer';
import { addRewardCoin } from './rewardService';

/**
 * Generate delivery OTP is no longer needed for regular orders.
 * Customer has a permanent deliveryOtp that is generated on account creation.
 * This function is kept for backward compatibility but does nothing meaningful now.
 */
export async function generateDeliveryOtp(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Fetch customer to get permanent OTP
    const customer = await Customer.findById(order.customer);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Set order fields for visibility
    order.deliveryOtp = customer.deliveryOtp;
    order.deliveryOtpRequested = true;
    order.deliveryOtpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 mins expiry
    await order.save();

    console.log(`[Delivery OTP] Using customer's permanent delivery OTP (${customer.deliveryOtp}) for order ${orderId}`);

    return {
      success: true,
      message: 'Delivery OTP has been shared with the customer.',
    };
  } catch (error: any) {
    console.error('Error in generateDeliveryOtp:', error);
    throw new Error(error.message || 'Failed to process delivery OTP request');
  }
}

/**
 * Verify delivery OTP using customer's permanent OTP
 */
export async function verifyDeliveryOtp(orderId: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    const order = await Order.findById(orderId).populate('customer');

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'Delivered') {
      return {
        success: true,
        message: 'Order is already delivered.',
      };
    }

    // Get customer's permanent delivery OTP
    let customerOtp: string | undefined;

    if (order.customer && typeof order.customer === 'object' && 'deliveryOtp' in order.customer) {
      customerOtp = (order.customer as any).deliveryOtp;
    } else if (order.customer) {
      // If not populated, fetch customer
      const customer = await Customer.findById(order.customer);
      customerOtp = customer?.deliveryOtp;
    }

    if (!customerOtp) {
      throw new Error('Customer delivery OTP not found. Please contact support.');
    }

    // Developer bypass for testing
    if ((process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_OTP === 'true') && otp === '9999') {
      order.deliveryOtpVerified = true;
      order.status = 'Delivered';
      order.deliveredAt = new Date();
      order.invoiceEnabled = true;
      await order.save();

      // Give reward coin
      await addRewardCoin(order.customer._id ? order.customer._id.toString() : order.customer.toString());

      return {
        success: true,
        message: 'OTP verified successfully. Order marked as delivered.',
      };
    }

    // Verify OTP against customer's permanent OTP
    if (customerOtp !== otp) {
      throw new Error('Invalid OTP. Please check and try again.');
    }

    // Mark order as delivered
    order.deliveryOtpVerified = true;
    order.status = 'Delivered';
    order.deliveredAt = new Date();
    order.invoiceEnabled = true;
    await order.save();

    // Give reward coin
    await addRewardCoin(order.customer._id ? order.customer._id.toString() : order.customer.toString());

    return {
      success: true,
      message: 'OTP verified successfully. Order marked as delivered.',
    };
  } catch (error: any) {
    console.error('Error verifying delivery OTP:', error);
    throw new Error(error.message || 'Failed to verify delivery OTP');
  }
}
