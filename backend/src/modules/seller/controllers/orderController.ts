import { Request, Response } from "express";
import Order from "../../../models/Order";
import OrderItem from "../../../models/OrderItem";
import { asyncHandler } from "../../../utils/asyncHandler";
import Seller from "../../../models/Seller";
import WalletTransaction from "../../../models/WalletTransaction";
import Delivery from "../../../models/Delivery";
import { Server as SocketIOServer } from "socket.io";

/**
 * Get seller's orders with filters, sorting, and pagination
 */
export const getOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const {
      dateFrom,
      dateTo,
      status,
      search,
      page = "1",
      limit = "10",
      sortBy = "orderDate",
      sortOrder = "desc",
    } = req.query;

    // Find all order IDs that contain items from this seller
    const orderItems = await OrderItem.find({ seller: sellerId }).distinct("order");

    // Build query - filter by orders containing this seller's items
    const query: any = { _id: { $in: orderItems } };

    // Date range filter
    if (dateFrom || dateTo) {
      query.orderDate = {};
      if (dateFrom) {
        query.orderDate.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        query.orderDate.$lte = new Date(dateTo as string);
      }
    }

    // Status filter
    if (status && status !== 'All Status') {
      // Map frontend status to backend status
      const statusMapping: Record<string, string> = {
        'Pending': 'Pending',
        'Accepted': 'Accepted',
        'On the way': 'On the way',
        'Delivered': 'Delivered',
        'Cancelled': 'Cancelled',
        'Rejected': 'Rejected',
      };
      query.status = statusMapping[status as string] || status;
    }

    // Search filter
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
        { 'deliveryAddress.name': { $regex: search, $options: "i" } },
        { 'deliveryAddress.phone': { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    // Get orders with populated customer and delivery info
    const orders = await Order.find(query)
      .populate("customer", "name email phone")
      .populate("deliveryBoy", "name mobile")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Order.countDocuments(query);

    // Format response for frontend
    const formattedOrders = orders.map(order => ({
      id: order._id,
      orderId: order.orderNumber,
      deliveryDate: order.estimatedDeliveryDate
        ? order.estimatedDeliveryDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
        : order.orderDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      orderDate: order.orderDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
      status: order.status === 'On the way' ? 'On the way' : order.status,
      amount: order.total,
      customerName: (order.customer as any)?.name || order.customerName || '',
      customerPhone: (order.customer as any)?.phone || order.customerPhone || '',
      deliveryBoyName: (order.deliveryBoy as any)?.name || '',
    }));

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: formattedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

/**
 * Get order by ID with populated order items, customer, and delivery info
 */
export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    // First check if this seller has items in this order
    const sellerItems = await OrderItem.find({ order: id, seller: sellerId })
      .populate("seller", "storeName")
      .populate("product");

    if (!sellerItems || sellerItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Get order with populated data
    const order = await Order.findById(id)
      .populate("customer", "name email phone")
      .populate("deliveryBoy", "name mobile email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Get only this seller's order items
    const orderItems = sellerItems;

    // Format order items for frontend
    const formattedItems = orderItems.map(item => {
      let unit = item.variation || 'N/A';
      let variationMatched = false;

      // Try to resolve variation value from product if it exists
      // item.product is populated now
      const product = item.product as any;
      if (product && product.variations && Array.isArray(product.variations)) {
        // 1. Try to match by ID or Value if validation is present
        if (item.variation) {
          const variationById = product.variations.find((v: any) => v._id.toString() === item.variation);
          if (variationById) {
            unit = variationById.value;
            variationMatched = true;
          } else {
            const variationByValue = product.variations.find((v: any) => v.value === item.variation);
            if (variationByValue) {
              unit = variationByValue.value;
              variationMatched = true;
            }
          }
        }

        // 2. Fallback: If not matched yet (even if we have a value like '250'), try to recover
        if (!variationMatched) {
          const variationByPrice = product.variations.find((v: any) => v.price === item.unitPrice || v.discPrice === item.unitPrice);
          if (variationByPrice) {
            unit = variationByPrice.value;
            variationMatched = true;
          } else if (product.variations.length === 1) {
            // 3. Last Resort: If there is only one variation, assume it's that one
            unit = product.variations[0].value;
          }
        }
      }

      return {
        srNo: item._id.toString().slice(-4), // Use last 4 chars of ID as srNo
        product: item.productName || 'Unknown Product',
        soldBy: (item.seller as any)?.storeName || 'N/A',
        unit: unit,
        price: item.unitPrice || 0,
        tax: 0,
        taxPercent: 0,
        qty: item.quantity || 0,
        subtotal: item.total || 0,
      };
    });

    // Format order data for frontend
    const orderDetail = {
      id: order._id,
      invoiceNumber: order.invoiceNumber || order.orderNumber || 'N/A',
      orderDate: order.orderDate ? order.orderDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      deliveryDate: order.estimatedDeliveryDate ? order.estimatedDeliveryDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      timeSlot: order.deliverySlot?.label || order.timeSlot || 'N/A',
      status: order.status === 'On the way' ? 'Out For Delivery' : order.status,
      customerName: (order.customer as any)?.name || order.customerName || '',
      customerEmail: (order.customer as any)?.email || order.customerEmail || '',
      customerPhone: (order.customer as any)?.phone || order.customerPhone || '',
      deliveryBoyName: (order.deliveryBoy as any)?.name || '',
      deliveryBoyPhone: (order.deliveryBoy as any)?.mobile || '',
      items: formattedItems,
      subtotal: order.subtotal || 0,
      tax: order.tax || 0,
      grandTotal: order.total || 0,
      paymentMethod: order.paymentMethod || 'N/A',
      paymentStatus: order.paymentStatus || 'Pending',
      isRefunded: order.isRefunded || false,
      deliveryAddress: order.deliveryAddress || {},
    };

    return res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      data: orderDetail,
    });
  }
);

/**
 * Update order status (seller can update: Accepted, On the way, Delivered, Cancelled)
 */
export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;
    const { status } = req.body;

    // Validate allowed status updates for seller
    const allowedStatuses = ['Accepted', 'Processed', 'On the way', 'Delivered', 'Cancelled', 'Rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Seller can only update to: ${allowedStatuses.join(', ')}`,
      });
    }

    // Check if this seller has items in this order
    const sellerItems = await OrderItem.findOne({ order: id, seller: sellerId });

    if (!sellerItems) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you are not authorized to manage this order",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Prevent updates if order is in a final state
    if (['Delivered', 'Cancelled', 'Returned', 'Rejected'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be updated as it is already ${order.status}`,
      });
    }

    // Check if status is already the same
    if (order.status === status) {
      return res.status(400).json({
        success: false,
        message: `Order is already ${status}`,
      });
    }

    const previousStatus = order.status;
    console.log(`[updateOrderStatus] Pre-save Check: orderId=${order._id}, newStatus=${status}, previousStatus=${previousStatus}`);
    
    try {
      // Prepare update object
      const updateData: any = { status };
      
      // Align delivery boy status if order reaches terminal state
      if (status === 'Delivered') {
        updateData.deliveryBoyStatus = 'Delivered';
        updateData.deliveredAt = new Date();
      } else if (['Cancelled', 'Rejected', 'Returned'].includes(status)) {
        updateData.deliveryBoyStatus = 'Failed'; // Releases the delivery boy
        updateData.cancelledAt = new Date();
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      if (!updatedOrder) {
        throw new Error('Order not found during update');
      }
      
      // Update our local reference to the updated one
      order.status = updatedOrder.status;
      console.log(`[updateOrderStatus] Order updated successfully`);
    } catch (saveError) {
      console.error(`[updateOrderStatus] Error updating order:`, saveError);
      throw saveError;
    }

    // If order is delivered, credit seller's balance
    if (status === 'Delivered' && previousStatus !== 'Delivered') {
      const seller = await Seller.findById(sellerId);
      if (seller) {
        // Calculate only this seller's items total in this order
        const sellerItems = await OrderItem.find({ order: id, seller: sellerId });
        const sellerSubtotal = sellerItems.reduce((acc, item) => acc + (item.total || 0), 0);

        // Calculate net earning (seller items total - commission)
        const commissionRate = (seller.commission || 0) / 100;
        const commissionAmount = sellerSubtotal * commissionRate;
        const netEarning = sellerSubtotal - commissionAmount;

        if (netEarning > 0) {
          seller.balance = (seller.balance || 0) + netEarning;
          await seller.save();

          // Log transaction
          await WalletTransaction.create({
            userId: sellerId,
            userType: 'SELLER',
            amount: netEarning,
            type: 'Credit',
            description: `Earnings from Order #${order.orderNumber} (Item Total: ₹${sellerSubtotal})`,
            reference: `ORD-${order.orderNumber}-${sellerId}-${Date.now()}`,
            status: 'Completed',
            relatedOrder: order._id
          });
        }
      }
    }

    // Push notification to Customer
    try {
      const { sendOrderStatusNotification } = await import("../../../services/notificationService");
      await sendOrderStatusNotification(
        order.orderNumber,
        order._id.toString(),
        order.customer.toString(),
        status,
        order.total
      );
    } catch (pushErr) {
      console.error("Error sending push notification to customer from seller controller:", pushErr);
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: {
        id: order._id,
        status: order.status,
      },
    });
  }
);


export const getDeliveryBoys = asyncHandler(
  async (_req: Request, res: Response) => {
    // Find all delivery boys who currently have an active order
    // Active delivery statuses: Assigned, Picked Up, In Transit
    const busyDeliveryBoys = await Order.distinct("deliveryBoy", {
      deliveryBoyStatus: { $in: ["Assigned", "Picked Up", "In Transit"] },
      status: { $nin: ["Delivered", "Cancelled", "Returned", "Rejected"] }
    });

    // Only fetch delivery boys who are active, online, and not busy with an ongoing order
    const deliveryBoys = await Delivery.find({
      status: "Active",
      isOnline: true,
      _id: { $nin: busyDeliveryBoys }
    }).select("name mobile email isOnline location");

    return res.status(200).json({
      success: true,
      message: "Delivery boys fetched successfully",
      data: deliveryBoys,
    });
  }
);

/**
 * Manually assign a delivery boy by the seller
 */
export const assignDeliveryBoy = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id: orderId } = req.params;
    const { deliveryBoyId } = req.body;

    if (!deliveryBoyId) {
      return res.status(400).json({ success: false, message: "Delivery Boy ID is required" });
    }

    // Check if this seller has items in this order
    const sellerItems = await OrderItem.findOne({ order: orderId, seller: sellerId });
    if (!sellerItems) {
      return res.status(404).json({ success: false, message: "Order not found or you are not authorized" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Prevent assignment if order is in a final state
    if (['Delivered', 'Cancelled', 'Returned', 'Rejected'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign delivery partner as the order is already ${order.status}`,
      });
    }

    // Actually assign
    order.deliveryBoy = deliveryBoyId;
    order.deliveryBoyStatus = "Assigned";
    order.assignedAt = new Date();

    // Typically assigned implies it is ready for pickup
    if (order.status === 'Pending' || order.status === 'Received' || order.status === 'Accepted' || order.status === 'Processed') {
      order.status = 'Ready for pickup';
    }

    await order.save();

    // Push notification to delivery boy and customer
    try {
      const io: SocketIOServer = (req.app.get("io") as SocketIOServer);
      if (io) {
        // Format notifications payload
        const notificationPayload = {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          deliveryAddress: {
            address: order.deliveryAddress.address,
            landmark: order.deliveryAddress.landmark,
            city: order.deliveryAddress.city,
            state: order.deliveryAddress.state,
            pincode: order.deliveryAddress.pincode
          },
          total: order.total,
          itemsCount: order.items?.length || 0
        };

        // Instead of broadcasting to all, alert just this one
        io.to(`delivery-${deliveryBoyId}`).emit('order-assigned-manually', {
          orderId,
          message: `You have been manually assigned to order #${order.orderNumber}`,
          orderData: notificationPayload
        });
      }

      const { sendTaskAvailableNotification } = await import("../../../services/notificationService");
      await sendTaskAvailableNotification(deliveryBoyId, orderId, order.orderNumber);

      const { sendOrderStatusNotification } = await import("../../../services/notificationService");
      await sendOrderStatusNotification(
        order.orderNumber,
        order._id.toString(),
        order.customer.toString(),
        order.status,
        order.total
      );
    } catch (err) {
      console.error("Error notifying assign:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Delivery partner assigned successfully",
      data: {
        id: order._id,
        status: order.status,
        deliveryBoy: deliveryBoyId,
      },
    });
  }
);
/**
 * Acknowledge a cancellation and approve the refund
 */
export const acknowledgeOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const sellerId = (req as any).user.userId;
    const { id } = req.params;

    const order = await Order.findById(id).populate('customer');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Authorization check
    const sellerItem = await OrderItem.findOne({ order: order._id, seller: sellerId });
    if (!sellerItem) {
       return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Only process if it's already cancelled and not yet refunded
    if (order.status !== 'Cancelled' && order.status !== 'Rejected') {
      return res.status(400).json({
        success: false,
        message: `Order must be Cancelled or Rejected to approve refund (Current: ${order.status})`,
      });
    }

    if (order.isRefunded) {
      return res.status(400).json({
        success: false,
        message: "Refund already processed for this order",
      });
    }

    // Refund logic (copied from customOrderController but optimized for seller-side)
    const walletUsed = order.walletAmountUsed || 0;
    let refundAmount = 0;
    
    if (order.paymentStatus === 'Paid') {
        refundAmount = order.total;
    } else if (walletUsed > 0) {
        refundAmount = walletUsed;
    }

    if (refundAmount > 0) {
        const Customer = (await import("../../../models/Customer")).default;
        const Refund = (await import("../../../models/Refund")).default;
        const Payment = (await import("../../../models/Payment")).default;

        const updatedCustomer = await Customer.findOneAndUpdate(
            { _id: order.customer },
            { $inc: { walletAmount: refundAmount } },
            { new: true }
        );

        if (updatedCustomer) {
            order.isRefunded = true;
            if (order.paymentStatus === 'Paid' || refundAmount === order.total) {
                order.paymentStatus = 'Refunded';
            }

            // Create Wallet Transaction Record (Credit)
            await WalletTransaction.create({
                userId: order.customer,
                userType: 'CUSTOMER',
                amount: refundAmount,
                type: 'Credit',
                description: `Refund for cancelled order #${order.orderNumber} (Approved by Seller)`,
                status: 'Completed',
                reference: `REFUND_APP_${order._id}_${Date.now()}`,
                relatedOrder: order._id
            });

            // Mark Payment as Refunded if exists
            const payment = await Payment.findOne({ 
                order: order._id, 
                status: { $in: ['Completed', 'Succeeded', 'Authorized'] } 
            });

            if (payment) {
                payment.status = 'Refunded';
                payment.refundAmount = refundAmount;
                payment.refundedAt = new Date();
                payment.refundReason = order.cancellationReason || "Seller Approved Cancellation";
                await payment.save();

                // Create audit record
                await Refund.create({
                    order: order._id,
                    payment: payment._id,
                    customer: order.customer,
                    amount: refundAmount,
                    reason: order.cancellationReason || "Seller Approved",
                    status: 'Completed'
                });
            }
        }
    } else {
        // If it was a COD order with no wallet use, just mark as acknowledged/refunded if applicable
        order.isRefunded = true;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Cancellation acknowledged and refund approved successfully",
      data: {
        id: order._id,
        isRefunded: order.isRefunded,
        paymentStatus: order.paymentStatus
      },
    });
  }
);
